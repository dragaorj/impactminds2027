import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { getDictionary, hasLocale, htmlLang, locales } from "@/lib/i18n";
import { PRIVACY_CONTACT, PRIVACY_UPDATED, privacyCopy, privacyPath } from "@/lib/privacy";
import Nav from "@/components/Nav";
import Footer from "@/components/sections/Footer";
import ScrollFx from "@/components/ScrollFx";
import BackToTop from "@/components/BackToTop";
import ConsentButton from "@/components/ConsentButton";
import { Bezel, container } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const p = privacyCopy[lang];
  return {
    title: p.meta.title,
    description: p.meta.description,
    alternates: {
      languages: { ...Object.fromEntries(locales.map((l) => [htmlLang[l], privacyPath(l)])), "x-default": privacyPath("en") },
    },
  };
}

const pill =
  "group inline-flex h-12 items-center gap-2.5 rounded-full p-1.5 pr-5 text-[0.9375rem] font-medium transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] active:scale-[0.97]";

// Privacy notice (LGPD): a numbered index beside the text on wide screens,
// each section headed by its gold number, and the contact card at the end.
export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const p = privacyCopy[lang];
  const updated = new Intl.DateTimeFormat(htmlLang[lang], { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${PRIVACY_UPDATED}T12:00:00Z`),
  );
  const num = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <>
      <Nav lang={lang} nav={t.nav} controls={t.controls} privacyLabel={p.navLabel} sub="/privacy" />
      <main id="conteudo" tabIndex={-1} className="w-full max-w-full overflow-x-clip outline-none">
        <section className="relative pb-20 pt-36 md:pb-28 md:pt-48">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(217_184_101/0.14),transparent)]"
          />
          <div className={container}>
            <div className="max-w-[60rem]">
              <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-ink/5 px-4 py-1.5 text-sm text-ink-2 ring-1 ring-line" data-nosplit>
                <span>{p.eyebrow}</span>
                <span aria-hidden className="h-3 w-px bg-line" />
                <span className="font-medium text-gold">
                  {p.updated}: {updated}
                </span>
              </p>
              <h1 className="mt-7 font-display text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.98] text-ink">{p.title}</h1>
              <p className="mt-7 max-w-[62ch] text-lg leading-relaxed text-ink-2 md:text-xl">{p.intro}</p>
            </div>

            <div className="mt-16 grid gap-12 md:mt-24 lg:grid-cols-12 lg:gap-16">
              {/* Index: sticky beside the text from lg up. */}
              <nav aria-label={p.title} className="lg:col-span-4">
                <ol className="rounded-[2rem] bg-ink/[0.03] p-2 ring-1 ring-line lg:sticky lg:top-28">
                  {p.sections.map((s, i) => (
                    <li key={s.title}>
                      <a
                        href={`#s-${i + 1}`}
                        className="group flex items-baseline gap-4 rounded-[1.5rem] px-4 py-2.5 text-ink-2 transition-colors duration-300 hover:bg-sun/10 hover:text-ink"
                      >
                        <span className="font-display text-sm tabular-nums text-gold">{num(i)}</span>
                        <span className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-x-1">{s.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              <article className="lg:col-span-8">
                {p.sections.map((s, i) => (
                  <section key={s.title} id={`s-${i + 1}`} className="scroll-mt-28 border-t border-line py-10 first:border-t-0 first:pt-0 md:py-12">
                    <div className="flex items-baseline gap-5">
                      <span className="font-display text-lg tabular-nums text-gold" aria-hidden>
                        {num(i)}
                      </span>
                      <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.08] text-ink">{s.title}</h2>
                    </div>
                    <div className="mt-5 space-y-4 text-base leading-relaxed text-ink-2 md:pl-11 md:text-[1.0625rem]">
                      {s.paragraphs?.map((para) => <p key={para}>{para}</p>)}
                      {s.items && (
                        <ul className="space-y-3">
                          {s.items.map((item) => (
                            <li key={item} className="flex gap-3.5">
                              <span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-sun" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                ))}

                {/* Contact: the controller's address, cookie choice and the way back. */}
                <Bezel className="mt-6">
                  <div className="relative isolate overflow-hidden p-7 md:p-10">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-20 -top-24 -z-10 size-64 rounded-full bg-[radial-gradient(closest-side,rgb(217_184_101/0.2),transparent)]"
                    />
                    <p className="max-w-[40ch] font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.1] text-ink">{p.contactLead}</p>
                    <div className="mt-7 flex flex-wrap gap-3" data-nosplit>
                      <a href={`mailto:${PRIVACY_CONTACT}`} className={`${pill} btn-solid`}>
                        <span className="grid size-9 place-items-center rounded-full bg-brand-ink/15">
                          <EnvelopeSimple size="1rem" />
                        </span>
                        {PRIVACY_CONTACT}
                      </a>
                      <ConsentButton className={`${pill} btn-outline pl-5`}>{p.manage}</ConsentButton>
                    </div>
                  </div>
                </Bezel>

                <a
                  href={`/${lang}`}
                  className="group mt-10 inline-flex items-center gap-3 text-ink-2 transition-colors duration-300 hover:text-gold"
                >
                  <span className="grid size-10 place-items-center rounded-full ring-1 ring-line transition-[background-color,color,box-shadow] duration-500 group-hover:bg-sun group-hover:text-sun-ink group-hover:ring-sun">
                    <ArrowLeft size="1rem" className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-x-0.5" />
                  </span>
                  {p.back}
                </a>
              </article>
            </div>
          </div>
        </section>
      </main>
      <Footer
        t={t.footer}
        hero={t.hero}
        nav={t.nav}
        home={`/${lang}`}
        privacy={{ href: privacyPath(lang), label: p.navLabel, manage: p.manage }}
      />
      <BackToTop label={t.footer.backToTop} />
      <ScrollFx />
    </>
  );
}
