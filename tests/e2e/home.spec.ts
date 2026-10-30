import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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

test("movimento reduzido mostra o terminal completo", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("hero-terminal")).toContainText(
    "open lumina --live",
  );
});

test("o terminal é decorativo e não entra na árvore de acessibilidade", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("hero-terminal")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
});

// Sem public/cv-gustavo-franca.pdf no repositório, o botão não pode aparecer
// (o caso "com CV" fica no teste unit de hasCv: o e2e roda contra o build pronto).
test("sem o PDF do CV, não há botão de baixar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Baixar CV" })).toHaveCount(0);
});

test("a home não tem rolagem horizontal", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
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
