// Variáveis públicas lidas no build (src/lib/env.ts). Segredo nunca entra aqui.
interface ImportMetaEnv {
  readonly PUBLIC_TURNSTILE_SITEKEY?: string;
  readonly PUBLIC_WHATSAPP?: string;
}
