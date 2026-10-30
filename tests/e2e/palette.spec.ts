import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// A ilha usa client:afterload: o atalho só responde depois que o atributo ssr some.
async function openPage(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
}

// Nome do arquivo do corpo da paleta (chunk à parte, com hash no nome).
const BODY_CHUNK = /\/_astro\/PaletteBody[^/]*\.js$/;

// O corpo da paleta vem em um chunk à parte: só digita depois que o campo existe.
// O atributo ssr some um instante antes de o React registrar o atalho (o efeito roda
// depois da hidratação). Repete o atalho até o diálogo abrir, sem nunca fechá-lo.
async function pressShortcut(page: Page) {
  await expect(async () => {
    if (!(await page.locator("dialog[open]").count())) {
      await page.keyboard.press("Control+K");
    }
    await expect(page.locator("dialog[open]")).toHaveCount(1, { timeout: 500 });
  }).toPass();
}

async function openPalette(page: Page) {
  await pressShortcut(page);
  await expect(page.getByRole("combobox")).toBeFocused();
}

const dialog = (page: Page) =>
  page.getByRole("dialog", { name: "Paleta de comandos" });

test.describe("paleta de comandos", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("Ctrl+K abre; digitar 'check' e Enter leva ao projeto", async ({
    page,
  }) => {
    await openPage(page);
    await pressShortcut(page);
    await expect(dialog(page)).toBeVisible();
    await expect(page.getByRole("combobox")).toBeFocused();
    await page.keyboard.type("check");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/projetos\/checkpoint$/);
  });

  test("o botão do cabeçalho abre; Esc fecha e devolve o foco", async ({
    page,
  }) => {
    await openPage(page);
    const trigger = page.getByRole("button", {
      name: "Abrir paleta de comandos",
    });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("clique no botão antes de a ilha hidratar abre a paleta quando ela chega", async ({
    page,
  }) => {
    // Segura o chunk da ilha: a página carrega, o botão já responde ao clique e o
    // React ainda não chegou (ninguém ouve o evento gf:open-palette).
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(/\/_astro\/CommandPalette[^/]*\.js$/, async (route) => {
      await held;
      await route.continue();
    });
    await page.goto("/");
    await expect(page.locator("astro-island[ssr]")).not.toHaveCount(0);
    await page
      .getByRole("button", { name: "Abrir paleta de comandos" })
      .click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    release();
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
    await expect(dialog(page)).toBeVisible();
    await expect(page.getByRole("combobox")).toBeFocused();
    // A marca foi consumida: fechar e esperar não reabre a paleta.
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-palette-requested",
    );
  });

  test("o foco fica preso na paleta enquanto ela está aberta", async ({
    page,
  }) => {
    await openPage(page);
    await pressShortcut(page);
    await expect(page.getByRole("combobox")).toBeFocused();
    for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
    const inside = await page.evaluate(
      () => !!document.activeElement?.closest("dialog"),
    );
    expect(inside).toBe(true);
  });

  test("copiar e-mail copia e mostra a confirmação", async ({ page }) => {
    await openPage(page);
    await openPalette(page);
    await page.keyboard.type("copiar");
    await page.keyboard.press("Enter");
    await expect(dialog(page).getByRole("status")).toHaveText("E-mail copiado");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe("contato@gustavofranca.tech");
  });

  test("alternar tema pela paleta troca e guarda o tema", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await openPage(page);
    await openPalette(page);
    await page.keyboard.type("tema");
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(dialog(page)).toBeHidden();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("mudar de idioma mantém a página", async ({ page }) => {
    await openPage(page, "/projetos/lumina");
    await openPalette(page);
    await page.keyboard.type("english");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en\/projects\/lumina$/);
  });

  test("em inglês, a paleta fala inglês", async ({ page }) => {
    await openPage(page, "/en/");
    await pressShortcut(page);
    await expect(
      page.getByRole("dialog", { name: "Command palette" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Switch to Português" }),
    ).toBeVisible();
  });

  test("busca sem resultado mostra a mensagem de vazio", async ({ page }) => {
    await openPage(page);
    await openPalette(page);
    await page.keyboard.type("zzzzqqq");
    await expect(dialog(page).getByText("Nada encontrado.")).toBeVisible();
  });

  test("easter egg: sudo hire-me leva ao contato", async ({ page }) => {
    await openPage(page);
    await openPalette(page);
    await expect(
      page.getByRole("option", { name: "Contratar o Gustavo" }),
    ).toHaveCount(0);
    await page.keyboard.type("sudo hire-me");
    await expect(
      page.getByRole("option", { name: "Contratar o Gustavo" }),
    ).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/contato$/);
  });

  test("com Ctrl+K a partir de um link, Esc devolve o foco ao link", async ({
    page,
  }) => {
    await openPage(page);
    const link = page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("link", { name: "Sobre" });
    await link.focus();
    await openPalette(page);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(link).toBeFocused();
  });

  test("falha ao carregar o corpo mostra mensagem e permite tentar de novo", async ({
    page,
  }) => {
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));
    await page.route(BODY_CHUNK, (route) => route.abort());
    await openPage(page);
    await pressShortcut(page);
    const alert = dialog(page).getByRole("alert");
    await expect(alert).toHaveText("Não consegui carregar a paleta.");
    const retry = dialog(page).getByRole("button", { name: "Tentar de novo" });
    await expect(retry).toBeFocused();
    expect(errors).toEqual([]);

    await page.unroute(BODY_CHUNK);
    await retry.click();
    await expect(page.getByRole("combobox")).toBeFocused();
    await page.keyboard.type("check");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/projetos\/checkpoint$/);
  });

  test("o que se digita antes de o corpo carregar não se perde", async ({
    page,
  }) => {
    await page.route(BODY_CHUNK, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await openPage(page);
    // Sem esperar foco nem o campo do cmdk: digita logo após o atalho.
    await pressShortcut(page);
    await page.keyboard.type("check");
    const field = page.getByRole("combobox");
    await expect(field).toHaveValue("check");
    await expect(field).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/projetos\/checkpoint$/);
  });

  test("clicar no fundo fecha a paleta", async ({ page }) => {
    await openPage(page);
    await pressShortcut(page);
    await expect(dialog(page)).toBeVisible();
    await page.mouse.click(2, 2);
    await expect(dialog(page)).toBeHidden();
  });

  for (const colorScheme of ["dark", "light"] as const) {
    test(`axe sem violações na paleta aberta (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await openPage(page);
      await pressShortcut(page);
      await expect(page.getByRole("option").first()).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter(
          (v) => v.impact === "serious" || v.impact === "critical",
        ),
      ).toEqual([]);
    });
  }
});
