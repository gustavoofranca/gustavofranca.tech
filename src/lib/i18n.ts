import en from "@/i18n/en";
import type { Locale } from "@/i18n/locales";
import pt, { type Dictionary } from "@/i18n/pt";

export type { Dictionary, Locale };

const dictionaries: Record<Locale, Dictionary> = { pt, en };

export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}

const INTL_LOCALE: Record<Locale, string> = { pt: "pt-BR", en: "en-US" };

// "2023-02" → "fev. 2023" (pt) / "Feb 2023" (en). Monta mês + ano à mão porque
// o pt-BR do Intl insere "de" ("fev. de 2023"). UTC evita que o fuso desloque o mês.
export function formatMonth(isoMonth: string, locale: Locale): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(isoMonth);
  if (!match) throw new Error(`formatMonth: mês inválido "${isoMonth}".`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  const parts = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  return `${month} ${year}`;
}
