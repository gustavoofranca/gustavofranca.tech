import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { expectExpectedLabel } from "./helpers/period";

for (const [path, cta] of [
  ["/", "Ver projetos"],
  ["/en/", "View projects"],
] as const) {
  test(`home ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Gustavo França",
    );
    await expect(page.getByRole("link", { name: cta })).toBeVisible();
    await expect(page.getByTestId("project-card")).toHaveCount(3);
  });
}

// A mini linha do tempo da home usa o mesmo período do Sobre: formatura no futuro
// não pode aparecer como data fechada.
for (const [path, label] of [
  ["/", "(previsão)"],
  ["/en/", "(expected)"],
] as const) {
  test(`home ${path}: término futuro da graduação é marcado como previsão`, async ({
    page,
  }) => {
    await page.goto(path);
    await expectExpectedLabel(
      page
        .locator("main li")
        .filter({ hasText: "Centro Universitário Campo Real" }),
      label,
    );
  });
}

test("movimento reduzido mostra o terminal completo", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const terminal = page.getByTestId("hero-terminal");
  await expect(terminal).toContainText("open lumina --live");
  // As máscaras da digitação ficam transparentes: nada do texto fica coberto.
  const masks = terminal.locator(".typing-mask");
  await expect(masks).toHaveCount(2);
  for (const mask of await masks.all()) {
    await expect(mask).toHaveCSS("opacity", "0");
  }
});

test("o terminal tem aria-hidden e fica fora da árvore de acessibilidade", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("hero-terminal")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  const tree = await page.locator("main").ariaSnapshot();
  expect(tree).not.toContain("cat stack.json");
  expect(tree).not.toContain("open lumina");
});

// WCAG 2.2.2: nada no hero se move sozinho para sempre; a aurora roda uma vez.
test("a aurora roda uma vez e nenhuma animação do hero é infinita", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const blobs = page.locator(".aurora-blob");
  await expect(blobs).toHaveCount(2);
  for (const blob of await blobs.all()) {
    await expect(blob).toHaveCSS("animation-iteration-count", "1");
  }
  const infinite = await page
    .locator("#hero-title")
    .evaluate(
      (title) =>
        (
          title.closest("section")?.getAnimations({ subtree: true }) ?? []
        ).filter(
          (animation) => animation.effect?.getTiming().iterations === Infinity,
        ).length,
    );
  expect(infinite).toBe(0);
});

// Sem public/cv-gustavo-franca.pdf no repositório, o botão não pode aparecer
// (o caso "com CV" fica no teste unit de hasCv: o e2e roda contra o build pronto).
test("sem o PDF do CV, não há botão de baixar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Baixar CV" })).toHaveCount(0);
});

test.describe("em 360 px", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  for (const path of ["/", "/en/"]) {
    test(`${path} não tem rolagem horizontal`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

// Movimento reduzido: o axe mede o contraste do estado final, sem a máscara da digitação.
for (const colorScheme of ["dark", "light"] as const) {
  for (const path of ["/", "/en/"]) {
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
