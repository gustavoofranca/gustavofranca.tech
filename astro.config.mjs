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
  adapter: node({ mode: "standalone" }),
  // PT na raiz, EN em /en. As rotas têm nomes próprios por idioma (src/lib/routes.ts).
  i18n: {
    defaultLocale: "pt",
    locales: ["pt", "en"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
