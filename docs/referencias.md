# Referências das regras de desenvolvimento

De onde vêm as regras em `CLAUDE.md` e `.claude/rules/`. Pesquisa feita em 2026-10-30.

## Claude Code (oficial, Anthropic)
- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices). Daqui vêm as ideias centrais:
  - `CLAUDE.md` curto, só com o que o Claude não descobre lendo o código;
  - registrar "o que você já teve que corrigir duas vezes" (aqui adotamos três, a pedido do Gustavo);
  - regra sem exceção vira hook ou deny rule, não texto;
  - dar ao Claude um comando de verificação (teste, typecheck) e exigir evidência antes de dar como pronto.
- [How Claude remembers your project](https://code.claude.com/docs/en/memory). `.claude/rules/` com `paths:` para carregar regras só nos arquivos certos, meta de menos de 200 linhas por `CLAUDE.md`, revisão periódica de regras conflitantes.
- [Hooks](https://code.claude.com/docs/en/hooks-guide) e [Permissions](https://code.claude.com/docs/en/permissions). A saída 2 de um hook bloqueia a ação. `deny` vale em qualquer modo de permissão.

## Comunidade (relatos de uso; não são oficiais)
- [6 patterns that changed how I use Claude Code](https://dev.to/ayusshjjw/6-patterns-that-changed-how-i-use-claude-code-3569): o "mistake log" no `CLAUDE.md`.
- [Self-improving CLAUDE.md](https://danyuchn.github.io/blog/posts/en/self-improving-claude-md) e [Learnings loop](https://www.mindstudio.ai/blog/how-to-build-learnings-loop-claude-code-skills): aprendizados em arquivo separado, para não inchar o contexto.
- [Claude Code anti-patterns](https://ao92265.github.io/claude-code-playbook/docs/anti-patterns/): o arquivo de lições que ninguém revisa vira lixo, por isso a regra de manutenção.
- [Stop Claude Code from reading your .env](https://dev.to/vildandenai/stop-claude-code-from-reading-your-env-with-three-deny-rules-24bl) e [Claude Code .env security guide](https://timewell.jp/en/columns/claude-code-env-security-guide): deny rules para `.env` e defesa em camadas (deny + hook + varredura de segredos no commit).

## Engenharia de software e segurança
- OWASP [ASVS 4.0](https://owasp.org/www-project-application-security-verification-standard/) e [Cheat Sheet Series](https://cheatsheetseries.owasp.org/) (Input Validation, Content Security Policy, HTTP Headers, Logging).
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (nível AA).
- [web.dev: Core Web Vitals](https://web.dev/articles/vitals).
- [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/).
- [Architecture Decision Records](https://adr.github.io/) (formato de Michael Nygard).
- [Astro docs](https://docs.astro.build/): ilhas, content collections, i18n.
