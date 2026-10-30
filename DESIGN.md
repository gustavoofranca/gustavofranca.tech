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

No tema claro, ciano e verde são mais escuros que os da paleta original (`#06b6d4`) para passar contraste AA de texto. O escuro é o padrão; o claro vale quando o visitante escolheu, ou quando o sistema pede e nada está salvo.

## Tipografia

- Texto: Inter Variable. Detalhes de dev (rótulos `// ...`, terminal, atalhos, tags): JetBrains Mono Variable. Mono nunca em parágrafo.
- Auto-hospedadas, subset latino, `font-display: swap`.
- Escala fixa (Tailwind): `text-sm` 14, `text-base` 16, `text-lg` 18, `text-2xl` 24, `text-4xl` 36, `text-6xl` 60. Títulos com `text-wrap: balance`; texto corrido até ~70 caracteres por linha.

## Espaçamento e raios

- Espaçamento: escala padrão do Tailwind (múltiplos de 4 px); seções com respiro generoso (`py-16` a `py-24`).
- Raios: `--radius-card` 12 px (cartões, terminal), `--radius-control` 8 px (botões, campos).

## Movimento

- Durações: `--duration-fast` 150 ms (hover, cor), `--duration-base` 250 ms (entradas).
- Só `transform` e `opacity`. Um momento orquestrado por página (hero); a aurora se move devagar; o terminal digita uma vez.
- `prefers-reduced-motion: reduce`: animações e transições reduzidas a quase zero em `global.css`; conteúdo completo visível, nunca começa com `opacity: 0`.

## Botões e cartões

- Primário: fundo `fg`, texto `bg`. Contorno: borda `line`, texto `fg`/`muted`, hover em `fg`. Alvo mínimo de 40 px. Foco visível com contorno `accent` de 2 px.
- Cartão (borda `line` + fundo `surface` + `--radius-card`) só para objetos separados: projeto e terminal. Seções não viram cartão.
