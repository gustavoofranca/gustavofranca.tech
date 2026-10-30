---
paths:
  - "src/**/*"
  - "tests/**/*"
  - "deploy/**/*"
---

# Boas práticas de engenharia

Princípios gerais. As regras específicas de cada área estão nos outros arquivos de `.claude/rules/`.

## Simplicidade
- Faça o mais simples que resolve o pedido de hoje (YAGNI). Abstração só depois do terceiro caso parecido (regra de três), não antes.
- Duplicação pequena é mais barata que a abstração errada. Só junte o que muda junto e pelo mesmo motivo.
- Mudança pequena e focada. Não refatore o que não faz parte da tarefa; se achar algo, anote e avise.

## Estrutura
- Núcleo puro e casca fina: regras e transformações em funções puras (`src/lib/`), com efeitos (rede, disco, DOM, relógio) nas bordas. O núcleo se testa sem mock.
- Valide na fronteira (entrada do usuário, conteúdo, variáveis de ambiente, resposta de API) com Zod e confie no tipo dali para dentro.
- Dados imutáveis por padrão (`const`, `readonly`, sem mutar argumento).
- Retorno antecipado em vez de `if` aninhado. Função faz uma coisa; nome diz qual.
- Variáveis de ambiente lidas e validadas num único módulo (`src/lib/env.ts`), nunca `process.env`/`import.meta.env` espalhado.

## Erros
- Nunca engula erro (`catch {}` vazio). Trate, devolva com contexto ou deixe subir.
- Erro esperado (validação, rate limit) é resultado tipado, não exceção. Exceção é para o inesperado.
- Mensagem para o usuário diz o que fazer. Detalhe técnico vai para o log, sem dado pessoal.
- Falhe cedo e alto no build (schema, `TODO(gustavo)`, variável faltando) para não falhar em silêncio em produção.

## Decisões e documentação
- Decisão de arquitetura que alguém pode questionar depois vira ADR curto em `docs/adr/NNNN-titulo.md` (contexto, decisão, alternativas, consequências), versionado. Use o modelo `docs/adr/0000-modelo.md`.
- README explica para um dev sênior: o que é, como rodar, como adicionar um projeto, decisões principais (links para os ADRs).
- Comentário explica o porquê. Se precisou explicar o quê, renomeie ou quebre o código.

## Verificação antes de dizer "pronto"
- Rode os comandos (`check`, `lint`, `test`, `build`) e leia a saída; não presuma.
- Mudança visual: veja no navegador, no build de produção.
- Diga exatamente o que foi verificado e o que não foi.
