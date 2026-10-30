// Variáveis públicas lidas no build (src/lib/env.ts). Segredo nunca entra aqui.
interface ImportMetaEnv {
  readonly PUBLIC_TURNSTILE_SITEKEY?: string;
  readonly PUBLIC_WHATSAPP?: string;
}

// Diretiva de hidratação própria (astro.config.mjs, src/directives/afterLoad.ts).
// Arquivo global (sem import/export): estende o namespace global Astro, não o módulo.
declare namespace Astro {
  interface ClientDirectives {
    "client:afterload"?: boolean;
  }
}
