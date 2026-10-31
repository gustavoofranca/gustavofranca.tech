import { expect, test } from "@playwright/test";

// Nível de conhecimento na stack: cada tecnologia tem um ponto colorido com o nível
// em texto para o leitor de tela (cor não é o único meio, WCAG 1.4.1), e a legenda
// visível mostra os três níveis. O axe dos dois temas está em a11y-and-layout.spec.ts.
for (const { path, levelText, legend } of [
  {
    path: "/",
    levelText: "nível: básico",
    legend: ["básico", "intermediário", "avançado"],
  },
  {
    path: "/sobre",
    levelText: "nível: básico",
    legend: ["básico", "intermediário", "avançado"],
  },
  {
    path: "/en/",
    levelText: "level: basic",
    legend: ["basic", "intermediate", "advanced"],
  },
  {
    path: "/en/about",
    levelText: "level: basic",
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
    // O nível está na árvore de acessibilidade, uma vez por tecnologia.
    const tree = await stack.ariaSnapshot();
    expect(tree.split(levelText).length - 1).toBe(count);

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

test("os ícones são decorativos e não levam estilo inline", async ({
  page,
}) => {
  await page.goto("/sobre");
  const icons = page
    .getByRole("region", { name: /stack/i })
    .locator("[data-testid=stack-item] svg");
  expect(await icons.count()).toBeGreaterThan(0);
  for (const icon of await icons.all()) {
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon).not.toHaveAttribute("style");
  }
});
