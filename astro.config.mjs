import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Saída estática: toda página é pré-renderizada. A única rota de servidor
// (/api/contato) opta por `prerender = false`, e o adapter Node a atende.
export default defineConfig({
  site: "https://gustavofranca.tech",
  output: "static",
  // bodySizeLimit: o padrão é 1 GB. O maior envio legítimo (4000 caracteres de 4 bytes,
  // percent-encoded, mais o token do Turnstile) fica abaixo de 64 KB.
  adapter: node({ mode: "standalone", bodySizeLimit: 64 * 1024 }),
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
