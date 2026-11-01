import { expect, test, type Page } from "@playwright/test";
import { t } from "@/lib/i18n";

// Seção de stack (home e Sobre): áreas numeradas, frase curta e tecnologias em
// pílulas com ponto de nível. Cada ponto tem o nível em texto para o leitor de tela
// (cor não é o único meio, WCAG 1.4.1), e a legenda visível mostra os três níveis.
// O axe dos dois temas está em a11y-and-layout.spec.ts.

const AREAS = {
  pt: [
    "Front-end",
    "Back-end",
    "CMS e web",
    "Dados",
    "Infraestrutura e operações",
  ],
  en: [
    "Front-end",
    "Back-end",
    "CMS and web",
    "Data",
    "Infrastructure and operations",
  ],
} as const;

const NAMES = {
  pt: [
    ...["React", "Angular", "Vue", "TypeScript", "JavaScript", "HTML & CSS"],
    ...["Tailwind CSS", "Node.js", "NestJS", "Python", "Flask", "PHP"],
    ...["Laravel", "Java", "WordPress", "Strapi", "PostgreSQL", "Supabase"],
    ...["Firebase", "Docker", "Deploy de aplicações", "Servidores Linux"],
    ...["Git e GitHub", "Suporte e sustentação"],
  ],
  en: [
    ...["React", "Angular", "Vue", "TypeScript", "JavaScript", "HTML & CSS"],
    ...["Tailwind CSS", "Node.js", "NestJS", "Python", "Flask", "PHP"],
    ...["Laravel", "Java", "WordPress", "Strapi", "PostgreSQL", "Supabase"],
    ...["Firebase", "Docker", "Application deployment", "Linux servers"],
    ...["Git and GitHub", "Support and maintenance"],
  ],
} as const;

// Saíram da seção (decisão do Gustavo), mas continuam nas etiquetas dos projetos.
const REMOVED = [
  ...["Flutter", "Dart", "Vite", "Nuxt", "Astro", "Express", "Prisma"],
  ...["Redis", "BullMQ", "Caddy", "Unity (C#)"],
];

const PAGES = [
  { path: "/", locale: "pt", home: true },
  { path: "/sobre", locale: "pt", home: false },
  { path: "/en/", locale: "en", home: true },
  { path: "/en/about", locale: "en", home: false },
] as const;

function stackSection(page: Page, locale: "pt" | "en") {
  return page.getByRole("region", { name: t(locale).stack.title });
}

for (const { path, locale } of PAGES) {
  const dict = t(locale).stack;
  const legend = Object.values(dict.levels);

  test(`${path}: 5 áreas numeradas, 24 tecnologias com nível e a legenda`, async ({
    page,
  }) => {
    await page.goto(path);
    const stack = stackSection(page, locale);
    await expect(stack).toBeVisible();

    const areas = stack.getByTestId("stack-area");
    await expect(areas).toHaveCount(5);
    await expect(stack.getByRole("heading", { level: 3 })).toHaveText([
      ...AREAS[locale],
    ]);
    // Número decorativo: fora da árvore de acessibilidade.
    const numbers = areas.locator(":scope > span[aria-hidden=true]");
    await expect(numbers).toHaveText(["01", "02", "03", "04", "05"]);

    const items = stack.getByTestId("stack-item");
    await expect(items).toHaveCount(24);
    await expect(stack.getByTestId("stack-name")).toHaveText([
      ...NAMES[locale],
    ]);
    for (const item of await items.all()) {
      const dot = item.locator("[data-level]");
      await expect(dot).toHaveCount(1);
      await expect(dot).toBeVisible();
      await expect(dot).toHaveAttribute("aria-hidden", "true");
      // Um texto de nível por pílula, só para o leitor de tela.
      await expect(item.locator(".sr-only")).toHaveCount(1);
    }
    // O nível está na árvore de acessibilidade, uma vez por tecnologia.
    const tree = await stack.ariaSnapshot();
    const found = legend.map(
      (label) => tree.split(dict.levelOf.replace("{level}", label)).length - 1,
    );
    expect(found.reduce((sum, n) => sum + n, 0)).toBe(24);
    // Nome e nível lidos juntos, sem vírgula solta: "React (nível: avançado)".
    const react = `React ${dict.levelOf.replace("{level}", dict.levels.advanced)}`;
    expect(tree).toContain(`listitem: "${react}"`);

    const legendList = stack.getByTestId("level-legend");
    await expect(legendList).toBeVisible();
    await expect(legendList.getByRole("listitem")).toHaveText(legend);
    await expect(legendList.locator("[data-level]")).toHaveCount(3);

    // "usado em" saiu da lista; fica só no title da pílula e nos estudos de caso.
    await expect(stack).not.toContainText(/usado em|used in/);
    for (const name of REMOVED) {
      await expect(
        stack.getByTestId("stack-name").filter({ hasText: name }),
      ).toHaveCount(0);
    }
  });

  test(`${path}: Git fica em infraestrutura e operações, não em dados`, async ({
    page,
  }) => {
    await page.goto(path);
    const area = (name: string) =>
      stackSection(page, locale)
        .getByTestId("stack-area")
        .filter({ has: page.getByRole("heading", { name, exact: true }) });
    const git = locale === "pt" ? "Git e GitHub" : "Git and GitHub";
    await expect(
      area(AREAS[locale][4]).getByTestId("stack-name"),
    ).toContainText([git]);
    await expect(area(AREAS[locale][3])).not.toContainText(git);
  });
}

test("/en/about e /en/ mostram a stack inteira em inglês", async ({ page }) => {
  for (const path of ["/en/about", "/en/"]) {
    await page.goto(path);
    const stack = stackSection(page, "en");
    await expect(stack).toContainText(
      "Interfaces in React and Angular, from the Lumina dashboard to the Conexão Metodista app.",
    );
    const text = (await stack.textContent()) ?? "";
    for (const pt of [
      "Com o que eu trabalho",
      "nível",
      "básico",
      "Dados",
      "Git e GitHub",
      "Interfaces em React",
      "Ver stack completa",
    ]) {
      expect(text).not.toContain(pt);
    }
    const titles = await stack
      .locator("[title]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("title") ?? ""));
    for (const title of titles) expect(title).not.toMatch(/usado em|nível/);
  }
});

test("o title da pílula diz onde a tecnologia foi usada, só quando há projeto", async ({
  page,
}) => {
  await page.goto("/sobre");
  const pill = (name: string) =>
    stackSection(page, "pt")
      .getByTestId("stack-item")
      .filter({ has: page.getByText(name, { exact: true }) })
      .locator("[title]")
      .first();
  // React aparece em projetos publicados; Laravel não tem projeto publicado.
  await expect(pill("React")).toHaveAttribute("title", /^usado em .+/);
  await expect(
    stackSection(page, "pt")
      .getByTestId("stack-item")
      .filter({ hasText: "Laravel" })
      .locator("[title^='usado em']"),
  ).toHaveCount(0);
});

test("as tecnologias que saíram da seção continuam nas etiquetas dos projetos", async ({
  page,
}) => {
  const tags = (locale: "pt" | "en") =>
    page.getByRole("list", { name: t(locale).projects.stackList });
  await page.goto("/projetos/checkpoint");
  for (const name of ["Prisma", "Redis", "BullMQ"]) {
    await expect(tags("pt")).toContainText(name);
  }
  await page.goto("/projetos/lumina");
  await expect(tags("pt")).toContainText("Vite");
  await page.goto("/en/projects/checkpoint");
  await expect(tags("en")).toContainText("Prisma");
});

for (const { path, locale, target } of [
  { path: "/", locale: "pt", target: "/sobre#stack" },
  { path: "/en/", locale: "en", target: "/en/about#stack" },
] as const) {
  test(`${path}: o link da home leva à stack completa`, async ({ page }) => {
    await page.goto(path);
    const link = stackSection(page, locale).getByRole("link", {
      name: t(locale).home.fullStack,
    });
    await expect(link).toHaveAttribute("href", target);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(stackSection(page, locale)).toBeInViewport();
  });
}

test("o Sobre não repete o link para a stack completa", async ({ page }) => {
  await page.goto("/sobre");
  await expect(
    stackSection(page, "pt").getByRole("link", {
      name: t("pt").home.fullStack,
    }),
  ).toHaveCount(0);
});

test("os ícones são decorativos e vêm do sprite externo, que tem todos os <symbol>", async ({
  page,
  request,
}) => {
  await page.goto("/sobre");
  const icons = stackSection(page, "pt").locator(
    "[data-testid=stack-item] svg",
  );
  await expect(icons).toHaveCount(24);
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
for (const { path, locale, home } of PAGES) {
  test(`${path}: ícones de stack ${home ? "ausentes, sem pedir o sprite" : "presentes"}`, async ({
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
    const items = stackSection(page, locale).getByTestId("stack-item");
    await expect(items).toHaveCount(24);
    const svgs = items.locator("svg");
    if (!home) {
      await expect(svgs).toHaveCount(24);
      expect(spriteRequests.length).toBeGreaterThan(0);
      return;
    }
    await expect(svgs).toHaveCount(0);
    await expect(page.locator("use")).toHaveCount(0);
    expect(spriteRequests).toEqual([]);
  });
}
