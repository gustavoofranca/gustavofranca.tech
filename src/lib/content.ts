import { getCollection } from "astro:content";
import type { Locale } from "@/lib/i18n";
import {
  assertFeaturedLimit,
  assertKnownStack,
  assertLocaleMatchesId,
  assertTranslationPairs,
  projectSlug,
  sortProjects,
} from "@/lib/contentRules";

export {
  assertFeaturedLimit,
  assertKnownStack,
  assertLocaleMatchesId,
  assertTranslationPairs,
  projectSlug,
  sortProjects,
} from "@/lib/contentRules";
export { findPendingTodos } from "@/lib/contentTodos";

// Carrega todos os projetos (os dois idiomas) e valida o conjunto inteiro de uma
// vez: as regras olham pares e limites que um idioma sozinho não revela. Qualquer
// violação lança e derruba o build. A promessa é reaproveitada entre páginas.
let validated: Promise<Awaited<ReturnType<typeof loadAllProjects>>> | undefined;

function stackIdsOf(stack: Awaited<ReturnType<typeof getStack>>) {
  return new Set(stack.areas.flatMap((area) => area.items.map((i) => i.id)));
}

async function loadAllProjects() {
  const [projects, stack] = await Promise.all([
    getCollection("projects"),
    getStack(),
  ]);
  const stackIds = stackIdsOf(stack);
  assertLocaleMatchesId(projects);
  assertTranslationPairs(projects.map((p) => p.id));
  assertFeaturedLimit(projects);
  assertKnownStack(projects, stackIds);
  return projects;
}

function allProjects() {
  validated ??= loadAllProjects();
  return validated;
}

export async function getProjects(locale: Locale) {
  const projects = await allProjects();
  return sortProjects(projects.filter((p) => p.data.locale === locale));
}

export async function getFeaturedProjects(locale: Locale) {
  return (await getProjects(locale)).filter((p) => p.data.featured);
}

export async function getProject(locale: Locale, slug: string) {
  return (await getProjects(locale)).find((p) => projectSlug(p.id) === slug);
}

export async function getStack() {
  const [entry] = await getCollection("stack");
  if (!entry) throw new Error("src/content/stack.json está vazio ou ausente.");
  return entry.data;
}

export async function getExperience() {
  const [entries, stack] = await Promise.all([
    getCollection("experience"),
    getStack(),
  ]);
  assertKnownStack(entries, stackIdsOf(stack));
  // Mais recente primeiro; "YYYY-MM" ordena como texto.
  return entries.sort((a, b) => b.data.start.localeCompare(a.data.start));
}

export async function getArchive() {
  const [entries, stack] = await Promise.all([
    getCollection("archive"),
    getStack(),
  ]);
  assertKnownStack(entries, stackIdsOf(stack));
  return entries.map((e) => e.data).sort((a, b) => b.year - a.year);
}

// Projetos do idioma que usam uma tecnologia, para a página de stack.
export async function usedIn(stackId: string, locale: Locale) {
  return (await getProjects(locale))
    .filter((p) => p.data.stack.includes(stackId))
    .map((p) => ({ slug: projectSlug(p.id), title: p.data.title }));
}
