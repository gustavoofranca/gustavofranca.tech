import { defineMiddleware } from "astro:middleware";

// Cabeçalhos da única rota de servidor. As páginas são estáticas: a CSP delas vai na
// <meta> do build e os demais cabeçalhos, no Caddy (fase 2). A API responde JSON ou um
// redirecionamento, nunca HTML: a CSP mais fechada possível, sem cache e sem sniffing.
// O 403 do checkOrigin do Astro (POST de formulário de outra origem) sai antes do
// middleware e fica sem eles; é texto puro e não carrega dado.
// https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#security-headers
const API_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
} as const;

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (context.isPrerendered || !context.url.pathname.startsWith("/api/")) {
    return response;
  }
  // Cópia em vez de mutar: uma resposta pode ter cabeçalhos imutáveis (fetch, redirect).
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(API_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
