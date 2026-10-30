import type { Locale } from "@/i18n/locales";

export type RouteKey =
  "home" | "projects" | "project" | "about" | "contact" | "privacy";

export type RouteMatch = { key: RouteKey; locale: Locale; slug?: string };

// Caminho de cada rota por idioma, sem o prefixo do idioma. `home` é a raiz.
// Os segmentos mudam de nome entre PT e EN, então a tabela é a fonte única.
const SEGMENTS: Record<Locale, Record<Exclude<RouteKey, "home">, string>> = {
  pt: {
    projects: "projetos",
    project: "projetos",
    about: "sobre",
    contact: "contato",
    privacy: "privacidade",
  },
  en: {
    projects: "projects",
    project: "projects",
    about: "about",
    contact: "contact",
    privacy: "privacy",
  },
};

// Rotas sem slug, usadas para o caminho inverso (segmento → chave).
const STATIC_KEYS = ["projects", "about", "contact", "privacy"] as const;

export function routePath(
  key: RouteKey,
  locale: Locale,
  slug?: string,
): string {
  const prefix = locale === "pt" ? "" : "/en";
  if (key === "home") return locale === "pt" ? "/" : "/en/";
  const base = `${prefix}/${SEGMENTS[locale][key]}`;
  if (key !== "project") return base;
  if (!slug) throw new Error("routePath: a rota 'project' exige slug.");
  return `${base}/${slug}`;
}

function splitLocale(pathname: string): {
  locale: Locale;
  segments: string[];
} {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];
  const isEnglish = first === "en";
  return {
    locale: isEnglish ? "en" : "pt",
    segments: parts.slice(isEnglish ? 1 : 0),
  };
}

export function getLocaleFromPath(pathname: string): Locale {
  return splitLocale(pathname).locale;
}

export function matchRoute(pathname: string): RouteMatch | null {
  const { locale, segments } = splitLocale(pathname);
  const [first, second, ...rest] = segments;
  if (first === undefined) return { key: "home", locale };
  if (rest.length > 0) return null;

  const key = STATIC_KEYS.find((k) => SEGMENTS[locale][k] === first);
  if (!key) return null;
  if (second === undefined) return { key, locale };
  if (key === "projects") return { key: "project", locale, slug: second };
  return null;
}

// Troca de idioma que mantém a página. Se a página não existe no destino
// (projeto só em um idioma, rota desconhecida), cai na home do idioma em vez de
// levar a um 404.
export function alternatePath(
  pathname: string,
  target: Locale,
  existingSlugs: ReadonlySet<string>,
): string {
  const match = matchRoute(pathname);
  if (!match) return routePath("home", target);
  if (match.key === "project") {
    if (!match.slug || !existingSlugs.has(match.slug)) {
      return routePath("home", target);
    }
    return routePath("project", target, match.slug);
  }
  return routePath(match.key, target);
}
