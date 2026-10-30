// Hook Stop: roda `npm run check` e devolve a saída ao Claude se falhar (exit 2).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  // Sem JSON no stdin: segue com o padrão.
}

// Evita laço infinito: se o Claude já está continuando por causa deste hook, deixa parar.
if (input.stop_hook_active) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
if (!existsSync(`${root}/node_modules`)) process.exit(0);

const result = spawnSync("npm run check", {
  cwd: root,
  shell: true,
  encoding: "utf8",
});
if (result.status !== 0) {
  process.stderr.write(`${result.stdout}${result.stderr}`);
  process.exit(2);
}
