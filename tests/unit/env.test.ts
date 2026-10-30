import { describe, expect, it } from "vitest";
import { parseEnv, parsePublicEnv } from "@/lib/env";

const complete = {
  SMTP_HOST: "smtp.zoho.com",
  SMTP_PORT: "465",
  SMTP_USER: "contato@gustavofranca.tech",
  SMTP_PASS: "troque-me",
  CONTACT_TO: "contato@gustavofranca.tech",
  TURNSTILE_SECRET: "1x0000000000000000000000000000000AA",
  MAIL_TRANSPORT: "json",
};

describe("parseEnv", () => {
  it("valida e converte as variáveis do servidor", () => {
    expect(parseEnv(complete)).toEqual({ ...complete, SMTP_PORT: 465 });
  });

  it("MAIL_TRANSPORT padrão é smtp e só aceita smtp ou json", () => {
    const withoutTransport: Record<string, string> = { ...complete };
    delete withoutTransport["MAIL_TRANSPORT"];
    expect(parseEnv(withoutTransport).MAIL_TRANSPORT).toBe("smtp");
    expect(() => parseEnv({ ...complete, MAIL_TRANSPORT: "sendmail" })).toThrow(
      /MAIL_TRANSPORT/,
    );
  });

  it("lista as variáveis que faltam (vazio conta como faltando)", () => {
    expect(() =>
      parseEnv({ ...complete, SMTP_PASS: "", TURNSTILE_SECRET: undefined }),
    ).toThrow(/SMTP_PASS, TURNSTILE_SECRET/);
  });

  it("a mensagem de erro nunca mostra valores", () => {
    expect(() =>
      parseEnv({ ...complete, SMTP_PORT: "senha-secreta", SMTP_PASS: "" }),
    ).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining("senha-secreta"),
      }),
    );
  });

  it("MAIL_TRANSPORT=json em produção falha fechado (mensagem não some em silêncio)", () => {
    expect(() =>
      parseEnv({ ...complete, MAIL_TRANSPORT: "json", NODE_ENV: "production" }),
    ).toThrow(/MAIL_TRANSPORT/);
    expect(
      parseEnv({ ...complete, MAIL_TRANSPORT: "smtp", NODE_ENV: "production" })
        .MAIL_TRANSPORT,
    ).toBe("smtp");
    expect(
      parseEnv({ ...complete, MAIL_TRANSPORT: "json", NODE_ENV: "test" })
        .MAIL_TRANSPORT,
    ).toBe("json");
  });

  it("ignora variáveis que não conhece", () => {
    expect(parseEnv({ ...complete, PATH: "/usr/bin" })).not.toHaveProperty(
      "PATH",
    );
  });
});

describe("parsePublicEnv", () => {
  it("exige a chave pública do Turnstile", () => {
    expect(() => parsePublicEnv({})).toThrow(/PUBLIC_TURNSTILE_SITEKEY/);
  });

  it("WhatsApp é opcional e vazio vira ausente", () => {
    expect(
      parsePublicEnv({
        PUBLIC_TURNSTILE_SITEKEY: "1x00000000000000000000AA",
        PUBLIC_WHATSAPP: "",
      }),
    ).toEqual({ PUBLIC_TURNSTILE_SITEKEY: "1x00000000000000000000AA" });
  });

  it("WhatsApp só com dígitos (formato do wa.me)", () => {
    const base = { PUBLIC_TURNSTILE_SITEKEY: "k" };
    expect(
      parsePublicEnv({ ...base, PUBLIC_WHATSAPP: "5500000000000" })
        .PUBLIC_WHATSAPP,
    ).toBe("5500000000000");
    expect(() =>
      parsePublicEnv({ ...base, PUBLIC_WHATSAPP: "+55 00 00000-0000" }),
    ).toThrow(/PUBLIC_WHATSAPP/);
  });
});
