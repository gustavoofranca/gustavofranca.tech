# Portfólio — gustavofranca.tech

Portfólio de desenvolvedor do Gustavo Henrique França: home com hero em terminal, projetos com estudos de caso, página sobre, contato com formulário e paleta de comandos (⌘K). Bilíngue: PT na raiz, EN em `/en`.

## Stack

- **Astro 7** com saída estática: toda página é pré-renderizada. A única rota de servidor é `/api/contato`, atendida pelo `@astrojs/node` (standalone). [ADR 0001](docs/adr/0001-astro-com-ilhas-react.md)
- **React 19** só nas ilhas com estado (paleta, formulário, filtro de projetos), hidratadas o mais tarde possível.
- **Tailwind 4** com tokens em `src/styles/tokens.css` (dois temas). Identidade visual em [`DESIGN.md`](DESIGN.md).
- Conteúdo em coleções do Astro (MDX e JSON) com schema Zod em `src/content.config.ts`.
- E-mail por SMTP (nodemailer), anti-spam com Cloudflare Turnstile, honeypot, tempo mínimo e limite por IP.
- Testes: Vitest (unidade), Playwright + axe (e2e e acessibilidade), Lighthouse CI (orçamento).

## Como rodar

Requer Node 24+.

```powershell
npm ci
cp .env.example .env   # valores falsos; não comite o .env
npm run dev            # http://localhost:4321
```

O build exige `PUBLIC_TURNSTILE_SITEKEY` (a chave de teste do Cloudflare, `1x00000000000000000000AA`, serve para desenvolvimento). Os segredos (`SMTP_*`, `TURNSTILE_SECRET`) só são lidos na primeira requisição a `/api/contato`.

O pre-commit (lefthook) exige o [gitleaks](https://github.com/gitleaks/gitleaks) instalado. Ative com `npx lefthook install`.

## Comandos

| Comando                | O que faz                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento em `http://localhost:4321`                                          |
| `npm run build`        | Gera `dist/` (antes, lista os `TODO(gustavo)`; com `CONTENT_STRICT=true` falha se sobrar algum) |
| `npm run preview`      | Serve o build (servidor Node do adapter)                                                        |
| `npm run check`        | `astro check` + `tsc`                                                                           |
| `npm run lint`         | ESLint + `prettier --check`                                                                     |
| `npm run test`         | Vitest                                                                                          |
| `npm run test:e2e`     | Playwright contra o build de produção (inclui a varredura de acessibilidade)                    |
| `npm run audit:dist`   | Confere a CSP de cada HTML de `dist/client` (depois do build)                                   |
| `npm run audit:fonts`  | Confere se as fontes publicadas têm glifo para todo caractere do build (depois do build)        |
| `npm run fonts:subset` | Gera de novo os subconjuntos das fontes em `src/assets/fonts/` (só ao mudar caractere ou peso)  |
| `npm run budget`       | JS da home, gzip, limite de 80 KB (depois do build)                                             |
| `npm run lhci`         | Lighthouse CI em quatro páginas, com o orçamento (depois do build)                              |
| `npm run audit:deps`   | `npm audit` em duas camadas (ver Segurança)                                                     |

Verificação completa antes de commitar: `check`, `lint`, `test`, `build`, `audit:dist`, `audit:fonts`, `budget`, `test:e2e`, `lhci`. O CI (`.github/workflows/ci.yml`) roda a mesma sequência e o `audit:deps`.

## Como adicionar um projeto

1. Escolha o slug (vira a URL: `/projetos/<slug>` e `/en/projects/<slug>`).
2. Coloque os prints em `src/assets/projects/<slug>/`: `cover.png` (16:10, aparece no cartão e no topo do estudo de caso) e o que mais o estudo usar (diagrama em SVG, print de celular).
3. Crie `src/content/projects/<slug>.pt.mdx` copiando o frontmatter de um projeto existente (`lumina.pt.mdx`). Campos validados em `src/content.config.ts`:
   - `title`, `summary` (até 160 caracteres), `locale: pt`;
   - `kind` (`web`, `api`, `mobile`), `role` (`solo` ou `team`) e `roleNote` opcional;
   - `period.start`/`period.end` no formato `AAAA-MM`;
   - `stack`: ids que existem em `src/content/stack.json` (id desconhecido derruba o build);
   - `status` (`live` mostra o selo "no ar", `offline`, `archived`);
   - `featured` (no máximo 3 por idioma aparecem na home) e `order` (posição na lista);
   - `links.demo` e `links.repo` (lista), ambos opcionais e validados como URL;
   - `cover` (caminho relativo para o print) e `coverAlt` (descreve o que aparece na imagem).
4. Escreva o corpo na ordem fixa de `.claude/rules/conteudo.md`: contexto, meu papel, arquitetura (com o porquê), desafios, resultado, o que faria diferente. Nada sobre o Gustavo é inventado: o que faltar vira `TODO(gustavo): <o que falta>`.
5. Crie `<slug>.en.mdx` com o mesmo frontmatter (`locale: en`) e o texto traduzido. O build exige o par PT/EN.
6. Se o projeto usa tecnologia nova, acrescente o item na área certa de `src/content/stack.json`.
7. Rode `npm run build`, `npm run test:e2e` e `npm run lhci`. A varredura de acessibilidade (`tests/e2e/a11y-and-layout.spec.ts`) já inclui a página nova: a lista de rotas sai dos arquivos de projeto. A imagem Open Graph é gerada no build.

## Qualidade e orçamentos

Regras em [`.claude/rules/qualidade.md`](.claude/rules/qualidade.md); decisões e medições em [ADR 0003](docs/adr/0003-orcamento-de-performance.md).

- **Acessibilidade:** `tests/e2e/a11y-and-layout.spec.ts` percorre todas as rotas PT e EN (e as duas 404) nos temas escuro e claro: axe sem violação séria ou crítica, exatamente um `h1` e nada de rolagem horizontal em 360 px.
- **JS da home:** `npm run budget` soma o que a home carrega sem interação (scripts inline, módulos, ilhas e seus imports estáticos); `import()` dinâmico, como o corpo da paleta, fica de fora.
- **Fontes:** Inter e JetBrains Mono saem de subconjuntos próprios em `src/assets/fonts/` (latim, pesos 400–600, só os recursos OpenType de forma), gerados por `npm run fonts:subset` a partir do `@fontsource-variable` e versionados com a licença OFL ao lado. Peso fora de 400–600 ou caractere novo fora do Latim-1 e da Pontuação Geral: ampliar `scripts/subset-fonts.mjs`, gerar de novo e ajustar o `font-weight` do `@font-face` em `global.css`. O `npm run audit:fonts` falha listando o caractere sem glifo. [ADR 0003](docs/adr/0003-orcamento-de-performance.md)
- **Lighthouse:** `lighthouserc.json` mede `/`, `/projetos/lumina`, `/sobre` e `/contato` no perfil mobile padrão (4G simulado), mediana de 3 execuções, sobre `dist/client` servido com compressão (como o Caddy faz em produção).
- **Lighthouse no Windows com antivírus:** o Kaspersky injeta um script em toda página aberta pelo `chrome.exe` e estraga a medição. Use o `chrome-headless-shell` do Playwright:

  ```powershell
  $env:CHROME_PATH = (Get-ChildItem "$env:LOCALAPPDATA\ms-playwright\chromium_headless_shell-*\chrome-headless-shell-win64\chrome-headless-shell.exe").FullName
  npm run lhci
  ```

## Segurança: CSP e cabeçalhos

- Cada página estática leva a CSP numa `<meta>` gerada pelo Astro no build (`security.csp` em `astro.config.mjs`), sem `'unsafe-inline'`. [ADR 0002](docs/adr/0002-csp.md)
- **Script ou estilo inline novo:** vai num arquivo de `src/scripts/inline/` (JS) ou `src/styles/inline/` (CSS) e entra no componente com `set:html` do import `?raw`. O `astro.config.mjs` calcula o hash desses arquivos. Escrever `<script is:inline>` ou `style=""` direto no template quebra a CSP. `<script>` comum de componente (empacotado pelo Astro) não precisa de nada.
- **Conferência:** `npm run audit:dist` (CI, depois do build) lê todo HTML de `dist/client` e falha se houver script ou estilo inline sem hash na `<meta>`, atributo `style=""` ou `on*=""`, script de origem fora do `script-src`, ou qualquer script, estilo ou folha de estilo antes da `<meta>`. O e2e `tests/e2e/security.spec.ts` confere no navegador que nenhuma rota gera violação.
- `/api/contato` recebe os próprios cabeçalhos em `src/middleware.ts`.
- **Origem:** em produção o Caddy encaminha `X-Forwarded-Proto/Host`, e `security.allowedDomains` faz o Astro confiar neles só para `gustavofranca.tech`; a origem vira `https://gustavofranca.tech`. No `npm run preview` (e no e2e) o host é `localhost:4321`, os cabeçalhos encaminhados são ignorados e a origem é `http://localhost:4321`.
- **Dependências (`npm run audit:deps`):** as de produção (o que vai para a imagem) não podem ter nenhum alerta alto ou crítico, sem exceção. Nas de desenvolvimento, alerta alto só passa se estiver em `audit-allowlist.json`, com motivo e data de revisão; vencida a data, o CI volta a falhar. Hoje as quatro exceções são da cadeia do `@lhci/cli` (`extract-zip`, `basic-ftp`, `zod` 3 do `chromium-bidi`), sem versão corrigida compatível. O `tmp` vulnerável da mesma cadeia foi corrigido com `overrides` (0.2.7).

## Docker

A imagem roda `node ./dist/server/entry.mjs` na porta 4321 e serve também os estáticos (o Caddy pode servir `dist/client` direto, se preferir).

```powershell
docker build --build-arg PUBLIC_TURNSTILE_SITEKEY=<chave> -t portfolio .
docker run --init -p 4321:4321 --env-file .env portfolio
```

- Multi-stage, Node 24 Alpine fixado por digest, usuário `node` (não root), `HEALTHCHECK` em `/`.
- `NODE_ENV=production` vem da imagem e é obrigatório: com ele, `MAIL_TRANSPORT=json` é recusado (as mensagens seriam descartadas em silêncio).
- Segredos só em tempo de execução (`--env-file` ou `env_file` no compose), nunca como `--build-arg`. O `.dockerignore` só deixa entrar o necessário para o build.
- O build usa `CONTENT_STRICT=true` e **falha enquanto houver `TODO(gustavo)`** no conteúdo; isso é o esperado. Para testar localmente: `--build-arg CONTENT_STRICT=false`.
- `--init` (ou `init: true` no compose): o Node como PID 1 não trata `SIGTERM` sozinho.
- **Não verificado:** a imagem ainda não foi construída nem executada (sem Docker na máquina de desenvolvimento). Os estágios foram simulados fora do Docker (build estrito falha, build com `CONTENT_STRICT=false` passa, servidor só com as dependências de produção responde as páginas e recusa `MAIL_TRANSPORT=json`).

## Regras do projeto

- [`CLAUDE.md`](CLAUDE.md): visão geral e regras inegociáveis.
- [`.claude/rules/`](.claude/rules/): regras por assunto (código, estilo, conteúdo, qualidade, segurança, git e deploy, boas práticas).
- [`docs/referencias.md`](docs/referencias.md): de onde vem cada regra.

## Decisões (ADRs)

- [0001. Astro com ilhas React](docs/adr/0001-astro-com-ilhas-react.md)
- [0002. CSP nativa do Astro, com hash dos scripts inline gerado no build](docs/adr/0002-csp.md)
- [0003. Orçamento de performance: como medir e o que mudou para cumprir](docs/adr/0003-orcamento-de-performance.md)

## Pendências conhecidas

- **Compressão no Caddy de borda (fase 2):** o Caddy de borda precisa de `encode zstd gzip`. O LHCI mede com compressão (o servidor estático dele comprime) e a imagem Docker serve `dist/client` sem comprimir; sem o `encode`, o JS da home chega com ~209 KB em vez de ~65 KB e o orçamento deixa de valer em produção.
- **Caddy de borda (fase 2):** cabeçalhos que não cabem na `<meta>`: `frame-ancestors 'none'`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (câmera, microfone e geolocalização desligados). E redirecionar `www` para o domínio sem `www`: `allowedDomains` só confia em `gustavofranca.tech`, então um POST do formulário vindo de `www` recebe 403.
- **Deploy:** o contêiner precisa rodar com `NODE_ENV=production` (a imagem já define; não sobrescreva no compose) e com o `.env` de produção no VPS.
- **Checkpoint:** a demo em `checkpoint.gustavofranca.tech` ainda não existe (plano próprio); o projeto aparece como `offline`.
- **`TODO(gustavo)`:** pendências de conteúdo (a lista completa sai de `npm run build` com `CONTENT_STRICT=true`; empresa atual, papel no Conexão, textos em primeira pessoa, CV, LinkedIn, WhatsApp, foto). O build de produção e a imagem Docker falham até elas serem respondidas.
- **LCP no 4G simulado com pouca folga na home:** com os subconjuntos de fonte as quatro páginas passam (medianas: home 1,44 s, `/sobre` 1,36 s, `/contato` e `/projetos/lumina` 1,06–1,36 s; limite 1,5 s), mas o Lantern oscila entre execuções e a home pode falhar de vez em quando no CI. Números e próxima alavanca no [ADR 0003](docs/adr/0003-orcamento-de-performance.md).
