import { isIP } from "node:net";
import { z } from "astro/zod";
import { SITE_URL } from "@/lib/site";

export const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Segredos de teste do Cloudflare (sempre passa / sempre falha / token já usado).
// Com eles o siteverify responde hostname "example.com", então o hostname não é checado.
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TEST_SECRETS = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

const EXPECTED_HOSTNAME = new URL(SITE_URL).hostname;

// Só os campos que importam; o resto da resposta do Cloudflare é ignorado.
const siteverifyResponse = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
});

// Verificação no servidor (o widget sozinho não prova nada):
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
// Erro de rede sobe como exceção; quem chama decide (o handler falha fechado).
export async function verifyTurnstile(
  token: string,
  ip: string,
  secret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  // Sem token o widget não rodou (formulário sem JS): nem vale a ida ao Cloudflare.
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  // remoteip é opcional: IP desconhecido não vai, em vez de um texto qualquer.
  if (isIP(ip)) body.set("remoteip", ip);
  const response = await fetchImpl(SITEVERIFY_URL, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return false;
  const parsed = siteverifyResponse.safeParse(await response.json());
  if (!parsed.success || !parsed.data.success) return false;
  if (TEST_SECRETS.has(secret)) return true;
  // Token resolvido em outro site com a mesma chave pública não vale aqui.
  return parsed.data.hostname === EXPECTED_HOSTNAME;
}
