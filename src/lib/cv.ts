import { existsSync } from "node:fs";
import { join } from "node:path";

export const CV_FILE = "cv-gustavo-franca.pdf";
export const CV_HREF = `/${CV_FILE}`;

// O botão "Baixar CV" só aparece se o PDF estiver em public/. Decidido no build:
// sem o arquivo no repositório, o link levaria a um 404.
export function hasCv(publicDir: string): boolean {
  return existsSync(join(publicDir, CV_FILE));
}
