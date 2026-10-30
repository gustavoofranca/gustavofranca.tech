# Portfólio — gustavofranca.tech

Portfólio de desenvolvedor do Gustavo Henrique França. Astro (saída estática) com ilhas React, bilíngue (PT padrão, EN em `/en`), Tailwind 4. Decisão de stack: [ADR 0001](docs/adr/0001-astro-com-ilhas-react.md).

## Como rodar

Requer Node 24+.

```powershell
npm ci
cp .env.example .env   # valores falsos; não comite o .env
npm run dev            # http://localhost:4321
```

Verificação completa antes de commitar: `npm run check`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`.

O pre-commit (lefthook) exige o [gitleaks](https://github.com/gitleaks/gitleaks) instalado. Ative com `npx lefthook install`.

## Segurança: CSP e cabeçalhos

- Cada página estática leva a CSP numa `<meta>` gerada pelo Astro no build (`security.csp` em `astro.config.mjs`), sem `'unsafe-inline'`. Script ou estilo inline novo vai num arquivo de `src/scripts/inline/` ou `src/styles/inline/` e entra com `set:html`; o hash sai desse arquivo. Detalhes e motivos: [ADR 0002](docs/adr/0002-csp.md).
- `/api/contato` recebe os próprios cabeçalhos em `src/middleware.ts`.
- **Origem:** em produção o Caddy encaminha `X-Forwarded-Proto/Host`, e `security.allowedDomains` faz o Astro confiar neles só para `gustavofranca.tech`; a origem vira `https://gustavofranca.tech`. No `npm run preview` (e no e2e) o host é `localhost:4321`, os cabeçalhos encaminhados são ignorados e a origem é `http://localhost:4321`, a mesma que o navegador manda.
- **Pendente na fase 2 (Caddy de borda):** `frame-ancestors 'none'` (não funciona em `<meta>`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (câmera, microfone e geolocalização desligados) e redirecionar `www` para o domínio sem `www`.

## Regras do projeto

- `CLAUDE.md`: visão geral e regras inegociáveis.
- `.claude/rules/`: regras por assunto (código, estilo, conteúdo, qualidade, segurança, git e deploy).
- `docs/adr/`: decisões de arquitetura.
