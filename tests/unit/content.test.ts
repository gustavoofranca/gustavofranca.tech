import { describe, expect, it } from "vitest";
import {
  assertFeaturedLimit,
  assertKnownStack,
  assertLocaleMatchesId,
  assertTranslationPairs,
  projectSlug,
  sortProjects,
} from "@/lib/contentRules";
import { findPendingTodos } from "@/lib/contentTodos";

const featured = (id: string, locale: "pt" | "en", isFeatured = true) => ({
  id,
  data: { featured: isFeatured, locale },
});

describe("projectSlug", () => {
  it("remove o sufixo de idioma do id", () => {
    expect(projectSlug("lumina.pt")).toBe("lumina");
    expect(projectSlug("checkpoint.en")).toBe("checkpoint");
  });
});

describe("sortProjects", () => {
  it("ordena por order crescente sem alterar a lista original", () => {
    const list = [
      { data: { order: 3 } },
      { data: { order: 1 } },
      { data: { order: 2 } },
    ];
    expect(sortProjects(list).map((p) => p.data.order)).toEqual([1, 2, 3]);
    expect(list.map((p) => p.data.order)).toEqual([3, 1, 2]);
  });
});

describe("assertFeaturedLimit", () => {
  it("lança com 4 destaques no mesmo idioma e cita os slugs", () => {
    const list = ["a", "b", "c", "d"].map((s) => featured(`${s}.pt`, "pt"));
    expect(() => assertFeaturedLimit(list)).toThrow(/featured/);
    expect(() => assertFeaturedLimit(list)).toThrow(/a, b, c, d/);
  });

  it("aceita 3 destaques por idioma e ignora quem não é destaque", () => {
    const list = [
      ...["a", "b", "c"].map((s) => featured(`${s}.pt`, "pt")),
      ...["a", "b", "c"].map((s) => featured(`${s}.en`, "en")),
      featured("d.pt", "pt", false),
    ];
    expect(() => assertFeaturedLimit(list)).not.toThrow();
  });

  it("respeita um limite customizado", () => {
    const list = ["a", "b"].map((s) => featured(`${s}.en`, "en"));
    expect(() => assertFeaturedLimit(list, 1)).toThrow(/featured/);
  });
});

describe("assertTranslationPairs", () => {
  it("lança listando os slugs sem par", () => {
    expect(() => assertTranslationPairs(["a.pt", "a.en", "b.pt"])).toThrow(/b/);
  });

  it("não cita slugs que têm par", () => {
    let message = "";
    try {
      assertTranslationPairs(["a.pt", "a.en", "b.pt"]);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("b (falta en)");
    expect(message).not.toContain("a (falta");
  });

  it("aceita todos os pares completos", () => {
    expect(() =>
      assertTranslationPairs(["a.pt", "a.en", "b.en", "b.pt"]),
    ).not.toThrow();
  });
});

describe("assertLocaleMatchesId", () => {
  it("aceita quando o locale do frontmatter bate com o sufixo do id", () => {
    const entries = [
      { id: "a.pt", data: { locale: "pt" as const } },
      { id: "a.en", data: { locale: "en" as const } },
    ];
    expect(() => assertLocaleMatchesId(entries)).not.toThrow();
  });

  it("lança citando o id cujo locale não bate com o sufixo", () => {
    const entries = [
      { id: "a.pt", data: { locale: "pt" as const } },
      { id: "b.en", data: { locale: "pt" as const } },
    ];
    expect(() => assertLocaleMatchesId(entries)).toThrow(/b\.en/);
    expect(() => assertLocaleMatchesId(entries)).not.toThrow(/a\.pt/);
  });
});

describe("assertKnownStack", () => {
  const ids = new Set(["astro", "react"]);

  it("lança com a stack desconhecida e o projeto", () => {
    const projects = [{ id: "x.pt", data: { stack: ["astro", "cobol"] } }];
    expect(() => assertKnownStack(projects, ids)).toThrow(/x\.pt.*cobol/s);
  });

  it("vale para qualquer entrada com stack (experiência, arquivo)", () => {
    const entries = [{ id: "empresa-atual", data: { stack: ["php"] } }];
    expect(() => assertKnownStack(entries, ids)).toThrow(/empresa-atual.*php/s);
  });

  it("aceita só ids conhecidos", () => {
    const projects = [{ id: "x.pt", data: { stack: ["astro", "react"] } }];
    expect(() => assertKnownStack(projects, ids)).not.toThrow();
  });
});

describe("findPendingTodos", () => {
  it("devolve arquivo, linha (base 1) e anotação", () => {
    const files = [
      { path: "x.mdx", text: "ok\nTODO(gustavo): cargo na empresa atual" },
    ];
    expect(findPendingTodos(files)).toEqual([
      { path: "x.mdx", line: 2, note: "cargo na empresa atual" },
    ]);
  });

  it("acha mais de um por arquivo e ignora texto sem TODO", () => {
    const files = [
      { path: "a.json", text: '{"a":"TODO(gustavo): x", "b":"ok"}' },
      {
        path: "b.mdx",
        text: "nada\n<!-- TODO(gustavo): y -->\nTODO(gustavo): z",
      },
    ];
    expect(
      findPendingTodos(files).map((p) => [p.path, p.line, p.note]),
    ).toEqual([
      ["a.json", 1, "x"],
      ["b.mdx", 2, "y"],
      ["b.mdx", 3, "z"],
    ]);
  });

  it("devolve lista vazia sem pendências", () => {
    expect(
      findPendingTodos([{ path: "a", text: "TODO(outro): nada" }]),
    ).toEqual([]);
  });
});
