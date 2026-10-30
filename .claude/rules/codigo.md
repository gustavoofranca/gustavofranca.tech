---
paths:
  - "src/**/*.{ts,tsx,astro,mjs}"
  - "tests/**/*"
  - "*.config.{ts,mjs,js}"
---

# Regras de código

## Linguagem e tipos
- TypeScript em modo `strict` (o preset `astro/tsconfigs/strictest`). `any` só com comentário explicando por quê; prefira `unknown` e estreitar o tipo.
- Sem `!` (non-null assertion) para calar o compilador; trate o caso nulo.
- Tipos que descrevem conteúdo vêm do schema Zod (`z.infer` / `CollectionEntry`), nunca duplicados à mão.
- `import type` para importações só de tipo.

## Nomes e idioma
- Identificadores (variáveis, funções, componentes, arquivos) em **inglês**. Conteúdo, textos de interface e comentários em **português**.
- Comentário explica **por quê**, não o quê. Código óbvio não ganha comentário.
- Componentes em `PascalCase.astro` / `PascalCase.tsx`; funções e arquivos de `lib/` em `camelCase.ts`; rotas seguem a URL (`projetos/[slug].astro`).

## Astro primeiro, React só para interação
- Componente novo é `.astro` por padrão. Vira React (`src/components/islands/`) só se tiver estado ou evento no navegador: terminal do hero, paleta ⌘K, formulário, seletor de tema/idioma.
- Hidratação explícita e a mais tardia possível: `client:visible` > `client:idle` > `client:load` (este último só com justificativa no comentário). Nunca `client:only` sem fallback de conteúdo.
- Toda página é pré-renderizada. A única rota de servidor é `src/pages/api/contato.ts` (`export const prerender = false`).
- Nada de busca de dados no navegador para conteúdo que existe no build.

## React (ilhas)
- Componentes de função, props tipadas, sem `default export` de objetos anônimos.
- Proibido `setState` síncrono dentro de `useEffect` (mesma regra do TCC). Estado derivado se calcula no render.
- Efeito só para sincronizar com algo externo (DOM, evento global, timer), sempre com limpeza.
- Sem biblioteca de estado global: as ilhas são independentes. Se duas ilhas precisarem conversar, use `nanostores` (recomendação oficial do Astro).

## Organização
- Lógica fora dos componentes: funções puras em `src/lib/`, cada uma com teste em `tests/unit/`.
- Um componente por arquivo, pequeno. Passou de ~150 linhas, quebre.
- Importações com alias `@/` (configurado no `tsconfig`), sem `../../../`.
- Sem código morto, `console.log` esquecido nem comentário de código desativado no commit.

## Dependências
- Antes de adicionar pacote, veja se o Astro ou a plataforma já resolve (ex.: `astro:assets`, `<dialog>`, `Intl`).
- Pacote novo precisa caber no orçamento de JS (ver `qualidade.md`) e ser mantido (commit no último ano). Versão exata no `package.json` (`save-exact`).
- Consulte a doc atual via `context7` antes de usar API do Astro/Tailwind; elas mudam entre versões maiores.
