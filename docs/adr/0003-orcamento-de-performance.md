# 0003. Orçamento de performance: como medir e o que mudou para cumprir

- **Data:** 2026-10-30
- **Status:** aceita (com o LCP de `/`, `/sobre` e `/contato` em aberto, ver Consequências)

## Contexto

`.claude/rules/qualidade.md` fixa o orçamento que falha o CI: Lighthouse mobile com Performance ≥ 95, Acessibilidade e SEO 100, Boas práticas ≥ 95, LCP < 1,5 s, CLS < 0,05 e no máximo 80 KB de JS (gzip) na home. A primeira medição (Lighthouse CI contra `npm run preview`) deu Performance 71–80 e Boas práticas 82. A investigação achou três problemas de medição e três de verdade.

Medição:

1. **Antivírus na máquina local.** O Kaspersky injeta um script de 150 KB (`gc.kis.v2.scr.kaspersky-labs.com`, por HTTP) em toda página aberta pelo `chrome.exe`. Ele bloqueia a renderização e derruba "HTTPS" em Boas práticas. O `chrome-headless-shell` do Playwright não é interceptado (por isso o e2e de CSP passava limpo).
2. **Sem compressão no preview.** O servidor do `@astrojs/node` não comprime; em produção o Caddy comprime (`encode`). Medido sem compressão, o `client.js` do React pesava 209 KB em vez de 65 KB.
3. **Como o Lighthouse simula.** O LCP "4G simulado" (Lantern: 150 ms de RTT, 1,6 Mbit/s, CPU 4×) conta como bloqueante tudo de prioridade "VeryHigh" que terminou antes da primeira pintura observada, inclusive as fontes, mesmo com `font-display: swap`. Em `localhost` tudo termina antes da pintura, então os bytes de fonte entram inteiros na conta.

De verdade:

4. O botão de tema era uma ilha React `client:load`: toda página baixava o runtime do React (~65 KB gzip) junto com o CSS, as fontes e a imagem do LCP.
5. A paleta ⌘K (`client:idle`) começava a baixar o React antes da primeira pintura, porque o navegador fica ocioso cedo.
6. A troca da fonte (Inter chegando depois do fallback) empurrava o texto do Sobre: CLS 0,06.

## Decisão

- **Lighthouse CI sobre `dist/client` com o servidor estático do próprio LHCI** (`staticDistDir`), que comprime como o Caddy. URLs com barra final (`/sobre/`), porque esse servidor redireciona `/sobre` para `/sobre/`. Na máquina do Gustavo, rodar com `CHROME_PATH` apontando para o `chrome-headless-shell` do Playwright (README). No CI (Ubuntu) usa o Chrome do runner.
- **Botão de tema sem React** (`src/components/ThemeToggle.astro` + `<script>` com `toggleTheme`). Ele não tem estado: o tema vive no `data-theme` do `<html>`.
- **Diretiva `client:afterload`** (`src/directives/afterLoad.ts`, registrada no `astro.config.mjs`): hidrata depois do evento `load`, quando o navegador fica ocioso. Usada só pela paleta, que abre por atalho ou clique.
- **Fallback com métricas da Inter** (`Inter Fallback`: Arial/Liberation Sans com `size-adjust`, `ascent-override` e `descent-override`), em `global.css`. CLS do Sobre: 0,06 → 0.
- **Orçamento de JS (`npm run budget`)** soma o gzip de tudo que a home carrega sem interação: scripts inline, `<script src>`, `modulepreload`, ilhas e renderers do Astro e os imports estáticos de cada chunk. `import()` dinâmico (o corpo da paleta) fica de fora.

## Alternativas consideradas

- **Continuar medindo no `npm run preview`:** mede um site sem compressão, que não é o de produção.
- **CSS inteiro inline (`build.inlineStylesheets: "always"`):** testado. Tira uma ida e volta, mas o HTML da home passa de 14 KB comprimido (a primeira janela do TCP) e o LCP da home piorou de 1,66 s para 1,81 s. Revertido.
- **Trocar a JetBrains Mono pela fonte mono do sistema:** com a mono fora, o FCP da home cai de 1,5 s para 1,2–1,3 s, mas muda a identidade visual (decisão do Gustavo, `estilo.md`).
- **JetBrains Mono 400 do arquivo estático (21 KB) e o variável só para pesos maiores:** testado. Home: FCP 1,5 → 1,4 s, LCP igual (1,66 s); `/projetos/lumina` (que usa mono 500/600) piorou de 1,58 para 1,73 s, por baixar os dois arquivos. Revertido.
- **Preload das duas fontes:** testado. Nenhum ganho de LCP no Lantern (a conta é limitada por banda, não pela cadeia CSS → fonte) e a home piorou para 1,74 s. Revertido.
- **Subconjunto próprio das fontes (`pyftsubset`):** reduziria a Inter de 48 KB; exige ferramenta nova e arquivos de fonte gerados no repositório. Fica como opção.
- **Afrouxar o LCP no `lighthouserc.json`:** não sem o Gustavo decidir; a regra é dele.

## Consequências

- Resultado (mediana de 3 execuções, `chrome-headless-shell`, 2026-10-30): Performance 99–100, Acessibilidade 100, Boas práticas 100, SEO 100, CLS 0 e TBT 0 nas quatro páginas. LCP: `/projetos/lumina` 1,21 s (passa); `/sobre` 1,508 s e `/contato` 1,511 s (no limite, 8–11 ms acima); **a home 1,66 s**. O que sobra é banda: antes da pintura cada página baixa o HTML, o CSS e as duas fontes (~89 KB só de fonte), e a home ainda a capa do Lumina. Só a Inter responde por ~0,3 s da estimativa na home (medido sem ela: LCP 1,4 s; sem a mono: 1,4–1,6 s).
- **Pendente no Caddy de borda: `encode zstd gzip`.** O LHCI mede `dist/client` com compressão (o servidor estático dele usa `compression()`), mas o contêiner Node serve os arquivos sem comprimir. Se o Caddy não comprimir, o JS da home chega com ~209 KB (e não ~65 KB do `client.js`) e nenhum número deste ADR vale em produção. Listado no README e no ADR 0002.
- **O gate de LCP pode oscilar no runner Ubuntu.** `/sobre` (1,508 s) e `/contato` (1,511 s) estão 8–11 ms acima do limite, dentro do ruído do Lantern; num runner diferente do `chrome-headless-shell` local eles podem passar ou falhar de uma execução para outra. A home (1,66 s) falha com folga.
- **Fallback de fonte só onde há Arial.** O `Inter Fallback` usa `local("Arial")`, `local("ArialMT")` e `local("Liberation Sans")`. No Android essas fontes costumam não existir, então lá o fallback com métricas ajustadas não entra e a troca da Inter pode mover o layout (CLS) como antes. Medido só em Windows e no runner Linux; não medido em Android.
- Enquanto o Gustavo não decidir (subconjunto de fontes, mono do sistema ou outro limite para o LCP simulado), `npm run lhci` falha no LCP de `/`, `/sobre` e `/contato`, e o CI também.
- O React só chega depois do `load`: o atalho de teclado é ouvido pela própria ilha, então antes disso não faz nada. O clique no botão do cabeçalho não se perde: o `Header` marca o pedido em `data-palette-requested` no `<html>` e a ilha, ao montar, abre a paleta e apaga a marca.
- Fonte nova ou arquivo de fonte maior pesa direto no LCP: medir com `npm run lhci` antes.
- Se o Lighthouse mudar como trata fontes no Lantern, ou se o Astro passar a emitir a `<meta>` da CSP no início do `<head>`, reavaliar.

## Referências

- Lighthouse, throttling e Lantern: https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md
- Lantern, FCP e LCP (código): `node_modules/@paulirish/trace_engine/models/trace/lantern/metrics/`
- Lighthouse CI, `staticDistDir`: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md#staticdistdir
- web.dev, Optimize LCP: https://web.dev/articles/optimize-lcp
- Chrome, fallback de fonte com métricas ajustadas: https://developer.chrome.com/blog/font-fallbacks
- Astro, `addClientDirective`: https://docs.astro.build/en/reference/integrations-reference/#addclientdirective-option
