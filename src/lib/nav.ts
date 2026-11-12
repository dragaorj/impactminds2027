import type { Dict } from "@/lib/dictionaries/pt";
import type { Locale } from "@/lib/i18n";

export const editionsPath = (lang: Locale) => `/${lang}/edicoes`;
// The agenda platform: the public agenda and speakers (pages of the site,
// read from the agenda's database), editing included.
export const agendaPath = (lang: Locale) => `/${lang}/agenda`;
export const agendaSpeakersPath = (lang: Locale) =>
  `/${lang}/agenda/${lang === "en" ? "speakers" : lang === "es" ? "ponentes" : "palestrantes"}`;
// The team's sign-in, a page of its own (nothing of the agenda behind it).
export const LOGIN_SLUG = "entrar";
export const agendaLoginPath = (lang: Locale) => `/${lang}/agenda/${LOGIN_SLUG}`;

// Fixed links for each way of viewing (to share or embed with ?embed=1):
// /pt/agenda/lista · /pt/agenda/grade, /pt/agenda/palestrantes/fotos …
// Each language has its own words; every word works in every language.
export type AgendaView = "list" | "grid";
export type SpeakersView = "cards" | "list" | "photos";
const AGENDA_VIEW_SLUG: Record<Locale, Record<AgendaView, string>> = {
  pt: { list: "lista", grid: "grade" },
  es: { list: "lista", grid: "grilla" },
  en: { list: "list", grid: "grid" },
};
const SPEAKERS_VIEW_SLUG: Record<Locale, Record<SpeakersView, string>> = {
  pt: { cards: "cards", list: "lista", photos: "fotos" },
  es: { cards: "tarjetas", list: "lista", photos: "fotos" },
  en: { cards: "cards", list: "list", photos: "photos" },
};
export const SPEAKER_SLUGS = ["palestrantes", "ponentes", "speakers"];
export const agendaViewFromSlug = (slug: string): AgendaView | null =>
  ["lista", "list"].includes(slug) ? "list" : ["grade", "grilla", "grid"].includes(slug) ? "grid" : null;
export const speakersViewFromSlug = (slug: string): SpeakersView | null =>
  slug === "cards" || slug === "tarjetas" ? "cards" : ["lista", "list"].includes(slug) ? "list" : ["fotos", "photos"].includes(slug) ? "photos" : null;
export const agendaViewPath = (lang: Locale, view: AgendaView) => `${agendaPath(lang)}/${AGENDA_VIEW_SLUG[lang][view]}`;
export const speakersViewPath = (lang: Locale, view: SpeakersView) => `${agendaSpeakersPath(lang)}/${SPEAKERS_VIEW_SLUG[lang][view]}`;
// Every slug, for building the pages ahead.
export const AGENDA_VIEW_SLUGS = [...new Set(Object.values(AGENDA_VIEW_SLUG).flatMap((x) => Object.values(x)))];
export const SPEAKERS_VIEW_SLUGS = [...new Set(Object.values(SPEAKERS_VIEW_SLUG).flatMap((x) => Object.values(x)))];

// The site's main links, shared by the menu and the footer. Off the home page
// the section links lead back to it; the contact form is in every page's footer.
export const mainNav = (lang: Locale, nav: Dict["nav"], onHome: boolean) => {
  const home = onHome ? "" : `/${lang}`;
  return [
    { href: `${home}#sobre`, label: nav.about },
    { href: `${home}#cartagena`, label: nav.cartagena },
    { href: editionsPath(lang), label: nav.editions },
    { href: "#contato", label: nav.contact },
  ];
};
