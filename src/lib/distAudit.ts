import { parse, type DefaultTreeAdapterTypes } from "parse5";
import { cspHash } from "./csp.ts";

// Auditoria da CSP no HTML do build (scripts/audit-dist.mjs). Confere, sem navegador,
// o que o e2e só pega se a página quebrar: todo script/estilo inline tem hash na
// <meta> da página, não há style="" nem on*="", e nada que execute ou estilize vem
// antes da <meta> (uma CSP em <meta> só vale para o que vem depois dela).
// Import relativo com .ts e só sintaxe "apagável": o Node 24 roda este arquivo direto.
// https://www.w3.org/TR/CSP3/#meta-element
// https://www.w3.org/TR/CSP3/#match-element-to-source-list

type Element = DefaultTreeAdapterTypes.Element;
type Node = DefaultTreeAdapterTypes.Node;

// Tipos MIME de JavaScript (HTML, "JavaScript MIME type essence match"). Qualquer outro
// type não vazio, fora module/importmap/speculationrules, é bloco de dados (JSON-LD).
// https://html.spec.whatwg.org/multipage/scripting.html#prepare-the-script-element
const JS_MIME =
  /^(?:text|application)\/(?:x-)?(?:javascript|ecmascript)$|^text\/(?:jscript|livescript|javascript1\.[0-5])$/;
const SCRIPT_KEYWORDS = new Set([
  "",
  "module",
  "importmap",
  "speculationrules",
]);

function attr(element: Element, name: string): string | undefined {
  return element.attrs.find((a) => a.name === name)?.value;
}

// Elementos em ordem de documento, incluindo o conteúdo de <template>.
function elementsOf(node: Node): Element[] {
  const children =
    "content" in node && node.nodeName === "template"
      ? node.content.childNodes
      : "childNodes" in node
        ? node.childNodes
        : [];
  const self = "tagName" in node ? [node] : [];
  return [...self, ...children.flatMap((child) => elementsOf(child))];
}

function textOf(element: Element): string {
  return element.childNodes
    .map((child) =>
      child.nodeName === "#text" && "value" in child ? child.value : "",
    )
    .join("");
}

function isExecutableScript(element: Element): boolean {
  if (element.tagName !== "script") return false;
  const type = (attr(element, "type") ?? "").trim().toLowerCase();
  return SCRIPT_KEYWORDS.has(type) || JS_MIME.test(type);
}

function isCspMeta(element: Element): boolean {
  return (
    element.tagName === "meta" &&
    attr(element, "http-equiv")?.toLowerCase() === "content-security-policy"
  );
}

// Carrega ou aplica estilo/script: o que precisa vir depois da <meta>.
function isActive(element: Element): boolean {
  if (isExecutableScript(element) || element.tagName === "style") return true;
  if (element.tagName !== "link") return false;
  const rel = (attr(element, "rel") ?? "").toLowerCase().split(/\s+/);
  return rel.includes("stylesheet") || rel.includes("modulepreload");
}

function snippet(element: Element): string {
  const attrs = element.attrs.map((a) => ` ${a.name}="${a.value}"`).join("");
  const text = textOf(element).slice(0, 40);
  return `<${element.tagName}${attrs}>${text}`.slice(0, 100);
}

function parseCsp(content: string): Map<string, string[]> {
  const directives = new Map<string, string[]>();
  for (const part of content.split(";")) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (!name || directives.has(name.toLowerCase())) continue;
    directives.set(name.toLowerCase(), sources);
  }
  return directives;
}

// Script externo: caminho do próprio site ou origem listada no script-src.
function allowedScriptSrc(src: string, sources: string[]): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  if (!/^[a-z][a-z0-9+.-]*:|^\/\//i.test(src)) return true;
  const origin = new URL(src, "https://self.invalid").origin;
  return sources.some((source) => source.replace(/\/$/, "") === origin);
}

export async function auditHtml(html: string): Promise<string[]> {
  const elements = elementsOf(parse(html));
  const metas = elements.filter(isCspMeta);
  if (metas.length === 0) return ["sem <meta> de CSP"];
  if (metas.length > 1) return [`${metas.length} <meta> de CSP na página`];
  const [meta] = metas;
  if (!meta) return ["sem <meta> de CSP"];

  const csp = parseCsp(attr(meta, "content") ?? "");
  const fallback = csp.get("default-src") ?? [];
  const scriptSrc = csp.get("script-src") ?? fallback;
  const styleSrc = csp.get("style-src") ?? fallback;
  const problems: string[] = [];

  for (const [name, sources] of [
    ["script-src", scriptSrc],
    ["style-src", styleSrc],
  ] as const) {
    if (sources.includes("'unsafe-inline'")) {
      problems.push(`${name} com 'unsafe-inline'`);
    }
  }

  const metaIndex = elements.indexOf(meta);
  for (const [index, element] of elements.entries()) {
    for (const { name } of element.attrs) {
      if (name === "style" || /^on/i.test(name)) {
        problems.push(`atributo ${name.toLowerCase()} em ${snippet(element)}`);
      }
    }
    if (!isActive(element)) continue;
    if (index < metaIndex) {
      problems.push(`antes da meta da CSP: ${snippet(element)}`);
      continue;
    }
    if (element.tagName === "link") continue;

    const src = attr(element, "src");
    if (src !== undefined) {
      if (!allowedScriptSrc(src, scriptSrc)) {
        problems.push(`script de origem fora do script-src: ${src}`);
      }
      continue;
    }

    const kind = element.tagName === "style" ? "style" : "script";
    const sources = kind === "style" ? styleSrc : scriptSrc;
    const hash = `'${await cspHash(textOf(element))}'`;
    if (!sources.includes(hash)) {
      problems.push(`${kind} inline sem hash na CSP: ${snippet(element)}`);
    }
  }
  return problems;
}
