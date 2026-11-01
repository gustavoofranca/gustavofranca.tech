import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      "dist/",
      ".astro/",
      "node_modules/",
      "coverage/",
      "playwright-report/",
      "test-results/",
      ".lighthouseci/",
      "docs/superpowers/",
      ".superpowers/",
      ".claude/skills/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs["jsx-a11y-recommended"],
  {
    files: ["**/*.{ts,tsx}"],
    ...jsxA11y.flatConfigs.recommended,
    plugins: {
      ...jsxA11y.flatConfigs.recommended.plugins,
      "react-hooks": reactHooks,
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      // Regra do projeto: nada de setState síncrono em useEffect.
      "react-hooks/set-state-in-effect": "error",
    },
  },
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    // O preflight do Tailwind tira o list-style de <ul>/<ol>, e o VoiceOver/Safari
    // deixa de anunciar a lista; role="list" devolve a semântica (estilo.md). A
    // própria jsx-a11y documenta esta exceção para listas.
    // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/no-redundant-roles.md
    files: ["**/*.astro"],
    rules: {
      "astro/jsx-a11y/no-redundant-roles": [
        "error",
        { ul: ["list"], ol: ["list"] },
      ],
    },
  },
);
