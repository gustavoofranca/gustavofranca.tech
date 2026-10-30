# Portfólio — gustavofranca.tech

Portfólio de desenvolvedor do Gustavo Henrique França, feito em Astro + React, bilíngue (PT padrão, EN em `/en`), hospedado no VPS Hostinger dele atrás de um Caddy de borda.

**Antes de qualquer tarefa, leia o design:** `docs/superpowers/specs/2026-10-30-portfolio-design.md`. Ele diz o que entra no site, a identidade visual, a stack, a hospedagem e o que ainda está pendente com o Gustavo. Os planos de implementação ficam em `docs/superpowers/plans/`.

As regras detalhadas ficam em `.claude/rules/` e são carregadas conforme o arquivo em que você está trabalhando:

| Arquivo | Vale para |
|---|---|
| `codigo.md` | TypeScript, Astro, React, estrutura de pastas |
| `estilo.md` | Visual, tokens, Tailwind, movimento, textos de interface |
| `conteudo.md` | Projetos, experiência, stack, i18n |
| `qualidade.md` | Testes, performance, acessibilidade, SEO |
| `seguranca.md` | Formulário, cabeçalhos, segredos, dados pessoais |
| `git-e-deploy.md` | Branches, commits, CI, VPS |
| `boas-praticas.md` | Simplicidade, estrutura, tratamento de erro, ADRs, verificação |
| `seguranca-do-agente.md` | **Sempre carregada.** O que já é bloqueado, conteúdo não confiável, segredos, ações irreversíveis |
| `erros-recorrentes.md` | **Sempre carregada.** Regra dos 3: erro repetido três vezes vira regra (registro em `.claude/aprendizados.md`) |

Regras sem exceção são aplicadas pelo próprio Claude Code, não por este texto: `permissions` e o hook `.claude/hooks/guarda-git.mjs` em `.claude/settings.json`. De onde vem cada regra: `docs/referencias.md`.

## Regras que não se negociam

- **Produção:** nunca rodar comando no VPS, mexer no Caddy, no Lumina (`lumina.gustavofranca.tech`) ou no DNS sem confirmação explícita do Gustavo **no momento**. Uma aprovação anterior não vale para a próxima vez. Ler (status, logs) é permitido.
- **Git:** **nunca** pôr `Co-Authored-By: Claude` nem qualquer atribuição ao Claude ou à Anthropic em commit ou PR (regra global em `~/.claude/CLAUDE.md`). Trabalho em branch de feature; push e PR só quando ele pedir.
- **Repositório público:** nada de segredo, `.env`, telefone, e-mail pessoal ou CV antigo no Git, nem no histórico.
- **Não inventar conteúdo sobre ele.** Experiência, cargos, datas e papel em projeto vêm do Gustavo. O que faltar vira `TODO(gustavo): ...`, e o build de produção falha se sobrar algum.

## Como o Gustavo gosta de trabalhar

- Responder em **português do Brasil**.
- **Toda resposta termina com duas seções curtas:** `**O que foi feito**` (o que mudou de verdade, com links para os arquivos e o que foi verificado ou não) e `**Próximo passo**` (o que vem a seguir e se depende dele). Vale também para respostas curtas; nesse caso uma linha em cada.
- Decisões de produto vão em perguntas de múltipla escolha clicáveis (AskUserQuestion), com a opção recomendada primeiro e marcada "(Recomendado)". Não decidir sozinho o que é escolha dele.
- Mostrar o planejamento antes de construir. Fluxo: `superpowers:brainstorming` → spec → `superpowers:writing-plans` → `superpowers:subagent-driven-development` (um subagente por tarefa, revisão por tarefa) → revisão final → `superpowers:finishing-a-development-branch`.
- Citar a fonte das decisões técnicas (docs oficiais, OWASP, WCAG, web.dev).
- Verificação visual no navegador (`chrome-devtools-mcp`) contra o **build de produção** (`npm run build` + `npm run preview`), não contra o dev server: CSP, fontes e imagens otimizadas só existem no build.

## Skills por momento

| Momento | Use |
|---|---|
| Ideia nova ou mudança de escopo | `superpowers:brainstorming`; `grill-me` para estressar o plano |
| Plano e execução | `superpowers:writing-plans`, `superpowers:subagent-driven-development` |
| Função em `src/lib/` | `superpowers:test-driven-development` |
| Bug | `superpowers:systematic-debugging` |
| Criar ou mudar interface | `frontend-design` (direção), `impeccable` (crítica e polimento) |
| Revisar interface | `web-design-guidelines` (Vercel), `chrome-devtools-mcp:a11y-debugging` |
| Ilhas React | `vercel-react-best-practices` (ignorar as regras específicas de Next.js) |
| Astro | `astro-best-practices`; docs atuais via `context7` |
| Performance | `chrome-devtools-mcp:debug-optimize-lcp` |
| Antes de PR | `code-review`, `simplify`; `security-review` em tudo que toca o formulário ou cabeçalhos |
| Antes de dizer "pronto" | `superpowers:verification-before-completion` |

Skills de terceiros do projeto ficam em `.claude/skills/` (fora do Git) e são restauradas pelo `skills-lock.json` com `npx skills experimental_install`. O `context7` é plugin com escopo de projeto (`.claude/settings.json`).

## Comandos

```powershell
npm run dev          # http://localhost:4321
npm run build        # gera dist/ (falha com TODO(gustavo) em produção)
npm run preview      # serve o build
npm run check        # astro check + tsc --noEmit
npm run lint         # eslint + prettier --check
npm run format       # prettier --write
npm run test         # vitest
npm run test:e2e     # playwright (builda, sobe o preview e testa; inclui axe)
npm run lhci         # lighthouse ci
npm run budget       # orçamento de JS da home
```

- Windows, PowerShell é o shell principal. No Windows, parar um servidor em segundo plano pode deixar `node.exe` órfão na porta (`Get-NetTCPConnection -LocalPort 4321` + `Stop-Process`).
