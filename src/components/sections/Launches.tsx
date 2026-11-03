import type { Dict } from "@/lib/dictionaries/pt";
import Art from "../Art";
import CountUp from "../CountUp";
import { Bezel, H2, container, section } from "../ui";

// Three launches with the same weight: equal cards side by side (stacked on
// phones), each with its theme, name, story, eligible countries and key
// figure on a shared baseline; the commitment they share closes the section.
export default function Launches({ t, locale }: { t: Dict["launches"]; locale: string }) {
  return (
    <section id="lancamentos" className={section} aria-labelledby="lancamentos-title">
      <Art name="mosaic" className="pointer-events-none absolute bottom-6 left-[1.25vw] hidden w-20 lg:block" />
      <div className={container}>
        <div className="max-w-3xl">
          <H2 id="lancamentos-title">{t.title}</H2>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-ink-2">{t.lead}</p>
        </div>

        <div className="mt-14 grid gap-3 md:mt-20 lg:grid-cols-3 lg:gap-4">
          {t.items.map((item) => (
            <Bezel key={item.title} inner="bg-surface">
              <article data-reveal className="flex h-full flex-col gap-8 p-7 md:p-9">
                <div className="flex-1">
                  <span className="inline-block rounded-full bg-sun/15 px-3 py-1 text-xs font-medium text-gold ring-1 ring-gold/25">
                    {item.tag}
                  </span>
                  <h3 className="mt-5 font-display text-2xl leading-[1.1] text-ink md:text-3xl">{item.title}</h3>
                  <div className="mt-4 space-y-4 text-base leading-relaxed text-ink-2">
                    {item.paragraphs.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                  {item.countries && (
                    <p className="mt-5 text-sm leading-relaxed text-ink-2" data-nosplit>
                      <span className="font-medium text-ink">{t.eligible} </span>
                      {item.countries}
                    </p>
                  )}
                </div>
                {/* The key figure and what it measures share one baseline,
                    ruled off from the story above; the same place on every card. */}
                <p className="flex items-end justify-between gap-6 border-t border-line pt-6" data-nosplit>
                  <span className="flex items-baseline gap-2 whitespace-nowrap font-display text-5xl leading-none text-brand">
                    {item.figure.startsWith("USD ") && (
                      <span className="font-sans text-xs font-medium tracking-[0.18em] text-muted md:text-sm">USD</span>
                    )}
                    <span>
                      <CountUp value={item.figure.replace(/^USD /, "")} locale={locale} />
                    </span>
                  </span>
                  <span className="max-w-[12ch] pb-1 text-right text-xs font-medium uppercase leading-snug tracking-[0.14em] text-ink-2 md:text-[0.8125rem]">
                    {item.figureLabel}
                  </span>
                </p>
              </article>
            </Bezel>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-[58ch] text-center font-display text-xl leading-snug text-ink md:mt-16 md:text-2xl" data-reveal>
          {t.closing}
        </p>
      </div>
    </section>
  );
}
