export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "gf-theme";

// Valor salvo só vale se for um tema conhecido; o resto cai no sistema.
// `ThemeScript.astro` repete esta lógica inline (precisa rodar antes da primeira pintura, sem imports).
export function resolveTheme(stored: unknown, prefersDark: boolean): Theme {
  if (stored === "dark" || stored === "light") return stored;
  return prefersDark ? "dark" : "light";
}
