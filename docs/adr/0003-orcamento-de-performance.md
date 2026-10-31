# 0003. Orçamento de performance: como medir e o que mudou para cumprir

- **Data:** 2026-10-30
- **Status:** aceita. O LCP das quatro páginas passa desde os subconjuntos de fonte (ver Consequências), com pouca folga na home.

## Contexto

`.claude/rules/qualidade.md` fixa o orçamento que falha o CI: Lighthouse mobile com Performance ≥ 95, Acessibilidade e SEO 100, Boas práticas ≥ 95, LCP < 1,5 s, CLS < 0,05 e no máximo 80 KB de JS (gzip) na home. A primeira medição (Lighthouse CI contra `npm run preview`) deu Performance 71–80 e Boas práticas 82. A investigação achou três problemas de medição e quatro de verdade.

Medição:

1. **Antivírus na máquina local.** O Kaspersky injeta um script de 150 KB (`gc.kis.v2.scr.kaspersky-labs.com`, por HTTP) em toda página aberta pelo `chrome.exe`. Ele bloqueia a renderização e derruba "HTTPS" em Boas práticas. O `chrome-headless-shell` do Playwright não é interceptado (por isso o e2e de CSP passava limpo).
2. **Sem compressão no preview.** O servidor do `@astrojs/node` não comprime; em produção o Caddy comprime (`encode`). Medido sem compressão, o `client.js` do React pesava 209 KB em vez de 65 KB.
3. **Como o Lighthouse simula.** O LCP "4G simulado" (Lantern: 150 ms de RTT, 1,6 Mbit/s, CPU 4×) conta como bloqueante tudo de prioridade "VeryHigh" que terminou antes da primeira pintura observada, inclusive as fontes, mesmo com `font-display: swap`. Em `localhost` tudo termina antes da pintura, então os bytes de fonte entram inteiros na conta.

De verdade:

4. O botão de tema era uma ilha React `client:load`: toda página baixava o runtime do React (~65 KB gzip) junto com o CSS, as fontes e a imagem do LCP.
5. A paleta ⌘K (`client:idle`) começava a baixar o React antes da primeira pintura, porque o navegador fica ocioso cedo.
6. A troca da fonte (Inter chegando depois do fallback) empurrava o texto do Sobre: CLS 0,06.
7. As fontes pesavam ~87 KB (Inter variável 47 KB, JetBrains Mono variável 39 KB: os arquivos latinos do Fontsource, com o eixo `wght` inteiro, 100–900 e 100–800). Com as correções acima, eram o que sobrava do LCP: home 1,66 s, `/sobre` e `/contato` 1,51 s.

## Decisão

- **Lighthouse CI sobre `dist/client` com o servidor estático do próprio LHCI** (`staticDistDir`), que comprime como o Caddy. URLs com barra final (`/sobre/`), porque esse servidor redireciona `/sobre` para `/sobre/`. Na máquina do Gustavo, rodar com `CHROME_PATH` apontando para o `chrome-headless-shell` do Playwright (README). No CI (Ubuntu) usa o Chrome do runner.
- **Botão de tema sem React** (`src/components/ThemeToggle.astro` + `<script>` com `toggleTheme`). Ele não tem estado: o tema vive no `data-theme` do `<html>`.
- **Diretiva `client:afterload`** (`src/directives/afterLoad.ts`, registrada no `astro.config.mjs`): hidrata depois do evento `load`, quando o navegador fica ocioso. Usada só pela paleta, que abre por atalho ou clique.
- **Fallback com métricas da Inter** (`Inter Fallback`: Arial/Liberation Sans com `size-adjust`, `ascent-override` e `descent-override`), em `global.css`. CLS do Sobre: 0,06 → 0.
- **Subconjuntos próprios das duas fontes** (decisão do Gustavo: mesmas famílias, mesma identidade). `scripts/subset-fonts.mjs` (`npm run fonts:subset`) parte do arquivo latino variável do `@fontsource-variable` e corta, com o [`subset-font`](https://github.com/papandreou/subset-font) (HarfBuzz em WebAssembly, sem Python):
  - **caracteres:** Latim Básico, Latim-1 (acentos do português) e Pontuação Geral, mais € ™ −. Sai o resto da faixa latina do Fontsource (Œ, ı, modificadores, setas ↑↓, marcas combinantes);
  - **eixo `wght`:** só 400–600, os pesos que o site usa (`font-normal`, `font-medium`, `font-semibold`; conferido no navegador em todas as páginas e com a paleta aberta). Na instanciação parcial do HarfBuzz, o lado 100–400 sai inteiro do `gvar`;
  - **recursos OpenType:** o gerador pede só os de forma (`ccmp`, `locl`, `calt`, `kern`, `mark`, `mkmk`); o que sobra é o que tem regra para os caracteres mantidos: Inter com `calt`, `locl` e `kern`; JetBrains Mono com `calt`, `ccmp` e `locl` (tabelas `GSUB`/`GPOS` lidas com o HarfBuzz nos `.woff2` gerados). Saem `frac`, `numr`, `dnom`, `tnum` e `pnum`: nenhum CSS pede `font-variant-numeric` nem `font-feature-settings`.

  Resultado: Inter 47,1 → 23,6 KB, JetBrains Mono 39,5 → 26,7 KB (86,6 → 50,3 KB). Métricas verticais (`head`, `hhea`, `OS/2`) idênticas às do original, então o `Inter Fallback` continua certo. Os `.woff2` gerados ficam no Git em `src/assets/fonts/`, com a licença OFL de cada família ao lado (nenhuma das duas declara Reserved Font Name, então o nome da família fica). O build não roda o gerador. A saída é determinística (mesmo SHA-256 em duas execuções).

- **Conferência de glifos (`npm run audit:fonts`, no CI depois do build):** todo caractere do HTML de `dist/client` (texto e atributos, inclusive os props das ilhas e o JSON-LD) e do JS publicado (a paleta monta textos no navegador) precisa estar no `cmap` de cada `.woff2` publicado; senão falha listando `U+XXXX (caractere)`. Lógica pura em `src/lib/fontCoverage.ts` (com teste); o `cmap` sai do HarfBuzz (`harfbuzzjs`). Exceção explícita (`SYSTEM_FALLBACK_CODE_POINTS`): ‑ (U+2011), ←, ⌘, ✓ e ❯, que já não existiam no arquivo do Fontsource e sempre foram desenhados com a fonte do sistema.
- **Orçamento de JS (`npm run budget`)** soma o gzip de tudo que a home carrega sem interação: scripts inline, `<script src>`, `modulepreload`, ilhas e renderers do Astro e os imports estáticos de cada chunk. `import()` dinâmico (o corpo da paleta) fica de fora.

## Alternativas consideradas

- **Continuar medindo no `npm run preview`:** mede um site sem compressão, que não é o de produção.
- **CSS inteiro inline (`build.inlineStylesheets: "always"`):** testado. Tira uma ida e volta, mas o HTML da home passa de 14 KB comprimido (a primeira janela do TCP) e o LCP da home piorou de 1,66 s para 1,81 s. Revertido.
- **Trocar a JetBrains Mono pela fonte mono do sistema:** com a mono fora, o FCP da home cai de 1,5 s para 1,2–1,3 s, mas muda a identidade visual (decisão do Gustavo, `estilo.md`).
- **JetBrains Mono 400 do arquivo estático (21 KB) e o variável só para pesos maiores:** testado. Home: FCP 1,5 → 1,4 s, LCP igual (1,66 s); `/projetos/lumina` (que usa mono 500/600) piorou de 1,58 para 1,73 s, por baixar os dois arquivos. Revertido.
- **Preload das duas fontes:** testado. Nenhum ganho de LCP no Lantern (a conta é limitada por banda, não pela cadeia CSS → fonte) e a home piorou para 1,74 s. Revertido.
- **Subconjunto com `pyftsubset` (fonttools, Python):** faz o mesmo, mas exige Python na máquina de quem mexe nas fontes. O `subset-font` roda no Node que o projeto já usa, com versão exata no `package.json`, sobre a mesma biblioteca (HarfBuzz) que o Chrome usa para montar o texto.
- **Gerar os subconjuntos a cada build:** deixaria o build dependente do WebAssembly do HarfBuzz para algo que muda raramente. Gerar à mão e versionar o resultado é mais simples; a conferência de glifos pega o caractere novo que ficou sem glifo.
- **Subconjunto só com os ~120 caracteres usados hoje:** economizaria mais 1,2 KB, mas qualquer texto novo com outro acento ou pontuação obrigaria a gerar de novo. Latim-1 e Pontuação Geral inteiros são a margem.
- **Eixo `wght` até 700 (margem para `<strong>` fora do `prose`):** +0,9 KB nas duas fontes, para um peso que nada usa hoje. Peso novo exige gerar de novo (Consequências).
- **Tirar `calt` da JetBrains Mono:** mudaria as ligaduras do texto mono (identidade visual). Fora.
- **Afrouxar o LCP no `lighthouserc.json`:** não sem o Gustavo decidir; a regra é dele.

## Consequências

- Resultado (`npm run lhci`, mediana de 3 execuções por página, `chrome-headless-shell`, 2026-10-30; antes e depois medidos em seguida, com a máquina parada):

  | Página             | LCP antes (fontes do Fontsource) | LCP depois (subconjuntos) |
  | ------------------ | -------------------------------- | ------------------------- |
  | `/`                | 1,668 s (falha)                  | 1,438 s                   |
  | `/projetos/lumina` | 1,358 s                          | 1,062 s                   |
  | `/sobre`           | 1,511 s (falha)                  | 1,361 s                   |
  | `/contato`         | 1,363 s                          | 1,064 s                   |

  Performance 99–100, Acessibilidade, Boas práticas e SEO 100 e CLS 0 nas quatro páginas, antes e depois. Antes de pintar, cada página ainda baixa o HTML, o CSS e as duas fontes (agora ~51 KB), e a home ainda a capa do Lumina.

- **O LCP simulado oscila entre execuções, e a folga da home é pequena.** O Lantern só conta as fontes quando o download delas termina antes da primeira pintura observada no navegador real, e isso varia de uma execução para outra. Quando conta, a home fica em ~1,44 s (60 ms de folga) e `/sobre`, `/contato` e `/projetos/lumina` em ~1,36 s; quando não conta, ~0,9–1,1 s. Com a máquina ocupada (TBT de 100 ms ou mais) apareceram execuções isoladas de 1,49 s e 1,62 s na home e de 1,49 s no `/sobre`, mas a mediana de 3 passou nas quatro rodadas medidas. Atualização (2026-10-31): com a área de infraestrutura inteira e a legenda de nível na home, a mediana foi 1,46 s (folga de ~35 ms); `/sobre` 1,21 s com o sprite de ícones de 7 KB. No runner Ubuntu do CI a home pode falhar de vez em quando; se isso virar rotina, a próxima alavanca é a capa do Lumina na home (16 KB), não as fontes.
- **Pendente no Caddy de borda: `encode zstd gzip`.** O LHCI mede `dist/client` com compressão (o servidor estático dele usa `compression()`), mas o contêiner Node serve os arquivos sem comprimir. Se o Caddy não comprimir, o JS da home chega com ~209 KB (e não ~65 KB do `client.js`) e nenhum número deste ADR vale em produção. Listado no README e no ADR 0002.
- **Fallback de fonte só onde há Arial.** O `Inter Fallback` usa `local("Arial")`, `local("ArialMT")` e `local("Liberation Sans")`. No Android essas fontes costumam não existir, então lá o fallback com métricas ajustadas não entra e a troca da Inter pode mover o layout (CLS) como antes. Medido só em Windows e no runner Linux; não medido em Android.
- **Gerar os subconjuntos de novo** (`npm run fonts:subset`, depois `npm run build` e `npm run audit:fonts`) quando:
  - aparecer no conteúdo um caractere fora de Latim-1 e Pontuação Geral (o `audit:fonts` falha e diz qual): acrescentar a faixa em `TEXT` no `scripts/subset-fonts.mjs`. Se o caractere não existir no arquivo latino do Fontsource, trocar a origem pelo arquivo `latin-ext` ou aceitar a fonte do sistema e pô-lo em `SYSTEM_FALLBACK_CODE_POINTS`;
  - entrar no CSS um peso fora de 400–600 (`font-bold`, ou `<strong>` fora do `prose`, que o Tailwind deixa em `bolder` = 700): ampliar `WEIGHT` no script e o `font-weight` dos dois `@font-face` em `global.css`. Sem isso o navegador desenha com o 600;
  - o CSS passar a usar `font-variant-numeric` ou outro recurso OpenType: acrescentar a tag em `SHAPING`;
  - o `@fontsource-variable` mudar de versão.

  Depois, medir com `npm run lhci`.

- **Diferença visual:** comparadas pixel a pixel no build de produção (`/`, `/en/`, `/sobre`, `/projetos/lumina`; claro e escuro; 360 e 1280 px), as páginas têm a mesma altura e o mesmo texto; mudam 0,01–0,1% dos pixels, só na suavização de borda dos glifos em peso 500 e 600 (arredondamento da instanciação parcial do eixo). Nenhum glifo faltando.
- O hífen sem quebra (U+2011, "full‑stack") já não existia na Inter do Fontsource e continua vindo da fonte do sistema (por isso o `Inter Fallback` aparece carregado na home). Não mudou com os subconjuntos.
- O React só chega depois do `load`: o atalho de teclado é ouvido pela própria ilha, então antes disso não faz nada. O clique no botão do cabeçalho não se perde: o `Header` marca o pedido em `data-palette-requested` no `<html>` e a ilha, ao montar, abre a paleta e apaga a marca.
- Fonte nova ou arquivo de fonte maior pesa direto no LCP: medir com `npm run lhci` antes. As fontes da imagem Open Graph (`src/lib/og.ts`, `@fontsource` estático lido pelo satori no build) não mudaram e não vão para o navegador.
- Se o Lighthouse mudar como trata fontes no Lantern, ou se o Astro passar a emitir a `<meta>` da CSP no início do `<head>`, reavaliar.

## Referências

- Lighthouse, throttling e Lantern: https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md
- Lantern, FCP e LCP (código): `node_modules/@paulirish/trace_engine/models/trace/lantern/metrics/`
- Lighthouse CI, `staticDistDir`: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md#staticdistdir
- web.dev, Optimize LCP: https://web.dev/articles/optimize-lcp
- Chrome, fallback de fonte com métricas ajustadas: https://developer.chrome.com/blog/font-fallbacks
- HarfBuzz, subconjunto e instanciação de fontes variáveis: https://harfbuzz.github.io/harfbuzz-hb-subset.html
- `subset-font`: https://github.com/papandreou/subset-font
- web.dev, Reduce web font size: https://web.dev/articles/reduce-webfont-size
- SIL Open Font License 1.1 (Reserved Font Name): https://openfontlicense.org/open-font-license-official-text/
- Astro, `addClientDirective`: https://docs.astro.build/en/reference/integrations-reference/#addclientdirective-option
