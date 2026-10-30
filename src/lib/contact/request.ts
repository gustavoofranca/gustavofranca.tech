import { z } from "astro/zod";
import type { ContactResult } from "@/lib/contact/handler";
import type { Locale } from "@/i18n/locales";
import { routePath } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

// Peças da rota /api/contato que não dependem do Astro, para testar sem servidor.

export type RequestKind = "json" | "form";

// JSON vem da ilha; urlencoded vem do <form> nativo (sem JS). multipart e o resto: 415.
export function requestKind(contentType: string | null): RequestKind | null {
  const type = contentType?.split(";")[0]?.trim().toLowerCase();
  if (type === "application/json") return "json";
  if (type === "application/x-www-form-urlencoded") return "form";
  return null;
}

// Converte o POST nativo no formato da ilha. Campos extras seguem adiante para o
// schema estrito recusar.
export function formToInput(form: URLSearchParams): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const [key, value] of form) {
    if (key === "cf-turnstile-response") input["turnstileToken"] = value;
    else if (key === "startedAt") {
      // Vazio = enviado sem JS (o script inline não preencheu).
      if (value !== "")
        input["startedAt"] = /^\d+$/.test(value) ? Number(value) : value;
    } else input[key] = value;
  }
  input["turnstileToken"] ??= "";
  return input;
}

// Há exatamente um proxy na frente (o Caddy), então o IP confiável é o que ele
// escreveu: o último valor do X-Forwarded-For. O Caddy, por padrão, sobrescreve o
// cabeçalho vindo de fora, e aí primeiro e último coincidem; se algum dia ele passar
// a acrescentar em vez de sobrescrever, o último continua certo e o primeiro, não.
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Forwarded-For
export function clientIp(
  forwardedFor: string | null,
  socketAddress: string | undefined,
): string {
  const last = forwardedFor
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1);
  return last ?? socketAddress ?? "desconhecido";
}

// Origem do site ou a do próprio servidor (preview local e e2e). Sem Origin, recusa:
// navegador sempre manda Origin em POST.
export function isAllowedOrigin(
  origin: string | null,
  requestOrigin: string,
): boolean {
  if (!origin) return false;
  return origin === new URL(SITE_URL).origin || origin === requestOrigin;
}

export function localeOf(raw: unknown): Locale {
  const isEnglish =
    typeof raw === "object" &&
    raw !== null &&
    (raw as Record<string, unknown>)["locale"] === "en";
  return isEnglish ? "en" : "pt";
}

// O ?status fica para quem lê a URL; a âncora (#) é o que mostra a mensagem certa sem
// JS: a página é estática e usa :target (ver contact/StatusMessages.astro).
export function redirectLocation(
  result: ContactResult,
  locale: Locale,
): string {
  const page = routePath("contact", locale);
  if (result.ok) return `${page}?status=enviado#contato-enviado`;
  return `${page}?status=erro&motivo=${result.reason}#contato-erro-${result.reason}`;
}

export function statusCode(result: ContactResult): number {
  if (result.ok) return 200;
  if (result.reason === "rate_limited") return 429;
  if (result.reason === "send_failed") return 502;
  return 400;
}

const resultSchema = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({
    ok: z.literal(false),
    reason: z.enum([
      "invalid",
      "spam",
      "rate_limited",
      "captcha",
      "send_failed",
    ]),
    fields: z.array(z.enum(["name", "email", "message"])).optional(),
  }),
]);

// Resposta da API lida pela ilha: valida na fronteira, como qualquer entrada.
export function parseResult(json: unknown): ContactResult | null {
  const parsed = resultSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

export type FeedbackKey =
  "success" | "invalid" | "captcha" | "tooManyRequests" | "generic";

// spam cai na mensagem genérica de propósito: não ensina o robô o que o barrou.
export function feedbackKey(result: ContactResult | null): FeedbackKey {
  if (!result) return "generic";
  if (result.ok) return "success";
  if (result.reason === "invalid") return "invalid";
  if (result.reason === "captcha") return "captcha";
  if (result.reason === "rate_limited") return "tooManyRequests";
  return "generic";
}
