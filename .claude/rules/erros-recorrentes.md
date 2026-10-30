# Erros recorrentes: regra dos 3

Todo erro que se repete vira regra. O registro fica em `.claude/aprendizados.md`. Ele não é carregado sozinho: leia o arquivo quando for registrar algo.

## O que conta como ocorrência
- O Gustavo corrige algo que você fez ("não era isso", "de novo isso", "eu já falei").
- Uma verificação pega um erro seu depois que você disse que estava pronto: teste, lint, typecheck, build, revisão ou CI.
- Você mesmo percebe que repetiu um engano já registrado.

Não conta: bug novo de lógica de negócio ou mudança de ideia do Gustavo.

## O que fazer, na hora
1. Corrija o erro.
2. Abra `.claude/aprendizados.md` e procure um padrão igual em "Em observação".
   - **Achou:** some 1 à contagem e anote a data e o contexto em uma linha.
   - **Não achou:** crie a entrada com contagem 1.
3. **Na 3ª ocorrência, promova o padrão:**
   - Se a regra **não pode ter exceção** e dá para checar por máquina, ela vira hook, regra de bloqueio (deny) no `.claude/settings.json`, regra de lint ou teste. Texto não basta.
   - Se não, ela vira uma linha curta e concreta no arquivo de `.claude/rules/` do assunto (código, estilo, conteúdo, qualidade, segurança, git). A linha diz o que fazer, não o que evitar em abstrato.
   - Mova a entrada para "Promovidas", com o link para onde a regra foi parar.
4. Conte ao Gustavo, em uma frase, o que foi registrado ou promovido.

## Manutenção
- Antes de promover, veja se a regra contradiz outra; se sim, resolva a contradição em vez de empilhar.
- Regra promovida que ficou 3 meses sem motivo para existir (o código mudou) pode ser removida, com o Gustavo de acordo.
