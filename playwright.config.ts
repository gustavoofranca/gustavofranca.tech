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
  // MAIL_TRANSPORT=json evita envio real de e-mail; cross-env mantém PowerShell e CI iguais.
  webServer: {
    command:
      "npx cross-env MAIL_TRANSPORT=json npm run build && npx cross-env MAIL_TRANSPORT=json npm run preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env["CI"],
    timeout: 180_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
