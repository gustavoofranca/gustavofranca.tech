import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { expectExpectedLabel } from "./helpers/period";

test("/sobre mostra formação, previsão e idiomas", async ({ page }) => {
  await page.goto("/sobre");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  const main = page.locator("main");
  await expect(main).toContainText("Engenharia de Software");
  await expect(main).toContainText("Campo Real");
  await expect(main).toContainText("2027");
  await expect(main).toContainText("Inglês");
  await expect(main).toContainText("Espanhol");
});

test("/en/about mostra os mesmos fatos em inglês", async ({ page }) => {
  await page.goto("/en/about");
  const main = page.locator("main");
  await expect(main).toContainText("Software Engineering");
  await expect(main).toContainText("Campo Real");
  await expect(main).toContainText("2027");
  await expect(main).toContainText("English");
  await expect(main).toContainText("Spanish");
  // A organização também é traduzida (antes saía "incubadora da Campo Real" aqui).
  await expect(main).toContainText("Evolve, Campo Real's incubator");
  await expect(main).not.toContainText("incubadora");
});

for (const path of ["/sobre", "/en/about"]) {
  test(`${path}: a linha do tempo vem do início mais recente para o mais antigo`, async ({
    page,
  }) => {
    await page.goto(path);
    const items = page.getByTestId("timeline-item");
    expect(await items.count()).toBeGreaterThanOrEqual(2);
    const starts = await items
      .locator("time")
      .evaluateAll((times) =>
        times
          .filter((time) => time.dataset["role"] === "start")
          .map((time) => time.getAttribute("datetime") ?? ""),
      );
    expect(starts.length).toBe(await items.count());
    expect(starts).toEqual([...starts].sort().reverse());
  });
}

// Escopo na linha da graduação: "expected" e "prevista" já aparecem nos textos.
// A expectativa sai do próprio término e do mês corrente (isFutureMonth), não de uma
// data fixa: depois de 12/2027 o rótulo some e o teste continua valendo.
for (const [path, label] of [
  ["/sobre", "(previsão)"],
  ["/en/about", "(expected)"],
] as const) {
  test(`${path}: término futuro da graduação é marcado como previsão`, async ({
    page,
  }) => {
    await page.goto(path);
    await expectExpectedLabel(
      page
        .getByTestId("timeline-item")
        .filter({ hasText: "Centro Universitário Campo Real" }),
      label,
    );
    // Fim já passado (Evolve) não leva o rótulo.
    const incubator = page
      .getByTestId("timeline-item")
      .filter({ hasText: "Evolve" });
    await expect(incubator).not.toContainText(label);
  });
}

test("a stack completa inclui tecnologias sem projeto, só com o nome", async ({
  page,
}) => {
  await page.goto("/sobre");
  const stack = page.getByRole("region", { name: /stack/i });
  const item = (name: string) =>
    stack.getByRole("listitem").filter({ hasText: name });
  // Com projeto publicado: mostra onde foi usada.
  await expect(item("Angular")).toContainText("usado em");
  // Sem projeto publicado (conferido em src/content/projects): aparece, sem "usado em".
  await expect(item("Laravel")).toHaveCount(1);
  await expect(item("Laravel")).not.toContainText("usado em");

  // Na home só entra o que tem prova; o Sobre lista mais tecnologias.
  const aboutCount = await stack.getByRole("listitem").count();
  await page.goto("/");
  const homeCount = await page
    .getByRole("region", { name: /stack/i })
    .getByRole("listitem")
    .count();
  expect(aboutCount).toBeGreaterThan(homeCount);
});

test("sem o PDF do CV, não há botão de baixar", async ({ page }) => {
  // O caso "com CV" fica no teste unit de hasCv: o e2e roda contra o build pronto.
  for (const path of ["/sobre", "/en/about"]) {
    await page.goto(path);
    await expect(
      page.getByRole("link", { name: /Baixar CV|Download CV/ }),
    ).toHaveCount(0);
  }
});

test("JSON-LD Person e hreflang entre /sobre e /en/about", async ({ page }) => {
  await page.goto("/sobre");
  const ld = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(JSON.parse(ld ?? "{}")).toMatchObject({ "@type": "Person" });
  await expect(
    page.locator('link[rel="alternate"][hreflang="en"]'),
  ).toHaveAttribute("href", "https://gustavofranca.tech/en/about");
});

test.describe("em 360 px", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  for (const path of ["/sobre", "/en/about"]) {
    test(`${path} não tem rolagem horizontal`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

for (const colorScheme of ["dark", "light"] as const) {
  for (const path of ["/sobre", "/en/about"]) {
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
