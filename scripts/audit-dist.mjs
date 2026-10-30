// Auditoria da CSP no build (npm run audit:dist, depois do npm run build): passa
// src/lib/distAudit.ts em todo HTML de dist/client e falha se alguma página tiver
// script/estilo inline sem hash, style=""/on*="" ou algo ativo antes da <meta>.
// Importa o .ts direto: o Node 24 remove os tipos sozinho. docs/adr/0002-csp.md
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { auditHtml } from "../src/lib/distAudit.ts";

const root = fileURLToPath(new URL("../dist/client", import.meta.url));

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

const files = htmlFiles(root);
if (files.length === 0) {
  console.error("Nenhum HTML em dist/client. Rode npm run build antes.");
  process.exit(1);
}

let failures = 0;
for (const file of files) {
  const problems = await auditHtml(readFileSync(file, "utf8"));
  const path = relative(root, file).replaceAll("\\", "/");
  for (const problem of problems) console.error(`  ${path}: ${problem}`);
  failures += problems.length;
}

if (failures > 0) {
  console.error(`\nAuditoria da CSP: ${failures} problema(s) em dist/client.`);
  process.exit(1);
}
console.log(`Auditoria da CSP: ${files.length} página(s) sem problema.`);
