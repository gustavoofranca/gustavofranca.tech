import { z } from "astro/zod";

// Único lugar que lê variáveis de ambiente (boas-praticas.md).
//
// Segredos vêm de `process.env` em tempo de execução, nunca de `import.meta.env.X`:
// no build, o Astro troca a variável privada pelo valor literal, e o segredo iria
// parar dentro de dist/ (e da imagem Docker).

const serverSchema = z.object({
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535),
  SMTP_USER: z.email(),
  SMTP_PASS: z.string(),
  CONTACT_TO: z.email(),
  TURNSTILE_SECRET: z.string(),
  // json: o nodemailer só monta a mensagem, sem enviar (testes e desenvolvimento).
  MAIL_TRANSPORT: z.enum(["smtp", "json"]).default("smtp"),
});

// Lidas no build (páginas estáticas): o valor fica no HTML, por isso o prefixo PUBLIC_.
const publicSchema = z.object({
  PUBLIC_TURNSTILE_SITEKEY: z.string(),
  // Formato do wa.me: só dígitos, com DDI (ex.: 55 + DDD + número, sem + nem espaços).
  PUBLIC_WHATSAPP: z
    .string()
    .regex(/^\d{10,15}$/)
    .optional(),
});

export type Env = z.infer<typeof serverSchema>;
export type PublicEnv = z.infer<typeof publicSchema>;

type Source = Record<string, string | undefined>;

// `.env` com `CHAVE=` define string vazia; para a validação isso é "faltando".
function withoutEmpty(source: Source): Source {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== ""),
  );
}

// A mensagem lista só os nomes: o valor pode ser um segredo.
function parseWith<T>(schema: z.ZodType<T>, source: Source): T {
  const result = schema.safeParse(withoutEmpty(source));
  if (result.success) return result.data;
  const names = [...new Set(result.error.issues.map((i) => String(i.path[0])))];
  throw new Error(
    `Variáveis de ambiente faltando ou inválidas: ${names.join(", ")}. Veja o .env.example.`,
  );
}

export function parseEnv(source: Source): Env {
  return parseWith(serverSchema, source);
}

export function parsePublicEnv(source: Source): PublicEnv {
  return parseWith(publicSchema, source);
}

let cached: Env | undefined;

// Lida na primeira requisição (não no build): o build e o preview não precisam dos segredos.
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

export function getPublicEnv(): PublicEnv {
  // Acesso por propriedade, um a um, de propósito: usar o objeto de env inteiro faria o
  // Astro injetar aqui as variáveis privadas citadas neste arquivo (SMTP_PASS etc.).
  // Por isso este arquivo também nunca escreve o objeto sem `.PROPRIEDADE` depois.
  return parsePublicEnv({
    PUBLIC_TURNSTILE_SITEKEY: import.meta.env.PUBLIC_TURNSTILE_SITEKEY,
    PUBLIC_WHATSAPP: import.meta.env.PUBLIC_WHATSAPP,
  });
}
