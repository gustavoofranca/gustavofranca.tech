---
paths:
  - "src/pages/api/**/*"
  - "src/lib/**/*"
  - "src/middleware.*"
  - "astro.config.*"
  - "deploy/**/*"
  - ".github/**/*"
  - ".env*"
---

# Regras de segurança

Referências: OWASP ASVS 4.0 (V5 validação, V7 logs, V14 configuração) e OWASP Cheat Sheets (Input Validation, Content Security Policy, HTTP Headers).

## Formulário de contato (`/api/contato`)
- Validação no servidor com Zod (o cliente valida só para UX). Limites: nome ≤ 80, e-mail válido ≤ 254, mensagem 10–4000 caracteres. Rejeite campos extras.
- Anti-spam em camadas: honeypot, tempo mínimo de preenchimento (≥ 3 s), Cloudflare Turnstile verificado no servidor e limite por IP (5/hora).
- Só `POST` com `Content-Type` esperado; checagem de `Origin`.
- O e-mail enviado ao Gustavo é texto puro (sem HTML montado com entrada do usuário); o e-mail do visitante vai no `Reply-To`, nunca no `From`.
- Resposta ao visitante não revela detalhe interno (stack trace, provedor SMTP).

## Logs e dados pessoais
- Nunca registrar o conteúdo da mensagem, e-mail, IP completo, token ou senha. Logue o resultado (`enviado`, `bloqueado:rate-limit`, `falha:smtp`) e um id de requisição.
- O formulário não guarda nada em banco: envia e esquece. A página de privacidade diz exatamente isso.
- Telefone/WhatsApp não aparece em texto puro no HTML: o link `wa.me` é montado no clique.

## Cabeçalhos (aplicados no Caddy de borda + `<meta>` de CSP no build)
- `Content-Security-Policy` sem `unsafe-inline` em `script-src` (scripts com hash gerado pelo Astro), `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. Exceções só para o Turnstile e o Umami, listadas e comentadas.
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` desligando câmera, microfone e geolocalização.

## Segredos e repositório público
- Segredos (SMTP do Zoho, chave do Turnstile, chave SSH de deploy) só em variáveis de ambiente: `.env` local (ignorado), GitHub Secrets e `.env` no VPS. `.env.example` documenta os nomes, sem valores.
- Variável que vai para o navegador tem prefixo `PUBLIC_`; segredo nunca tem.
- Antes de commit, nada de dado pessoal no diff (telefone, e-mail pessoal, endereço, CV antigo).

## Dependências e CI
- Dependabot semanal; `npm audit --audit-level=high` no CI.
- Actions do GitHub fixadas por SHA; `permissions:` mínimas em cada workflow.
- A chave SSH de deploy só pode atualizar o container do portfólio no VPS (usuário dedicado, sem sudo geral).
