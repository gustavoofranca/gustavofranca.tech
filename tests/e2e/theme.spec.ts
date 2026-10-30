import { expect, test } from "@playwright/test";

const html = (page: import("@playwright/test").Page) => page.locator("html");

test.describe("sistema escuro", () => {
  test.use({ colorScheme: "dark" });

  test("tema persiste e não pisca", async ({ page }) => {
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: /tema/i }).click();
    await page.reload();
    await expect(html(page)).toHaveAttribute("data-theme", "light");
  });

  test("valor salvo inválido cai no sistema (escuro)", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("gf-theme", "banana"));
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("sistema claro", () => {
  test.use({ colorScheme: "light" });

  test("sem valor salvo segue o sistema", async ({ page }) => {
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-theme", "light");
  });

  test("valor salvo inválido cai no sistema (claro)", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("gf-theme", "banana"));
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-theme", "light");
  });

  test("storage bloqueado segue o sistema e não gera erro", async ({
    page,
  }) => {
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("blocked");
        },
      });
    });
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: /tema/i }).click();
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    expect(errors).toEqual([]);
  });
});
