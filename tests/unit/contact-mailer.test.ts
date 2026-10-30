import { describe, expect, it } from "vitest";
import { buildEmail, createMailer, toMailOptions } from "@/lib/contact/mailer";
import type { ContactInput } from "@/lib/contact/schema";
import type { Env } from "@/lib/env";

const input: ContactInput = {
  name: "João Ávila",
  email: "joao+portfolio@exemplo.com",
  message: "<script>alert(1)</script> olá, tudo bem?",
  locale: "pt",
  website: "",
  turnstileToken: "t",
};

const env: Env = {
  SMTP_HOST: "smtp.exemplo.invalid",
  SMTP_PORT: 465,
  SMTP_USER: "contato@gustavofranca.tech",
  SMTP_PASS: "troque-me",
  CONTACT_TO: "caixa@gustavofranca.tech",
  TURNSTILE_SECRET: "s",
  MAIL_TRANSPORT: "json",
};

describe("buildEmail", () => {
  it("monta assunto, texto puro e reply-to", () => {
    const email = buildEmail(input);
    expect(email.subject).toBe("[Portfólio] Mensagem de João Ávila");
    expect(email.replyTo).toBe("joao+portfolio@exemplo.com");
    expect(email.text).toContain("<script>alert(1)</script> olá, tudo bem?");
    expect(email.text).toContain("joao+portfolio@exemplo.com");
    expect(email).not.toHaveProperty("html");
  });
});

describe("toMailOptions", () => {
  it("From é a conta SMTP, To é a caixa de contato e o visitante vai no Reply-To", () => {
    const options = toMailOptions(buildEmail(input), env);
    expect(options.from).toBe("contato@gustavofranca.tech");
    expect(options.to).toBe("caixa@gustavofranca.tech");
    expect(options.replyTo).toBe("joao+portfolio@exemplo.com");
    expect(options).not.toHaveProperty("html");
  });
});

describe("createMailer", () => {
  it("com MAIL_TRANSPORT=json não abre conexão e gera só a parte de texto", async () => {
    const send = createMailer(env);
    const raw = await send(buildEmail(input));
    const message = JSON.parse(raw) as Record<string, unknown>;
    expect(message["text"]).toContain("<script>alert(1)</script>");
    expect(message).not.toHaveProperty("html");
    expect(message["subject"]).toBe("[Portfólio] Mensagem de João Ávila");
  });
});
