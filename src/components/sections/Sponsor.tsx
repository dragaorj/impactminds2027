import type { Dict } from "@/lib/dictionaries/pt";
import { links } from "@/lib/site";
import { readerHref } from "@/lib/docs";
import type { Locale } from "@/lib/i18n";
import Art from "../Art";
import { Bezel, Button, H2, container, section } from "../ui";

// The invitation to sponsor the 2027 edition: the pitch and the button to the
// sponsorship brochure (PDF) on the left; on the right, in a card, what a
// sponsor's organization finds at Impact Minds, in large, easy-to-read type,
// one reason per row.
export default function Sponsor({ t, lang }: { t: Dict["sponsor"]; locale: string; lang: Locale }) {
  return (
    <section id="patrocinio" className={section} aria-labelledby="patrocinio-title">
      {/* Concentric rings sunk into the section's lower edge: the next section
          (and its wave) is painted over their lower half, so they sit behind it. */}
      <Art name="rings" className="absolute -bottom-36 left-[2vw] hidden w-72 xl:block" />
      <div className={`${container} grid grid-cols-1 gap-12 xl:grid-cols-12 xl:items-center xl:gap-12`}>
        <div className="xl:col-span-5" data-reveal>
          <H2 id="patrocinio-title" className="!text-[calc(clamp(min(1.75rem,6.9vw),4.4vw,3.5rem)-1px)]">
            {t.title}
          </H2>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-ink-2">{t.text}</p>
          <div className="mt-9">
            <Button href={readerHref(lang, links.sponsorBrochure[lang])} external={links.sponsorBrochure[lang].startsWith("http")}>
              {t.cta}
            </Button>
          </div>
        </div>

        {/* What a sponsor gets. */}
        <Bezel className="xl:col-span-7" inner="bg-surface">
          <div className="px-7 py-8 md:px-10 md:py-10" data-reveal data-nosplit>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold md:text-sm">{t.benefitsTitle}</p>
            <ol className="mt-4 divide-y divide-line">
              {t.benefits.map((b, i) => (
                <li key={b} className="flex items-baseline gap-5 py-6 first:pt-4 last:pb-0 md:gap-7 md:py-7">
                  <span aria-hidden className="w-[2ch] shrink-0 font-display text-[clamp(2rem,3vw,2.75rem)] leading-none text-brand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-[clamp(1.25rem,1.8vw,1.625rem)] leading-snug text-ink">{b}</span>
                </li>
              ))}
            </ol>
          </div>
        </Bezel>
      </div>
    </section>
  );
}
