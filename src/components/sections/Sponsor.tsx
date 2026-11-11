import type { Dict } from "@/lib/dictionaries/pt";
import { links, participantsByYear } from "@/lib/site";
import { readerHref } from "@/lib/docs";
import type { Locale } from "@/lib/i18n";
import { Check } from "@phosphor-icons/react/dist/ssr";
import Art from "../Art";
import CountUp from "../CountUp";
import { Bezel, Button, H2, container, section } from "../ui";

// The invitation to sponsor the 2027 edition: the pitch and the button to the
// sponsorship brochure (PDF) on the left, the reasons in numbers in a card on
// the right, and what a sponsor gets in a row of three cards below.
export default function Sponsor({ t, locale, lang }: { t: Dict["sponsor"]; locale: string; lang: Locale }) {
  const first = participantsByYear[0].value;
  const last = participantsByYear[participantsByYear.length - 1].value;
  const growth = `+${Math.round(((last - first) / first) * 100)}%`;
  return (
    <section id="patrocinio" className={section} aria-labelledby="patrocinio-title">
      {/* Concentric rings sunk into the section's lower edge: the next section
          (and its wave) is painted over their lower half, so they sit behind it. */}
      <Art name="rings" className="absolute -bottom-36 left-[2vw] hidden w-72 xl:block" />
      <div className={`${container} grid grid-cols-1 gap-12 xl:grid-cols-12 xl:items-center xl:gap-12`}>
        <div className="xl:col-span-6" data-reveal>
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

        {/* Why it matters, in numbers: the growth comes from the attendance data. */}
        <Bezel className="xl:col-span-6" inner="bg-surface">
          <dl className="grid divide-y divide-line px-7 md:px-10" data-reveal data-nosplit>
            {[{ value: growth, label: t.growthLabel }, ...t.stats].map((s) => (
              <div key={s.label} className="flex items-baseline gap-5 py-6 md:py-7">
                <dd className="w-[5.5ch] shrink-0 whitespace-nowrap font-display text-[clamp(2.25rem,3.4vw,3.25rem)] leading-none text-brand">
                  <CountUp value={s.value} locale={locale} />
                </dd>
                <dt className="text-base leading-snug text-ink-2 md:text-lg">{s.label}</dt>
              </div>
            ))}
          </dl>
        </Bezel>

        {/* What a sponsor gets: a full-width row of three cards. */}
        <div className="xl:col-span-12" data-reveal>
          <p className="text-sm font-medium text-ink">{t.benefitsTitle}</p>
          <ul className="mt-4 grid gap-3 md:grid-cols-3 md:gap-4">
            {t.benefits.map((b) => (
              <li key={b} className="flex gap-3 rounded-[1.5rem] bg-surface/70 p-5 text-base leading-relaxed text-ink-2 ring-1 ring-line">
                <span aria-hidden className="mt-[0.3em] grid size-5 shrink-0 place-items-center rounded-full bg-sun/20 text-gold">
                  <Check size="0.75rem" weight="bold" />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
