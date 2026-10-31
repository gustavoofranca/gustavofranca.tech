import { getCollection } from "astro:content";
import type { Locale } from "@/lib/i18n";
import { buildIconSprite, iconSpriteFile } from "@/lib/iconSprite";
import { stackName } from "@/lib/stack";
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

// id → nome de exibição no idioma ("nestjs" → "NestJS"), para tags e listas.
export async function getStackNames(locale: Locale) {
  const stack = await getStack();
  return new Map(
    stack.areas.flatMap((area) =>
      area.items.map(
        (item) => [item.id, stackName(item.name, locale)] as const,
      ),
    ),
  );
}

// Sprite com todos os ícones de stack.json (src/pages/icons/[file].svg.ts). Uma
// promessa só por build: o TechIcon pede o endereço para cada item.
let sprite: Promise<{ svg: string; file: string; href: string }> | undefined;

export function getIconSprite() {
  sprite ??= getStack().then((stack) => {
    const svg = buildIconSprite(
      stack.areas.flatMap((area) =>
        area.items.flatMap((item) => (item.icon ? [item.icon] : [])),
      ),
    );
    const file = iconSpriteFile(svg);
    return { svg, file, href: `/icons/${file}` };
  });
  return sprite;
}

export async function getAbout() {
  const [entry] = await getCollection("about");
  if (!entry) throw new Error("src/content/about.json está vazio ou ausente.");
  return entry.data;
}

export async function getExperience() {
  const [entries, stack] = await Promise.all([
    getCollection("experience"),
    getStack(),
  ]);
  assertKnownStack(entries, stackIdsOf(stack));
  // Mais recente primeiro; "YYYY-MM" ordena como texto. Início igual desempata
  // pelo id (nome do arquivo), para a ordem não depender do loader.
  return entries.sort(
    (a, b) =>
      b.data.start.localeCompare(a.data.start) || a.id.localeCompare(b.id),
  );
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

// Stack por área, cada item com os projetos do idioma que o usam. A home filtra os
// que têm prova; o Sobre mostra todos.
export async function getStackAreas(locale: Locale) {
  const stack = await getStack();
  return Promise.all(
    stack.areas.map(async (area) => ({
      id: area.id,
      label: area.label[locale],
      items: await Promise.all(
        area.items.map(async (item) => ({
          id: item.id,
          name: stackName(item.name, locale),
          icon: item.icon,
          level: item.level,
          projects: (await usedIn(item.id, locale)).map((p) => p.title),
        })),
      ),
    })),
  );
}
