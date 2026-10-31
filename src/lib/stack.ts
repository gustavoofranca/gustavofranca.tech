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
