import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"]
    ? [["github"], ["html", { open: "never" }]]
    : "list",
  use: { baseURL: "http://localhost:4321", trace: "on-first-retry" },
  // O teste roda contra o build de produção (CSP, fontes e imagens só existem nele).
  // Variáveis só de teste, nunca segredo real: MAIL_TRANSPORT=json monta o e-mail sem
  // enviar, e as chaves do Turnstile são as de teste do Cloudflare (sempre passam).
  // https://developers.cloudflare.com/turnstile/troubleshooting/testing/
  webServer: {
    // NODE_ENV=test só no preview: o build continua de produção, e o env aceita
    // MAIL_TRANSPORT=json (com NODE_ENV=production ele falha fechado).
    command: "npm run build && npx cross-env NODE_ENV=test npm run preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env["CI"],
    timeout: 180_000,
    env: {
      MAIL_TRANSPORT: "json",
      SMTP_HOST: "smtp.exemplo.invalid",
      SMTP_PORT: "465",
      SMTP_USER: "contato@gustavofranca.tech",
      SMTP_PASS: "e2e-nao-e-segredo",
      CONTACT_TO: "contato@gustavofranca.tech",
      TURNSTILE_SECRET: "1x0000000000000000000000000000000AA",
      PUBLIC_TURNSTILE_SITEKEY: "1x00000000000000000000AA",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
