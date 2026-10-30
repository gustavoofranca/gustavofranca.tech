// O número vai para o HTML em base64, não em dígitos: robô que raspa telefone não o
// reconhece, e o link wa.me só é montado no clique (seguranca.md).
const PHONE = /^\d{10,15}$/;

export function encodePhone(digits: string): string {
  return btoa(digits);
}

export function decodePhone(encoded: string): string | null {
  try {
    const digits = atob(encoded);
    return PHONE.test(digits) ? digits : null;
  } catch {
    // base64 inválido: trata como "sem número".
    return null;
  }
}

export function whatsappUrl(digits: string): string {
  return `https://wa.me/${digits}`;
}
