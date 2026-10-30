export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "gf-theme";

// Valor salvo só vale se for um tema conhecido; o resto cai no sistema.
// `ThemeScript.astro` repete esta lógica inline (precisa rodar antes da primeira pintura, sem imports).
export function resolveTheme(stored: unknown, prefersDark: boolean): Theme {
  if (stored === "dark" || stored === "light") return stored;
  return prefersDark ? "dark" : "light";
}

// Troca o tema no <html> e guarda a escolha. Compartilhada entre o botão do
// cabeçalho e a paleta de comandos, para os dois produzirem o mesmo resultado.
export function toggleTheme(): Theme {
  const next: Theme =
    document.documentElement.dataset["theme"] === "light" ? "dark" : "light";
  document.documentElement.dataset["theme"] = next;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch (error) {
    // Armazenamento bloqueado: o tema vale só nesta visita.
    console.warn("Não foi possível salvar o tema.", error);
  }
  return next;
}
