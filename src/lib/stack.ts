import { z } from "astro/zod";
import type { Locale } from "@/lib/i18n";

// Ordem da legenda e valores aceitos pelo schema de stack.json.
export const STACK_LEVELS = ["basic", "intermediate", "advanced"] as const;
export type StackLevel = (typeof STACK_LEVELS)[number];

// Nome próprio de tecnologia é igual nos dois idiomas; descrição ("Git e GitHub",
// "Servidores Linux") precisa de tradução e vem como { pt, en }.
export function stackName(
  name: string | Readonly<Record<Locale, string>>,
  locale: Locale,
): string {
  return typeof name === "string" ? name : name[locale];
}

const bilingual = z.object({ pt: z.string(), en: z.string() });

// Schema de src/content/stack.json. Mora aqui (e não em content.config.ts) para o
// teste unitário validar as regras sem o runtime do Astro.
export const stackSchema = z.object({
  areas: z.array(
    z
      .object({
        id: z.string(),
        label: bilingual,
        // Frase curta da área na seção de stack. Opcional só para área que não
        // aparece (todos os itens com showInStack: false); ver o refine abaixo.
        description: bilingual.optional(),
        items: z.array(
          z.object({
            id: z.string(),
            // Nome próprio é igual nos dois idiomas; descrição ("Git e GitHub") é bilíngue.
            name: z.union([z.string(), bilingual]),
            // Slug do Simple Icons ou "lucide:<nome>" (src/lib/genericIcons.ts).
            icon: z.string().optional(),
            level: z.enum(STACK_LEVELS),
            // false tira o item da seção de stack (home e Sobre). Ele continua aqui
            // porque os projetos o citam como etiqueta (fato do projeto): Vite no
            // Lumina, Prisma no Checkpoint.
            showInStack: z.boolean().default(true),
          }),
        ),
      })
      .refine(
        (area) =>
          area.description !== undefined ||
          !area.items.some((item) => item.showInStack),
        {
          message: "Área que aparece na seção de stack precisa de description.",
          path: ["description"],
        },
      ),
  ),
});

export type StackArea = z.infer<typeof stackSchema>["areas"][number];

// Áreas como a seção mostra: só os itens com showInStack, sem área vazia, na ordem
// do arquivo. Não muda a lista recebida.
export function visibleStackAreas(areas: readonly StackArea[]) {
  return areas.flatMap((area) => {
    const items = area.items.filter((item) => item.showInStack);
    if (items.length === 0) return [];
    // O schema já exige a frase; o erro aqui só cobre dado que não passou por ele.
    if (!area.description) {
      throw new Error(`stack.json: a área "${area.id}" não tem description.`);
    }
    return [{ ...area, description: area.description, items }];
  });
}

// Quem mostra uma amostra da stack (o terminal do hero) só pode citar o que a seção
// de stack mostra: item fora dela (showInStack: false) ou inexistente derruba o build.
export function assertShownInStack(
  ids: readonly string[],
  areas: readonly StackArea[],
): void {
  const shown = new Set(
    visibleStackAreas(areas).flatMap((area) => area.items.map((i) => i.id)),
  );
  const missing = ids.filter((id) => !shown.has(id));
  if (missing.length > 0) {
    throw new Error(
      `Fora da seção de stack (showInStack: false ou inexistente em stack.json): ${missing.map((id) => `"${id}"`).join(", ")}.`,
    );
  }
}
