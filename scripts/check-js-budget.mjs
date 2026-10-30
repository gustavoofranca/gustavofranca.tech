// Orçamento de JS da home (.claude/rules/qualidade.md): soma o gzip de todo JS que a
// home carrega sem interação (scripts inline, <script src>, modulepreload, ilhas e
// renderers do Astro, e os imports estáticos de cada chunk, em cascata) e falha acima
// de 80 KB. import() dinâmico fica de fora: é o que só baixa sob demanda (o corpo da
// paleta ⌘K, por exemplo). Rode depois do npm run build.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { parse } from "parse5";

const LIMIT_BYTES = 80 * 1024;
const root = fileURLToPath(new URL("../dist/client/", import.meta.url));
const ORIGIN = "https://site.invalid";

// Atributos com URL de JS que o Astro (ou o HTML) carrega na abertura da página.
const URL_ATTRS = new Set([
  "component-url",
  "renderer-url",
  "before-hydration-url",
]);
// import/export estático: `import{a}from"./x.js"`, `import"./x.js"`, `export*from"./x.js"`.
// `import("./x.js")` não casa: depois de `import` vem `(`, não aspas nem nomes.
const STATIC_IMPORT =
  /(?:^|[;}\s])(?:import|export)\s*(?:[^'"();]*?from\s*)?["']([^"']+\.js)["']/g;

function elementsOf(node) {
  const self = node.tagName ? [node] : [];
  const children = node.childNodes ?? [];
  return [...self, ...children.flatMap(elementsOf)];
}

function isExecutableScript(element) {
  const type = element.attrs.find((a) => a.name === "type")?.value ?? "";
  return type === "" || type === "module" || /javascript/i.test(type);
}

function gzipSize(text) {
  return gzipSync(Buffer.from(text, "utf8")).length;
}

const html = readFileSync(`${root}index.html`, "utf8");
const elements = elementsOf(parse(html));
const sizes = new Map();
let inlineBytes = 0;

function visit(path) {
  if (sizes.has(path)) return;
  if (!path.startsWith("/")) {
    throw new Error(`JS fora do site na home: ${path}`);
  }
  const source = readFileSync(`${root}${path.slice(1)}`, "utf8");
  sizes.set(path, gzipSize(source));
  for (const [, spec] of source.matchAll(STATIC_IMPORT)) {
    visit(new URL(spec, `${ORIGIN}${path}`).pathname);
  }
}

function visitUrl(url) {
  const resolved = new URL(url, `${ORIGIN}/`);
  if (resolved.origin !== ORIGIN) {
    throw new Error(`JS de outra origem na home: ${url}`);
  }
  visit(resolved.pathname);
}

for (const element of elements) {
  for (const { name, value } of element.attrs) {
    if (URL_ATTRS.has(name)) visitUrl(value);
  }
  if (element.tagName === "link") {
    const rel = element.attrs.find((a) => a.name === "rel")?.value ?? "";
    const href = element.attrs.find((a) => a.name === "href")?.value;
    if (/\bmodulepreload\b/.test(rel) && href) visitUrl(href);
  }
  if (element.tagName !== "script" || !isExecutableScript(element)) continue;
  const src = element.attrs.find((a) => a.name === "src")?.value;
  if (src) {
    visitUrl(src);
    continue;
  }
  const text = element.childNodes.map((c) => c.value ?? "").join("");
  inlineBytes += gzipSize(text);
  for (const [, spec] of text.matchAll(STATIC_IMPORT)) visitUrl(spec);
}

const total = [...sizes.values()].reduce(
  (sum, size) => sum + size,
  inlineBytes,
);
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

for (const [path, size] of [...sizes].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${kb(size).padStart(8)}  ${path}`);
}
console.log(`  ${kb(inlineBytes).padStart(8)}  (scripts inline)`);
console.log(`JS da home: ${kb(total)} gzip (limite ${kb(LIMIT_BYTES)}).`);

if (total > LIMIT_BYTES) {
  console.error("Orçamento de JS estourado.");
  process.exit(1);
}
