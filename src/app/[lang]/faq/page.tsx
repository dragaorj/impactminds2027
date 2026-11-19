import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale, htmlLang, locales } from "@/lib/i18n";
import { faqCopy, faqPath, FAQ_EMAIL } from "@/lib/faq";
import { links } from "@/lib/site";
import { readerHref } from "@/lib/docs";
import { privacyCopy, privacyPath } from "@/lib/privacy";
import Nav from "@/components/Nav";
import Footer from "@/components/sections/Footer";
import FaqList from "@/components/sections/Faq";
import ScrollFx from "@/components/ScrollFx";
import BackToTop from "@/components/BackToTop";
import { container } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/faq">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  const f = faqCopy[lang];
  return {
    title: `${f.title} | ${t.meta.title}`,
    description: f.intro,
    alternates: {
      languages: { ...Object.fromEntries(locales.map((l) => [htmlLang[l], faqPath(l)])), "x-default": faqPath("en") },
    },
  };
}

// The FAQ, on a page of its own: the title and a short intro, then the
// questions (open in place) beside a card with the contact e-mail, which
// stays in view on wide screens.
export default async function FaqPage({ params }: PageProps<"/[lang]/faq">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const f = faqCopy[lang];
  const p = privacyCopy[lang];
  const sponsorHref = readerHref(lang, links.sponsorBrochure[lang]);

  return (
    <>
      <Nav lang={lang} nav={t.nav} controls={t.controls} privacyLabel={p.navLabel} sub="/faq" />
      <main id="conteudo" tabIndex={-1} className="w-full max-w-full overflow-x-clip outline-none">
        <section className="relative pb-24 pt-36 md:pb-36 md:pt-48">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(217_184_101/0.14),transparent)]"
          />
          <div className={`${container} grid gap-12 xl:grid-cols-12 xl:gap-16`}>
            <div className="xl:col-span-4">
              <div className="xl:sticky xl:top-32">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold md:text-sm">{f.kicker}</p>
                <h1 className="mt-5 font-display text-[clamp(2.75rem,6vw,5rem)] leading-[0.98] text-balance text-ink">{f.title}</h1>
                <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-ink-2">{f.intro}</p>
                <div className="mt-10 rounded-[1.75rem] bg-bg-2 p-7 ring-1 ring-line">
                  <p className="font-display text-2xl text-ink">{f.moreTitle}</p>
                  <p className="mt-2 text-base leading-relaxed text-ink-2">{f.moreText}</p>
                  <a href={`mailto:${FAQ_EMAIL}`} className="mt-3 inline-block break-all text-lg font-medium text-brand underline decoration-brand/30 underline-offset-4 transition-colors hover:decoration-brand">
                    {FAQ_EMAIL}
                  </a>
                </div>
              </div>
            </div>
            <div className="xl:col-span-8">
              <FaqList items={f.items} sponsorHref={sponsorHref} />
            </div>
          </div>
        </section>
      </main>
      <Footer t={t.footer} contact={t.contact} hero={t.hero} nav={t.nav} lang={lang} sub="/faq" privacy={{ href: privacyPath(lang), label: p.navLabel }} />
      <BackToTop label={t.footer.backToTop} />
      <ScrollFx />
    </>
  );
}
