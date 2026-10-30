import { describe, expect, it } from "vitest";
import {
  alternatePath,
  getLocaleFromPath,
  matchRoute,
  routePath,
} from "@/lib/routes";

describe("routePath", () => {
  it("monta o caminho de cada rota nos dois idiomas", () => {
    expect(routePath("home", "pt")).toBe("/");
    expect(routePath("home", "en")).toBe("/en/");
    expect(routePath("projects", "pt")).toBe("/projetos");
    expect(routePath("projects", "en")).toBe("/en/projects");
    expect(routePath("about", "pt")).toBe("/sobre");
    expect(routePath("about", "en")).toBe("/en/about");
    expect(routePath("contact", "pt")).toBe("/contato");
    expect(routePath("contact", "en")).toBe("/en/contact");
    expect(routePath("privacy", "pt")).toBe("/privacidade");
    expect(routePath("privacy", "en")).toBe("/en/privacy");
  });

  it("inclui o slug do projeto", () => {
    expect(routePath("project", "pt", "lumina")).toBe("/projetos/lumina");
    expect(routePath("project", "en", "lumina")).toBe("/en/projects/lumina");
  });

  it("exige slug na rota de projeto", () => {
    expect(() => routePath("project", "pt")).toThrow();
  });
});

describe("matchRoute", () => {
  it("reconhece rotas em PT e EN", () => {
    expect(matchRoute("/")).toEqual({ key: "home", locale: "pt" });
    expect(matchRoute("/en")).toEqual({ key: "home", locale: "en" });
    expect(matchRoute("/en/")).toEqual({ key: "home", locale: "en" });
    expect(matchRoute("/sobre")).toEqual({ key: "about", locale: "pt" });
    expect(matchRoute("/en/contact")).toEqual({ key: "contact", locale: "en" });
    expect(matchRoute("/privacidade")).toEqual({
      key: "privacy",
      locale: "pt",
    });
  });

  it("ignora a barra final e extrai o slug", () => {
    expect(matchRoute("/en/projects/checkpoint/")).toEqual({
      key: "project",
      locale: "en",
      slug: "checkpoint",
    });
    expect(matchRoute("/projetos/lumina")).toEqual({
      key: "project",
      locale: "pt",
      slug: "lumina",
    });
  });

  it("não mistura os idiomas nem aceita caminhos desconhecidos", () => {
    expect(matchRoute("/en/projetos")).toBeNull();
    expect(matchRoute("/projects")).toBeNull();
    expect(matchRoute("/qualquer/coisa")).toBeNull();
    expect(matchRoute("/projetos/a/b")).toBeNull();
  });
});

describe("alternatePath", () => {
  const slugs = new Set(["lumina"]);

  it("troca o idioma mantendo a página", () => {
    expect(alternatePath("/projetos/lumina", "en", slugs)).toBe(
      "/en/projects/lumina",
    );
    expect(alternatePath("/en/about/", "pt", slugs)).toBe("/sobre");
    expect(alternatePath("/", "en", slugs)).toBe("/en/");
  });

  it("cai na home do idioma se o projeto não existe no destino", () => {
    expect(alternatePath("/projetos/so-pt", "en", slugs)).toBe("/en/");
  });

  it("cai na home do idioma se a rota é desconhecida", () => {
    expect(alternatePath("/qualquer/coisa", "pt", new Set())).toBe("/");
  });
});

describe("getLocaleFromPath", () => {
  it("lê o idioma pelo prefixo", () => {
    expect(getLocaleFromPath("/en/about")).toBe("en");
    expect(getLocaleFromPath("/en")).toBe("en");
    expect(getLocaleFromPath("/sobre")).toBe("pt");
    expect(getLocaleFromPath("/")).toBe("pt");
  });

  it("não confunde prefixo parecido", () => {
    expect(getLocaleFromPath("/entrada")).toBe("pt");
  });
});
