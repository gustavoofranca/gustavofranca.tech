import { describe, expect, it } from "vitest";
import { contactSchema, fieldErrors } from "@/lib/contact/schema";

const valid = {
  name: "Ana Souza",
  email: "ana@exemplo.com",
  message: "Olá, vi seu portfólio e gostaria de conversar.",
  locale: "pt",
  website: "",
  startedAt: 1_700_000_000_000,
  turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
};

function errorsFor(input: unknown) {
  const result = contactSchema.safeParse(input);
  if (result.success) throw new Error("esperava falha de validação");
  return fieldErrors(result.error);
}

describe("contactSchema", () => {
  it("aceita uma mensagem válida", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("aceita e-mail com + e nome com acentos", () => {
    const result = contactSchema.safeParse({
      ...valid,
      name: "João Ávila",
      email: "joao+portfolio@exemplo.com",
    });
    expect(result.success).toBe(true);
  });

  it("aceita envio sem startedAt (formulário sem JS)", () => {
    const withoutTime: Record<string, unknown> = { ...valid };
    delete withoutTime["startedAt"];
    expect(contactSchema.safeParse(withoutTime).success).toBe(true);
  });

  it("rejeita quebra de linha no nome (injeção de cabeçalho)", () => {
    expect(errorsFor({ ...valid, name: "Ana\r\nBcc: x@y.z" })).toEqual({
      name: "nameInvalid",
    });
    expect(errorsFor({ ...valid, name: "Ana\nBcc: x@y.z" })).toEqual({
      name: "nameInvalid",
    });
  });

  it("aplica os limites de tamanho", () => {
    expect(errorsFor({ ...valid, name: "   " })).toEqual({
      name: "nameRequired",
    });
    expect(errorsFor({ ...valid, name: "a".repeat(81) })).toEqual({
      name: "nameTooLong",
    });
    expect(
      contactSchema.safeParse({ ...valid, name: "a".repeat(80) }).success,
    ).toBe(true);
    expect(errorsFor({ ...valid, email: `${"a".repeat(250)}@x.com` })).toEqual({
      email: "emailInvalid",
    });
    expect(errorsFor({ ...valid, message: "curta" })).toEqual({
      message: "messageTooShort",
    });
    expect(errorsFor({ ...valid, message: "a".repeat(4001) })).toEqual({
      message: "messageTooLong",
    });
    expect(
      contactSchema.safeParse({ ...valid, message: "a".repeat(4000) }).success,
    ).toBe(true);
  });

  it("aponta campos obrigatórios ausentes", () => {
    expect(
      errorsFor({ locale: "pt", website: "", turnstileToken: "" }),
    ).toEqual({
      name: "nameRequired",
      email: "emailInvalid",
      message: "messageTooShort",
    });
  });

  it("rejeita campos extras, idioma desconhecido e honeypot preenchido", () => {
    expect(contactSchema.safeParse({ ...valid, admin: true }).success).toBe(
      false,
    );
    expect(contactSchema.safeParse({ ...valid, locale: "es" }).success).toBe(
      false,
    );
    expect(contactSchema.safeParse({ ...valid, website: "x" }).success).toBe(
      false,
    );
  });

  it("rejeita token do captcha grande demais", () => {
    expect(
      contactSchema.safeParse({ ...valid, turnstileToken: "a".repeat(2049) })
        .success,
    ).toBe(false);
  });
});
