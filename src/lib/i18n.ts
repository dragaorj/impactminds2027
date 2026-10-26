import pt from "./dictionaries/pt";
import es from "./dictionaries/es";
import en from "./dictionaries/en";

export const locales = ["pt", "es", "en"] as const;
export type Locale = (typeof locales)[number];
// Used when the browser asks for none of the three languages.
export const defaultLocale: Locale = "en";

export const htmlLang: Record<Locale, string> = { pt: "pt-BR", es: "es", en: "en" };

const dictionaries = { pt, es, en };

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const getDictionary = (locale: Locale) => dictionaries[locale];
