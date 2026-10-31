# Design

Variante 1: minimal escuro + terminal + aurora. Todos os valores vivem em `src/styles/tokens.css`; este arquivo só os documenta.

## Paleta

| Token (classe Tailwind) | Escuro    | Claro     | Uso                                  |
| ----------------------- | --------- | --------- | ------------------------------------ |
| `bg`                    | `#09090b` | `#fafafa` | Fundo da página                      |
| `surface`               | `#131316` | `#ffffff` | Cartões e terminal                   |
| `fg`                    | `#fafafa` | `#18181b` | Texto principal                      |
| `muted`                 | `#a1a1aa` | `#52525b` | Texto secundário                     |
| `faint`                 | `#8a8a96` | `#62626c` | Rótulos e detalhes                   |
| `line`                  | `#27272a` | `#e4e4e7` | Bordas                               |
| `accent`                | `#a78bfa` | `#7c3aed` | Destaque (violeta)                   |
| `accent-strong`         | `#7c3aed` | `#6d28d9` | Fundos de destaque, estados de hover |
| `accent-2`              | `#67e8f9` | `#0e7490` | Segundo destaque (ciano)             |
| `live`                  | `#4ade80` | `#15803d` | Só para o status "no ar"             |
| `code-string`           | `#86efac` | `#166534` | Strings no terminal do hero          |
| `level-basic`           | `#28c840` | `#1f8a34` | Ponto de nível "básico" na stack     |
| `level-intermediate`    | `#ff9f0a` | `#c26a00` | Ponto de nível "intermediário"       |
| `level-advanced`        | `#ff5f57` | `#d63a31` | Ponto de nível "avançado"            |

Tokens do hero, sem classe Tailwind (usados como `var(--...)` ou `shadow-(--...)`); a cor já leva o alfa porque cada tema pede outra intensidade:

| Token               | Escuro                          | Claro                               | Uso                       |
| ------------------- | ------------------------------- | ----------------------------------- | ------------------------- |
| `--aurora-1`        | violeta `#7c3aed` a 45%         | violeta `#8b5cf6` a 22%             | Brilho esquerdo da aurora |
| `--aurora-2`        | ciano `#06b6d4` a 30%           | ciano `#06b6d4` a 16%               | Brilho direito da aurora  |
| `--grid-line`       | branco a 4,5%                   | `#18181b` a 6%                      | Linhas da grade do hero   |
| `--shadow-terminal` | `0 24px 64px -24px` preto a 90% | `0 24px 56px -28px` `#18181b` a 28% | Sombra do terminal        |

No tema claro, ciano e verde são mais escuros que os da paleta original (`#06b6d4`) para passar contraste AA de texto. O escuro é o padrão; o claro vale quando o visitante escolheu, ou quando o sistema pede e nada está salvo.

## Tipografia

- Texto: Inter Variable. Detalhes de dev (rótulos `// ...`, terminal, atalhos, tags): JetBrains Mono Variable. Mono nunca em parágrafo.
- Auto-hospedadas, `font-display: swap`. Subconjuntos próprios em `src/assets/fonts/` (latim, pesos 400–600), gerados do `@fontsource-variable` por `npm run fonts:subset`: peso fora de 400–600 exige gerar de novo (ADR 0003).
- Fallback com métricas ajustadas (`Inter Fallback`: Arial/Liberation Sans com `size-adjust` e `ascent/descent-override` da Inter, em `global.css`): a troca de fonte não empurra o texto (CLS).
- Escala fixa (Tailwind): `text-sm` 14, `text-base` 16, `text-lg` 18, `text-2xl` 24, `text-4xl` 36, `text-6xl` 60. Títulos com `text-wrap: balance`; texto corrido até ~70 caracteres por linha.

## Espaçamento e raios

- Espaçamento: escala padrão do Tailwind (múltiplos de 4 px); seções com respiro generoso (`py-16` a `py-24`).
- Raios: `--radius-card` 12 px (cartões, terminal), `--radius-control` 8 px (botões, campos).

## Movimento

- Durações: `--duration-fast` 150 ms (hover, cor), `--duration-base` 250 ms (entradas), `--duration-type` 65 ms (por caractere digitado no terminal), `--duration-aurora` 4,5 s (deriva única dos brilhos da aurora).
- Terminal do hero: o estado padrão já é o texto completo; a digitação é uma máscara que anda com `steps()` (só `transform`/`opacity`) e só existe com `prefers-reduced-motion: no-preference`. O cursor pisca 4 vezes e para (WCAG 2.2.2).
- Só `transform` e `opacity`. Um momento orquestrado por página (hero); a aurora deriva uma vez em 4,5 s e para (WCAG 2.2.2: nada se move sozinho por mais de 5 s sem pausa); o terminal digita uma vez.
- `prefers-reduced-motion: reduce`: animações e transições reduzidas a quase zero em `global.css`; conteúdo completo visível, nunca começa com `opacity: 0`.

## Botões e cartões

- Primário: fundo `fg`, texto `bg`. Contorno: borda `line`, texto `fg`/`muted`, hover em `fg`. Alvo mínimo de 40 px. Foco visível com contorno `accent` de 2 px.
- Cartão (borda `line` + fundo `surface` + `--radius-card`) só para objetos separados: projeto e terminal. Seções não viram cartão.
- Cartão de projeto: o link do título se estica sobre o cartão (`::after`) e o anel de foco aparece no cartão inteiro.
- Títulos de seção da home são o próprio rótulo mono (`// projetos em destaque`), com as barras ocultas do leitor de tela. Sem rótulo acima de título.
- Selo "disponível para oportunidades": ponto em `accent-2`, não em `live` (verde só para "no ar").

## Stack: ícones e nível

- Cada tecnologia tem ícone monocromático na cor do texto (`text-muted`), 16 px, via `<svg><use href="/icons/stack-<hash>.svg#id"/></svg>` (`src/components/stack/TechIcon.astro`). O sprite externo é gerado no build só com os ícones de `stack.json` (`src/pages/icons/[file].svg.ts`, `src/lib/iconSprite.ts`), com o hash do conteúdo no nome; os `<symbol>` usam `currentColor`, então a cor segue o tema. Sem JS e sem `style=""` (a CSP não libera estilo inline). Marca vem do `simple-icons` (CC0); prática sem marca vem do Lucide (ISC), copiado em `src/lib/genericIcons.ts` e referenciado como `lucide:<nome>`. Item sem ícone mantém o espaço reservado para o nome alinhar.
- Nível de conhecimento: ponto de 10 px ao lado do nome, no estilo dos botões de janela do macOS (verde básico, laranja intermediário, vermelho avançado). No escuro valem os tons do macOS; no claro eles ficam abaixo de 3:1, então os tokens `level-*` escurecem. Contraste com o fundo (WCAG 1.4.11, mínimo 3:1): escuro 8,9 / 9,7 / 6,7; claro 4,2 / 3,8 / 4,5 (sobre `bg`).
- Cor não é o único meio (WCAG 1.4.1): cada ponto tem o texto "nível: básico" oculto para leitor de tela, e a legenda visível acima da stack mostra os três níveis.
