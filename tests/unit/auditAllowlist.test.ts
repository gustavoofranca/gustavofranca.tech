import { describe, expect, it } from "vitest";
import {
  checkAudit,
  parseAllowlist,
  type AllowedAdvisory,
} from "@/lib/auditAllowlist";

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

describe("parseAllowlist", () => {
  const valid = {
    id: "GHSA-aaaa",
    package: "pkg",
    reason: "só na ferramenta de CI",
    reviewBy: "2027-01-30",
  };

  it("aceita entradas válidas", () => {
    expect(parseAllowlist([valid])).toEqual([valid]);
  });

  it("recusa o que não é uma lista", () => {
    expect(() => parseAllowlist({ id: "x" })).toThrow(/lista/);
  });

  it.each([
    ["sem reviewBy", { ...valid, reviewBy: undefined }],
    ["reviewBy em formato brasileiro", { ...valid, reviewBy: "30/01/2027" }],
    ["reviewBy com data inexistente", { ...valid, reviewBy: "2027-02-30" }],
    ["reviewBy com mês 13", { ...valid, reviewBy: "2027-13-01" }],
    ["reviewBy que não é texto", { ...valid, reviewBy: 20270130 }],
    ["sem motivo", { ...valid, reason: undefined }],
    ["motivo em branco", { ...valid, reason: "   " }],
    ["sem id", { ...valid, id: "" }],
    ["sem pacote", { ...valid, package: undefined }],
    ["entrada que não é objeto", "GHSA-aaaa"],
  ])("recusa entrada %s", (_nome, entry) => {
    expect(() => parseAllowlist([entry])).toThrow(/audit-allowlist/);
  });

  it("diz qual entrada está errada", () => {
    expect(() =>
      parseAllowlist([
        valid,
        { ...valid, id: "GHSA-bbbb", reviewBy: "amanhã" },
      ]),
    ).toThrow(/GHSA-bbbb/);
  });
});

describe("checkAudit com lista inválida", () => {
  it("falha em vez de deixar a exceção valer para sempre", () => {
    const sem = { id: "GHSA-aaaa", package: "pkg", reason: "x" };
    expect(() =>
      checkAudit(
        report(advisory("GHSA-aaaa", "high")),
        [sem as AllowedAdvisory],
        "2026-10-30",
      ),
    ).toThrow(/reviewBy/);
  });
});
