import type { Locale } from "@/lib/i18n";

// Regras de validação do conteúdo, em funções puras e sem `astro:content`, para
// serem testáveis no Vitest. Os getters de src/lib/content.ts chamam estas funções,
// então qualquer violação derruba o build.

// "lumina.pt" → "lumina". O id vem do nome do arquivo (`<slug>.<locale>.mdx`).
export function projectSlug(id: string): string {
  return id.replace(/\.(pt|en)$/, "");
}

export function sortProjects<T extends { data: { order: number } }>(
  list: T[],
): T[] {
  return [...list].sort((a, b) => a.data.order - b.data.order);
}

export function assertFeaturedLimit(
  list: { id: string; data: { featured: boolean; locale: Locale } }[],
  max = 3,
): void {
  const byLocale = new Map<Locale, string[]>();
  for (const { id, data } of list) {
    if (!data.featured) continue;
    byLocale.set(data.locale, [
      ...(byLocale.get(data.locale) ?? []),
      projectSlug(id),
    ]);
  }
  for (const [locale, slugs] of byLocale) {
    if (slugs.length > max) {
      throw new Error(
        `Projetos com featured: true em "${locale}": ${slugs.length} (máximo ${max}): ${slugs.join(", ")}.`,
      );
    }
  }
}

export function assertTranslationPairs(ids: string[]): void {
  const locales = new Map<string, Set<string>>();
  for (const id of ids) {
    const slug = projectSlug(id);
    locales.set(
      slug,
      (locales.get(slug) ?? new Set()).add(id.slice(slug.length + 1)),
    );
  }
  const missing = [...locales]
    .filter(([, found]) => !(found.has("pt") && found.has("en")))
    .map(([slug, found]) => `${slug} (falta ${found.has("pt") ? "en" : "pt"})`);
  if (missing.length > 0) {
    throw new Error(
      `Projetos sem par de tradução PT/EN: ${missing.join(", ")}.`,
    );
  }
}

export function assertKnownStack(
  projects: { id: string; data: { stack: string[] } }[],
  stackIds: Set<string>,
): void {
  const problems = projects.flatMap(({ id, data }) => {
    const unknown = data.stack.filter((item) => !stackIds.has(item));
    return unknown.length > 0 ? [`${id}: ${unknown.join(", ")}`] : [];
  });
  if (problems.length > 0) {
    throw new Error(
      `Stack que não existe em stack.json (projeto: ids): ${problems.join("; ")}.`,
    );
  }
}
