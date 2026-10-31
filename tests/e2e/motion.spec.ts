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

  test("a sequência automática do terminal pisca o cursor uma vez e acaba antes de 5 s", async ({
    page,
  }) => {
    await page.goto("/");
    // Fim de cada animação da sequência (atraso + duração × repetições), em ms. O
    // piscar do hover é do ::before e não conta: é disparado pelo usuário.
    const timings = await page.getByTestId("hero-terminal").evaluate((el) =>
      el
        .getAnimations({ subtree: true })
        .filter(
          (a): a is CSSAnimation =>
            a instanceof CSSAnimation &&
            ["type", "appear", "blink"].includes(a.animationName),
        )
        .map((a) => {
          const timing = a.effect?.getTiming();
          return {
            name: a.animationName,
            iterations: Number(timing?.iterations),
            end:
              Number(timing?.delay ?? 0) +
              Number(timing?.duration ?? 0) * Number(timing?.iterations ?? 1),
          };
        }),
    );
    const blink = timings.filter((timing) => timing.name === "blink");
    expect(blink.map((timing) => timing.iterations)).toEqual([1]);
    expect(Math.max(...timings.map((timing) => timing.end))).toBeLessThan(5000);
  });

  test("na stack, o número da área e a borda da pílula acendem em accent com o mouse", async ({
    page,
  }) => {
    await page.goto("/");
    const accent = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.setProperty("color", "var(--accent)");
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    const row = page.getByTestId("stack-area").first();
    const number = row.locator(":scope > span[aria-hidden=true]");
    await row.scrollIntoViewIfNeeded();
    await expect(number).not.toHaveCSS("color", accent);
    await row.getByRole("heading").hover();
    await expect(number).toHaveCSS("color", accent);

    const pill = row.getByTestId("stack-item").first().locator("> span");
    await pill.hover();
    await expect(pill).toHaveCSS("border-top-color", accent);
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

  test("o hover no terminal pisca o cursor sem recomeçar a digitação nem mostrá-lo antes", async ({
    page,
  }) => {
    await page.goto("/");
    const terminal = page.getByTestId("hero-terminal");
    // Início de cada animação da sequência (digitação e entradas), por alvo e nome.
    const sequence = () =>
      terminal.evaluate((el) =>
        el
          .getAnimations({ subtree: true })
          .filter(
            (a): a is CSSAnimation =>
              a instanceof CSSAnimation &&
              ["type", "appear"].includes(a.animationName),
          )
          .map((a) => {
            const target =
              a.effect instanceof KeyframeEffect ? a.effect.target : null;
            return `${target?.className ?? "?"}|${a.animationName}|${String(a.startTime)}`;
          }),
      );
    const before = await sequence();
    expect(before.length).toBeGreaterThan(0);

    await terminal.hover();
    const state = await page.locator(".cursor").evaluate((cursor) => {
      const own = cursor
        .getAnimations()
        .find((a) => a instanceof CSSAnimation && a.animationName === "appear");
      const delay = Number(own?.effect?.getTiming().delay ?? 0);
      return {
        // O cursor ainda espera a digitação acabar: tem que continuar invisível.
        waiting: own !== undefined && Number(own.currentTime ?? 0) < delay,
        opacity: getComputedStyle(cursor).opacity,
        blink: cursor
          .getAnimations({ subtree: true })
          .some(
            (a) =>
              a instanceof CSSAnimation &&
              a.animationName === "blink" &&
              a.effect instanceof KeyframeEffect &&
              a.effect.pseudoElement === "::before",
          ),
      };
    });
    expect(state.blink).toBe(true);
    expect(state.waiting ? state.opacity : "0").toBe("0");

    // Nada da sequência recomeçou: o que ainda roda tem o mesmo início de antes.
    for (const entry of await sequence()) expect(before).toContain(entry);
  });

  test("depois do mouse, o foco do teclado mostra a luz parada no topo", async ({
    page,
  }) => {
    await page.goto("/");
    const card = page.getByTestId("project-card").nth(1);
    await card.scrollIntoViewIfNeeded();
    await card.hover({ position: { x: 40, y: 200 } });
    await card.hover({ position: { x: 70, y: 230 } });
    await expect
      .poll(() => card.evaluate((el) => el.style.getPropertyValue("--light-x")))
      .not.toBe("");

    await page.mouse.move(2, 2);
    // A posição só volta ao topo depois que a luz termina de apagar.
    await expect.poll(() => card.getAttribute("style")).toBe("");

    await card.locator("h3 a").focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(card.locator("h3 a")).toBeFocused();
    expect(
      await card.evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--light-x"),
      ),
    ).toBe("50%");
    await expect
      .poll(() =>
        card.evaluate((el) => getComputedStyle(el, "::after").opacity),
      )
      .toBe("1");
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

// Só um elemento visível por página pode ter o nome; dois, e o navegador pula a
// transição. A 404 tem dois cabeçalhos (PT e EN) e o script esconde um.
for (const path of ["/", "/en/", "/sobre", "/nao-existe", "/en/nao-existe"]) {
  test(`${path}: um só cabeçalho com view-transition-name`, async ({
    page,
  }) => {
    await page.goto(path);
    const named = await page.evaluate(
      () =>
        [...document.querySelectorAll("body *")].filter(
          (el) =>
            getComputedStyle(el).viewTransitionName === "site-header" &&
            el.checkVisibility(),
        ).length,
    );
    expect(named).toBe(1);
  });
}

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
