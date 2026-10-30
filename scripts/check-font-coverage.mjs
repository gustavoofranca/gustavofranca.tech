// Cobertura das fontes no build (npm run audit:fonts, depois do npm run build): todo
// caractere do HTML de dist/client e do JS das ilhas (a paleta monta textos no navegador)
// precisa estar no cmap de cada .woff2 publicado. Falha listando o que falta; aí é
// ampliar o subconjunto em scripts/subset-fonts.mjs e rodar npm run fonts:subset.
// Importa o .ts direto: o Node 24 remove os tipos sozinho.
// docs/adr/0003-orcamento-de-performance.md
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { Blob, Face } from "harfbuzzjs";
import subsetFont from "subset-font";
import {
  SYSTEM_FALLBACK_CODE_POINTS,
  codePointsInHtml,
  codePointsInText,
  formatCodePoint,
  missingCodePoints,
} from "../src/lib/fontCoverage.ts";

const root = fileURLToPath(new URL("../dist/client", import.meta.url));

function filesOf(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? filesOf(full) : [full];
  });
}

// O HarfBuzz não lê WOFF2: o próprio subset-font devolve o SFNT com todos os glifos.
async function cmapOf(file) {
  const sfnt = await subsetFont(readFileSync(file), null, {
    keepAllGlyphs: true,
    targetFormat: "sfnt",
  });
  return new Set(new Face(new Blob(new Uint8Array(sfnt))).collectUnicodes());
}

const files = filesOf(root);
const html = files.filter((file) => file.endsWith(".html"));
const scripts = files.filter((file) => file.endsWith(".js"));
const fonts = files.filter((file) => file.endsWith(".woff2"));
if (html.length === 0 || fonts.length === 0) {
  console.error(
    "Nenhum HTML ou .woff2 em dist/client. Rode npm run build antes.",
  );
  process.exit(1);
}

const used = new Set();
for (const file of html) {
  for (const codePoint of codePointsInHtml(readFileSync(file, "utf8")))
    used.add(codePoint);
}
for (const file of scripts) {
  for (const codePoint of codePointsInText(readFileSync(file, "utf8")))
    used.add(codePoint);
}

let failures = 0;
for (const font of fonts) {
  const missing = missingCodePoints(
    used,
    await cmapOf(font),
    SYSTEM_FALLBACK_CODE_POINTS,
  );
  if (missing.length === 0) continue;
  failures += missing.length;
  const name = relative(root, font).replaceAll("\\", "/");
  console.error(
    `  ${name} não tem: ${missing.map(formatCodePoint).join(", ")}`,
  );
}

// exitCode em vez de process.exit(): no Windows, sair com o WebAssembly do HarfBuzz
// ainda carregado derruba o Node ("Assertion failed: UV_HANDLE_CLOSING", código 127).
if (failures > 0) {
  console.error(
    "\nCobertura das fontes: caractere sem glifo no subconjunto (scripts/subset-fonts.mjs).",
  );
  process.exitCode = 1;
} else {
  console.log(
    `Cobertura das fontes: ${used.size} caractere(s) de ${html.length} página(s) e ${scripts.length} script(s) cobertos por ${fonts.length} fonte(s).`,
  );
}
