---
paths:
  - ".github/**/*"
  - "deploy/**/*"
  - "Dockerfile"
  - "package.json"
---

# Git, CI e deploy

## Git
- `main` sempre publicável. Trabalho em `feat/...`, `fix/...`, `chore/...`, `docs/...`; PR para `main`.
- Commits convencionais em português: `feat: adiciona paleta de comandos`, `fix: corrige contraste do tema claro`. Um assunto por commit.
- **Sem** `Co-Authored-By: Claude` nem qualquer atribuição ao Claude/Anthropic em commit ou PR.
- Commit só com autorização (vale para o branch de feature corrente depois de dada); push e PR só quando o Gustavo pedir. Não há `gh` nesta máquina: PR sai pelo link `.../compare/main...<branch>?expand=1`.
- Nunca `--force` em `main`, nunca `--no-verify`.

## CI (GitHub Actions)
Em todo PR e push na `main`: install (cache) → `check` → `lint` → `test` → `build` → `test:e2e` (com axe) → Lighthouse CI com o orçamento de `qualidade.md`. Qualquer falha bloqueia o merge.

## Deploy (só depois da fase de infra aprovada)
- `main` verde → build da imagem Docker → GHCR (tag com SHA do commit) → SSH no VPS → `docker compose pull && up -d` só do serviço `portfolio`.
- Rollback: subir a tag anterior. Toda publicação registra qual SHA está no ar.
- Qualquer outra ação no VPS (Caddy de borda, Lumina, Checkpoint, DNS, Postgres) exige confirmação do Gustavo **no momento**, com plano de volta escrito antes.
- VPS é KVM 1 (4 GB): todo serviço com `mem_limit` no compose; conferir `docker stats` depois de cada serviço novo.
