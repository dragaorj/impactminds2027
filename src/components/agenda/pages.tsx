import type { Metadata } from "next";
import { getDictionary, htmlLang, locales, type Locale } from "@/lib/i18n";
import { agendaAdminPath, agendaPath, agendaSpeakersPath, agendaViewPath, speakersViewPath, type AgendaView, type SpeakersView } from "@/lib/nav";
import { getAgenda } from "@/lib/agenda";
import PlatformShell from "./PlatformShell";
import AgendaBoard, { Empty } from "./AgendaBoard";
import SpeakersBoard from "./SpeakersBoard";
import { AgendaProvider } from "./store";
import { LoginPage } from "./Editor";

// The platform's two pages, shared by every address that shows them:
// /pt/agenda, /pt/agenda/lista, /pt/agenda/grade, /pt/agenda/palestrantes,
// /pt/agenda/palestrantes/fotos … A view in the address is fixed by the link
// (handy to share or embed); the page itself still lets the visitor switch.

const EMPTY = { days: [], rooms: [], formats: [], talks: [], speakers: [] };

export function agendaMetadata(lang: Locale, view?: AgendaView): Metadata {
  const t = getDictionary(lang);
  const path = (l: Locale) => (view ? agendaViewPath(l, view) : agendaPath(l));
  return {
    title: `${t.agendaApp.title} | Impact Minds 2027`,
    description: t.agendaApp.subtitle,
    alternates: { canonical: path(lang), languages: { ...Object.fromEntries(locales.map((l) => [htmlLang[l], path(l)])), "x-default": path("en") } },
  };
}

export function speakersMetadata(lang: Locale, view?: SpeakersView): Metadata {
  const t = getDictionary(lang);
  const path = (l: Locale) => (view ? speakersViewPath(l, view) : agendaSpeakersPath(l));
  return {
    title: `${t.agendaApp.speakers} | Impact Minds 2027`,
    description: t.agendaApp.subtitle,
    alternates: { canonical: path(lang), languages: { ...Object.fromEntries(locales.map((l) => [htmlLang[l], path(l)])), "x-default": path("en") } },
  };
}

export async function AgendaScreen({ lang, view }: { lang: Locale; view?: AgendaView }) {
  const t = getDictionary(lang).agendaApp;
  const data = await getAgenda(lang);
  return (
    <AgendaProvider initial={data ?? EMPTY} lang={lang}>
      <PlatformShell lang={lang} tab="agenda" t={t}>
        <main id="conteudo">{data ? <AgendaBoard lang={lang} t={t} adminHref={agendaAdminPath(lang)} fixedView={view} /> : <Empty text={t.empty} />}</main>
      </PlatformShell>
    </AgendaProvider>
  );
}

export async function SpeakersScreen({ lang, view }: { lang: Locale; view?: SpeakersView }) {
  const t = getDictionary(lang).agendaApp;
  const data = await getAgenda(lang);
  return (
    <AgendaProvider initial={data ?? EMPTY} lang={lang}>
      <PlatformShell lang={lang} tab="speakers" t={t}>
        <main id="conteudo">
          {data ? <SpeakersBoard lang={lang} t={t} agendaHref={agendaPath(lang)} adminHref={agendaAdminPath(lang)} fixedView={view} /> : <Empty text={t.emptySpeakers} />}
        </main>
      </PlatformShell>
    </AgendaProvider>
  );
}

export function LoginScreen({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).agendaApp;
  return (
    <AgendaProvider initial={EMPTY} lang={lang}>
      <div className="platform min-h-[100dvh] font-sans">
        <LoginPage t={t} lang={lang} />
      </div>
    </AgendaProvider>
  );
}
