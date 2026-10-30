import { LOCALES, type Locale } from "@/i18n/locales";
import { t } from "@/lib/i18n";
import { OG_HEIGHT, OG_WIDTH, ogPathFor } from "@/lib/og";
import { matchRoute, routePath } from "@/lib/routes";
import { GITHUB_URL, SITE_URL } from "@/lib/site";

type Hreflang = "pt-BR" | "en" | "x-default";

export type SeoInput = {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  ogImage?: string | undefined;
};

export type Seo = {
  title: string;
  canonical: string;
  alternates: { hreflang: Hreflang; href: string }[];
  og: Record<string, string>;
};

const HREFLANG: Record<Locale, Exclude<Hreflang, "x-default">> = {
  pt: "pt-BR",
  en: "en",
};
const OG_LOCALE: Record<Locale, string> = { pt: "pt_BR", en: "en_US" };

// Único ponto que decide a barra final: rota conhecida usa a forma de `routePath`
// (só as duas homes terminam em "/"); o resto perde a barra. O sitemap segue a mesma
// regra em astro.config.mjs, e um e2e confere que os dois batem.
function canonicalPath(path: string): string {
  const match = matchRoute(path);
  if (match) return routePath(match.key, match.locale, match.slug);
  return path.replace(/\/+$/, "") || "/";
}

// Imagem padrão: a gerada no build para a própria página. Rota desconhecida (a 404)
// não tem imagem.
function defaultOgImage(path: string): string | undefined {
  const match = matchRoute(path);
  if (!match) return undefined;
  return ogPathFor(match.locale, match.key, match.slug);
}

const absolute = (path: string) => new URL(canonicalPath(path), SITE_URL).href;

// Título vazio é a home: "Gustavo França — Engenheiro de Software".
function fullTitle(title: string, locale: Locale): string {
  const { siteName, jobTitle } = t(locale).meta;
  return title ? `${title} — ${siteName}` : `${siteName} — ${jobTitle}`;
}

// Par de idiomas só existe para rotas conhecidas. Todo projeto tem versão PT e EN
// (validado no build em content.ts), então o slug vale nos dois lados.
function alternatesFor(path: string): Seo["alternates"] {
  const match = matchRoute(path);
  if (!match) return [];
  const href = (locale: Locale) =>
    absolute(routePath(match.key, locale, match.slug));
  return [
    ...LOCALES.map((locale) => ({
      hreflang: HREFLANG[locale],
      href: href(locale),
    })),
    { hreflang: "x-default", href: href("pt") },
  ];
}

export function buildSeo({
  locale,
  title,
  description,
  path,
  ogImage = defaultOgImage(path),
}: SeoInput): Seo {
  const seoTitle = fullTitle(title, locale);
  const canonical = absolute(path);
  const og: Record<string, string> = {
    "og:title": seoTitle,
    "og:description": description,
    "og:url": canonical,
    "og:type": "website",
    "og:locale": OG_LOCALE[locale],
    "og:site_name": t(locale).meta.siteName,
    "twitter:card": ogImage ? "summary_large_image" : "summary",
  };
  if (ogImage) {
    og["og:image"] = new URL(ogImage, SITE_URL).href;
    // Toda imagem vem de src/lib/og.ts, sempre no mesmo tamanho; com largura e altura
    // declaradas, quem lê a prévia não precisa baixar a imagem para montar o cartão.
    og["og:image:width"] = String(OG_WIDTH);
    og["og:image:height"] = String(OG_HEIGHT);
    og["og:image:alt"] = t(locale).meta.ogImageAlt.replace("{title}", seoTitle);
  }
  return {
    title: seoTitle,
    canonical,
    alternates: alternatesFor(path),
    og,
  };
}

const PERSON_NAME = "Gustavo Henrique França";

export function personJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PERSON_NAME,
    jobTitle: t(locale).meta.jobTitle,
    url: absolute(routePath("home", locale)),
    sameAs: [GITHUB_URL],
  };
}

export type ProjectSeoInput = {
  slug: string;
  title: string;
  summary: string;
  period: { start: string };
};

export function projectJsonLd(project: ProjectSeoInput, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    url: absolute(routePath("project", locale, project.slug)),
    inLanguage: HREFLANG[locale],
    dateCreated: project.period.start,
    author: { "@type": "Person", name: PERSON_NAME },
  };
}
