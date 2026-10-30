import { describe, expect, it } from "vitest";
import { buildSeo, personJsonLd, projectJsonLd } from "@/lib/seo";
import { GITHUB_URL, SITE_URL } from "@/lib/site";

describe("buildSeo", () => {
  it("monta título, canonical e hreflang de uma página PT", () => {
    const s = buildSeo({
      locale: "pt",
      title: "Sobre",
      description: "d",
      path: "/sobre",
    });
    expect(s.title).toBe("Sobre — Gustavo França");
    expect(s.canonical).toBe("https://gustavofranca.tech/sobre");
    expect(s.alternates).toContainEqual({
      hreflang: "pt-BR",
      href: "https://gustavofranca.tech/sobre",
    });
    expect(s.alternates).toContainEqual({
      hreflang: "en",
      href: "https://gustavofranca.tech/en/about",
    });
    expect(s.alternates).toContainEqual({
      hreflang: "x-default",
      href: "https://gustavofranca.tech/sobre",
    });
  });

  it("aponta o x-default para a versão em português mesmo na página EN", () => {
    const s = buildSeo({
      locale: "en",
      title: "About",
      description: "d",
      path: "/en/about",
    });
    expect(s.canonical).toBe("https://gustavofranca.tech/en/about");
    expect(s.alternates).toContainEqual({
      hreflang: "x-default",
      href: "https://gustavofranca.tech/sobre",
    });
    expect(s.alternates).toContainEqual({
      hreflang: "pt-BR",
      href: "https://gustavofranca.tech/sobre",
    });
  });

  it("usa o título da home quando o título vem vazio", () => {
    expect(
      buildSeo({ locale: "pt", title: "", description: "d", path: "/" }).title,
    ).toBe("Gustavo França — Engenheiro de Software");
    expect(
      buildSeo({ locale: "en", title: "", description: "d", path: "/en/" })
        .title,
    ).toBe("Gustavo França — Software Engineer");
  });

  it("traduz o caminho de projeto entre os idiomas", () => {
    const s = buildSeo({
      locale: "pt",
      title: "Lumina",
      description: "d",
      path: "/projetos/lumina",
    });
    expect(s.alternates).toContainEqual({
      hreflang: "en",
      href: "https://gustavofranca.tech/en/projects/lumina",
    });
  });

  it("não inventa alternativas para caminho que não é rota (404)", () => {
    const s = buildSeo({
      locale: "pt",
      title: "404",
      description: "d",
      path: "/404",
    });
    expect(s.alternates).toEqual([]);
  });

  it("preenche Open Graph e deixa a imagem absoluta", () => {
    const s = buildSeo({
      locale: "pt",
      title: "Sobre",
      description: "desc",
      path: "/sobre",
      ogImage: "/og/sobre.png",
    });
    expect(s.og).toMatchObject({
      "og:title": "Sobre — Gustavo França",
      "og:description": "desc",
      "og:url": "https://gustavofranca.tech/sobre",
      "og:type": "website",
      "og:locale": "pt_BR",
      "og:site_name": "Gustavo França",
      "og:image": "https://gustavofranca.tech/og/sobre.png",
      "twitter:card": "summary_large_image",
    });
  });

  it("sem imagem, omite og:image e usa o cartão simples", () => {
    const s = buildSeo({
      locale: "en",
      title: "About",
      description: "d",
      path: "/en/about",
    });
    expect(s.og).not.toHaveProperty("og:image");
    expect(s.og["twitter:card"]).toBe("summary");
    expect(s.og["og:locale"]).toBe("en_US");
  });
});

describe("personJsonLd", () => {
  it("descreve a pessoa só com o GitHub em sameAs", () => {
    const ld = personJsonLd("pt");
    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Gustavo Henrique França",
      url: SITE_URL,
      sameAs: [GITHUB_URL],
    });
    expect(personJsonLd("en")).toMatchObject({ url: `${SITE_URL}/en/` });
  });

  it("traduz o cargo", () => {
    expect(personJsonLd("pt")).toMatchObject({
      jobTitle: "Engenheiro de Software",
    });
    expect(personJsonLd("en")).toMatchObject({ jobTitle: "Software Engineer" });
  });
});

describe("projectJsonLd", () => {
  const project = {
    slug: "lumina",
    title: "Lumina",
    summary: "Resumo.",
    period: { start: "2026-05" },
  };

  it("monta um CreativeWork com autor e URL do estudo de caso", () => {
    expect(projectJsonLd(project, "pt")).toMatchObject({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: "Lumina",
      description: "Resumo.",
      url: "https://gustavofranca.tech/projetos/lumina",
      inLanguage: "pt-BR",
      dateCreated: "2026-05",
      author: { "@type": "Person", name: "Gustavo Henrique França" },
    });
  });

  it("usa a URL em inglês no idioma EN", () => {
    expect(projectJsonLd(project, "en")).toMatchObject({
      url: "https://gustavofranca.tech/en/projects/lumina",
      inLanguage: "en",
    });
  });
});
