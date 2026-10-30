import { describe, expect, it } from "vitest";
import en from "@/i18n/en";
import pt from "@/i18n/pt";
import { formatMonth, t } from "@/lib/i18n";

describe("t", () => {
  it("devolve o dicionário do idioma", () => {
    expect(t("pt")).toBe(pt);
    expect(t("en")).toBe(en);
  });

  it("os dois dicionários têm as mesmas chaves", () => {
    const keys = (value: unknown, prefix = ""): string[] =>
      typeof value === "object" && value !== null
        ? Object.entries(value).flatMap(([k, v]) => keys(v, `${prefix}${k}.`))
        : [prefix];
    expect(keys(en)).toEqual(keys(pt));
  });

  it("o rótulo do tema continua casando com /tema/i no PT", () => {
    expect(t("pt").theme.toggle).toMatch(/tema/i);
  });
});

describe("formatMonth", () => {
  it("formata mês e ano no idioma", () => {
    expect(formatMonth("2023-02", "pt")).toBe("fev. 2023");
    expect(formatMonth("2023-02", "en")).toBe("Feb 2023");
  });

  it("não desloca o mês por fuso horário", () => {
    expect(formatMonth("2024-01", "en")).toBe("Jan 2024");
    expect(formatMonth("2024-12", "pt")).toBe("dez. 2024");
  });

  it("rejeita formato inválido", () => {
    expect(() => formatMonth("2023-13", "pt")).toThrow();
    expect(() => formatMonth("fev 2023", "pt")).toThrow();
  });
});
