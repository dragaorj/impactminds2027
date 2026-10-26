import Image from "next/image";
import type { Dict } from "@/lib/dictionaries/pt";
import { photos } from "@/lib/site";
import Art from "../Art";
import { Bezel, H2, container, section } from "../ui";

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

export default function Numbers({ t, locale }: { t: Dict["numbers"]; locale: string }) {
  const label = "mt-3 max-w-[22ch] text-[0.9375rem] leading-snug";
  return (
    <section id="numeros" className={section} aria-labelledby="numeros-title">
      <Art name="mosaic" className="pointer-events-none absolute -left-16 top-20 w-40 md:-left-14 md:w-52 xl:w-64" />
      <div className={container}>
        <div className="max-w-3xl" data-reveal>
          <H2 id="numeros-title">{t.title}</H2>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-ink-2">{t.lead}</p>
        </div>

        <div className="mt-14 grid grid-flow-dense grid-cols-2 gap-3 md:mt-20 lg:auto-rows-[minmax(12.5rem,auto)] lg:grid-cols-12 lg:gap-4">
          <Bezel className="col-span-2 lg:col-span-6 lg:row-span-2" inner="bg-block text-block-ink">
            <div data-reveal className="flex h-full min-h-[20rem] flex-col justify-between p-7 md:p-10">
              <Art name="window" className="absolute -bottom-6 right-4 -z-10 w-40 !opacity-25 [color:var(--block-muted)] md:w-52" />
              <Stat value={580} locale={locale} className="text-[clamp(5rem,13vw,10rem)]" />
              <p className="relative text-xl text-block-muted">{t.participants}</p>
            </div>
          </Bezel>

          <Bezel className="lg:col-span-3">
            <div data-reveal className="flex h-full flex-col justify-end p-6">
              <Stat value={350} locale={locale} className="text-5xl text-brand md:text-6xl" />
              <p className={`${label} text-ink-2`}>{t.organizations}</p>
            </div>
          </Bezel>

          <Bezel className="lg:col-span-3" inner="bg-sun text-sun-ink">
            <div data-reveal className="flex h-full flex-col justify-end p-6">
              <Art name="arcs" className="absolute -right-2 -top-2 -z-10 w-24 !opacity-40 [color:var(--sun-ink)]" />
              <Stat value={33} locale={locale} className="text-5xl md:text-6xl" />
              <p className={label}>{t.countries}</p>
            </div>
          </Bezel>

          <Bezel className="lg:col-span-3" inner="bg-block text-white">
            <div data-reveal className="relative flex h-full min-h-[12.5rem] flex-col justify-end p-6">
              <Image
                src={photos.speakersTile}
                alt=""
                fill
                sizes="(min-width:1024px) 25vw, 50vw"
                className="object-cover opacity-55 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgb(34_14_52/0.85))]" />
              <Stat value={220} prefix="+" locale={locale} className="relative text-5xl md:text-6xl" />
              <p className={`${label} relative text-white/85`}>{t.speakers}</p>
            </div>
          </Bezel>

          <Bezel className="lg:col-span-3" inner="bg-terra text-terra-ink">
            <div data-reveal className="flex h-full flex-col justify-end p-6">
              <Stat value={12} locale={locale} className="text-5xl md:text-6xl" />
              <p className={label}>{t.fieldVisits}</p>
            </div>
          </Bezel>

          <Bezel className="lg:col-span-4">
            <div data-reveal className="flex h-full flex-col justify-end p-6">
              <Stat value={65} prefix="+" locale={locale} className="text-5xl text-brand md:text-6xl" />
              <p className={`${label} text-ink-2`}>{t.sessions}</p>
            </div>
          </Bezel>

          <Bezel className="col-span-2 lg:col-span-5">
            <div data-reveal className="flex h-full flex-col justify-between gap-6 p-6 sm:flex-row sm:items-end">
              <div>
                <Stat value={23} locale={locale} className="text-5xl text-brand md:text-6xl" />
                <p className={`${label} text-ink-2`}>{t.panels}</p>
              </div>
              <ul className="grid grid-cols-3 gap-4 sm:gap-6">
                {t.panelsBreakdown.map((p) => (
                  <li key={p.label} className="border-l border-line pl-3">
                    <p className="font-display text-2xl text-ink">{p.value}</p>
                    <p className="mt-1 text-xs leading-tight text-muted">{p.label}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Bezel>

          <Bezel className="lg:col-span-3">
            <div data-reveal className="flex h-full flex-col justify-end p-6">
              <Stat value={11} locale={locale} className="text-5xl text-brand md:text-6xl" />
              <p className={`${label} text-ink-2`}>{t.connections}</p>
            </div>
          </Bezel>
        </div>
      </div>
    </section>
  );
}
