import { describe, expect, it } from "vitest";
import { checkAudit, type AllowedAdvisory } from "@/lib/auditAllowlist";

function advisory(id: string, severity: string, name = "pkg") {
  return {
    source: 1,
    name,
    title: `falha em ${name}`,
    url: `https://github.com/advisories/${id}`,
    severity,
    range: "<1.0.0",
  };
}

function report(...advisories: ReturnType<typeof advisory>[]) {
  return {
    vulnerabilities: Object.fromEntries(
      advisories.map((a) => [a.name, { severity: a.severity, via: [a] }]),
    ),
  };
}

const allowed = (id: string, reviewBy = "2027-01-30"): AllowedAdvisory => ({
  id,
  package: "pkg",
  reason: "só na ferramenta de CI",
  reviewBy,
});

describe("checkAudit", () => {
  it("bloqueia alerta alto ou crítico fora da lista", () => {
    const verdict = checkAudit(
      report(
        advisory("GHSA-aaaa", "high", "a"),
        advisory("GHSA-bbbb", "critical", "b"),
      ),
      [],
      "2026-10-30",
    );
    expect(verdict.blocking).toEqual([
      expect.stringContaining("GHSA-aaaa"),
      expect.stringContaining("GHSA-bbbb"),
    ]);
  });

  it("ignora alerta moderado ou baixo", () => {
    const verdict = checkAudit(
      report(
        advisory("GHSA-mmmm", "moderate"),
        advisory("GHSA-llll", "low", "l"),
      ),
      [],
      "2026-10-30",
    );
    expect(verdict.blocking).toEqual([]);
  });

  it("libera alerta alto que está na lista e dentro do prazo", () => {
    const verdict = checkAudit(
      report(advisory("GHSA-aaaa", "high")),
      [allowed("GHSA-aaaa")],
      "2026-10-30",
    );
    expect(verdict).toEqual({ blocking: [], expired: [], stale: [] });
  });

  it("bloqueia item da lista com revisão vencida", () => {
    const verdict = checkAudit(
      report(advisory("GHSA-aaaa", "high")),
      [allowed("GHSA-aaaa", "2026-10-29")],
      "2026-10-30",
    );
    expect(verdict.blocking).toEqual([]);
    expect(verdict.expired).toEqual([expect.stringContaining("GHSA-aaaa")]);
  });

  it("aponta item da lista que não aparece mais no relatório", () => {
    const verdict = checkAudit(report(), [allowed("GHSA-zzzz")], "2026-10-30");
    expect(verdict.stale).toEqual(["GHSA-zzzz"]);
  });

  it("conta cada alerta uma vez, mesmo citado por vários pacotes", () => {
    const shared = advisory("GHSA-aaaa", "high", "a");
    const verdict = checkAudit(
      {
        vulnerabilities: {
          a: { severity: "high", via: [shared] },
          b: { severity: "high", via: ["a", shared] },
        },
      },
      [],
      "2026-10-30",
    );
    expect(verdict.blocking).toHaveLength(1);
  });

  it("recusa relatório em formato inesperado", () => {
    expect(() => checkAudit({ erro: true }, [], "2026-10-30")).toThrow(
      /formato/,
    );
  });
});
