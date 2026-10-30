import { expect, test } from "@playwright/test";

test.describe("cabeçalho e acessibilidade básica", () => {
  test("o primeiro Tab foca o link de pular para o conteúdo", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("#conteudo")).toBeFocused();
  });

  test("<html lang> segue o idioma da página", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    const res = await page.goto("/en/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("cada página tem um h1, canonical e hreflang", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://gustavofranca.tech/",
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute("href", "https://gustavofranca.tech/en/");
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]'),
    ).toHaveAttribute("href", "https://gustavofranca.tech/");
    const ld = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    expect(JSON.parse(ld ?? "{}")).toMatchObject({ "@type": "Person" });
  });

  test("o botão ⌘K dispara gf:open-palette", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      (window as unknown as { opened: number }).opened = 0;
      window.addEventListener("gf:open-palette", () => {
        (window as unknown as { opened: number }).opened += 1;
      });
    });
    await page
      .getByRole("button", { name: "Abrir paleta de comandos" })
      .click();
    expect(
      await page.evaluate(
        () => (window as unknown as { opened: number }).opened,
      ),
    ).toBe(1);
  });

  test("a troca de idioma leva à home em inglês quando a página não tem par", async ({
    page,
  }) => {
    await page.goto("/projetos/so-pt");
    await page.getByRole("link", { name: "EN — English" }).click();
    await expect(page).toHaveURL(/\/en\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("404", () => {
  test("/nao-existe responde 404 em português", async ({ page }) => {
    const res = await page.goto("/nao-existe");
    expect(res?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page.getByText("command not found")).toBeVisible();
    await expect(page.getByText("/nao-existe")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Voltar ao início" }),
    ).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("/en/nao-existe responde 404 em inglês", async ({ page }) => {
    const res = await page.goto("/en/nao-existe");
    expect(res?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("link", { name: "Back to home" }),
    ).toHaveAttribute("href", "/en/");
    await expect(page.locator("h1")).toHaveCount(1);
  });
});

test("robots.txt aponta para o sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("Allow: /");
  expect(body).toContain(
    "Sitemap: https://gustavofranca.tech/sitemap-index.xml",
  );
});

test("todo <loc> do sitemap é igual ao canonical da própria página", async ({
  page,
  request,
}) => {
  const res = await request.get("/sitemap-0.xml");
  expect(res.status()).toBe(200);
  const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1] ?? "",
  );
  expect(locs.length).toBeGreaterThan(0);
  for (const loc of locs) {
    await page.goto(new URL(loc).pathname);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      loc,
    );
  }
});

test.describe("sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("esconde os controles que dependem de JS e mantém os links", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Abrir paleta de comandos" }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Alternar tema" }),
    ).toBeHidden();
    await expect(page.getByRole("link", { name: "Projetos" })).toHaveAttribute(
      "href",
      "/projetos",
    );
    await expect(page.getByRole("link", { name: "Sobre" })).toBeVisible();
    await page.getByRole("link", { name: "EN — English" }).click();
    await expect(page).toHaveURL(/\/en\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.getByRole("link", { name: "PT — Português" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
