---
paths:
  - "src/**/*.{astro,tsx,css}"
  - "DESIGN.md"
---

# Regras de estilo e design

A direção visual está decidida: **Variante 1 — minimal escuro + terminal + aurora** (ver §4 do design). Ela não se renegocia em tarefa de implementação; mudança de direção volta para brainstorming.

## Tokens
- Toda cor, fonte, raio, sombra, espaçamento especial e duração de animação vem de `src/styles/tokens.css` (exposto ao Tailwind via `@theme`). **Nenhuma cor literal** (`#...`, `rgb()`) fora desse arquivo.
- Os dois temas (escuro e claro) redefinem os mesmos tokens. Componente nunca testa o tema; ele usa o token.
- Token novo só com motivo, e registrado no `DESIGN.md`.

## Tailwind
- Classes utilitárias no markup; `@apply` só em estilos de conteúdo MDX (`prose`) e em casos raros justificados.
- Ordem de classes pelo `prettier-plugin-tailwindcss`.
- Classes condicionais com `clsx` + `tailwind-merge` (`cn()` em `src/lib/cn.ts`).
- Responsivo mobile-first. Testar em 360 px, 768 px e 1280 px. Nada de rolagem horizontal na página.

## Tipografia
- Inter para texto, JetBrains Mono para detalhes de "dev" (rótulos `// ...`, terminal, atalhos, tags de stack). Mono nunca em parágrafo.
- Fontes auto-hospedadas, com `font-display: swap`: subconjuntos em `src/assets/fonts/` gerados do `@fontsource-variable/*` (`npm run fonts:subset`), só pesos 400–600. Peso ou caractere novo: ampliar `scripts/subset-fonts.mjs` e gerar de novo; `npm run audit:fonts` confere os glifos.
- Escala tipográfica fixa no `DESIGN.md`; títulos com `text-wrap: balance`; texto corrido com no máximo ~70 caracteres por linha.

## Movimento
- Um momento orquestrado por página (o hero), não efeitos espalhados. Aurora se move devagar; o terminal digita uma vez e para.
- Só `transform` e `opacity` em animação (nada que cause layout).
- `prefers-reduced-motion: reduce` → tudo estático, conteúdo completo visível.
- Conteúdo nunca começa com `opacity: 0` esperando JS ou scroll: a primeira pintura já mostra tudo.

## Componentes e padrões visuais
- Cartão (borda + fundo) só para o que é objeto separado (projeto, terminal). Seções não viram cartão.
- Estado de foco visível em tudo que é clicável (`focus-visible`, com o token de anel).
- Ícones: `lucide` para interface, `simple-icons` para marcas de tecnologia. Sem emoji como ícone. Ícone de stack só na stack completa (Sobre/About; na home, não, por causa do LCP, ver `DESIGN.md`) e vem do sprite externo gerado no build (`TechIcon.astro` com `<use>`, `<symbol>` em `currentColor`, nunca traçado no HTML nem `style=""`); prática sem marca usa `lucide:<nome>` de `src/lib/genericIcons.ts`.
- Nível na stack: ponto `bg-level-*` com texto oculto e legenda visível (ver `DESIGN.md`); cor nunca sozinha.
- Imagens via `<Image>`/`<Picture>` do `astro:assets`, com `alt` descritivo, largura/altura definidas e AVIF/WebP.

## Textos de interface
- Primeira pessoa, direto, sem clichê ("Apaixonado por tecnologia", "Hi, I'm 👋").
- Botão diz o que acontece ("Baixar CV", "Enviar mensagem"); erro diz o que houve e como resolver.
- Todo texto visível passa pelo i18n (ver `conteudo.md`). Nenhuma string solta no componente.

## Antes de entregar uma tela
1. Rodar `web-design-guidelines` sobre os arquivos alterados.
2. Ver no navegador (build de produção) nos dois temas e nas três larguras.
3. Conferir contraste e teclado com `chrome-devtools-mcp:a11y-debugging`.
