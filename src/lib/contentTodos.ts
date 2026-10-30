// Sem imports e só sintaxe "apagável" de TypeScript: o Node 24 roda este arquivo
// direto (scripts/content-todos.mjs), e o Vitest/Astro também. Uma implementação só.

export interface PendingTodo {
  path: string;
  line: number;
  note: string;
}

// A nota termina no fim da linha, ou antes de `"` (valor de JSON), `-->` (comentário
// HTML) ou `*/`, para não arrastar o resto de uma linha de JSON/MDX para dentro dela.
const TODO_PATTERN = /TODO\(gustavo\):\s*([^"\n]*?)\s*(?:-->|\*\/|"|$)/gm;

export function findPendingTodos(
  files: { path: string; text: string }[],
): PendingTodo[] {
  const pending: PendingTodo[] = [];
  for (const { path, text } of files) {
    for (const match of text.matchAll(TODO_PATTERN)) {
      const before = text.slice(0, match.index);
      const line = before.split("\n").length;
      pending.push({ path, line, note: match[1] ?? "" });
    }
  }
  return pending;
}
