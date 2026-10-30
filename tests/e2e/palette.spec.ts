import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// A ilha usa client:idle: o atalho só responde depois que o atributo ssr some.
async function openPage(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
}

// O corpo da paleta vem em um chunk à parte: só digita depois que o campo existe.
async function openPalette(page: Page) {
  await page.keyboard.press("Control+K");
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
    await page.keyboard.press("Control+K");
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

  test("o foco fica preso na paleta enquanto ela está aberta", async ({
    page,
  }) => {
    await openPage(page);
    await page.keyboard.press("Control+K");
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
    await page.keyboard.press("Control+K");
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

  test("clicar no fundo fecha a paleta", async ({ page }) => {
    await openPage(page);
    await page.keyboard.press("Control+K");
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
      await page.keyboard.press("Control+K");
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
