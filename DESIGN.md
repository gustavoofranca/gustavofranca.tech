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
| `--glow-accent`     | accent `#a78bfa` a 10%          | accent `#7c3aed` a 6%               | Luz do cursor nos cartões |

Botões de janela do terminal no hover (decorativos, `aria-hidden`; os mesmos tons nos dois temas, como no macOS): `--window-close` `#ff5f57`, `--window-minimize` `#febc2e`, `--window-zoom` `#28c840`. Não reaproveitam `--level-*`: o significado é outro e aqueles escurecem no tema claro.

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

- Durações: `--duration-fast` 150 ms (hover, cor, entrada da luz), `--duration-base` 250 ms (zoom, sublinhado, saída da luz, crossfade entre páginas), `--duration-type` 65 ms (por caractere digitado no terminal), `--duration-pulse` 1,2 s (um ciclo do pulso do selo), `--duration-aurora` 4,5 s (deriva única dos brilhos da aurora).
- Curva: `--ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`) nas chegadas. Nada de bounce. Hover entra rápido e sai devagar.
- Terminal do hero: o estado padrão já é o texto completo; a digitação é uma máscara que anda com `steps()` (só `transform`/`opacity`) e só existe com `prefers-reduced-motion: no-preference`. O cursor pisca 4 vezes e para (WCAG 2.2.2).
- Só `transform` e `opacity` (e variáveis CSS que alimentam os dois). Um momento orquestrado por página (hero); a aurora deriva uma vez em 4,5 s e para (WCAG 2.2.2: nada se move sozinho por mais de 5 s sem pausa); o terminal digita uma vez. O resto é resposta a hover, foco ou scroll, nunca entrada de conteúdo.
- Conteúdo nunca começa escondido: sem "fade-in ao rolar". Os efeitos de scroll mexem só em decoração (linha, pontos, aurora, barra).
- `prefers-reduced-motion: reduce`: animações e transições reduzidas a quase zero em `global.css`; conteúdo completo visível, nunca começa com `opacity: 0`. Esse reset **não** alcança animação de scroll, view transition nem a luz movida por JS: cada efeito abaixo desliga sozinho.
- Hover só com mouse ou trackpad: `@media (hover: hover) and (pointer: fine)` (variante `hover-fine:` do Tailwind, em `global.css`). No toque, nada de hover.
- Animação de scroll em propriedades longas (`animation-name`, `animation-timeline` etc.), nunca no atalho `animation`: o minificador junta os dois num valor que o Chrome rejeita.

### Efeitos (ADR 0004)

| Efeito                       | Onde                                            | Como                                                                                                                                                                                                                                                                                                                                                                                                                                | Movimento reduzido / toque                        |
| ---------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Zoom da capa (H1)            | Cartão de projeto (home, `/projetos`)           | `scale` 1,03 na capa, dentro de uma moldura com `overflow: hidden` (sem deslocar nada), 250 ms. Também no foco do teclado                                                                                                                                                                                                                                                                                                           | Sem zoom / sem zoom                               |
| Sublinhado de luz (H2)       | Menu do cabeçalho                               | `::after` de 1 px em `accent`, `scale-x` 0 → 1 a partir da esquerda, 250 ms, no hover e no foco; **sempre cheio na página atual** (`aria-current`), que assim não depende só da cor                                                                                                                                                                                                                                                 | Aparece sem transição / só a da página atual      |
| Terminal acorda (H4)         | Terminal do hero                                | No hover, os três pontos ganham as cores de janela do macOS (`--window-*`) e o cursor pisca mais 4 vezes e para                                                                                                                                                                                                                                                                                                                     | Cor muda, cursor parado / nada                    |
| Linha do tempo acende (S2)   | Mini linha do tempo (home) e trajetória (Sobre) | Linha `accent` cresce sobre a borda com `scaleY` (`animation-timeline: view()`), com a ponta no meio da tela; cada ponto acende (`opacity` de uma camada `accent` com halo) ao chegar lá                                                                                                                                                                                                                                            | Desenho de sempre / igual (é scroll)              |
| Barra de leitura (S1)        | Só estudos de caso                              | 2 px fixos no topo, `accent`, `scaleX` com `scroll(root)`                                                                                                                                                                                                                                                                                                                                                                           | Não aparece (Firefox também não)                  |
| Aurora recua (S3)            | Hero                                            | Contêiner da aurora sobe 40 px e vai a 35% de opacidade nos primeiros 70vh de scroll; no topo da página é idêntica                                                                                                                                                                                                                                                                                                                  | Parada                                            |
| Luz no cartão (I1)           | Cartão de projeto                               | Círculo de luz (`--glow-accent`) atrás do texto, movido com `transform`, e borda acesa (`accent`, anel de 1 px com máscara) perto do cursor. Script empacotado de ~0,4 KB: um `pointermove` delegado, uma escrita por quadro (`requestAnimationFrame`), posição em `--light-x`/`--light-y` pelo CSSOM (`setProperty`, permitido pela CSP). Acende em 150 ms, apaga em 250 ms. Teclado: luz parada no topo (`:has(a:focus-visible)`) | Luz parada no topo, sem seguir o cursor / sem luz |
| Pulso "disponível" (I3)      | Selo do hero                                    | Anel em `accent-2` sai do ponto 3 vezes (3,6 s, começa em 0,6 s) e para                                                                                                                                                                                                                                                                                                                                                             | Sem pulso, fica o brilho fixo                     |
| Transição entre páginas (V1) | Site todo                                       | `@view-transition { navigation: auto }`: crossfade de 250 ms; o cabeçalho (`view-transition-name: site-header`) troca na hora e fica parado                                                                                                                                                                                                                                                                                         | Sem transição                                     |

Fora, por decisão: fade-in de seções ao rolar, lanterna na grade do hero, brilho no anel de foco, `<ClientRouter />` do Astro e bibliotecas de animação.

## Botões e cartões

- Primário: fundo `fg`, texto `bg`. Contorno: borda `line`, texto `fg`/`muted`, hover em `fg`. Alvo mínimo de 40 px. Foco visível com contorno `accent` de 2 px.
- Cartão (borda `line` + fundo `surface` + `--radius-card`) só para objetos separados: projeto e terminal. Seções não viram cartão.
- Cartão de projeto: o link do título se estica sobre o cartão (`::after`) e o anel de foco aparece no cartão inteiro. No hover a borda vai a `accent` a 40%, e o trecho perto do cursor fica `accent` cheio (borda acesa, ver Movimento).
- Títulos de seção da home são o próprio rótulo mono (`// projetos em destaque`), com as barras ocultas do leitor de tela. Sem rótulo acima de título.
- Selo "disponível para oportunidades": ponto em `accent-2`, não em `live` (verde só para "no ar").

## Stack: ícones e nível

- Na stack completa (Sobre/About), cada tecnologia tem ícone monocromático na cor do texto (`text-muted`), 16 px, via `<svg><use href="/icons/stack-<hash>.svg#id"/></svg>` (`src/components/stack/TechIcon.astro`). O sprite externo é gerado no build só com os ícones de `stack.json` (`src/pages/icons/[file].svg.ts`, `src/lib/iconSprite.ts`), com o hash do conteúdo no nome; os `<symbol>` usam `currentColor`, então a cor segue o tema. Sem JS e sem `style=""` (a CSP não libera estilo inline). Marca vem do `simple-icons` (CC0); prática sem marca vem do Lucide (ISC), copiado em `src/lib/genericIcons.ts` e referenciado como `lucide:<nome>`. Item sem ícone mantém o espaço reservado para o nome alinhar.
- A home não leva ícone nem o espaço dele (só nome, ponto e legenda), e não pede o sprite. Motivo: o sprite (~19,6 KB gzip) era pedido junto com a capa do primeiro destaque, que é o LCP da home, e no Lighthouse mobile (headless shell, Lantern) o LCP subiu de 1,46 s para 1,60 s, acima do limite de 1,5 s. Sem ícones a home fica em ~1,46 s (mediana medida com a área de infraestrutura e a legenda; folga de ~35 ms).
- Os traçados do sprite saem com 1 casa decimal (`svgo`, `convertPathData`): 0,07 px num ícone de 16 px, invisível. O sprite cai de ~19,6 KB para ~7 KB gzip. Com ~20 KB o pedido dividia banda com as fontes, e o LCP do `/sobre` (um parágrafo) foi a 1,52 s; com ~7 KB ele fica em ~1,37 s, igual ao da `main`.
- Nível de conhecimento: ponto de 10 px ao lado do nome, no estilo dos botões de janela do macOS (verde básico, laranja intermediário, vermelho avançado). No escuro valem os tons do macOS; no claro eles ficam abaixo de 3:1, então os tokens `level-*` escurecem. Contraste com o fundo (WCAG 1.4.11, mínimo 3:1): escuro 8,9 / 9,7 / 6,7; claro 4,2 / 3,8 / 4,5 (sobre `bg`).
- Cor não é o único meio (WCAG 1.4.1): cada ponto tem o texto "nível: básico" oculto para leitor de tela, e a legenda visível acima da stack mostra os três níveis.
