import type { APIRoute } from "astro";
import {
  handleContact,
  logContactResult,
  type ContactResult,
} from "@/lib/contact/handler";
import { createMailer } from "@/lib/contact/mailer";
import { createRateLimiter } from "@/lib/contact/rateLimit";
import {
  clientIp,
  formToInput,
  isAllowedOrigin,
  localeOf,
  redirectLocation,
  requestKind,
  statusCode,
  type RequestKind,
} from "@/lib/contact/request";
import { verifyTurnstile } from "@/lib/contact/turnstile";
import { getEnv, type Env } from "@/lib/env";

// A única rota de servidor do site; o resto é estático.
export const prerender = false;

// 5 envios por hora por IP (seguranca.md). Vive enquanto o processo vive.
const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });
// Varre as janelas vencidas a cada minuto mesmo sem tráfego novo, para o IP não ficar
// guardado depois da janela (promessa da página de privacidade). unref: não segura o processo.
setInterval(() => limiter.sweep(), 60 * 1000).unref();

// Um transporte por processo, criado no primeiro envio (as variáveis só são lidas aí).
let send: ReturnType<typeof createMailer> | undefined;

// Só para logar o que nem chega ao handler (origem, tipo, corpo ilegível).
function reject(requestId: string, result: string, status: number) {
  console.warn(JSON.stringify({ requestId, result }));
  return new Response(null, { status });
}

function respond(kind: RequestKind, result: ContactResult, raw: unknown) {
  if (kind === "form") {
    // 303: o navegador troca o POST por GET na página de contato (padrão PRG).
    return new Response(null, {
      status: 303,
      headers: { Location: redirectLocation(result, localeOf(raw)) },
    });
  }
  return Response.json(result, { status: statusCode(result) });
}

async function readBody(request: Request, kind: RequestKind) {
  if (kind === "json") return (await request.json()) as unknown;
  return formToInput(new URLSearchParams(await request.text()));
}

export const POST: APIRoute = async ({ request, url, clientAddress }) => {
  const requestId = crypto.randomUUID();
  const kind = requestKind(request.headers.get("content-type"));
  if (!kind) return reject(requestId, "bloqueado:content-type", 415);
  if (!isAllowedOrigin(request.headers.get("origin"), url.origin)) {
    return reject(requestId, "bloqueado:origem", 403);
  }

  let raw: unknown;
  try {
    raw = await readBody(request, kind);
  } catch {
    // JSON malformado ou corpo acima do bodySizeLimit do adapter.
    raw = null;
  }

  let env: Env;
  try {
    env = getEnv();
  } catch (error) {
    // A mensagem lista só nomes de variáveis, nunca valores (src/lib/env.ts).
    console.error(JSON.stringify({ requestId, result: "falha:config" }));
    console.error(error instanceof Error ? error.message : "env inválido");
    const failed: ContactResult = { ok: false, reason: "send_failed" };
    return respond(kind, failed, raw);
  }
  send ??= createMailer(env);
  const result: ContactResult = await handleContact(raw, {
    ip: clientIp(request.headers.get("x-forwarded-for"), clientAddress),
    now: Date.now(),
    deps: {
      limiter,
      verifyCaptcha: (token, ip) =>
        verifyTurnstile(token, ip, env.TURNSTILE_SECRET),
      send,
    },
  });
  logContactResult(requestId, result);
  return respond(kind, result, raw);
};

// Qualquer outro método: 405, dizendo qual é aceito.
export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: "POST" } });
