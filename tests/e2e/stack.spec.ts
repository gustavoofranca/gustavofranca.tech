import { expect, test } from "@playwright/test";

// Nível de conhecimento na stack: cada tecnologia tem um ponto colorido com o nível
// em texto para o leitor de tela (cor não é o único meio, WCAG 1.4.1), e a legenda
// visível mostra os três níveis. O axe dos dois temas está em a11y-and-layout.spec.ts.
for (const { path, prefix, legend } of [
  {
    path: "/",
    prefix: "nível",
    legend: ["básico", "intermediário", "avançado"],
  },
  {
    path: "/sobre",
    prefix: "nível",
    legend: ["básico", "intermediário", "avançado"],
  },
  {
    path: "/en/",
    prefix: "level",
    legend: ["basic", "intermediate", "advanced"],
  },
  {
    path: "/en/about",
    prefix: "level",
    legend: ["basic", "intermediate", "advanced"],
  },
]) {
  test(`${path}: toda tecnologia tem ponto de nível e a legenda aparece`, async ({
    page,
  }) => {
    await page.goto(path);
    const stack = page.getByRole("region", { name: /stack/i });
    const items = stack.getByTestId("stack-item");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
    for (const item of await items.all()) {
      const dot = item.locator("[data-level]");
      await expect(dot).toHaveCount(1);
      await expect(dot).toBeVisible();
      await expect(dot).toHaveAttribute("aria-hidden", "true");
    }
    // O nível está na árvore de acessibilidade, uma vez por tecnologia, com o nome
    // de um dos três níveis da legenda.
    const tree = await stack.ariaSnapshot();
    const found = legend.map(
      (label) => tree.split(`${prefix}: ${label}`).length - 1,
    );
    expect(found.reduce((sum, n) => sum + n, 0)).toBe(count);
    const levels = await items
      .locator("[data-level]")
      .evaluateAll((dots) => dots.map((dot) => dot.getAttribute("data-level")));
    for (const level of levels) {
      expect(["basic", "intermediate", "advanced"]).toContain(level);
    }

    const legendList = stack.getByTestId("level-legend");
    await expect(legendList).toBeVisible();
    await expect(legendList.getByRole("listitem")).toHaveText(legend);
    await expect(legendList.locator("[data-level]")).toHaveCount(3);
  });
}

test("/en/about mostra a stack em inglês, com a área de infraestrutura", async ({
  page,
}) => {
  await page.goto("/en/about");
  const stack = page.getByRole("region", { name: /stack/i });
  await expect(stack).toContainText("Git and GitHub");
  await expect(stack).not.toContainText("Git e GitHub");
  await expect(
    stack.getByRole("heading", { name: "Infrastructure and operations" }),
  ).toBeVisible();
  for (const name of [
    "Docker",
    "Caddy",
    "Application deployment",
    "Linux servers",
    "Support and maintenance",
  ]) {
    await expect(
      stack.getByTestId("stack-item").filter({ hasText: name }),
    ).toHaveCount(1);
  }
  await expect(stack.getByRole("heading", { name: "Data" })).toBeVisible();
});

test("/sobre mostra a área de infraestrutura em português", async ({
  page,
}) => {
  await page.goto("/sobre");
  const stack = page.getByRole("region", { name: /stack/i });
  await expect(
    stack.getByRole("heading", { name: "Infraestrutura e operações" }),
  ).toBeVisible();
  await expect(stack.getByRole("heading", { name: "Dados" })).toBeVisible();
  for (const name of [
    "Git e GitHub",
    "Deploy de aplicações",
    "Servidores Linux",
    "Suporte e sustentação",
  ]) {
    await expect(
      stack.getByTestId("stack-item").filter({ hasText: name }),
    ).toHaveCount(1);
  }
});

for (const { path, practices } of [
  {
    path: "/",
    practices: [
      "Deploy de aplicações",
      "Servidores Linux",
      "Suporte e sustentação",
    ],
  },
  {
    path: "/en/",
    practices: [
      "Application deployment",
      "Linux servers",
      "Support and maintenance",
    ],
  },
]) {
  test(`${path}: a área de infraestrutura aparece inteira na home, sem "usado em" inventado`, async ({
    page,
  }) => {
    await page.goto(path);
    const stack = page.getByRole("region", { name: /stack/i });
    for (const name of practices) {
      const item = stack.getByTestId("stack-item").filter({ hasText: name });
      await expect(item).toHaveCount(1);
      await expect(item).not.toContainText(/usado em|used in/);
    }
    // As outras áreas continuam só com o que tem projeto: Laravel não tem.
    await expect(
      stack.getByTestId("stack-item").filter({ hasText: "Laravel" }),
    ).toHaveCount(0);
  });
}

test("os ícones são decorativos e vêm do sprite externo, que tem todos os <symbol>", async ({
  page,
  request,
}) => {
  await page.goto("/sobre");
  const icons = page
    .getByRole("region", { name: /stack/i })
    .locator("[data-testid=stack-item] svg");
  expect(await icons.count()).toBeGreaterThan(0);
  const hrefs = new Set<string>();
  for (const icon of await icons.all()) {
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon).not.toHaveAttribute("style");
    await expect(icon.locator("path")).toHaveCount(0);
    const href = await icon.locator("use").getAttribute("href");
    expect(href).toMatch(/^\/icons\/stack-[0-9a-f]{10}\.svg#[\w-]+$/);
    hrefs.add(href ?? "");
  }
  const files = new Set([...hrefs].map((href) => href.split("#")[0] ?? ""));
  expect(files.size).toBe(1);
  const [file] = [...files];
  const response = await request.get(file ?? "");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  const sprite = await response.text();
  for (const href of hrefs) {
    expect(sprite).toContain(`<symbol id="${href.split("#")[1]}"`);
  }
});

// Ícone só na stack completa: na home o sprite disputava banda com a capa do
// destaque e passava o LCP do limite de 1,5 s (DESIGN.md).
for (const { path, icons } of [
  { path: "/", icons: false },
  { path: "/en/", icons: false },
  { path: "/sobre", icons: true },
  { path: "/en/about", icons: true },
]) {
  test(`${path}: ícones de stack ${icons ? "presentes" : "ausentes, sem pedir o sprite"}`, async ({
    page,
  }) => {
    const spriteRequests: string[] = [];
    page.on("request", (request) => {
      if (/\/icons\/stack-[^/]*\.svg/.test(request.url())) {
        spriteRequests.push(request.url());
      }
    });
    await page.goto(path);
    await page.waitForLoadState("load");
    const items = page
      .getByRole("region", { name: /stack/i })
      .getByTestId("stack-item");
    expect(await items.count()).toBeGreaterThan(0);
    const svgs = items.locator("svg");
    if (icons) {
      expect(await svgs.count()).toBeGreaterThan(0);
      expect(spriteRequests.length).toBeGreaterThan(0);
      return;
    }
    await expect(svgs).toHaveCount(0);
    await expect(page.locator("use")).toHaveCount(0);
    expect(spriteRequests).toEqual([]);
  });
}
