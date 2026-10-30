export type ProjectFilter = { kind?: string; stack?: string };

// Critérios combinam com E. Vazio (ou ausente) significa "sem filtro", o valor que
// um <select> com a opção "Todos" entrega.
export function filterProjects<
  T extends { data: { kind: string; stack: string[] } },
>(list: T[], f: ProjectFilter): T[] {
  return list.filter(
    ({ data }) =>
      (!f.kind || data.kind === f.kind) &&
      (!f.stack || data.stack.includes(f.stack)),
  );
}
