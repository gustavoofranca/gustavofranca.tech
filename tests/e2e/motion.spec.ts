import { expect, test, type Page } from "@playwright/test";

// Movimento e interação (docs/adr/0004-movimento-e-interacao.md). O reset global de
// movimento reduzido não alcança scroll-driven, view transitions nem a luz movida por
// JS: cada efeito precisa desligar sozinho, e é isso que este arquivo confere.

const PAGES = ["/", "/sobre", "/projetos", "/projetos/lumina"];

// Nome da animação no elemento (ou pseudo-elemento), "-" se ele não existe na página.
async function animationOf(page: Page, selector: string, pseudo?: string) {
  return page.evaluate(
    ([sel, pse]) => {
      const el = document.querySelector(sel ?? "");
      return el ? getComputedStyle(el, pse).animationName : "-";
    },
    [selector, pseudo],
  );
}

test.describe("com movimento reduzido", () => {
  test.use({ reducedMotion: "reduce" });

  for (const path of PAGES) {
    test(`${path}: nada anima e o conteúdo aparece inteiro`, async ({
      page,
    }) => {
      await page.goto(path);
      const card = page.getByTestId("project-card").first();
      if ((await card.count()) > 0) {
        await card.hover({ position: { x: 30, y: 200 } });
        await card.hover({ position: { x: 60, y: 220 } });
      }
      await page.evaluate(() => window.scrollTo(0, 1500));

      // Nenhuma animação (keyframes, scroll); transição só a de cor e opacidade do
      // hover, quase instantânea pelo reset de global.css.
      const running = await page.evaluate(() =>
        document.getAnimations().map((animation) => ({
          keyframes: animation instanceof CSSAnimation,
          duration: Number(animation.effect?.getTiming().duration ?? 0),
        })),
      );
      expect(running.filter((animation) => animation.keyframes)).toEqual([]);
      for (const { duration } of running) {
        expect(duration).toBeLessThanOrEqual(0.01);
      }
      for (const [selector, pseudo] of [
        [".aurora"],
        [".available-dot", "::after"],
        ["ol.timeline", "::before"],
        [".timeline-dot", "::after"],
        ["[data-testid=reading-progress]"],
      ] as const) {
        expect(["none", "-"]).toContain(
          await animationOf(page, selector, pseudo),
        );
      }
      // A barra de leitura não aparece parada (seria um progresso falso).
      const progress = page.getByTestId("reading-progress");
      if ((await progress.count()) > 0) await expect(progress).toBeHidden();

      if ((await card.count()) > 0) {
        // Sem luz seguindo o cursor (o script não liga) e sem zoom na capa.
        expect(await card.getAttribute("style")).toBeNull();
        await expect(card.locator("img")).toHaveCSS("scale", "none");
      }

      // Nada de conteúdo escondido esperando animação.
      const hidden = await page
        .locator("main :is(h1, h2, h3, p, li, img)")
        .evaluateAll(
          (els) =>
            els.filter(
              (el) =>
                el.checkVisibility() &&
                Number(getComputedStyle(el).opacity) < 1,
            ).length,
        );
      expect(hidden).toBe(0);
    });
  }
});

// Mouse de verdade: força um contexto de desktop também no projeto "mobile".
test.describe("com mouse e sem movimento reduzido", () => {
  test.use({
    reducedMotion: "no-preference",
    isMobile: false,
    hasTouch: false,
    viewport: { width: 1280, height: 800 },
  });

  test("a luz do cartão segue o cursor pelo CSSOM, sem violar a CSP", async ({
    page,
  }) => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if (/content security policy/i.test(message.text())) {
        violations.push(message.text());
      }
    });
    await page.goto("/");
    const card = page.getByTestId("project-card").first();
    await card.scrollIntoViewIfNeeded();
    await card.hover({ position: { x: 40, y: 200 } });
    await card.hover({ position: { x: 70, y: 230 } });

    // A posição do hover do Playwright conta da caixa interna (1 px dentro da borda).
    const light = (name: string) =>
      card.evaluate((el, prop) => el.style.getPropertyValue(prop), name);
    await expect.poll(() => light("--light-x")).toMatch(/^7[01]px$/);
    expect(await light("--light-y")).toMatch(/^23[01]px$/);
    await expect(card.locator("img")).toHaveCSS("scale", "1.03");
    expect(violations).toEqual([]);
  });

  test("a barra de leitura existe só nos estudos de caso", async ({ page }) => {
    await page.goto("/projetos/lumina");
    const progress = page.getByTestId("reading-progress");
    // No topo ela está em scaleX(0), largura zero: aparece depois de rolar.
    await expect(progress).toHaveCSS("display", "block");
    await page.evaluate(() => window.scrollTo(0, 2000));
    await expect(progress).toBeVisible();
    expect(await animationOf(page, "[data-testid=reading-progress]")).toBe(
      "reading-progress",
    );

    for (const path of ["/", "/sobre", "/projetos"]) {
      await page.goto(path);
      await expect(page.getByTestId("reading-progress")).toHaveCount(0);
    }
  });

  test("o ponto 'disponível' pulsa um número finito de vezes", async ({
    page,
  }) => {
    await page.goto("/");
    const timing = await page.evaluate(() => {
      const style = getComputedStyle(
        document.querySelector(".available-dot") ?? document.body,
        "::after",
      );
      return [style.animationName, style.animationIterationCount];
    });
    expect(timing).toEqual(["available-pulse", "3"]);
  });

  test("a linha do tempo acende com o scroll", async ({ page }) => {
    await page.goto("/sobre");
    expect(await animationOf(page, "ol.timeline", "::before")).toBe(
      "timeline-grow",
    );
    expect(await animationOf(page, ".timeline-dot", "::after")).toBe(
      "timeline-light",
    );
  });

  test("o hover no terminal pisca o cursor sem recomeçar a digitação", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("hero-terminal").hover();
    const names = await page
      .locator(".cursor")
      .evaluate((el) =>
        el
          .getAnimations()
          .map((a) => (a instanceof CSSAnimation ? a.animationName : "")),
      );
    expect(names).toContain("blink-again");
  });
});

test("transição entre páginas declarada e cabeçalho parado", async ({
  page,
}) => {
  await page.goto("/");
  const declared = await page.evaluate(() => {
    const rules = (list: CSSRuleList): string[] =>
      [...list].flatMap((rule) =>
        "cssRules" in rule && rule.cssRules instanceof CSSRuleList
          ? rules(rule.cssRules)
          : [rule.cssText],
      );
    return [...document.styleSheets]
      .flatMap((sheet) => rules(sheet.cssRules))
      .some((text) => /@view-transition\s*\{\s*navigation:\s*auto/.test(text));
  });
  expect(declared).toBe(true);
  await expect(page.locator("body > header")).toHaveCSS(
    "view-transition-name",
    "site-header",
  );
});

test("o item da página atual no menu tem o sublinhado cheio", async ({
  page,
}) => {
  await page.goto("/sobre");
  const scales = await page
    .locator("header nav a")
    .evaluateAll((links) =>
      links.map((a) => [
        a.getAttribute("aria-current"),
        getComputedStyle(a, "::after").scale,
      ]),
    );
  expect(scales).toEqual([
    [null, "0 1"],
    ["page", "1"],
    [null, "0 1"],
  ]);
});

// Toque: ponteiro grosso, sem hover. O script não liga e a capa não aumenta.
test.describe("no toque", () => {
  test.use({
    reducedMotion: "no-preference",
    isMobile: true,
    hasTouch: true,
    viewport: { width: 412, height: 915 },
  });

  test("passar o ponteiro no cartão não acende a luz nem dá zoom", async ({
    page,
  }) => {
    await page.goto("/");
    const card = page.getByTestId("project-card").first();
    await card.scrollIntoViewIfNeeded();
    await card.hover({ position: { x: 40, y: 200 } });
    await card.hover({ position: { x: 70, y: 230 } });
    expect(await card.getAttribute("style")).toBeNull();
    await expect(card.locator("img")).toHaveCSS("scale", "none");
  });
});
