import { createTransport } from "nodemailer";
import type { ContactInput } from "@/lib/contact/schema";
import type { Env } from "@/lib/env";

export type ContactEmail = { subject: string; text: string; replyTo: string };

// Só texto puro: nada de HTML montado com entrada do visitante (seguranca.md).
// O nome já chega sem quebra de linha (schema), então não abre cabeçalho novo no assunto.
export function buildEmail(input: ContactInput): ContactEmail {
  return {
    subject: `[Portfólio] Mensagem de ${input.name}`,
    text: [
      `Nome: ${input.name}`,
      `E-mail: ${input.email}`,
      `Idioma: ${input.locale}`,
      "",
      input.message,
      "",
    ].join("\n"),
    replyTo: input.email,
  };
}

// From é a conta autenticada (o Zoho recusa outro remetente); o visitante vai no
// Reply-To, nunca no From, para não falsificar remetente.
export function toMailOptions(email: ContactEmail, env: Env) {
  return {
    from: env.SMTP_USER,
    to: env.CONTACT_TO,
    replyTo: email.replyTo,
    subject: email.subject,
    text: email.text,
    // Defesa extra: a mensagem não tem anexo, mas o nodemailer nunca lê arquivo nem URL.
    disableFileAccess: true,
    disableUrlAccess: true,
  };
}

// Devolve uma função de envio. Com MAIL_TRANSPORT=json devolve a mensagem montada
// (JSON), sem abrir conexão: é o que os testes e o e2e usam.
export function createMailer(
  env: Env,
): (email: ContactEmail) => Promise<string> {
  if (env.MAIL_TRANSPORT === "json") {
    const transport = createTransport({ jsonTransport: true });
    return async (email) => {
      const info = await transport.sendMail(toMailOptions(email, env));
      return info.message;
    };
  }
  const transport = createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // Zoho na porta 465: TLS desde o início.
    secure: true,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    // Sem isso uma conexão travada prende a requisição do visitante.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return async (email) => {
    const info = await transport.sendMail(toMailOptions(email, env));
    return info.messageId;
  };
}
