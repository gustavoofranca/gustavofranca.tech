export const LOCALES = ["pt", "en"] as const;

export type Locale = (typeof LOCALES)[number];
