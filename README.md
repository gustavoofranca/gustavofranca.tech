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

## Regras do projeto

- `CLAUDE.md`: visão geral e regras inegociáveis.
- `.claude/rules/`: regras por assunto (código, estilo, conteúdo, qualidade, segurança, git e deploy).
- `docs/adr/`: decisões de arquitetura.
