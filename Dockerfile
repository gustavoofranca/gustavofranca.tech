# syntax=docker/dockerfile:1

# Imagem do portfólio: o servidor Node do Astro (@astrojs/node, standalone) atende
# /api/contato e também serve as páginas estáticas de dist/client na porta 4321.
#
# Build (a chave do Turnstile é pública e vai para o HTML; segredo nunca entra aqui):
#   docker build --build-arg PUBLIC_TURNSTILE_SITEKEY=<chave> -t portfolio .
# Com CONTENT_STRICT=true (padrão) o build falha enquanto houver TODO(gustavo) no
# conteúdo. Só para teste local: --build-arg CONTENT_STRICT=false.
#
# Execução (segredos só em tempo de execução, nunca na imagem). Teste local, só no
# loopback:
#   docker run --init -p 127.0.0.1:4321:4321 --env-file .env portfolio
# Em produção a porta 4321 não é publicada no host: só o Caddy de borda a alcança, pela
# rede do Docker. Exposta, qualquer um mandaria um X-Forwarded-For forjado e escaparia
# do limite por IP (src/lib/contact/request.ts confia no último valor, que é do proxy).
# --init (ou `init: true` no compose): o Node como PID 1 não trata SIGTERM sozinho.

# Node 24 em Alpine, fixado pelo digest. A imagem vai literal no FROM (e não num ARG)
# porque o Dependabot só reconhece imagem escrita no FROM (.github/dependabot.yml).
FROM node:26-alpine@sha256:8996bb5821d62a8fd9bb27c1cb07462f3fdce6e47d640c6a881ead0b064ce216 AS base

# Dependências completas, para o build. --ignore-scripts: nenhum pacote de produção
# precisa de script de instalação (só o lefthook, que instala hooks do Git).
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM deps AS build
ARG PUBLIC_TURNSTILE_SITEKEY
ARG PUBLIC_WHATSAPP=""
ARG CONTENT_STRICT=true
COPY . .
# Falha cedo e com mensagem clara: sem a chave o build do Astro também falharia.
RUN test -n "$PUBLIC_TURNSTILE_SITEKEY" \
    || (echo "Faltou --build-arg PUBLIC_TURNSTILE_SITEKEY=<chave>." >&2 && exit 1)
# Os ARG viram variáveis de ambiente só deste RUN; nada disso chega à imagem final.
RUN PUBLIC_TURNSTILE_SITEKEY="$PUBLIC_TURNSTILE_SITEKEY" \
    PUBLIC_WHATSAPP="$PUBLIC_WHATSAPP" \
    CONTENT_STRICT="$CONTENT_STRICT" \
    npm run build

# Só as dependências de produção (o servidor importa astro, nodemailer etc. em tempo de
# execução).
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM base AS runtime
WORKDIR /app
# NODE_ENV=production é obrigatório: com ele, src/lib/env.ts recusa MAIL_TRANSPORT=json
# (que descartaria as mensagens em silêncio). HOST: o padrão do adapter é localhost,
# que não aceita conexão de fora do contêiner.
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321
# Arquivos do root e só leitura para o processo: o usuário node não escreve em /app.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:4321/ || exit 1
CMD ["node", "./dist/server/entry.mjs"]
