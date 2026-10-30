import { describe, expect, it } from "vitest";
import { filterProjects } from "@/lib/filter";

const project = (id: string, kind: string, stack: string[]) => ({
  id,
  data: { kind, stack },
});

const list = [
  project("lumina", "web", ["react", "flask", "postgresql"]),
  project("conexao-metodista", "web", ["react", "supabase"]),
  project("checkpoint", "api", ["nestjs", "postgresql"]),
  project("prime-edu", "mobile", ["flutter", "dart"]),
];

describe("filterProjects", () => {
  it("devolve a lista inteira sem filtro", () => {
    expect(filterProjects(list, {})).toEqual(list);
  });

  it("filtra por tipo", () => {
    expect(filterProjects(list, { kind: "mobile" }).map((p) => p.id)).toEqual([
      "prime-edu",
    ]);
  });

  it("filtra por tecnologia", () => {
    expect(filterProjects(list, { stack: "nestjs" }).map((p) => p.id)).toEqual([
      "checkpoint",
    ]);
  });

  it("combina tipo e tecnologia (E)", () => {
    expect(
      filterProjects(list, { kind: "web", stack: "react" }).map((p) => p.id),
    ).toEqual(["lumina", "conexao-metodista"]);
    expect(filterProjects(list, { kind: "api", stack: "react" })).toEqual([]);
  });

  it("trata string vazia como sem filtro", () => {
    expect(filterProjects(list, { kind: "", stack: "" })).toEqual(list);
  });

  it("não altera a lista original", () => {
    const copy = [...list];
    filterProjects(list, { kind: "web" });
    expect(list).toEqual(copy);
  });
});
