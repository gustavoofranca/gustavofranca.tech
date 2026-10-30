// Auditoria de dependências (CI, job "seguranca"). Duas camadas:
// 1. Produção (`--omit=dev`, o que vai para a imagem Docker): qualquer alerta alto ou
//    crítico falha, sem exceção.
// 2. Tudo (inclui ferramentas de CI): alerta alto ou crítico só passa se estiver em
//    audit-allowlist.json, com motivo e data de revisão (src/lib/auditAllowlist.ts).
// Hoje as exceções são todas da cadeia do @lhci/cli, sem versão corrigida. README.md
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { checkAudit, parseAllowlist } from "../src/lib/auditAllowlist.ts";

// npm audit sai com código != 0 quando acha alerta; o JSON vem no stdout mesmo assim.
// Comando numa string só (com shell): no Windows o npm é um .cmd, que o Node só abre
// por shell, e os argumentos aqui são fixos.
function audit(flags) {
  const result = spawnSync(`npm audit --json ${flags}`, {
    encoding: "utf8",
    shell: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (!result.stdout) {
    throw new Error(`npm audit não respondeu: ${result.stderr}`);
  }
  return JSON.parse(result.stdout);
}

const today = new Date().toISOString().slice(0, 10);
// Lista inválida (sem data, data fora do formato, sem motivo) falha aqui, com a
// entrada apontada, em vez de deixar a exceção valer para sempre.
let allowlist;
try {
  allowlist = parseAllowlist(
    JSON.parse(
      readFileSync(new URL("../audit-allowlist.json", import.meta.url), "utf8"),
    ),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const production = checkAudit(audit("--omit=dev"), [], today);
const all = checkAudit(audit(""), allowlist, today);

const failures = [
  ...production.blocking.map((line) => `produção: ${line}`),
  ...all.blocking.map((line) => `fora da lista: ${line}`),
  ...all.expired.map((line) => `exceção vencida (reveja ou remova): ${line}`),
];

for (const id of all.stale) {
  console.warn(
    `Aviso: ${id} está em audit-allowlist.json mas não aparece mais. Remova.`,
  );
}
if (failures.length > 0) {
  for (const line of failures) console.error(`  ${line}`);
  console.error(
    `\nnpm audit: ${failures.length} alerta(s) alto(s) ou crítico(s).`,
  );
  process.exit(1);
}
console.log(
  `npm audit: produção sem alerta alto; ${allowlist.length} exceção(ões) de ferramenta de CI dentro do prazo.`,
);
