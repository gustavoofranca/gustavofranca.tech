import type { Locale } from "@/i18n/locales";
import { t } from "@/lib/i18n";
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
const LOCALES: Locale[] = ["pt", "en"];

const absolute = (path: string) => new URL(path, SITE_URL).href;

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
  ogImage,
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
  if (ogImage) og["og:image"] = absolute(ogImage);
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
    url: locale === "pt" ? SITE_URL : absolute(routePath("home", locale)),
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
