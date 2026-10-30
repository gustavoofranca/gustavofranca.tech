import { randomInt } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// O limite é 5 envios por hora por IP, e o servidor do e2e é reaproveitado entre
// rodadas locais. Cada teste se apresenta com um IP próprio no X-Forwarded-For
// (o servidor confia nele como confiaria no Caddy) para não esbarrar no limite.
// Faixa 198.18.0.0/15: reservada para testes (RFC 2544).
function testIp() {
  return `198.18.${randomInt(0, 256)}.${randomInt(1, 255)}`;
}

// Token que o widget de teste do Turnstile gera; o segredo de teste o aceita.
const DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

async function routeApi(page: Page, options: { appendToken?: boolean } = {}) {
  const ip = testIp();
  await page.route("**/api/contato", async (route) => {
    const request = route.request();
    const postData =
      options.appendToken && request.postData() !== null
        ? `${request.postData()}&cf-turnstile-response=${DUMMY_TOKEN}`
        : undefined;
    await route.continue({
      headers: { ...request.headers(), "x-forwarded-for": ip },
      ...(postData ? { postData } : {}),
    });
  });
}

async function fillForm(page: Page) {
  await page.getByLabel("Nome").fill("João Ávila");
  await page.getByLabel("E-mail").fill("joao+portfolio@exemplo.com");
  await page
    .getByLabel("Mensagem")
    .fill("<script>alert(1)</script> Olá! Vi o portfólio e quero conversar.");
}

test.describe("contato com JavaScript", () => {
  test("envio válido mostra 'Mensagem enviada'", async ({ page }) => {
    await routeApi(page);
    await page.goto("/contato");
    await fillForm(page);
    // Simula alguém que levou 10 s preenchendo (o mínimo é 3 s).
    await page
      .locator("#contact-started-at")
      .evaluate((input: HTMLInputElement) => {
        input.value = String(Date.now() - 10_000);
      });
    await expect(
      page.locator('input[name="cf-turnstile-response"]'),
    ).toHaveValue(/.+/, { timeout: 20_000 });

    const response = page.waitForResponse("**/api/contato");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    expect((await response).status()).toBe(200);
    await expect(
      page.getByRole("status").filter({ hasText: "Mensagem enviada" }),
    ).toBeVisible();
    await expect(page.getByLabel("Nome")).toHaveValue("");
  });

  test("em inglês, a mesma rota responde no idioma da página", async ({
    page,
  }) => {
    await routeApi(page);
    await page.goto("/en/contact");
    await page.getByLabel("Name").fill("Jane Doe");
    await page.getByLabel("Email").fill("jane@example.com");
    await page.getByLabel("Message").fill("Hi! I saw your portfolio.");
    await page
      .locator("#contact-started-at")
      .evaluate((input: HTMLInputElement) => {
        input.value = String(Date.now() - 10_000);
      });
    await expect(
      page.locator('input[name="cf-turnstile-response"]'),
    ).toHaveValue(/.+/, { timeout: 20_000 });
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Message sent" }),
    ).toBeVisible();
  });

  test("campo vazio mostra o erro ligado ao campo e não envia", async ({
    page,
  }) => {
    let posted = false;
    await page.route("**/api/contato", (route) => {
      posted = true;
      return route.abort();
    });
    await page.goto("/contato");
    await page.getByLabel("E-mail").fill("joao@exemplo.com");
    await page.getByLabel("Mensagem").fill("Uma mensagem com tamanho bom.");
    // Espera a ilha hidratar: só com ela o erro aparece no lugar do balão nativo.
    await expect(page.locator("#contact-form")).toHaveJSProperty(
      "noValidate",
      true,
    );
    await page.getByRole("button", { name: "Enviar mensagem" }).click();

    const name = page.getByLabel("Nome");
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription("Informe seu nome.");
    await expect(name).toBeFocused();
    await expect(page.locator("#contact-name-error")).toHaveText(
      "Informe seu nome.",
    );
    expect(posted).toBe(false);
  });

  test("API: outra origem recebe 403 e outro método, 405", async ({
    request,
  }) => {
    const res = await request.post("/api/contato", {
      headers: { Origin: "https://evil.example" },
      data: { name: "x" },
    });
    expect(res.status()).toBe(403);
    expect((await request.get("/api/contato")).status()).toBe(405);
  });

  test("API: JSON inválido volta 400 com os campos, sem detalhe interno", async ({
    request,
    baseURL,
  }) => {
    const res = await request.post("/api/contato", {
      headers: { Origin: baseURL ?? "", "X-Forwarded-For": testIp() },
      data: {
        name: "Ana\r\nBcc: x@y.z",
        email: "ana@exemplo.com",
        message: "Mensagem de teste longa.",
        locale: "pt",
        website: "",
        turnstileToken: DUMMY_TOKEN,
      },
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({
      ok: false,
      reason: "invalid",
      fields: ["name"],
    });
  });

  for (const path of [
    "/contato",
    "/en/contact",
    "/privacidade",
    "/en/privacy",
  ]) {
    test(`${path} não tem violação séria de acessibilidade`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      const { violations } = await new AxeBuilder({ page })
        // O widget do Turnstile é um iframe de terceiro, fora do nosso controle.
        .exclude('iframe[src*="challenges.cloudflare.com"]')
        .analyze();
      const serious = violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(serious).toEqual([]);
    });
  }
});

test.describe("contato sem JavaScript (Review Focus 2)", () => {
  test.use({ javaScriptEnabled: false });

  test("POST nativo redireciona para /contato?status=enviado e mostra o resultado", async ({
    page,
  }) => {
    // Sem JS o widget do Turnstile não roda. Aqui o teste injeta o token que o widget
    // de teste geraria, para exercitar o caminho completo do POST nativo até o 303.
    await routeApi(page, { appendToken: true });
    await page.goto("/contato");
    await expect(page.locator("#contact-started-at")).toHaveValue("");
    await fillForm(page);
    await page.getByRole("button", { name: "Enviar mensagem" }).click();

    await expect(page).toHaveURL(/\/contato\?status=enviado#contato-enviado$/);
    await expect(page.locator("#contato-enviado")).toBeVisible();
    await expect(page.locator("#contato-enviado")).toHaveText(
      "Mensagem enviada. Respondo em breve.",
    );
    await expect(
      page.getByTestId("contact-status").filter({ visible: true }),
    ).toHaveCount(1);
  });

  test("sem o token do widget, volta com motivo=captcha e a mensagem aponta o e-mail", async ({
    page,
  }) => {
    await routeApi(page);
    await page.goto("/en/contact");
    await page.getByLabel("Name").fill("Jane Doe");
    await page.getByLabel("Email").fill("jane@example.com");
    await page.getByLabel("Message").fill("Hi! I saw your portfolio.");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page).toHaveURL(
      /\/en\/contact\?status=erro&motivo=captcha#contato-erro-captcha$/,
    );
    await expect(page.locator("#contato-erro-captcha")).toBeVisible();
    await expect(page.locator("#contato-erro-captcha")).toContainText(
      "contato@gustavofranca.tech",
    );
    await expect(page.locator("#contato-enviado")).toBeHidden();
  });

  test("sem resultado na URL, nenhuma mensagem aparece", async ({ page }) => {
    await page.goto("/contato");
    await expect(
      page.getByTestId("contact-status").filter({ visible: true }),
    ).toHaveCount(0);
  });
});

test("/privacidade diz que o formulário não guarda nada e que não há cookies", async ({
  page,
}) => {
  await page.goto("/privacidade");
  const main = page.locator("main");
  await expect(main).toContainText("não guarda nada");
  await expect(main).toContainText("não grava cookies");
  await expect(main).toContainText("contato@gustavofranca.tech");
});

test("o rodapé leva à página de privacidade", async ({ page }) => {
  await page.goto("/en/");
  await page.getByRole("link", { name: "Privacy" }).click();
  await expect(page).toHaveURL(/\/en\/privacy$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy");
});
