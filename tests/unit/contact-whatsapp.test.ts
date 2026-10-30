import { describe, expect, it } from "vitest";
import { decodePhone, encodePhone, whatsappUrl } from "@/lib/contact/whatsapp";

describe("whatsapp", () => {
  it("o número codificado não aparece como dígitos no HTML", () => {
    const encoded = encodePhone("5500000000000");
    expect(encoded).not.toMatch(/\d{6,}/);
    expect(decodePhone(encoded)).toBe("5500000000000");
  });

  it("decodificação inválida devolve null", () => {
    expect(decodePhone("")).toBeNull();
    expect(decodePhone("###")).toBeNull();
    expect(decodePhone(encodePhone("abc"))).toBeNull();
  });

  it("monta o link do wa.me", () => {
    expect(whatsappUrl("5500000000000")).toBe("https://wa.me/5500000000000");
  });
});
