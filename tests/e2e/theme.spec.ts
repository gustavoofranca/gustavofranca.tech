import { expect, test } from "@playwright/test";

// O Playwright emula esquema claro por padrão; o teste parte de um sistema escuro.
test.use({ colorScheme: "dark" });

test("tema persiste e não pisca", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /tema/i }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("storage bloqueado não quebra", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    /dark|light/,
  );
});
