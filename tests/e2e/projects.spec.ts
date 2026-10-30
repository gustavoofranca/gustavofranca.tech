import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const LIST_PATHS = ["/projetos", "/en/projects"] as const;
const CASE_PATHS = [
  "/projetos/lumina",
  "/en/projects/lumina",
  "/projetos/conexao-metodista",
  "/projetos/checkpoint",
  "/en/projects/prime-edu",
] as const;

// A ilha só responde depois de hidratar (client:visible): o atributo ssr some.
async function waitForFilter(page: Page) {
  await page.getByTestId("project-card").first().scrollIntoViewIfNeeded();
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
}

test("lista com 6 cartões e o arquivo acadêmico", async ({ page }) => {
  await page.goto("/projetos");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projetos");
  await expect(page.getByTestId("project-card")).toHaveCount(6);
  const archive = page.getByRole("region", { name: "arquivo acadêmico" });
  await expect(archive.getByRole("listitem")).toHaveCount(11);
  await expect(
    archive.getByRole("link", { name: "Desafio-museu" }),
  ).toHaveAttribute("href", "https://github.com/gustavoofranca/Desafio-museu");
});

test("os cartões da lista carregam data-kind e data-stack do projeto", async ({
  page,
}) => {
  await page.goto("/projetos");
  const prime = page
    .getByTestId("project-card")
    .filter({ hasText: "Prime Edu" });
  await expect(prime).toHaveAttribute("data-kind", "mobile");
  await expect(prime).toHaveAttribute("data-stack", "flutter dart");
  const checkpoint = page
    .getByTestId("project-card")
    .filter({ hasText: "Checkpoint" });
  await expect(checkpoint).toHaveAttribute("data-kind", "api");
  await expect(checkpoint).toHaveAttribute("data-stack", /(^| )nestjs( |$)/);
});

test("lista em inglês tem os mesmos 6 cartões", async ({ page }) => {
  await page.goto("/en/projects");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  await expect(page.getByTestId("project-card")).toHaveCount(6);
  await expect(
    page.getByRole("region", { name: "academic archive" }),
  ).toBeVisible();
});

test("o filtro 'Mobile' deixa 1 cartão visível e 'Todos' devolve os 6", async ({
  page,
}) => {
  await page.goto("/projetos");
  await waitForFilter(page);
  const visible = page.getByTestId("project-card").filter({ visible: true });

  await page.getByRole("button", { name: "Mobile" }).click();
  await expect(visible).toHaveCount(1);
  await expect(visible).toContainText("Prime Edu");
  await expect(page.getByRole("button", { name: "Mobile" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("status")).toHaveText("Mostrando 1 de 6");

  await page.getByRole("button", { name: "Todos" }).click();
  await expect(visible).toHaveCount(6);
});

test("filtro por tecnologia combina com o tipo e mostra o estado vazio", async ({
  page,
}) => {
  await page.goto("/en/projects");
  await waitForFilter(page);
  const visible = page.getByTestId("project-card").filter({ visible: true });

  await page.getByLabel("Technology").selectOption({ label: "NestJS" });
  await expect(visible).toHaveCount(1);
  await expect(visible).toContainText("Checkpoint");

  await page.getByRole("button", { name: "Mobile" }).click();
  await expect(visible).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText(
    "No projects match this filter.",
  );
});

test.describe("sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("todos os cartões aparecem e o filtro some", async ({ page }) => {
    await page.goto("/projetos");
    await expect(page.getByTestId("project-card")).toHaveCount(6);
    for (const card of await page.getByTestId("project-card").all()) {
      await expect(card).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Mobile" })).toBeHidden();
  });
});

test("Conexão Metodista: sem botão de código e com link para o site", async ({
  page,
}) => {
  await page.goto("/projetos/conexao-metodista");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Conexão Metodista",
  );
  await expect(page.getByRole("link", { name: "Código" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Demo" })).toHaveAttribute(
    "href",
    "https://www.conexaometodista.com.br",
  );
});

test("Lumina em inglês: selo 'live', dois repositórios e diagrama uma vez", async ({
  page,
}) => {
  await page.goto("/en/projects/lumina");
  await expect(page.getByText("live", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Code/ })).toHaveCount(2);
  // O MDX já embute o diagrama: o layout não pode desenhar outro.
  await expect(page.locator('main img[src*="arquitetura"]')).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "All projects" }),
  ).toHaveAttribute("href", "/en/projects");
});

test("só projetos 'live' mostram o selo de no ar", async ({ page }) => {
  await page.goto("/projetos/checkpoint");
  await expect(page.getByText("no ar", { exact: true })).toHaveCount(0);
  await expect(page.getByText("fora do ar", { exact: true })).toBeVisible();
});

test("estudo de caso tem JSON-LD CreativeWork e um só h1", async ({ page }) => {
  await page.goto("/projetos/lumina");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  const json = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  expect(JSON.parse(json ?? "{}")).toMatchObject({
    "@type": "CreativeWork",
    name: "Lumina Influence AI",
  });
});

test.describe("em 360 px", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  for (const path of [...LIST_PATHS, ...CASE_PATHS]) {
    test(`${path} não rola na horizontal`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("o diagrama rola dentro do próprio contêiner em vez de encolher", async ({
    page,
  }) => {
    await page.goto("/projetos/lumina");
    const diagram = page.locator('main img[src*="arquitetura"]');
    await diagram.scrollIntoViewIfNeeded();
    const box = await diagram.boundingBox();
    // Tamanho real (960 px): nunca encolhe abaixo disso, só rola.
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(959);
    const scroller = diagram.locator("xpath=..");
    const { scrollWidth, clientWidth } = await scroller.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(scrollWidth).toBeGreaterThan(clientWidth);
    // A rolagem fica no contêiner: o corpo da página não rola na horizontal.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

for (const colorScheme of ["dark", "light"] as const) {
  for (const path of [...LIST_PATHS, ...CASE_PATHS]) {
    test(`axe sem violações sérias em ${path} (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page }).analyze();
      const serious = violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(
        serious.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.html).join(" | ")}`,
        ),
      ).toEqual([]);
    });
  }
}
