import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createElement, type ReactNode } from "react";
import type { Locale } from "@/i18n/locales";
import { routePath, type RouteKey } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// `/og/<idioma>/<rota>.png`, onde <rota> é o caminho da página sem o prefixo do
// idioma ("projetos/lumina"). A home vira "home": nenhuma rota usa esse nome.
export function ogPathFor(
  locale: Locale,
  key: RouteKey,
  slug?: string,
): string {
  const page = routePath(key, locale, slug);
  const route =
    key === "home" ? "home" : page.replace(/^\/en(?=\/)/, "").slice(1);
  return `/og/${locale}/${route}.png`;
}

// Espelho de src/styles/tokens.css (tema escuro). O satori desenha uma imagem e não
// enxerga variáveis CSS, então aqui os valores são literais. Mudou o token, mude aqui.
const COLOR = {
  bg: "#09090b",
  fg: "#fafafa",
  muted: "#a1a1aa",
  line: "#27272a",
  accent: "#a78bfa",
  aurora1: "rgba(124, 58, 237, 0.45)",
  aurora2: "rgba(6, 182, 212, 0.3)",
} as const;

const SANS = "Inter";
const MONO = "JetBrains Mono";

// O satori lê TTF, OTF e WOFF, mas não WOFF2. Os pacotes `-variable` só trazem WOFF2,
// então as fontes vêm dos pacotes estáticos (`@fontsource/*`), no subconjunto latino
// (cobre os acentos do português).
const FONT_FILES = [
  {
    name: SANS,
    weight: 400,
    file: "@fontsource/inter/files/inter-latin-400-normal.woff",
  },
  {
    name: SANS,
    weight: 700,
    file: "@fontsource/inter/files/inter-latin-700-normal.woff",
  },
  {
    name: MONO,
    weight: 400,
    file: "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff",
  },
] as const;

type Font = { name: string; data: Buffer; weight: 400 | 700; style: "normal" };

// Lidas uma vez por processo: o build gera dezenas de imagens com as mesmas fontes.
let fonts: Promise<Font[]> | undefined;

function loadFonts(): Promise<Font[]> {
  fonts ??= Promise.all(
    FONT_FILES.map(async ({ name, weight, file }) => ({
      name,
      weight,
      style: "normal" as const,
      data: await readFile(join(process.cwd(), "node_modules", file)),
    })),
  );
  return fonts;
}

export type OgInput = {
  title: string;
  subtitle: string;
  tags: readonly string[];
};

const el = (
  type: string,
  style: Record<string, string | number>,
  ...children: ReactNode[]
) => createElement(type, { style }, ...children);

// Títulos longos descem de tamanho antes de cortar; o corte (lineClamp) é a rede de
// segurança para o que ainda não couber.
function titleSize(title: string): number {
  if (title.length <= 28) return 84;
  if (title.length <= 48) return 68;
  return 54;
}

function card({ title, subtitle, tags }: OgInput) {
  return el(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      width: OG_WIDTH,
      height: OG_HEIGHT,
      boxSizing: "border-box",
      padding: 72,
      backgroundColor: COLOR.bg,
      // Brilho da aurora do hero: violeta no alto à direita, ciano embaixo à esquerda.
      backgroundImage: `radial-gradient(ellipse 60% 70% at 85% 0%, ${COLOR.aurora1}, rgba(0, 0, 0, 0)), radial-gradient(ellipse 50% 60% at 0% 100%, ${COLOR.aurora2}, rgba(0, 0, 0, 0))`,
      color: COLOR.fg,
      fontFamily: SANS,
    },
    el(
      "div",
      { fontFamily: MONO, fontSize: 30, color: COLOR.accent },
      "~/gustavo",
    ),
    el(
      "div",
      { display: "flex", flexDirection: "column" },
      el(
        "div",
        {
          fontSize: titleSize(title),
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: -2,
          lineClamp: 2,
        },
        title,
      ),
      el(
        "div",
        {
          marginTop: 28,
          fontSize: 32,
          lineHeight: 1.35,
          color: COLOR.muted,
          lineClamp: 3,
        },
        subtitle,
      ),
    ),
    el(
      "div",
      {
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        fontFamily: MONO,
        fontSize: 26,
      },
      el(
        "div",
        { display: "flex", flexWrap: "wrap", gap: 12, maxWidth: 820 },
        ...tags.slice(0, 6).map((tag) =>
          el(
            "div",
            {
              padding: "6px 18px",
              border: `2px solid ${COLOR.line}`,
              borderRadius: 999,
              color: COLOR.muted,
            },
            tag,
          ),
        ),
      ),
      el("div", { color: COLOR.muted }, new URL(SITE_URL).host),
    ),
  );
}

// Importados na hora de usar: `seo.ts` importa este arquivo só por `ogPathFor`, e o
// satori e o resvg (binário nativo) não devem entrar em quem não gera imagem.
export async function renderOg(input: OgInput): Promise<Uint8Array> {
  const [{ default: satori }, { Resvg }, loaded] = await Promise.all([
    import("satori"),
    import("@resvg/resvg-js"),
    loadFonts(),
  ]);
  const svg = await satori(card(input), {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: loaded,
  });
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
  }).render();
  return new Uint8Array(png.asPng());
}
