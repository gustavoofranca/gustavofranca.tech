import { describe, expect, it } from "vitest";
import { ogPathFor, renderOg } from "@/lib/og";

describe("ogPathFor", () => {
  it("usa o segmento da rota no idioma", () => {
    expect(ogPathFor("en", "project", "checkpoint")).toBe(
      "/og/en/projects/checkpoint.png",
    );
    expect(ogPathFor("pt", "project", "lumina")).toBe(
      "/og/pt/projetos/lumina.png",
    );
    expect(ogPathFor("pt", "about")).toBe("/og/pt/sobre.png");
    expect(ogPathFor("en", "contact")).toBe("/og/en/contact.png");
  });

  it("a home vira 'home', sem colidir com nenhuma rota", () => {
    expect(ogPathFor("pt", "home")).toBe("/og/pt/home.png");
    expect(ogPathFor("en", "home")).toBe("/og/en/home.png");
  });

  it("projeto sem slug é erro, como em routePath", () => {
    expect(() => ogPathFor("pt", "project")).toThrow();
  });
});

describe("renderOg", () => {
  it("devolve um PNG de 1200x630", async () => {
    const png = await renderOg({
      title: "Lumina Influence AI",
      subtitle: "SaaS para auditar marketing de influência.",
      tags: ["React", "Python", "PostgreSQL"],
    });
    expect([...png.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    // IHDR: largura e altura em big-endian, logo após a assinatura de 8 bytes.
    expect(view.getUint32(16)).toBe(1200);
    expect(view.getUint32(20)).toBe(630);
  }, 20_000);

  it("aceita título e resumo longos e sem tags", async () => {
    const png = await renderOg({
      title: "Um título muito longo ".repeat(10),
      subtitle: "Resumo longo ".repeat(40),
      tags: [],
    });
    expect([...png.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  }, 20_000);
});
