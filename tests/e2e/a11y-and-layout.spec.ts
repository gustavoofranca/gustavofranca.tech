import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readdirSync } from "node:fs";
import type { Locale } from "@/i18n/locales";
import { projectSlug } from "@/lib/contentRules";
import { routePath, type RouteKey } from "@/lib/routes";

// Varredura de todas as rotas, nos dois idiomas e nos dois temas: axe sem violação
// séria ou crítica, nada de rolagem horizontal em 360 px e exatamente um h1.
// A lista sai do mapa de rotas (src/lib/routes.ts) e dos arquivos de projeto: projeto
// novo entra sem editar o teste, e chave de rota nova falha o typecheck até entrar
// em STATIC_KEY_SET. .claude/rules/qualidade.md

const LOCALES: readonly Locale[] = ["pt", "en"];
// Todas as chaves de rota sem parâmetro. O `satisfies` exige uma entrada por chave de
// RouteKey (menos "project", que depende do slug): chave nova sem entrada aqui não
// compila (npm run check), então nenhuma rota fica fora da varredura sem ninguém ver.
const STATIC_KEY_SET = {
  home: true,
  projects: true,
  about: true,
  contact: true,
  privacy: true,
} satisfies Record<Exclude<RouteKey, "project">, true>;
const STATIC_KEYS = Object.keys(STATIC_KEY_SET) as Array<
  keyof typeof STATIC_KEY_SET
>;

// "lumina.pt.mdx" → slug "lumina" no idioma "pt".
function projectSlugs(locale: Locale): string[] {
  const dir = new URL("../../src/content/projects/", import.meta.url);
  return readdirSync(dir)
    .filter((file) => file.endsWith(`.${locale}.mdx`))
    .map((file) => projectSlug(file.replace(/\.mdx$/, "")));
}

const ROUTES = [
  ...LOCALES.flatMap((locale) => [
    ...STATIC_KEYS.map((key) => routePath(key, locale)),
    ...projectSlugs(locale).map((slug) => routePath("project", locale, slug)),
  ]),
  "/nao-existe",
  "/en/nao-existe",
];

test("a lista de rotas cobre os dois idiomas e todos os projetos", () => {
  expect(ROUTES).toContain("/");
  expect(ROUTES).toContain("/en/projects/lumina");
  expect(ROUTES.length).toBeGreaterThanOrEqual(22);
});

for (const colorScheme of ["dark", "light"] as const) {
  test.describe(`tema ${colorScheme}`, () => {
    for (const path of ROUTES) {
      test(`${path}: axe, um h1 e sem rolagem horizontal em 360 px`, async ({
        page,
      }) => {
        // Movimento reduzido: o axe mede o estado final, sem a máscara da digitação.
        await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          colorScheme,
        );
        await expect(page.locator("h1")).toHaveCount(1);

        const { violations } = await new AxeBuilder({ page })
          // O widget do Turnstile é um iframe de terceiro, fora do nosso controle.
          .exclude('iframe[src*="challenges.cloudflare.com"]')
          .analyze();
        const serious = violations.filter(
          (v) => v.impact === "serious" || v.impact === "critical",
        );
        expect(
          serious.map(
            (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`,
          ),
        ).toEqual([]);

        await page.setViewportSize({ width: 360, height: 740 });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  });
}
