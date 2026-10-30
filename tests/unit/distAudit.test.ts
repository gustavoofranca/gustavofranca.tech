import { describe, expect, it } from "vitest";
import { cspHash } from "@/lib/csp";
import { auditHtml } from "@/lib/distAudit";

const THEME = "document.documentElement.dataset.theme='dark'";
const STYLE = ".a{color:red}";

async function cspMeta(
  extra: { script?: string[]; style?: string[] } = {},
): Promise<string> {
  const scriptHashes = [await cspHash(THEME), ...(extra.script ?? [])]
    .map((h) => (h.startsWith("sha") ? `'${h}'` : h))
    .join(" ");
  const styleHashes = [await cspHash(STYLE), ...(extra.style ?? [])]
    .map((h) => (h.startsWith("sha") ? `'${h}'` : h))
    .join(" ");
  return `<meta http-equiv="content-security-policy" content="default-src 'self'; object-src 'none'; script-src 'self' ${scriptHashes}; style-src 'self' ${styleHashes}">`;
}

async function page(head: string, body: string, meta?: string) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">${head}${meta ?? (await cspMeta())}</head><body>${body}</body></html>`;
}

describe("auditHtml", () => {
  it("aceita página com scripts e estilos inline cobertos por hash", async () => {
    const html = await page(
      '<script type="application/ld+json">{"@type":"Person"}</script>',
      `<script>${THEME}</script><style>${STYLE}</style><script type="module" src="/_astro/a.js"></script><p>oi</p>`,
    );
    expect(await auditHtml(html)).toEqual([]);
  });

  it("acusa script inline sem hash na CSP", async () => {
    const html = await page("", "<script>alert(1)</script>");
    const problems = await auditHtml(html);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/script inline sem hash/);
  });

  it("acusa estilo inline sem hash na CSP", async () => {
    const html = await page("", "<style>.b{color:blue}</style>");
    expect(await auditHtml(html)).toEqual([
      expect.stringMatching(/style inline sem hash/),
    ]);
  });

  it("hash de script não libera o mesmo texto como estilo", async () => {
    const html = await page("", `<style>${THEME}</style>`);
    expect(await auditHtml(html)).toEqual([
      expect.stringMatching(/style inline sem hash/),
    ]);
  });

  it("acusa atributo style e handlers on*", async () => {
    const html = await page(
      "",
      '<div style="color:red"></div><button onclick="x()">a</button><svg><g ONLOAD="y()"></g></svg>',
    );
    const problems = await auditHtml(html);
    expect(problems).toHaveLength(3);
    expect(problems.join("\n")).toMatch(/atributo style/);
    expect(problems.join("\n")).toMatch(/atributo onclick/);
    expect(problems.join("\n")).toMatch(/atributo onload/);
  });

  it("não confunde atributo que só começa com 'o' (open, opts)", async () => {
    const html = await page(
      "",
      '<details open><summary>a</summary></details><astro-island opts="{}"></astro-island>',
    );
    expect(await auditHtml(html)).toEqual([]);
  });

  it("acusa script, estilo e folha de estilo antes da meta da CSP", async () => {
    const html = await page(
      `<script>${THEME}</script><link rel="stylesheet" href="/a.css"><style>${STYLE}</style><link rel="modulepreload" href="/b.js">`,
      "",
    );
    const problems = await auditHtml(html);
    expect(problems).toHaveLength(4);
    for (const problem of problems) expect(problem).toMatch(/antes da meta/);
  });

  it("JSON-LD antes da meta não é executável e passa", async () => {
    const html = await page(
      '<script type="application/ld+json">{"a":1}</script>',
      "",
    );
    expect(await auditHtml(html)).toEqual([]);
  });

  it("acusa página sem meta de CSP ou com mais de uma", async () => {
    const without = `<!doctype html><html><head></head><body></body></html>`;
    expect(await auditHtml(without)).toEqual([
      expect.stringMatching(/sem <meta> de CSP/),
    ]);
    const meta = await cspMeta();
    const twice = await page("", "", meta + meta);
    expect(await auditHtml(twice)).toEqual([
      expect.stringMatching(/2 <meta> de CSP/),
    ]);
  });

  it("acusa 'unsafe-inline' em script-src ou style-src", async () => {
    const meta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'">`;
    const problems = await auditHtml(await page("", "", meta));
    expect(problems).toHaveLength(2);
    expect(problems.join("\n")).toMatch(/script-src.*'unsafe-inline'/);
    expect(problems.join("\n")).toMatch(/style-src.*'unsafe-inline'/);
  });

  it("sem script-src, o hash vale pelo default-src", async () => {
    const hash = await cspHash(THEME);
    const meta = `<meta http-equiv="content-security-policy" content="default-src 'self' '${hash}'">`;
    expect(
      await auditHtml(await page("", `<script>${THEME}</script>`, meta)),
    ).toEqual([]);
  });

  it("acusa script externo de origem fora do script-src", async () => {
    const meta = await cspMeta({
      script: ["https://challenges.cloudflare.com"],
    });
    const ok = await page(
      "",
      '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async></script>',
      meta,
    );
    expect(await auditHtml(ok)).toEqual([]);
    const bad = await page(
      "",
      '<script src="https://evil.example/x.js"></script><script src="//cdn.example/y.js"></script>',
    );
    const problems = await auditHtml(bad);
    expect(problems).toHaveLength(2);
    for (const problem of problems) expect(problem).toMatch(/origem fora/);
  });

  it("confere scripts dentro de <template>", async () => {
    const html = await page(
      "",
      "<template><script>alert(1)</script></template>",
    );
    expect(await auditHtml(html)).toEqual([
      expect.stringMatching(/script inline sem hash/),
    ]);
  });

  it("hasheia o texto depois da normalização de quebra de linha do parser", async () => {
    // O navegador troca \r\n por \n antes de hashear; o arquivo pode ter vindo com CRLF.
    const code = "let a = 1;\nlet b = 2;";
    const meta = await cspMeta({ script: [await cspHash(code)] });
    const html = await page(
      "",
      `<script>${code.replace("\n", "\r\n")}</script>`,
      meta,
    );
    expect(await auditHtml(html)).toEqual([]);
  });
});
