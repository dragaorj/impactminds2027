import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n";
import { AgendaScreen, agendaMetadata } from "@/components/agenda/pages";

// Whole pages, served from the agenda cache: no instant-navigation shell checks.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[lang]/agenda">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? agendaMetadata(lang) : {};
}

// The agenda (anyone, no login; the team signs in here to edit), read from
// the agenda system's database.
export default async function AgendaPage({ params }: PageProps<"/[lang]/agenda">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <AgendaScreen lang={lang} />;
}
