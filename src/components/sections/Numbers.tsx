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
} from "@phosphor-icons/react/dist/ssr";
import type { Dict } from "@/lib/dictionaries/pt";
import { photos } from "@/lib/site";
import Art from "../Art";
import { Bezel, container, section } from "../ui";

function Stat({ value, prefix = "", locale, className = "" }: { value: number; prefix?: string; locale: string; className?: string }) {
  return (
    <p className={`font-display leading-none tabular-nums ${className}`}>
      {prefix}
      <span data-count={value} data-locale={locale}>
        {value.toLocaleString(locale)}
      </span>
    </p>
  );
}

// Small gold icon chip that opens every card; `tone` adapts it to the card colour.
function Chip({ icon: I, tone = "default" }: { icon: Icon; tone?: "default" | "dark" | "onGold" | "onLavender" }) {
  const tones = {
    default: "bg-sun/15 text-gold ring-gold/25",
    dark: "bg-white/10 text-[#E2C985] ring-white/20 backdrop-blur-md",
    onGold: "bg-sun-ink/10 text-sun-ink ring-sun-ink/15",
    onLavender: "bg-terra-ink/10 text-terra-ink ring-terra-ink/15",
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
// community, every card opens with a gold icon chip and lifts on hover. The
// title breaks after the edition so "em números" gets its own gold line.
export default function Numbers({ t, locale }: { t: Dict["numbers"]; locale: string }) {
  const label = "mt-3 max-w-[24ch] text-[0.9375rem] leading-snug";
  const card = "transition-[transform,box-shadow] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 hover:ring-sun/50";
  const [titleHead, titleTail] = t.title.split(/(?<=2026)\s/);

  return (
    <section id="numeros" className={section} aria-labelledby="numeros-title">
      <Art name="mosaic" className="pointer-events-none absolute bottom-6 left-[calc(4vw_-_13rem)] hidden w-52 lg:block" />
      <div className={container}>
        <div className="max-w-3xl" data-reveal>
          <h2 id="numeros-title" className="font-display text-[clamp(2.25rem,5.2vw,4.25rem)] leading-[1.02] text-ink" data-nosplit>
            <span className="block">{titleHead}</span>
            {titleTail && <span className="block text-gold">{titleTail}</span>}
          </h2>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-ink-2">{t.lead}</p>
        </div>

        <div className="mt-14 grid grid-flow-dense grid-cols-2 gap-3 md:mt-20 lg:auto-rows-[minmax(13rem,auto)] lg:grid-cols-12 lg:gap-4">
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

          <Bezel className={`lg:col-span-3 ${card}`} inner="bg-sun text-sun-ink">
            <div data-reveal className="flex h-full flex-col justify-between gap-6 p-6">
              <Art name="arcs" className="absolute -right-2 -top-2 -z-10 w-24 !opacity-40 [color:var(--sun-ink)]" />
              <Chip icon={GlobeHemisphereWest} tone="onGold" />
              <div>
                <Stat value={33} locale={locale} className="text-5xl md:text-6xl" />
                <p className={label}>{t.countries}</p>
              </div>
            </div>
          </Bezel>

          <Bezel className={`lg:col-span-3 ${card}`} inner="bg-block text-white">
            <div data-reveal className="group relative flex h-full min-h-[13rem] flex-col justify-between gap-6 p-6">
              <Image
                src={photos.speakersTile}
                alt=""
                fill
                sizes="(min-width:1024px) 25vw, 50vw"
                className="object-cover opacity-60 mix-blend-luminosity transition-transform duration-[1800ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(34_14_52/0.2),rgb(34_14_52/0.9))]" />
              <span className="relative">
                <Chip icon={MicrophoneStage} tone="dark" />
              </span>
              <div className="relative">
                <Stat value={220} prefix="+" locale={locale} className="text-5xl md:text-6xl" />
                <p className={`${label} text-white/85`}>{t.speakers}</p>
              </div>
            </div>
          </Bezel>

          <Bezel className={`lg:col-span-3 ${card}`} inner="bg-terra text-terra-ink">
            <div data-reveal className="flex h-full flex-col justify-between gap-6 p-6">
              <Art name="palm" className="absolute -bottom-4 right-3 -z-10 h-[85%] !opacity-30 [color:var(--terra-ink)]" />
              <Chip icon={Tree} tone="onLavender" />
              <div>
                <Stat value={12} locale={locale} className="text-5xl md:text-6xl" />
                <p className={label}>{t.fieldVisits}</p>
              </div>
            </div>
          </Bezel>

          <Bezel className={`lg:col-span-3 ${card}`}>
            <div data-reveal className="flex h-full flex-col justify-between gap-6 p-6">
              <Chip icon={ChatsCircle} />
              <div>
                <Stat value={65} prefix="+" locale={locale} className="text-5xl text-brand md:text-6xl" />
                <p className={`${label} text-ink-2`}>{t.sessions}</p>
              </div>
            </div>
          </Bezel>

          <Bezel className={`col-span-2 lg:col-span-5 ${card}`}>
            <div data-reveal className="flex h-full flex-col justify-between gap-6 p-6">
              <Chip icon={PresentationChart} />
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Stat value={23} locale={locale} className="text-5xl text-brand md:text-6xl" />
                  <p className={`${label} text-ink-2`}>{t.panels}</p>
                </div>
                <ul className="grid grid-cols-3 gap-4 sm:gap-6">
                  {t.panelsBreakdown.map((p) => (
                    <li key={p.label} className="border-l border-gold/50 pl-3">
                      <p className="font-display text-2xl text-ink">{p.value}</p>
                      <p className="mt-1 text-xs leading-tight text-muted">{p.label}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Bezel>

          <Bezel className={`col-span-2 lg:col-span-4 ${card}`}>
            <div data-reveal className="flex h-full items-end justify-between gap-4 p-6">
              <div>
                <Stat value={11} locale={locale} className="text-5xl text-brand md:text-6xl" />
                <p className={`${label} text-ink-2`}>{t.connections}</p>
              </div>
              <MiniNetwork />
            </div>
          </Bezel>
        </div>
      </div>
    </section>
  );
}
