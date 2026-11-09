import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale, locales } from "@/lib/i18n";
import PdfReader from "@/components/PdfReader";

// The site's PDF reader page: one per file in public/docs (built ahead).
const DOCS = path.join(process.cwd(), "public", "docs");
const names = () =>
  fs.existsSync(DOCS) ? fs.readdirSync(DOCS).filter((f) => f.endsWith(".pdf")).map((f) => f.slice(0, -4)) : [];

export function generateStaticParams() {
  return locales.flatMap((lang) => names().map((name) => ({ lang, name })));
}

const title = (name: string, t: ReturnType<typeof getDictionary>) => {
  const report = name.match(/^impact-minds-(\d{4})-relatorio$/);
  if (report) return `${t.editions.report} ${report[1]}`;
  if (/patrocinio/.test(name)) return t.reader.sponsorDoc;
  return t.meta.title;
};

export async function generateMetadata({ params }: PageProps<"/[lang]/documento/[name]">): Promise<Metadata> {
  const { lang, name } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: `${title(name, t)} | ${t.meta.title}`, robots: { index: false } };
}

export default async function DocumentPage({ params }: PageProps<"/[lang]/documento/[name]">) {
  const { lang, name } = await params;
  if (!hasLocale(lang) || !names().includes(name)) notFound();
  const t = getDictionary(lang);
  return <PdfReader src={`/docs/${name}.pdf`} title={title(name, t)} back={`/${lang}`} labels={t.reader} />;
}
