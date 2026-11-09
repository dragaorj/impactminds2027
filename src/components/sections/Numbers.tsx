import Image from "next/image";
import type { Icon } from "@phosphor-icons/react";
import {
  Buildings,
  ChatsCircle,
  GlobeHemisphereWest,
  MicrophoneStage,
  PresentationChart,
  Tree,
  UsersThree,
  ArrowUpRight,
  FilePdf,
  Star,
} from "@phosphor-icons/react/dist/ssr";
import type { Dict } from "@/lib/dictionaries/pt";
import { links, photos } from "@/lib/site";
import { readerHref } from "@/lib/docs";
import type { Locale } from "@/lib/i18n";
import Art from "../Art";
import NumbersShow, { type ShowCopy } from "../NumbersShow";
import WatchShow from "../WatchShow";
import { Bezel, container, section } from "../ui";

function Stat({
  value,
  prefix = "",
  suffix,
  decimals = 0,
  locale,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  locale: string;
  className?: string;
}) {
  return (
    <p className={`font-display leading-none tabular-nums ${className}`}>
      {prefix}
      <span data-count={value} data-locale={locale} data-decimals={decimals || undefined}>
        {value.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      </span>
      {suffix && <span className="text-[0.45em] text-muted">{suffix}</span>}
    </p>
  );
}

// Small gold icon chip that opens every card; `tone` adapts it to the photo card.
function Chip({ icon: I, tone = "default" }: { icon: Icon; tone?: "default" | "dark" }) {
  const tones = {
    default: "bg-sun/15 text-gold ring-gold/25",
    dark: "bg-white/10 text-[#E2C985] ring-white/20 backdrop-blur-md",
  } as const;
  return (
    <span className={`grid size-11 place-items-center rounded-full ring-1 ${tones[tone]}`}>
      <I size="1.25rem" weight="light" />
    </span>
  );
}

// The average connections per organisation drawn small: a gold hub with
// eleven nodes around it, turning and breathing like the survey network.
function MiniNetwork() {
  const n = 11;
  return (
    <svg viewBox="0 0 120 120" aria-hidden className="size-24 shrink-0 md:size-28">
      <g className="net-spin">
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = 60 + 44 * Math.cos(a);
          const y = 60 + 44 * Math.sin(a);
          return (
            <g key={i} className="net-spoke" style={{ "--i": i } as React.CSSProperties}>
              <line x1="60" y1="60" x2={x} y2={y} stroke="var(--gold)" strokeWidth="0.8" opacity="0.55" />
              <circle cx={x} cy={y} r="4" fill="var(--terra)" />
            </g>
          );
        })}
      </g>
      <circle cx="60" cy="60" r="13" fill="var(--sun)" />
    </svg>
  );
}

// Bento of the 2026 edition: the headline figure sits on a real photo of the
// community and every other card shares one plain look; each opens with a gold
// icon chip and lifts on hover. The return score closes it, highlighted. The
// title breaks after the edition so "em números" gets its own gold line.
export default function Numbers({ t, locale, lang, show }: { t: Dict["numbers"]; locale: string; lang: Locale; show: ShowCopy }) {
  const label = "mt-3 max-w-[24ch] text-[0.9375rem] leading-snug";
  const card = "transition-[transform,box-shadow] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 hover:ring-sun/50";
  const [titleHead, titleTail] = t.title.split(/(?<=2026)\s/);

  return (
    <section id="numeros" className={section} aria-labelledby="numeros-title">
      <Art name="petals" className="pointer-events-none absolute bottom-6 left-[1.25vw] hidden w-16 lg:block" />
      <div className={container}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between" data-reveal>
          <div className="max-w-3xl">
          <h2 id="numeros-title" className="font-display text-[calc(clamp(min(1.875rem,7.4vw),5.2vw,4.25rem)-1px)] leading-[1.02] text-ink" data-nosplit>
            <span className="block">{titleHead}</span>
            {titleTail && <span className="block text-gold">{titleTail}</span>}
          </h2>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-ink-2">{t.lead}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <WatchShow label={t.watch} />
            {/* The full 2026 report (PDF, in Portuguese), in the site's reader. */}
            <a
              href={readerHref(lang, links.report2026)}
              className="group inline-flex min-h-12 min-w-0 items-center gap-3 rounded-full py-1.5 pl-2 pr-5 text-left text-[0.9375rem] font-medium leading-snug btn-outline transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:bg-sun hover:text-sun-ink active:scale-[0.98]"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sun/15 text-gold transition-colors group-hover:bg-sun-ink/10 group-hover:text-sun-ink">
                <FilePdf size="1.05rem" weight="light" />
              </span>
              {t.report}
              <ArrowUpRight size="1rem" className="shrink-0 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="relative mt-14 grid grid-flow-dense grid-cols-2 gap-3 md:mt-20 lg:auto-rows-[minmax(13rem,auto)] lg:grid-cols-12 lg:gap-4">
          {/* Headline: participants over the community photo. */}
          <Bezel className={`col-span-2 lg:col-span-6 lg:row-span-2 ${card}`} inner="bg-block text-white">
            <div data-reveal className="group relative flex h-full min-h-[22rem] flex-col justify-between p-7 md:p-10">
              <Image
                src={photos.numbersHero}
                alt=""
                fill
                sizes="(min-width:1024px) 50vw, 100vw"
                className="object-cover object-[50%_45%] transition-transform duration-[1800ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
              />
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(200deg,rgb(34_14_52/0.15)_10%,rgb(34_14_52/0.55)_45%,rgb(34_14_52/0.95))]" />
              <div className="relative flex items-center justify-between">
                <Chip icon={UsersThree} tone="dark" />
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/20 backdrop-blur-md">{t.place}</span>
              </div>
              <div className="relative">
                <Stat value={580} locale={locale} className="text-[clamp(5rem,12vw,9.5rem)]" />
                <p className="mt-2 text-xl text-[#E2C985]">{t.participants}</p>
              </div>
            </div>
          </Bezel>

          <Bezel className={`lg:col-span-3 ${card}`}>
            <div data-reveal className="flex h-full flex-col justify-between gap-6 p-6">
              <Chip icon={Buildings} />
              <div>
                <Stat value={350} locale={locale} className="text-5xl text-brand md:text-6xl" />
                <p className={`${label} text-ink-2`}>{t.organizations}</p>
              </div>
            </div>
          </Bezel>

          <Bezel className={`lg:col-span-3 ${card}`}>
            <div data-reveal className="flex h-full flex-col justify-between gap-6 p-6">
              <Chip icon={GlobeHemisphereWest} />
              <div>
                <Stat value={33} locale={locale} className="text-5xl text-brand md:text-6xl" />
                <p className={`${label} text-ink-2`}>{t.countries}</p>
              </div>
            </div>
          </Bezel>

          <Bezel className={`lg:col-span-3 ${card}`}>
            <div data-reveal className="flex h-full flex-col justify-between gap-6 p-6">
              <Chip icon={MicrophoneStage} />
              <div>
                <Stat value={220} prefix="+" locale={locale} className="text-5xl text-brand md:text-6xl" />
                <p className={`${label} text-ink-2`}>{t.speakers}</p>
              </div>
            </div>
          </Bezel>

          <Bezel className={`lg:col-span-3 ${card}`}>
            <div data-reveal className="flex h-full flex-col justify-between gap-6 p-6">
              <Chip icon={Tree} />
              <div>
                <Stat value={12} locale={locale} className="text-5xl text-brand md:text-6xl" />
                <p className={`${label} text-ink-2`}>{t.fieldVisits}</p>
              </div>
            </div>
          </Bezel>

          {/* Full row below desktop, so it never sits beside an empty cell. */}
          <Bezel className={`col-span-2 lg:col-span-3 ${card}`}>
            <div data-reveal className="flex h-full flex-col justify-between gap-6 p-6">
              <Chip icon={ChatsCircle} />
              <div>
                <Stat value={65} prefix="+" locale={locale} className="text-5xl text-brand md:text-6xl" />
                <p className={`${label} text-ink-2`}>{t.sessions}</p>
              </div>
            </div>
          </Bezel>

          <Bezel className={`col-span-2 lg:col-span-3 ${card}`}>
            <div data-reveal className="flex h-full flex-col justify-between gap-6 p-6">
              <Chip icon={PresentationChart} />
              <div>
                <Stat value={23} locale={locale} className="text-5xl text-brand md:text-6xl" />
                <p className={`${label} text-ink-2`}>{t.panels}</p>
              </div>
            </div>
          </Bezel>

          {/* The connections made, beside how likely they are to meet again. */}
          <Bezel className={`col-span-2 lg:col-span-6 ${card}`}>
            <div data-reveal className="grid h-full gap-6 p-6 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <Stat value={11} locale={locale} className="text-5xl text-brand md:text-6xl" />
                  <p className={`${label} text-ink-2`}>{t.connections}</p>
                </div>
                <MiniNetwork />
              </div>
              <span aria-hidden className="h-px w-full bg-line sm:h-full sm:w-px" />
              <div>
                <Stat value={4.2} decimals={1} suffix="/5" locale={locale} className="text-5xl text-brand md:text-6xl" />
                <p className={`${label} text-ink-2`}>{t.reconnect}</p>
              </div>
            </div>
          </Bezel>

          {/* Motion presentation played over the bento ("Ver apresentação"). */}
          <NumbersShow t={t} show={show} locale={locale} />
        </div>

        {/* Below the bento, one slim line: how likely participants are to come back. */}
        <Bezel className={`mt-3 lg:mt-4 ${card}`} inner="bg-sun/10">
          <div data-reveal className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 md:px-7 md:py-5">
            <Chip icon={Star} />
            <Stat value={8.5} decimals={1} suffix="/10*" locale={locale} className="text-4xl text-brand md:text-5xl" />
            <p className="text-base leading-snug text-ink-2 md:text-lg">{t.comeBack}</p>
          </div>
        </Bezel>
        <p className="mt-4 text-xs text-muted">{t.footnote}</p>
      </div>
    </section>
  );
}
