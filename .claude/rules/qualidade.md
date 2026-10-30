---
paths:
  - "src/**/*"
  - "tests/**/*"
  - "lighthouserc.*"
  - "playwright.config.*"
  - "vitest.config.*"
---

# Regras de qualidade

Nenhuma tarefa está pronta sem rodar e ver passar: `npm run check`, `npm run lint`, `npm run test`, `npm run build`. Mudança visível ao usuário também roda `npm run test:e2e`. "Deve funcionar" não conta; mostre a saída.

## Testes
- **Unit (Vitest):** toda função de `src/lib/` com TDD: teste falhando primeiro, depois o código.
- **E2E (Playwright):** fluxos principais nos dois idiomas: home, lista e estudo de caso, ⌘K, troca de tema e idioma, formulário (SMTP falso), 404.
- **Acessibilidade:** `@axe-core/playwright` em todas as páginas; zero violações `serious`/`critical`.
- Teste novo para todo bug corrigido (reproduz primeiro, depois corrige).
- Sem `test.skip`/`only` no commit.

## Orçamento de performance (falha o CI se estourar)
| Métrica | Limite |
|---|---|
| Lighthouse mobile: Performance | ≥ 95 |
| Lighthouse: Acessibilidade / SEO | 100 |
| Lighthouse: Boas práticas | ≥ 95 |
| JS total na home (gzip) | ≤ 80 KB |
| LCP (4G simulado) | < 1,5 s |
| CLS | < 0,05 |

- Imagem acima da dobra com `loading="eager"` e `fetchpriority="high"`; o resto lazy.
- Sem WebGL na aurora (CSS); sem fonte de CDN externa.

## Acessibilidade (WCAG 2.2 AA)
- HTML semântico (landmarks, um `h1` por página, hierarquia de títulos sem pular nível).
- Tudo operável por teclado, na ordem visual; "Pular para o conteúdo" no topo.
- Contraste AA nos **dois** temas (texto 4.5:1, componentes 3:1).
- Terminal animado com `aria-hidden="true"`; o conteúdo real está no HTML ao lado.
- Alvo de toque ≥ 24×24 px; `lang` correto por página; formulário com `label` e erro ligado ao campo (`aria-describedby`).

## SEO e compartilhamento
- `<title>` e `description` próprios por página e idioma; URL canônica; `hreflang` PT/EN/x-default.
- `sitemap.xml` (`@astrojs/sitemap`) e `robots.txt`.
- JSON-LD `Person` na home/sobre e `CreativeWork` nos estudos de caso.
- Imagem Open Graph gerada por página; conferir a prévia do link antes de publicar.

## Revisão
- Antes de abrir PR: `code-review` e `simplify`. Formulário, cabeçalhos e deploy também passam por `security-review`.
- Feedback de revisão se verifica antes de aplicar (`superpowers:receiving-code-review`).
