import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { STACK_LEVELS } from "@/lib/stack";

const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use o formato YYYY-MM.");
const bilingual = z.object({ pt: z.string(), en: z.string() });

const projects = defineCollection({
  // O id é o nome do arquivo sem extensão ("lumina.pt"). O gerador padrão faria
  // slug do caminho e engoliria o ponto ("luminapt"), perdendo o idioma.
  loader: glob({
    base: "./src/content/projects",
    pattern: "*.mdx",
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ""),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(160),
      locale: z.enum(["pt", "en"]),
      kind: z.enum(["web", "api", "mobile"]),
      role: z.enum(["solo", "team"]),
      roleNote: z.string().optional(),
      period: z.object({ start: month, end: month.optional() }),
      stack: z.array(z.string()),
      status: z.enum(["live", "offline", "archived"]),
      featured: z.boolean(),
      order: z.number(),
      links: z.object({
        demo: z.url().optional(),
        repo: z.array(z.url()).optional(),
      }),
      cover: image(),
      coverAlt: z.string(),
    }),
});

const experience = defineCollection({
  loader: glob({ base: "./src/content/experience", pattern: "*.json" }),
  schema: z.object({
    kind: z.enum(["work", "education", "incubator", "venture"]),
    // Bilíngue: nome próprio se repete, mas descrição junto do nome ("incubadora
    // da Campo Real") precisa de tradução.
    org: bilingual,
    role: bilingual,
    start: month,
    end: month.nullable(),
    description: bilingual,
    stack: z.array(z.string()),
  }),
});

// O loader `file` exige array com `id` ou objeto indexado por id. Os JSONs de
// stack e archive têm o formato natural do conteúdo ({ areas } e lista de
// repositórios), então o `parser` os adapta ao que o loader espera.
const stack = defineCollection({
  loader: file("src/content/stack.json", {
    parser: (text) => [{ id: "stack", ...JSON.parse(text) }],
  }),
  schema: z.object({
    areas: z.array(
      z.object({
        id: z.string(),
        label: bilingual,
        // A home mostra só tecnologia usada em projeto publicado. Área de prática
        // (infraestrutura e operações) não tem projeto que a prove e aparece inteira.
        showAllOnHome: z.boolean().default(false),
        items: z.array(
          z.object({
            id: z.string(),
            // Nome próprio é igual nos dois idiomas; descrição ("Git e GitHub") é bilíngue.
            name: z.union([z.string(), bilingual]),
            // Slug do Simple Icons ou "lucide:<nome>" (src/lib/genericIcons.ts).
            icon: z.string().optional(),
            level: z.enum(STACK_LEVELS),
          }),
        ),
      }),
    ),
  }),
});

// Texto do Sobre que não é linha do tempo: história, idiomas e cursos. Os nomes de
// idioma e curso moram aqui (e não no dicionário) por serem fatos sobre ele.
const about = defineCollection({
  loader: file("src/content/about.json", {
    parser: (text) => [{ id: "about", ...JSON.parse(text) }],
  }),
  schema: z.object({
    story: z.array(bilingual),
    languages: z.array(z.object({ name: bilingual, level: bilingual })),
    courses: z.array(bilingual),
  }),
});

const archive = defineCollection({
  loader: file("src/content/archive.json", {
    parser: (text) =>
      (JSON.parse(text) as Record<string, unknown>[]).map((repo) => ({
        id: String(repo["name"]),
        ...repo,
      })),
  }),
  schema: z.object({
    name: z.string(),
    repo: z.url(),
    stack: z.array(z.string()),
    year: z.number().int(),
  }),
});

export const collections = { projects, experience, stack, about, archive };
