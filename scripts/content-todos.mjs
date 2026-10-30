// Gancho `prebuild`: lista os TODO(gustavo) que sobraram em src/content. Com
// CONTENT_STRICT=true (build de produção) qualquer pendência falha o build.
// Importa o .ts direto: o Node 24 remove os tipos sozinho, então a regex
// de src/lib/contentTodos.ts continua sendo a única.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { findPendingTodos } from "../src/lib/contentTodos.ts";

// fileURLToPath decodifica %20 e trata a letra do drive no Windows.
const rootPath = fileURLToPath(new URL("../src/content", import.meta.url));

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(rootPath).map((file) => ({
  path: relative(process.cwd(), file).replaceAll("\\", "/"),
  text: readFileSync(file, "utf8"),
}));

const pending = findPendingTodos(files);
const strict = process.env.CONTENT_STRICT === "true";

for (const { path, line, note } of pending) {
  console.log(`  ${path}:${line}  TODO(gustavo): ${note}`);
}

if (pending.length === 0) {
  console.log("Conteúdo sem TODO(gustavo) pendente.");
} else if (strict) {
  console.error(
    `\nCONTENT_STRICT=true: ${pending.length} pendência(s) de TODO(gustavo). Build interrompido.`,
  );
  process.exit(1);
} else {
  console.warn(
    `\nAviso: ${pending.length} pendência(s) de TODO(gustavo). O build de produção (CONTENT_STRICT=true) falha enquanto houver.`,
  );
}
