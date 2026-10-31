import * as simpleIcons from "simple-icons";
import { GENERIC_ICONS } from "@/lib/genericIcons";

// Marca vem preenchida (Simple Icons); genérico vem em linha (Lucide). Os dois usam
// viewBox 24×24 e a cor do texto. Roda só no build: o HTML leva apenas o traçado
// dos ícones usados, e nenhum JS vai para o navegador.
export type TechIcon = {
  kind: "brand" | "generic";
  paths: readonly string[];
};

const GENERIC_PREFIX = "lucide:";

const brandPaths = new Map(
  Object.values(simpleIcons).map((icon) => [icon.slug, icon.path] as const),
);

export function resolveTechIcon(slug: string): TechIcon | undefined {
  if (slug.startsWith(GENERIC_PREFIX)) {
    const paths = GENERIC_ICONS[slug.slice(GENERIC_PREFIX.length)];
    return paths && { kind: "generic", paths };
  }
  const path = brandPaths.get(slug);
  return path === undefined ? undefined : { kind: "brand", paths: [path] };
}

export function missingTechIcons(slugs: readonly string[]): string[] {
  return slugs.filter((slug) => !resolveTechIcon(slug));
}
