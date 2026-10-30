import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", image: "https://gustavofranca.tech/og/pt/home.png" },
  {
    path: "/en/projects/lumina",
    image: "https://gustavofranca.tech/og/en/projects/lumina.png",
  },
];

for (const { path, image } of pages) {
  test(`og:image de ${path} aponta para um PNG que existe`, async ({
    page,
    request,
  }) => {
    await page.goto(path);
    const content = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(content).toBe(image);
    // O host canônico é o de produção; o teste busca o mesmo caminho no preview local.
    const res = await request.get(new URL(content ?? "").pathname);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
  });
}

test("a 404 não declara og:image", async ({ page }) => {
  await page.goto("/404");
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
});
