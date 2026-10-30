# 0001. Astro com ilhas React

- Status: aceito
- Data: 2026-10-30

## Contexto

Portfólio bilíngue, quase todo conteúdo estático, com orçamento de JS de 80 KB (gzip) na home e meta de Lighthouse acima de 95. Só poucas partes precisam de interação no navegador: terminal do hero, paleta de comandos, formulário e seletores de tema e idioma.

## Decisão

Astro com saída estática e ilhas React hidratadas sob demanda (`client:visible` > `client:idle` > `client:load`). Uma única rota de servidor (`/api/contato`), atendida pelo adapter Node.

## Alternativas

- **Next.js:** runtime React em toda página e pacote de JS maior que o orçamento; recursos de servidor que o site não usa.
- **Nuxt:** equivalente em Vue; o Gustavo trabalha com React, e as ilhas reaproveitam esse conhecimento.
- **SPA (Vite + React):** tudo hidratado no cliente, pior LCP e SEO, conteúdo dependente de JS.

## Consequências

- JS enviado só onde há interação; o restante é HTML.
- Duas formas de componente (`.astro` e `.tsx`) com regra clara de quando usar cada uma (`.claude/rules/codigo.md`).
- Ilhas não compartilham estado por padrão; se precisarem, `nanostores`.
