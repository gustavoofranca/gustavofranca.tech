import { z } from "astro/zod";

export const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Só o campo que importa; o resto da resposta do Cloudflare é ignorado.
const siteverifyResponse = z.object({ success: z.boolean() });

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
  const response = await fetchImpl(SITEVERIFY_URL, {
    method: "POST",
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return false;
  const parsed = siteverifyResponse.safeParse(await response.json());
  return parsed.success && parsed.data.success;
}
