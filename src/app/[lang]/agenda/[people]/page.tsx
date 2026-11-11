import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/lib/i18n";
import { AGENDA_VIEW_SLUGS, LOGIN_SLUG, SPEAKER_SLUGS, agendaViewFromSlug } from "@/lib/nav";
import { AgendaScreen, LoginScreen, SpeakersScreen, agendaMetadata, speakersMetadata } from "@/components/agenda/pages";

// Whole pages, served from the agenda cache: no instant-navigation shell checks.
export const instant = false;

// One level under /agenda: the speakers (/palestrantes, /ponentes, /speakers)
// a fixed agenda view (/lista, /grade, /grilla, /list, /grid), or the team's
// sign-in (/entrar).
export function generateStaticParams() {
  return locales.flatMap((lang) => [...SPEAKER_SLUGS, ...AGENDA_VIEW_SLUGS, LOGIN_SLUG].map((people) => ({ lang, people })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/agenda/[people]">): Promise<Metadata> {
  const { lang, people } = await params;
  if (!hasLocale(lang)) return {};
  if (people === LOGIN_SLUG) return { title: "Login | Impact Minds 2027", robots: { index: false, follow: false } };
  const view = agendaViewFromSlug(people);
  return view ? agendaMetadata(lang, view) : speakersMetadata(lang);
}

export default async function AgendaSubPage({ params }: PageProps<"/[lang]/agenda/[people]">) {
  const { lang, people } = await params;
  if (!hasLocale(lang)) notFound();
  if (people === LOGIN_SLUG) return <LoginScreen lang={lang} />;
  const view = agendaViewFromSlug(people);
  if (view) return <AgendaScreen lang={lang} view={view} />;
  if (!SPEAKER_SLUGS.includes(people)) notFound();
  return <SpeakersScreen lang={lang} />;
}
