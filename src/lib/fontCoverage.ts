import { parse, type DefaultTreeAdapterTypes } from "parse5";

// Cobertura das fontes subconjunto (scripts/check-font-coverage.mjs): todo caractere
// que o build publica precisa existir no cmap das fontes, senão o navegador desenha
// aquele caractere com a fonte do sistema (glifo diferente ou "tofu").
// Import relativo com .ts e só sintaxe "apagável": o Node 24 roda este arquivo direto.
// docs/adr/0003-orcamento-de-performance.md

type Node = DefaultTreeAdapterTypes.Node;

/**
 * Caracteres que já faltavam no arquivo latino do Fontsource das duas fontes (antes do
 * subconjunto): o navegador sempre os desenhou com a fonte do sistema. Ficam fora da
 * conferência para o visual continuar igual; incluir um deles exige a fonte completa.
 */
export const SYSTEM_FALLBACK_CODE_POINTS: ReadonlySet<number> = new Set([
  0x2011, // ‑ hífen sem quebra ("full‑stack")
  0x2190, // ← voltar
  0x2192, // → ver stack completa
  0x2318, // ⌘ atalho da paleta
  0x2713, // ✓ terminal
  0x276f, // ❯ prompt do terminal
]);

export function codePointsInText(text: string): Set<number> {
  const found = new Set<number>();
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined) found.add(codePoint);
  }
  return found;
}

// Texto e atributos de todo o documento, inclusive <script>, <style> e <template>: os
// props das ilhas e o JSON-LD também viram texto na tela. Conservador de propósito.
function stringsOf(node: Node): string[] {
  const own = [
    ...("value" in node && node.nodeName === "#text" ? [node.value] : []),
    ...("attrs" in node ? node.attrs.map((a) => a.value) : []),
  ];
  const children =
    "content" in node && node.nodeName === "template"
      ? node.content.childNodes
      : "childNodes" in node
        ? node.childNodes
        : [];
  return [...own, ...children.flatMap((child) => stringsOf(child))];
}

export function codePointsInHtml(html: string): Set<number> {
  return codePointsInText(stringsOf(parse(html)).join(""));
}

// C0, DEL e C1: controle, sem glifo.
function isControl(codePoint: number): boolean {
  return codePoint < 0x20 || (codePoint >= 0x7f && codePoint <= 0x9f);
}

export function missingCodePoints(
  used: Iterable<number>,
  covered: ReadonlySet<number>,
  ignored: ReadonlySet<number> = new Set(),
): number[] {
  const missing = new Set<number>();
  for (const codePoint of used) {
    if (isControl(codePoint) || covered.has(codePoint)) continue;
    if (!ignored.has(codePoint)) missing.add(codePoint);
  }
  return [...missing].sort((a, b) => a - b);
}

export function formatCodePoint(codePoint: number): string {
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  return `U+${hex} (${String.fromCodePoint(codePoint)})`;
}
