import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale, htmlLang, locales } from "@/lib/i18n";
import { editionsPath } from "@/lib/nav";
import { editionMedia } from "@/lib/editions";
import { privacyCopy, privacyPath } from "@/lib/privacy";
import Nav from "@/components/Nav";
import Footer from "@/components/sections/Footer";
import Editions from "@/components/sections/Editions";
import ScrollFx from "@/components/ScrollFx";
import BackToTop from "@/components/BackToTop";
import { container } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/edicoes">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: `${t.editions.title} | ${t.meta.title}`,
    description: t.editions.intro,
    alternates: {
      languages: { ...Object.fromEntries(locales.map((l) => [htmlLang[l], editionsPath(l)])), "x-default": editionsPath("en") },
    },
  };
}

// Past editions, on a page of their own: the title and a short intro, then the
// photo gallery with the edition picker and each edition's full report.
export default async function EditionsPage({ params }: PageProps<"/[lang]/edicoes">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const p = privacyCopy[lang];

  return (
    <>
      <Nav lang={lang} nav={t.nav} controls={t.controls} privacyLabel={p.navLabel} sub="/edicoes" />
      <main id="conteudo" tabIndex={-1} className="w-full max-w-full overflow-x-clip outline-none">
        <section className="relative pb-12 pt-36 md:pb-16 md:pt-48">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(217_184_101/0.14),transparent)]"
          />
          <div className={container}>
            <h1 className="font-display text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.98] text-balance text-ink">{t.editions.title}</h1>
            <p className="mt-7 max-w-[62ch] text-lg leading-relaxed text-ink-2 md:text-xl">{t.editions.intro}</p>
          </div>
        </section>
        <Editions t={t.editions} media={editionMedia(t.editions.list.map((e) => e.year), lang)} asPage />
      </main>
      <Footer t={t.footer} contact={t.contact} hero={t.hero} nav={t.nav} lang={lang} privacy={{ href: privacyPath(lang), label: p.navLabel }} />
      <BackToTop label={t.footer.backToTop} />
      <ScrollFx />
    </>
  );
}
