import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { readdirSync, readFileSync } from "node:fs";
import { cspHash } from "./src/lib/csp.ts";

// Hash de cada script/estilo is:inline do site. Eles vivem em arquivos próprios e entram
// na página com set:html (texto idêntico), então o hash sai do arquivo, num lugar só.
// Vale para todas as páginas: um hash só libera aquele texto exato, onde quer que esteja.
// Não dá para registrar por componente (Astro.csp): com o adapter o build renderiza em
// streaming, e a <meta> sai antes de o componente rodar. docs/adr/0002-csp.md
async function inlineHashes(dir) {
  const url = new URL(dir, import.meta.url);
  return Promise.all(
    readdirSync(url).map((file) =>
      cspHash(readFileSync(new URL(file, url), "utf8")),
    ),
  );
}

// Saída estática: toda página é pré-renderizada. A única rota de servidor
// (/api/contato) opta por `prerender = false`, e o adapter Node a atende.
export default defineConfig({
  site: "https://gustavofranca.tech",
  output: "static",
  // bodySizeLimit: o padrão é 1 GB. O maior envio legítimo (4000 caracteres de 4 bytes,
  // percent-encoded, mais o token do Turnstile) fica abaixo de 64 KB.
  adapter: node({ mode: "standalone", bodySizeLimit: 64 * 1024 }),
  security: {
    // Atrás do Caddy o processo recebe HTTP com X-Forwarded-Proto/Host. Só para este
    // domínio o Astro confia neles, e aí url.origin é https://gustavofranca.tech (o
    // checkOrigin do POST nativo e src/lib/contact/request.ts dependem disso). Fora
    // dele (preview local, e2e) o Astro ignora os cabeçalhos e usa http://localhost:4321.
    // https://docs.astro.build/en/reference/configuration-reference/#securityalloweddomains
    allowedDomains: [{ hostname: "gustavofranca.tech", protocol: "https" }],
    // CSP nativa: o Astro hasheia os scripts e estilos que processa (ilhas, <script>
    // empacotado, CSS inline) e põe uma <meta> em cada página estática. Os is:inline
    // entram por inlineHashes. Sem 'unsafe-inline'. frame-ancestors, HSTS e o resto dos
    // cabeçalhos vão no Caddy (fase 2): frame-ancestors é ignorado em <meta>.
    // docs/adr/0002-csp.md
    // https://docs.astro.build/en/reference/configuration-reference/#securitycsp
    csp: {
      directives: [
        "default-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // 'self' explícito: quando uma página acrescenta uma origem (o Turnstile, no
      // contato), o Astro deixa de pôr o 'self' padrão.
      scriptDirective: {
        resources: ["'self'"],
        hashes: await inlineHashes("./src/scripts/inline/"),
      },
      styleDirective: {
        resources: ["'self'"],
        hashes: await inlineHashes("./src/styles/inline/"),
      },
    },
  },
  // Sem realce de sintaxe: o Shiki pinta com style="" inline, que a CSP barra (sem
  // 'unsafe-inline' em style-src). Se um estudo de caso precisar de código colorido,
  // usar "prism" (só classes) com um tema em CSS.
  markdown: { syntaxHighlight: false },
  // PT na raiz, EN em /en. As rotas têm nomes próprios por idioma (src/lib/routes.ts).
  i18n: {
    defaultLocale: "pt",
    locales: ["pt", "en"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    mdx(),
    sitemap({
      // Mesma regra de barra final do canonical (src/lib/seo.ts, canonicalPath): só as
      // duas homes terminam em "/". O @astrojs/sitemap emitiria "/sobre/" (formato diretório).
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== "/" && url.pathname !== "/en/") {
          url.pathname = url.pathname.replace(/\/+$/, "");
        }
        return { ...item, url: url.href };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
