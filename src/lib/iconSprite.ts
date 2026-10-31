import { createHash } from "node:crypto";
import { optimize } from "svgo";
import { missingTechIcons, resolveTechIcon } from "@/lib/techIcons";

// Sprite SVG externo com os ícones da stack: um arquivo só, cacheável, em vez de
// repetir os traçados no HTML de cada página (eles triplicavam o HTML do Sobre).
// Cada ícone vira um <symbol>; a página usa <svg><use href="arquivo#id"/></svg>, e o
// currentColor do <symbol> herda a cor do <use>, então os dois temas continuam valendo.

export function iconSymbolId(slug: string): string {
  return slug.startsWith("lucide:") ? slug.replace(":", "-") : `si-${slug}`;
}

// Uma casa decimal no viewBox 24×24 é 0,07 px num ícone de 16 px: invisível. O
// sprite cai de ~19,6 KB para ~7 KB gzip, e o Sobre volta a passar no LCP (o pedido
// dele divide banda com as fontes; DESIGN.md). Só o convertPathData: ids, viewBox e
// pintura ficam como estão.
const PATH_PRECISION = 1;

// Atributos de apresentação, não `style`: a CSP não libera estilo inline.
const BRAND_PAINT = 'fill="currentColor"';
const GENERIC_PAINT =
  'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

export function buildIconSprite(slugs: readonly string[]): string {
  const missing = missingTechIcons([...new Set(slugs)]);
  if (missing.length > 0) {
    throw new Error(
      `Ícone que não existe no Simple Icons nem em src/lib/genericIcons.ts: ${missing.join(", ")}.`,
    );
  }
  // Ordem estável: a mesma lista em outra ordem gera o mesmo arquivo (e o mesmo hash).
  const symbols = [...new Set(slugs)].sort().flatMap((slug) => {
    const icon = resolveTechIcon(slug);
    if (!icon) return [];
    const paint = icon.kind === "brand" ? BRAND_PAINT : GENERIC_PAINT;
    const paths = icon.paths.map((d) => `<path d="${d}"/>`).join("");
    return `<symbol id="${iconSymbolId(slug)}" viewBox="0 0 24 24" ${paint}>${paths}</symbol>`;
  });
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join("")}</svg>`;
  return optimize(sprite, {
    plugins: [
      { name: "convertPathData", params: { floatPrecision: PATH_PRECISION } },
    ],
  }).data;
}

// Nome com hash do conteúdo: ícone novo gera arquivo novo, então o cache pode ser longo.
export function iconSpriteFile(sprite: string): string {
  const hash = createHash("sha256").update(sprite).digest("hex").slice(0, 10);
  return `stack-${hash}.svg`;
}
