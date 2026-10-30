import type { ContactEmail } from "@/lib/contact/mailer";
import { buildEmail } from "@/lib/contact/mailer";
import type { RateLimiter } from "@/lib/contact/rateLimit";
import { contactSchema, type ContactField } from "@/lib/contact/schema";

export type ContactReason =
  "invalid" | "spam" | "rate_limited" | "captcha" | "send_failed";

export type ContactResult =
  | { ok: true }
  | { ok: false; reason: ContactReason; fields?: ContactField[] | undefined };

export type ContactDeps = {
  limiter: Pick<RateLimiter, "hit">;
  verifyCaptcha: (token: string, ip: string) => Promise<boolean>;
  send: (email: ContactEmail) => Promise<unknown>;
};

type Context = { ip: string; now: number; deps: ContactDeps };

export const MIN_FILL_MS = 3000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Checado no objeto cru, antes do schema: robô que preenche tudo nem chega a ser validado.
function honeypotFilled(raw: Record<string, unknown>): boolean {
  return raw["website"] !== undefined && raw["website"] !== "";
}

// startedAt ausente (sem JS) é "tempo desconhecido": passa, e os outros filtros seguem
// valendo. Valor no futuro vem de relógio adiantado do visitante, não de robô rápido.
function tooFast(raw: Record<string, unknown>, now: number): boolean {
  const startedAt = raw["startedAt"];
  if (typeof startedAt !== "number") return false;
  const elapsed = now - startedAt;
  return elapsed >= 0 && elapsed < MIN_FILL_MS;
}

function invalidFields(issues: readonly { path: readonly PropertyKey[] }[]) {
  const fields = issues
    .map((issue) => issue.path[0])
    .filter(
      (key): key is ContactField =>
        key === "name" || key === "email" || key === "message",
    );
  return [...new Set(fields)];
}

// Ordem: honeypot → tempo mínimo → schema → limite por IP → captcha → envio.
// Os filtros baratos vêm primeiro; o limite só conta envios bem formados.
export async function handleContact(
  raw: unknown,
  { ip, now, deps }: Context,
): Promise<ContactResult> {
  if (!isRecord(raw)) return { ok: false, reason: "invalid", fields: [] };
  if (honeypotFilled(raw) || tooFast(raw, now)) {
    return { ok: false, reason: "spam" };
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid",
      fields: invalidFields(parsed.error.issues),
    };
  }

  if (!deps.limiter.hit(ip)) return { ok: false, reason: "rate_limited" };

  let human: boolean;
  try {
    human = await deps.verifyCaptcha(parsed.data.turnstileToken, ip);
  } catch {
    // Cloudflare fora do ar: falha fechado (sem captcha não há envio).
    human = false;
  }
  if (!human) return { ok: false, reason: "captcha" };

  try {
    await deps.send(buildEmail(parsed.data));
  } catch {
    // O erro do SMTP é descartado de propósito: a mensagem dele pode citar endereços
    // ou trechos do e-mail, que não podem ir para o log. O resultado já diz o que houve.
    return { ok: false, reason: "send_failed" };
  }
  return { ok: true };
}

const LABEL: Record<ContactReason, string> = {
  invalid: "invalido",
  spam: "bloqueado:spam",
  rate_limited: "bloqueado:rate-limit",
  captcha: "bloqueado:captcha",
  send_failed: "falha:smtp",
};

export function describeResult(result: ContactResult): string {
  return result.ok ? "enviado" : LABEL[result.reason];
}

// Só id da requisição e resultado: nada de nome, e-mail, mensagem, IP ou token (seguranca.md).
export function logContactResult(requestId: string, result: ContactResult) {
  const line = JSON.stringify({ requestId, result: describeResult(result) });
  if (result.ok) console.info(line);
  else if (result.reason === "send_failed") console.error(line);
  else console.warn(line);
}
