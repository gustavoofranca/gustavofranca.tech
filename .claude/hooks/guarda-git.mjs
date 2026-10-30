// Hook PreToolUse (Bash/PowerShell): barra comandos git que quebram regras sem exceção.
// Regra em texto (CLAUDE.md) o modelo pode decidir não seguir; aqui o Claude Code
// aplica sempre. Saída 2 bloqueia o comando e devolve o stderr ao Claude.
import { readFileSync } from "node:fs";

const REGRAS = [
  {
    // Regra global do Gustavo: commit e PR saem só com o autor dele.
    teste: (c) => /\bgit\b[\s\S]*\bcommit\b/i.test(c) && /co-authored-by:[^\n]*(claude|anthropic)|generated with \[?claude/i.test(c),
    motivo: "Commit com atribuição ao Claude/Anthropic. Remova a linha Co-Authored-By/Generated with Claude (regra global em ~/.claude/CLAUDE.md).",
  },
  {
    teste: (c) => /\bgit\b[\s\S]*\bpush\b/i.test(c) && /(\s--force(?!-with-lease)\b|\s-f\b)/.test(c),
    motivo: "Push forçado é proibido. Se for mesmo necessário num branch de feature, use --force-with-lease e peça ao Gustavo.",
  },
  {
    // Só o nome exato do branch (ou HEAD:main); feat/main-hero não conta.
    teste: (c) => /\bgit\b[\s\S]*\bpush\b[\s\S]*(\s|:)(main|master)(\s|$)/i.test(c),
    motivo: "Push direto na main é proibido. Trabalhe num branch de feature e abra PR.",
  },
  {
    teste: (c) => /\bgit\b[\s\S]*\s--no-verify\b/i.test(c),
    motivo: "--no-verify é proibido: os hooks (lint, varredura de segredos) existem para rodar. Corrija a causa.",
  },
  {
    teste: (c) => /\bgit\s+add\b[^\n]*(\s-f\b|\s--force\b|(^|[\s/\\])\.env(?!\.example)\b)/i.test(c),
    motivo: "Tentativa de versionar .env ou forçar arquivo ignorado. Segredos nunca entram no Git (repositório público).",
  },
];

let entrada;
try {
  entrada = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0); // sem entrada legível não há o que julgar
}

const comando = String(entrada?.tool_input?.command ?? "");
const violada = REGRAS.find((r) => r.teste(comando));
if (violada) {
  process.stderr.write(`Bloqueado pelo hook guarda-git: ${violada.motivo}\n`);
  process.exit(2);
}
process.exit(0);
