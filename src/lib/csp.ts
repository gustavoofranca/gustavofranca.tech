// Hash de CSP do conteúdo exato de um <script> ou <style> inline. O navegador hasheia
// o texto entre as tags, byte a byte, então qualquer espaço a mais muda o resultado.
// https://www.w3.org/TR/CSP3/#match-element-to-source-list
export async function cspHash(content: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(content),
  );
  return `sha256-${Buffer.from(digest).toString("base64")}`;
}

// Única exceção externa da CSP: o Cloudflare Turnstile do formulário de contato, que
// carrega um script e um iframe desta origem. Liberado só nas páginas de contato
// (src/pages/contato.astro e en/contact.astro), em script-src e frame-src.
// https://developers.cloudflare.com/turnstile/reference/content-security-policy/
export const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";
