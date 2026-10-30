// Gera os subconjuntos das fontes do site (npm run fonts:subset). Roda à mão, só quando
// mudar caractere, peso ou a versão do Fontsource; o resultado vai para o Git em
// src/assets/fonts/ e o build não depende desta ferramenta.
// Parte do arquivo latino variável do Fontsource e corta o que o site não usa:
// - caracteres: Latim Básico, Latim-1 (acentos do PT) e Pontuação Geral, mais € ™ −;
// - eixo wght: só 400–600 (font-normal, font-medium e font-semibold);
// - recursos OpenType: só os de forma (ccmp, locl, calt, kern, mark, mkmk); frações e
//   números tabulares/proporcionais (frac, numr, dnom, tnum, pnum) não são usados.
// Peso ou recurso novo no CSS: amplie aqui, rode de novo e atualize o font-weight do
// @font-face em global.css. Conferência: npm run audit:fonts (depois do build).
// docs/adr/0003-orcamento-de-performance.md
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const root = new URL("../", import.meta.url);
const outDir = fileURLToPath(new URL("src/assets/fonts/", root));

function range(first, last) {
  return Array.from({ length: last - first + 1 }, (_, i) =>
    String.fromCodePoint(first + i),
  ).join("");
}

const TEXT =
  range(0x20, 0x7e) + // Latim Básico (sem controles)
  range(0xa0, 0xff) + // Latim-1: acentos do português, ©, ·, «»
  range(0x2000, 0x206f) + // Pontuação Geral: – — ‘ ’ “ ” • … (o que a fonte tiver)
  "€™−"; // € ™ −

const WEIGHT = { min: 400, max: 600 };
const SHAPING = ["ccmp", "locl", "calt", "kern", "mark", "mkmk"];

const FONTS = [
  {
    source: "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
    license: "@fontsource-variable/inter/LICENSE",
    name: "inter",
  },
  {
    source:
      "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
    license: "@fontsource-variable/jetbrains-mono/LICENSE",
    name: "jetbrains-mono",
  },
];

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

mkdirSync(outDir, { recursive: true });
for (const font of FONTS) {
  const sourcePath = fileURLToPath(
    new URL(`node_modules/${font.source}`, root),
  );
  const source = readFileSync(sourcePath);
  const subset = await subsetFont(source, TEXT, {
    targetFormat: "woff2",
    keepFeatures: SHAPING,
    variationAxes: { wght: WEIGHT },
  });
  const file = `${font.name}-latin-wght-${WEIGHT.min}-${WEIGHT.max}.woff2`;
  writeFileSync(`${outDir}${file}`, subset);
  // OFL 1.1: a licença acompanha a fonte modificada. Nenhuma das duas declara
  // Reserved Font Name, então o nome da família pode continuar o mesmo.
  copyFileSync(
    fileURLToPath(new URL(`node_modules/${font.license}`, root)),
    `${outDir}OFL-${font.name}.txt`,
  );
  console.log(`${file}: ${kb(source.length)} -> ${kb(subset.length)}`);
}
