# 0004. Movimento e interação: CSS nativo, um script de 0,5 KB e cada efeito com o seu desligamento

- **Data:** 2026-10-31
- **Status:** aceita

## Contexto

O site tinha um único momento animado (o hero: aurora que deriva uma vez e terminal que digita uma vez). O Gustavo escolheu, de um catálogo de 14 efeitos com fonte e risco, nove interações leves: zoom da capa e luz que segue o cursor nos cartões de projeto, sublinhado de luz no menu, terminal que "acorda" no hover, linha do tempo que acende ao rolar, barra de leitura nos estudos de caso, aurora que recua ao rolar, pulso do selo "disponível" e transição entre páginas. A lista completa, com onde, como e o comportamento com movimento reduzido, está em `DESIGN.md` › Movimento.

As restrições que pesam:

- **LCP da home** com ~35 ms de folga (ADR 0003): nada pode baixar ou rodar antes da primeira pintura além de poucos bytes de CSS. Orçamento de JS da home: 80 KB (estava em 73,7 KB).
- **CSP sem `'unsafe-inline'`** (ADR 0002): nada de `style=""` nem `<script is:inline>` escrito à mão.
- **WCAG 2.2 AA:** 2.2.2 (nada se move sozinho por mais de 5 s), 2.3.3 (movimento disparado por interação pode ser desligado; aqui pelo `prefers-reduced-motion`), foco visível, contraste igual nos dois temas.
- **`estilo.md`:** só `transform` e `opacity`; conteúdo nunca começa escondido.
- O reset de movimento reduzido de `global.css` (`animation-duration: 0.01ms` em `*`) **não** alcança animação ligada a scroll (a linha do tempo é o scroll, não o relógio), os pseudo-elementos `::view-transition-*` nem posição movida por JS.

## Decisão

- **Tudo em CSS nativo**, menos a posição da luz dos cartões:
  - scroll: `animation-timeline: view()` / `scroll(root)` dentro de `@supports (animation-timeline: …)` e de `@media (prefers-reduced-motion: no-preference)`. Sem suporte (Firefox estável) ou com movimento reduzido, fica o desenho de sempre;
  - transição entre páginas: `@view-transition { navigation: auto }` (cross-document, sem JS), também dentro de `no-preference`;
  - hover: `@media (hover: hover) and (pointer: fine)` (variante `hover-fine:` no Tailwind), com par em `:focus-visible` ou `:has(a:focus-visible)` onde o hover indica estado.
- **Luz do cartão:** um `<script>` empacotado pelo Astro (`src/scripts/cardLight.ts`, ~0,5 KB gzip; a conta da posição é pura, em `src/lib/cardLight.ts`, com teste) e o CSS em `src/styles/cardLight.css`, importado pelo `ProjectCard` e embutido no HTML. Um ouvinte `pointermove` delegado e passivo, só para `pointerType === "mouse"`, no máximo uma escrita por quadro (`requestAnimationFrame`), e a posição vai em `--light-x`/`--light-y` com `element.style.setProperty`, que a CSP permite (ela barra `setAttribute("style")` e `style.cssText`). Custo por quadro, enquanto o mouse anda sobre um cartão: recálculo de estilo do cartão (as variáveis herdam para os filhos); o círculo de luz anda com `transform` e ganha camada própria com `will-change: transform` só durante o hover, então o deslocamento dele é composição; a borda acesa (gradiente na posição do cursor, com máscara) repinta a área do cartão a cada quadro. Não liga com toque nem com movimento reduzido: aí a luz fica parada no topo, que é também o estado de foco do teclado. Quando a luz termina de apagar (`transitionend`) ou o cartão recebe foco sem o mouse em cima, a posição é apagada e a luz volta ao topo; apagar já na saída do mouse faria a luz pular durante o esmaecimento.
- **Borda acesa só com máscara:** o anel fica dentro de `@supports (mask-composite: exclude) or (-webkit-mask-composite: xor)`, com `-webkit-mask` antes da propriedade padrão. Sem máscara, o `::after` seria um gradiente accent opaco por cima do texto do cartão; sem o `@supports`, ele simplesmente não existe.
- **Cursor do terminal no hover:** o bloco do cursor é um `::before`, e o piscar do hover anima só ele. A opacidade do pai (entrada e piscadas da sequência) multiplica, então passar o mouse durante a digitação não mostra o cursor antes da hora em nenhum motor, e a sequência não é tocada.
- **Nada que se repete sozinho:** pulso do selo 3 × 1,2 s; cursor do terminal pisca 4 vezes por hover.
- **Animação de scroll em propriedades longas**, nunca no atalho `animation`: o minificador (Lightning CSS, no build do Tailwind e do Vite) junta `animation: … ; animation-timeline: view()` em `animation: linear both nome view()`, que o Chrome 156 rejeita (`CSS.supports` falso), e a regra inteira cai sem aviso. Com só algumas longas declaradas, ele não monta o atalho.
- **CSS do hero dentro de 4 KB:** o Astro embute no HTML a folha de um componente até 4.096 bytes; acima disso ela vira um arquivo à parte, um pedido bloqueante a mais na home. As cores dos botões de janela do terminal foram para utilitários do Tailwind (folha global) para o bloco do hero continuar embutido.

## Alternativas consideradas

- **`<ClientRouter />` do Astro (transição de SPA):** não é suportado com `security.csp` (documentação do Astro), põe JS em toda página e obrigaria a reiniciar scripts e a paleta a cada navegação. A transição nativa entre documentos faz o crossfade sem JS.
- **Biblioteca de animação (GSAP, Motion, AOS, Lenis):** dezenas de KB para o que o CSS já faz; o orçamento da home tem ~6 KB livres. Motion só faria sentido dentro de ilha React, e a home não ganha ilha nova.
- **Fade-in de seções ao rolar (IntersectionObserver ou `view()` a partir de `opacity: 0`):** proibido pelo `estilo.md` (conteúdo escondido esperando scroll ou JS), o axe do Lighthouse roda sem rolar e pode medir contraste num quadro intermediário, e é o efeito genérico que não diz nada deste site. Rejeitado pelo Gustavo.
- **Lanterna na grade do hero e brilho no anel de foco:** fora por decisão do Gustavo (a lanterna repintaria uma camada do tamanho do hero a cada quadro e obrigaria a medir de novo o contraste do hero).
- **Luz por `background-position` / gradiente na posição do cursor (sem transform):** mais simples, mas repinta o cartão inteiro a cada quadro. Ficou só na borda acesa, que pela máscara também repinta a área do cartão; o círculo de fundo anda por composição.
- **`will-change` permanente no círculo de luz:** uma camada a mais por cartão desde a primeira pintura, inclusive no celular, onde a luz nem liga. Só no hover.
- **Medir o cartão no `pointerenter` em vez de a cada quadro:** erra a posição se a página rolar com o mouse parado em cima; ler `getBoundingClientRect` no início do quadro, com o layout limpo, é barato.
- **Reaproveitar `--level-*` nos botões de janela:** são os mesmos tons no escuro, mas o significado é outro e eles escurecem no tema claro. Tokens próprios (`--window-*`).
- **Subir `assetsInlineLimit` para manter o CSS do hero embutido:** a mesma opção decide se imagens pequenas viram `data:`, que a CSP (`default-src 'self'`) bloqueia.

## Consequências

- Firefox estável não tem scroll-driven nem view transition entre documentos: lá não há linha que acende, aurora que recua, barra de leitura nem crossfade. O desenho estático é o de antes, completo.
- Custo antes da primeira pintura na home: o CSS global cresceu ~0,9 KB gzip (6,8 → 7,6 KB) e o HTML ~1,4 KB gzip (9,8 → 11,2 KB: estilos do cartão e o script da luz, que é módulo e só age no primeiro `pointermove`). JS da home: 73,7 → 74,2 KB (`npm run budget`). Nenhum pedido novo.
- Medição (2026-10-31, `chrome-headless-shell`, máquina com carga de fundo): `npm run lhci` passou em todas as asserções, medianas home 1,199 s, `/projetos/lumina` 0,937 s, `/sobre` 1,283 s, `/contato` 0,977 s; pior execução da home 1,485 s. Como a carga variava, a comparação justa foi intercalada (só a home, uma execução de cada build por vez, 6 de cada): `main` mediana 1,451 s (máximo 1,599 s), esta branch 1,448 s (máximo 1,454 s). Diferença dentro do ruído do Lantern; a folga da home continua pequena (ADR 0003).
- Efeito novo de movimento precisa do próprio desligamento: o reset global não basta. O e2e `tests/e2e/motion.spec.ts` confere, com movimento reduzido, que `document.getAnimations()` fica vazio em home, Sobre, `/projetos` e estudo de caso.
- Componente com CSS próprio na home: cuidar do limite de 4 KB por folha embutida (ver o tamanho do `<style>` no `dist`).
- O cabeçalho tem `view-transition-name: site-header`. Só um elemento visível por página pode ter esse nome; a 404, que tem dois cabeçalhos, esconde um com `hidden` (não é capturado).
- Se o Lightning CSS passar a emitir o atalho certo (com `animation-timeline` só como reset), as propriedades longas continuam válidas; nada a mudar.

## Referências

- Chrome, scroll-driven animations: https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- MDN, `animation-timeline` e `animation-range`: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline
- Chrome, view transitions entre documentos: https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
- Astro, `security.csp` (`<ClientRouter />` não suportado): https://docs.astro.build/en/reference/configuration-reference/#securitycsp
- MDN, CSP `style-src` (propriedades do `element.style` não são bloqueadas; `setAttribute("style")` e `cssText`, sim): https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src
- WCAG 2.2, 2.2.2 Pause, Stop, Hide: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- WCAG 2.2, 2.3.3 Animation from Interactions: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- web.dev, High-performance CSS animations: https://web.dev/articles/animations-guide
- MDN, `@media (pointer)` e `(hover)`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer
- Astro, `build.inlineStylesheets` (limite de 4 kB de `assetsInlineLimit`): https://docs.astro.build/en/reference/configuration-reference/#buildinlinestylesheets
