import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n";
import Home from "./home";

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <Home lang={lang} />;
}
