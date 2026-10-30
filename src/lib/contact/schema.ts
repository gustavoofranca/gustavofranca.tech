import { z } from "@/lib/zod";

// Limites de seguranca.md (OWASP ASVS V5). O token do Turnstile tem até 2048 caracteres
// (documentação do Cloudflare); maior que isso não é token.
export const CONTACT_LIMITS = {
  nameMax: 80,
  emailMax: 254,
  messageMin: 10,
  messageMax: 4000,
  tokenMax: 2048,
} as const;

// Caractere de controle (\r, \n, \t, \0...) ou separador de linha Unicode no nome
// abriria caminho para injeção de cabeçalho no assunto do e-mail. Caractere de
// formatação (\p{Cf}: U+202E e outros controles bidi, espaço de largura zero)
// reordena ou esconde texto e falsificaria o assunto que o Gustavo lê.
const SINGLE_LINE = /^[^\p{Cc}\p{Cf}\p{Zl}\p{Zp}]*$/u;

// Mesmo schema no servidor (fronteira) e na ilha (só para UX).
export const contactSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(CONTACT_LIMITS.nameMax)
      .regex(SINGLE_LINE),
    email: z.email().max(CONTACT_LIMITS.emailMax),
    message: z
      .string()
      .trim()
      .min(CONTACT_LIMITS.messageMin)
      .max(CONTACT_LIMITS.messageMax),
    locale: z.enum(["pt", "en"]),
    // Honeypot: campo escondido que só robô preenche.
    website: z.literal(""),
    // Ausente quando o formulário foi enviado sem JS.
    startedAt: z.number().int().nonnegative().optional(),
    // Vazio quando o widget não rodou; quem decide é a verificação do captcha.
    turnstileToken: z.string().max(CONTACT_LIMITS.tokenMax),
  })
  .strict();

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactField = "name" | "email" | "message";

export type FieldErrorKey =
  | "nameRequired"
  | "nameTooLong"
  | "nameInvalid"
  | "emailInvalid"
  | "messageTooShort"
  | "messageTooLong";

type Issue = z.core.$ZodIssue;

const MESSAGE_FOR: Record<ContactField, (issue: Issue) => FieldErrorKey> = {
  name: (issue) =>
    issue.code === "too_big"
      ? "nameTooLong"
      : issue.code === "invalid_format"
        ? "nameInvalid"
        : "nameRequired",
  email: () => "emailInvalid",
  message: (issue) =>
    issue.code === "too_big" ? "messageTooLong" : "messageTooShort",
};

function isContactField(key: unknown): key is ContactField {
  return key === "name" || key === "email" || key === "message";
}

// Primeiro erro de cada campo visível, como chave do dicionário (contact.form.errors).
export function fieldErrors(
  error: z.ZodError,
): Partial<Record<ContactField, FieldErrorKey>> {
  const errors: Partial<Record<ContactField, FieldErrorKey>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (!isContactField(field) || errors[field]) continue;
    errors[field] = MESSAGE_FOR[field](issue);
  }
  return errors;
}
