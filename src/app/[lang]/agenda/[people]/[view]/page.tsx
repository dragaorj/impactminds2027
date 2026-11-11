import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/lib/i18n";
import { SPEAKERS_VIEW_SLUGS, SPEAKER_SLUGS, speakersViewFromSlug } from "@/lib/nav";
import { SpeakersScreen, speakersMetadata } from "@/components/agenda/pages";

// Whole pages, served from the agenda cache: no instant-navigation shell checks.
export const instant = false;

// The speakers in a fixed view: /pt/agenda/palestrantes/cards, /lista, /fotos
// (es: /tarjetas, /lista, /fotos; en: /cards, /list, /photos).
export function generateStaticParams() {
  return locales.flatMap((lang) => SPEAKER_SLUGS.flatMap((people) => SPEAKERS_VIEW_SLUGS.map((view) => ({ lang, people, view }))));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; people: string; view: string }> }): Promise<Metadata> {
  const { lang, view } = await params;
  const v = speakersViewFromSlug(view);
  return hasLocale(lang) && v ? speakersMetadata(lang, v) : {};
}

export default async function SpeakersViewPage({ params }: { params: Promise<{ lang: string; people: string; view: string }> }) {
  const { lang, people, view } = await params;
  const v = speakersViewFromSlug(view);
  if (!hasLocale(lang) || !SPEAKER_SLUGS.includes(people) || !v) notFound();
  return <SpeakersScreen lang={lang} view={v} />;
}
