import { randomInt } from "node:crypto";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

// CSP e cabeçalhos (Task 13). Roda contra o build de produção: a CSP só existe nele.
// https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html

const TURNSTILE = "https://challenges.cloudflare.com";
const CONTACT_PATHS = ["/contato", "/en/contact"];

// Mesma faixa de teste do contact.spec.ts (RFC 2544): não esbarra no limite por IP.
function testIp() {
  return `198.18.${randomInt(0, 256)}.${randomInt(1, 255)}`;
}

async function cspOf(page: Page): Promise<string> {
  const meta = page.locator('meta[http-equiv="content-security-policy"]');
  await expect(meta).toHaveCount(1);
  return (await meta.getAttribute("content")) ?? "";
}

// "script-src 'self' 'sha256-…'" → ["'self'", "'sha256-…'"]. undefined se não existe.
function directive(csp: string, name: string): string[] | undefined {
  const found = csp
    .split(";")
    .map((part) => part.trim().split(/\s+/))
    .find(([key]) => key === name);
  return found?.slice(1);
}

// Todas as páginas do build (o sitemap lista cada uma) e as duas 404.
async function allPaths(request: APIRequestContext): Promise<string[]> {
  const index = await (await request.get("/sitemap-index.xml")).text();
  const sitemaps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, loc]) => new URL(loc ?? "").pathname,
  );
  const paths: string[] = [];
  for (const sitemap of sitemaps) {
    const xml = await (await request.get(sitemap)).text();
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      paths.push(new URL(loc ?? "").pathname);
    }
  }
  return [...paths, "/nao-existe", "/en/nao-existe"];
}

// Escuta as violações antes de qualquer script da página (addInitScript roda primeiro).
async function watchViolations(page: Page) {
  const console: string[] = [];
  page.on("console", (message) => {
    if (/content security policy/i.test(message.text())) {
      console.push(message.text());
    }
  });
  await page.addInitScript(() => {
    const list: string[] = [];
    (window as unknown as { __csp: string[] }).__csp = list;
    document.addEventListener("securitypolicyviolation", (event) => {
      list.push(
        `${event.effectiveDirective} ${event.blockedURI} ${event.sourceFile} ${event.sample}`,
      );
    });
  });
  return async () => {
    const events = await page.evaluate(
      () => (window as unknown as { __csp: string[] }).__csp,
    );
    return [...events, ...console];
  };
}

test.describe("content security policy", () => {
  test("a home tem CSP restrita, sem 'unsafe-inline' em script", async ({
    page,
  }) => {
    await page.goto("/");
    const csp = await cspOf(page);
    expect(directive(csp, "default-src")).toEqual(["'self'"]);
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
    const script = directive(csp, "script-src") ?? [];
    expect(script).toContain("'self'");
    expect(script).not.toContain("'unsafe-inline'");
    expect(script).not.toContain("'unsafe-eval'");
    expect(directive(csp, "style-src")).not.toContain("'unsafe-inline'");
    // frame-ancestors é ignorado em <meta> (e gera erro no console): vai no Caddy.
    expect(directive(csp, "frame-ancestors")).toBeUndefined();
    // O Turnstile só é liberado onde ele existe, na página de contato.
    expect(csp).not.toContain(TURNSTILE);
  });

  for (const path of CONTACT_PATHS) {
    test(`${path} libera o Turnstile só em script-src e frame-src`, async ({
      page,
    }) => {
      await page.goto(path);
      const csp = await cspOf(page);
      expect(directive(csp, "script-src")).toContain(TURNSTILE);
      expect(directive(csp, "frame-src")).toEqual([TURNSTILE]);
      expect(directive(csp, "script-src")).not.toContain("'unsafe-inline'");
    });
  }

  // Uma CSP em <meta> só vale para o que vem depois dela no documento. Script ou
  // estilo antes da meta rodaria sem política nenhuma.
  test("a meta da CSP vem antes de todo script e estilo", async ({ page }) => {
    for (const path of ["/", "/contato", "/nao-existe"]) {
      await page.goto(path);
      const before = await page.evaluate(() => {
        const meta = document.querySelector(
          'meta[http-equiv="content-security-policy"]',
        );
        if (!meta) return ["sem meta"];
        return [
          ...document.querySelectorAll(
            'script:not([type="application/ld+json"]), style, link[rel="stylesheet"]',
          ),
        ]
          .filter(
            (el) =>
              !(
                meta.compareDocumentPosition(el) &
                Node.DOCUMENT_POSITION_FOLLOWING
              ),
          )
          .map((el) => el.outerHTML.slice(0, 80));
      });
      expect(before, path).toEqual([]);
    }
  });

  test("nenhuma rota (PT, EN e 404) tem violação de CSP", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const paths = await allPaths(request);
    expect(paths.length).toBeGreaterThan(20);
    const ip = testIp();
    await page.route("**/api/contato", (route) =>
      route.continue({
        headers: { ...route.request().headers(), "x-forwarded-for": ip },
      }),
    );

    for (const path of paths) {
      const violations = await watchViolations(page);
      await page.goto(path);
      // Todas as ilhas hidratadas (client:idle e client:visible inclusive).
      await page.mouse.wheel(0, 2000);
      await expect(page.locator("astro-island[ssr]"), path).toHaveCount(0);
      if (CONTACT_PATHS.includes(path)) {
        // O widget de teste do Turnstile só gera o token se o script e o iframe carregaram.
        await expect(
          page.locator('input[name="cf-turnstile-response"]'),
          path,
        ).toHaveValue(/.+/, { timeout: 20_000 });
      }
      await page.waitForLoadState("networkidle");
      expect(await violations(), path).toEqual([]);
      // Recomeça a escuta na próxima página (o init script vale por navegação).
      page.removeAllListeners("console");
    }
  });

  test("abrir a paleta e trocar o tema não viola a CSP", async ({ page }) => {
    const violations = await watchViolations(page);
    await page.goto("/");
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
    await expect(async () => {
      if (!(await page.locator("dialog[open]").count())) {
        await page.keyboard.press("Control+K");
      }
      await expect(page.locator("dialog[open]")).toHaveCount(1, {
        timeout: 500,
      });
    }).toPass();
    await expect(page.getByRole("combobox")).toBeFocused();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /tema/i }).click();
    await page.waitForLoadState("networkidle");
    expect(await violations()).toEqual([]);
  });
});

test.describe("rota /api/contato", () => {
  test("POST de outra origem responde 403", async ({ request }) => {
    const res = await request.post("/api/contato", {
      headers: { Origin: "https://evil.example" },
      data: { name: "x" },
    });
    expect(res.status()).toBe(403);
  });

  test("a resposta da API sai com cabeçalhos de API", async ({ request }) => {
    const res = await request.post("/api/contato", {
      headers: { Origin: "https://evil.example" },
      data: { name: "x" },
    });
    const headers = res.headers();
    expect(headers["cache-control"]).toBe("no-store");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toBe(
      "default-src 'none'; frame-ancestors 'none'",
    );
  });

  // Atrás do Caddy o processo recebe HTTP com X-Forwarded-Proto/Host. Com
  // security.allowedDomains, o Astro confia nesses cabeçalhos só para o domínio do
  // site, e url.origin vira https://gustavofranca.tech (o checkOrigin do POST nativo
  // depende disso).
  test("POST nativo vindo do proxy com o domínio do site passa da checagem de origem", async ({
    request,
  }) => {
    const res = await request.post("/api/contato", {
      headers: {
        Origin: "https://gustavofranca.tech",
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Host": "gustavofranca.tech",
        "X-Forwarded-For": testIp(),
      },
      form: {
        name: "Ana",
        email: "ana@exemplo.com",
        message: "Mensagem de teste longa.",
        locale: "pt",
        website: "",
        startedAt: "",
      },
      maxRedirects: 0,
    });
    // Sem token do Turnstile: volta com motivo=captcha, mas passou da origem.
    expect(res.status()).toBe(303);
    expect(res.headers()["location"]).toBe(
      "/contato?status=erro&motivo=captcha#contato-erro-captcha",
    );
  });

  test("X-Forwarded-Host de outro domínio não engana a checagem de origem", async ({
    request,
  }) => {
    const res = await request.post("/api/contato", {
      headers: {
        Origin: "https://evil.example",
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Host": "evil.example",
      },
      form: { name: "Ana" },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(403);
  });
});
