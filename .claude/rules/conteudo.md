---
paths:
  - "src/content/**/*"
  - "src/content.config.ts"
  - "src/i18n/**/*"
---

# Regras de conteúdo e i18n

## Onde fica cada coisa
- **Projetos:** `src/content/projects/<slug>.pt.mdx` e `<slug>.en.mdx` (mesmo `slug`, mesmo frontmatter, só os textos mudam). Prints em `src/assets/projects/<slug>/`.
- **Experiência e formação:** `src/content/experience/*.json`.
- **Stack:** `src/content/stack.json`, agrupada por área (front, back, cms, mobile, dados, infraestrutura e operações, outros). Cada área tem `id`, `label` e `description` (`{ pt, en }`, a frase curta da linha; obrigatória quando a área tem item visível). Cada item tem `id`, `name` (texto, ou `{ pt, en }` quando o nome é descrição e precisa de tradução), `icon` opcional, `level` (`basic` | `intermediate` | `advanced`, definido pelo Gustavo) e `showInStack` (padrão `true`; `false` tira o item da seção de stack, mas ele continua valendo como etiqueta de projeto). Área sem item visível não aparece. Home e Sobre mostram a mesma lista (o Sobre com ícones). Os projetos em que cada item foi usado saem do `stack` de cada projeto e vão só no `title` da pílula.
- **Textos de interface:** `src/i18n/pt.ts` e `src/i18n/en.ts`. O `en.ts` é tipado a partir do `pt.ts`, então chave faltando quebra o `astro check`.

## Schemas
- Todo campo de conteúdo tem schema Zod em `src/content.config.ts` (o da stack mora em `src/lib/stack.ts`, para ter teste unitário). Campo novo começa pelo schema.
- Links (`demo`, `repo`) são validados como URL. `repo` é opcional: projeto com código privado (ex.: Conexão Metodista) não ganha botão "código".
- `status` do projeto: `live` | `offline` | `archived`. O selo "no ar" só aparece com `live`.
- `featured: true` em no máximo 3 projetos (validação no build).

## Veracidade
- Nada sobre o Gustavo é inventado: cargo, datas, papel, números, clientes. Faltou informação → `TODO(gustavo): <o que falta>`. O build de produção falha se encontrar `TODO(gustavo)`.
- Projeto em equipe diz que é em equipe e o que foi feito por ele.
- Nome de empresa ou cliente só aparece se ele autorizou (K13 Web: autorizado em 2026-10-30).

## Estudo de caso (ordem fixa)
Resumo + stack + links → Contexto/problema → Meu papel → Arquitetura (diagrama + decisões com "por quê") → Desafios e soluções → Resultado (prints/vídeo) → O que eu faria diferente.

## Tradução
- PT é a fonte. EN é tradução fiel, natural (não literal), revisada pelo Gustavo.
- Rotas espelhadas: `/projetos/x` ↔ `/en/projects/x`, com `hreflang` e link de troca de idioma que mantém a página atual.
- Datas e números com `Intl` no idioma da página.
- Arquivos de conteúdo em UTF-8, fim de linha LF (o `.gitattributes` garante).
