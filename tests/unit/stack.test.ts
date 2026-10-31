import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  STACK_LEVELS,
  stackName,
  stackSchema,
  visibleStackAreas,
} from "@/lib/stack";

describe("stackName", () => {
  it("nome simples vale para os dois idiomas", () => {
    expect(stackName("React", "pt")).toBe("React");
    expect(stackName("React", "en")).toBe("React");
  });

  it("nome bilíngue sai no idioma da página", () => {
    const name = { pt: "Git e GitHub", en: "Git and GitHub" };
    expect(stackName(name, "pt")).toBe("Git e GitHub");
    expect(stackName(name, "en")).toBe("Git and GitHub");
  });
});

describe("STACK_LEVELS", () => {
  it("vai do básico ao avançado, na ordem da legenda", () => {
    expect(STACK_LEVELS).toEqual(["basic", "intermediate", "advanced"]);
  });
});

const label = { pt: "Área", en: "Area" };
const description = { pt: "Frase.", en: "Sentence." };
const item = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: id,
  level: "basic",
  ...extra,
});

describe("stackSchema", () => {
  it("item aparece na seção por padrão (showInStack: true)", () => {
    const data = stackSchema.parse({
      areas: [{ id: "a", label, description, items: [item("x")] }],
    });
    expect(data.areas[0]?.items[0]?.showInStack).toBe(true);
  });

  it("aceita item fora da seção, que continua valendo como etiqueta de projeto", () => {
    const data = stackSchema.parse({
      areas: [
        {
          id: "a",
          label,
          description,
          items: [item("x"), item("y", { showInStack: false })],
        },
      ],
    });
    expect(data.areas[0]?.items.map((i) => i.showInStack)).toEqual([
      true,
      false,
    ]);
  });

  it("exige frase bilíngue na área que aparece na seção", () => {
    const result = stackSchema.safeParse({
      areas: [{ id: "a", label, items: [item("x")] }],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["areas", 0, "description"]);
  });

  it("área só com itens fora da seção dispensa a frase", () => {
    const result = stackSchema.safeParse({
      areas: [{ id: "a", label, items: [item("x", { showInStack: false })] }],
    });
    expect(result.success).toBe(true);
  });

  it("frase precisa dos dois idiomas", () => {
    const result = stackSchema.safeParse({
      areas: [
        {
          id: "a",
          label,
          description: { pt: "Frase." },
          items: [item("x")],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("recusa nível fora da legenda", () => {
    const result = stackSchema.safeParse({
      areas: [
        {
          id: "a",
          label,
          description,
          items: [item("x", { level: "expert" })],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("visibleStackAreas", () => {
  const areas = stackSchema.parse({
    areas: [
      {
        id: "front",
        label,
        description,
        items: [item("react"), item("vite", { showInStack: false })],
      },
      {
        id: "mobile",
        label,
        items: [item("flutter", { showInStack: false })],
      },
      { id: "data", label, description, items: [item("postgresql")] },
    ],
  }).areas;

  it("tira da seção os itens marcados e as áreas que ficam vazias, sem mudar a ordem", () => {
    const visible = visibleStackAreas(areas);
    expect(visible.map((area) => area.id)).toEqual(["front", "data"]);
    expect(visible[0]?.items.map((i) => i.id)).toEqual(["react"]);
  });

  it("devolve a frase de cada área visível", () => {
    expect(visibleStackAreas(areas)[0]?.description).toEqual(description);
  });

  it("não muda a lista recebida", () => {
    visibleStackAreas(areas);
    expect(areas[0]?.items).toHaveLength(2);
    expect(areas).toHaveLength(3);
  });
});

// Conteúdo de verdade (decisão do Gustavo em 2026-10-31): 24 tecnologias em 5 áreas.
// O que saiu da seção continua em stack.json, porque os projetos o usam como etiqueta.
describe("src/content/stack.json", () => {
  const stack = stackSchema.parse(
    JSON.parse(readFileSync("src/content/stack.json", "utf8")),
  );
  const visible = visibleStackAreas(stack.areas);
  const names = (area: (typeof visible)[number]) =>
    area.items.map((i) => stackName(i.name, "pt"));

  it("a seção mostra 5 áreas e 24 tecnologias, na ordem decidida", () => {
    expect(visible.map((area) => area.label.pt)).toEqual([
      "Front-end",
      "Back-end",
      "CMS e web",
      "Dados",
      "Infraestrutura e operações",
    ]);
    expect(visible.map(names)).toEqual([
      [
        "React",
        "Angular",
        "Vue",
        "TypeScript",
        "JavaScript",
        "HTML & CSS",
        "Tailwind CSS",
      ],
      ["Node.js", "NestJS", "Python", "Flask", "PHP", "Laravel", "Java"],
      ["WordPress", "Strapi"],
      ["PostgreSQL", "Supabase", "Firebase"],
      [
        "Docker",
        "Deploy de aplicações",
        "Servidores Linux",
        "Git e GitHub",
        "Suporte e sustentação",
      ],
    ]);
  });

  it("o que saiu da seção continua em stack.json, com o nível", () => {
    const hidden = stack.areas
      .flatMap((area) => area.items)
      .filter((i) => !i.showInStack);
    expect(hidden.map((i) => i.id).sort()).toEqual(
      [
        "astro",
        "bullmq",
        "caddy",
        "dart",
        "express",
        "flutter",
        "nuxt",
        "prisma",
        "redis",
        "unity",
        "vite",
      ].sort(),
    );
    for (const i of hidden) expect(STACK_LEVELS).toContain(i.level);
  });
});
