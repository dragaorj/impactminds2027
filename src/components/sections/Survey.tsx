import Image from "next/image";
import type { Dict } from "@/lib/dictionaries/pt";
import Art from "../Art";
import CountUp from "../CountUp";
import { Bezel, H2, container, section } from "../ui";

const TICKS = 100;

// Unit chart: one dot per scale point, the last one partially filled.
// Text stays in ink tokens; only the dots carry the brand color.
// The average number of connections drawn literally: one organization at the
// centre, a node for each connection around it.
function Network({ count, label }: { count: number; label: React.ReactNode }) {
  const R = 58;
  const nodes = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    return [80 + R * Math.cos(a), 80 + R * Math.sin(a)];
  });
  return (
    <div className="relative size-40">
      <svg viewBox="0 0 160 160" className="absolute inset-0 size-full" aria-hidden>
        <circle cx={80} cy={80} r={R} fill="none" stroke="var(--lavender)" strokeWidth={0.75} strokeDasharray="2 4" opacity={0.6} />
        {/* Spokes turn slowly while each one eases in and out, in a wave. */}
        <g className="net-spin">
          {nodes.map(([x, y], i) => (
            <g key={i} className="net-spoke" style={{ "--i": i } as React.CSSProperties}>
              <line x1={80} y1={80} x2={x} y2={y} stroke="var(--gold)" strokeWidth={1} opacity={0.6} />
              <circle cx={x} cy={y} r={5.5} fill="var(--lavender)" />
            </g>
          ))}
        </g>
        <circle cx={80} cy={80} r={30} fill="var(--sun)" />
      </svg>
      <p className="absolute inset-0 grid place-items-center font-display text-4xl leading-none text-sun-ink">{label}</p>
    </div>
  );
}

function Dots({
  value,
  max,
  size = "size-4 md:size-5",
  tone = "brand",
}: {
  value: number;
  max: number;
  size?: string;
  tone?: "brand" | "gold";
}) {
  const fillCls = tone === "gold" ? "bg-sun" : "bg-brand";
  const ringCls = tone === "gold" ? "border-sun/70" : "border-brand/40";
  return (
    <div className="flex flex-wrap gap-1.5 md:gap-2" data-dots aria-hidden>
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span
            key={i}
            className={`dot-wave relative ${size} overflow-hidden rounded-full border ${ringCls}`}
            style={{ animationDelay: `${i * 140}ms` }}
          >
            <span
              data-dot
              className={`absolute inset-y-0 left-0 ${fillCls}`}
              style={{ width: `${fill * 100}%`, opacity: "var(--fill, 1)" } as React.CSSProperties}
            />
          </span>
        );
      })}
    </div>
  );
}

export default function Survey({ t, locale }: { t: Dict["survey"]; locale: string }) {
  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 1 });
  return (
    <section id="pesquisa" className={section} aria-labelledby="pesquisa-title">
      <Art name="laurel" className="pointer-events-none absolute left-[calc(4vw_-_9rem)] top-20 hidden w-36 lg:block" />
      <div className={container}>
        <div data-reveal className="max-w-3xl">
          <H2 id="pesquisa-title">{t.title}</H2>
          <p className="mt-5 text-lg text-ink-2">{t.subtitle}</p>
        </div>

        <ul className="mt-14 md:mt-20">
          {t.scores.map((s, i) => (
            <li
              key={s.label}
              data-reveal
              className="group grid gap-5 border-t border-line py-8 md:grid-cols-12 md:items-center md:gap-8 md:py-10"
            >
              {/* What was asked leads the row; the score answers it. */}
              <div className="md:col-span-5 md:order-last" data-nosplit>
                <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-gold">
                  <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span aria-hidden className="h-px w-10 bg-gold/50 transition-[width] duration-700 ease-[var(--ease-out-expo)] group-hover:w-16" />
                </p>
                <p className="mt-3 max-w-[30ch] font-display text-[clamp(1.375rem,2.2vw,2rem)] leading-[1.15] text-ink">
                  {s.label}
                  <span aria-hidden className="text-muted">*</span>
                </p>
              </div>
              <p className="flex items-baseline gap-2 md:col-span-3" data-nosplit>
                <span className="font-display text-[clamp(3.5rem,7vw,5.5rem)] leading-none text-brand">
                  <CountUp value={fmt(s.value)} locale={locale} />
                </span>
                <span className="text-base text-muted">/10</span>
                <span className="sr-only"> {t.outOf}</span>
              </p>
              <div className="md:col-span-4">
                <Dots value={s.value} max={10} tone="gold" size="size-4 md:size-[1.375rem]" />
              </div>
            </li>
          ))}
        </ul>
        <p className="border-t border-line pt-5 text-sm text-muted">* {t.note}</p>

        <Bezel className="mt-16 md:mt-24" inner="bg-block text-block-ink">
          <div className="relative grid gap-10 p-6 md:p-12 xl:grid-cols-12 xl:gap-12 [--art:var(--gold)] [--art-opacity:0.5]">
            {/* Left: the title, the two headline figures in glass cards and a
                networking photo that stretches to fill whatever height the list
                on the right leaves, so the column never ends in empty space. */}
            <div className="flex flex-col gap-6 xl:col-span-5">
              <h3 className="font-display text-3xl leading-tight md:text-[2.75rem]">{t.connectionsTitle}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col items-start gap-5 rounded-[1.5rem] bg-white/[0.05] p-6 ring-1 ring-white/10">
                  <Network count={11} label={<span data-count={11} data-locale={locale}>11</span>} />
                  <p className="text-[0.9375rem] leading-snug text-block-muted">{t.avgConnections}</p>
                </div>
                <div className="flex flex-col justify-between gap-5 rounded-[1.5rem] bg-white/[0.05] p-6 ring-1 ring-white/10">
                  <p className="font-display text-7xl leading-none text-sun" data-nosplit>
                    <CountUp value={fmt(4.2)} locale={locale} />
                    <span className="ml-1 font-sans text-lg text-block-muted">/5</span>
                  </p>
                  <Dots value={4.2} max={5} size="size-5" tone="gold" />
                  <p className="text-[0.9375rem] leading-snug text-block-muted">{t.interactAgain}</p>
                </div>
              </div>
              <figure className="group relative min-h-[15rem] flex-1 overflow-hidden rounded-[1.5rem] ring-1 ring-white/10 sm:min-h-[18rem]">
                <Image
                  src="/photos/editions/2026/12.jpg"
                  alt=""
                  fill
                  sizes="(min-width:1280px) 34vw, 100vw"
                  className="object-cover object-[55%_40%] transition-[scale] duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-105"
                />
                <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(34_14_52/0.1)_25%,rgb(34_14_52/0.92))]" />
                <figcaption className="absolute inset-x-0 bottom-0 p-6" data-nosplit>
                  <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#E2C985]">
                    <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 shrink-0 fill-current">
                      <path d="M12 0c.9 6.4 5 10.6 12 12-7 1.4-11.1 5.6-12 12-.9-6.4-5-10.6-12-12C7 10.6 11.1 6.4 12 0Z" />
                    </svg>
                    {t.photoKicker}
                  </span>
                  <span className="mt-2 block max-w-[24ch] font-display text-2xl leading-tight text-white md:text-[1.75rem]">{t.photoCaption}</span>
                </figcaption>
              </figure>
            </div>

            {/* Right: connection types ranked. Each meter has 100 fine ticks (1% each)
                that light up gold one after another while the figure counts up and
                turns gold; the leading type sits in a gold-tinted card. */}
            <div className="xl:col-span-7">
              <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-[#E2C985] md:text-sm" data-nosplit>
                <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 fill-current">
                  <path d="M12 0c.9 6.4 5 10.6 12 12-7 1.4-11.1 5.6-12 12-.9-6.4-5-10.6-12-12C7 10.6 11.1 6.4 12 0Z" />
                </svg>
                {t.typesTitle}
              </p>
              <ol className="mt-6 flex flex-col gap-2" data-ticks>
                {t.types.map((type, i) => {
                  const lead = i === 0;
                  return (
                    <li
                      key={type.label}
                      className={`rounded-[1.5rem] p-5 ring-1 md:px-6 ${lead ? "bg-sun/10 ring-sun/30 md:py-6" : "bg-white/[0.03] ring-white/[0.07]"}`}
                    >
                      <div className="flex items-baseline gap-4" data-nosplit>
                        <span className="w-7 shrink-0 font-display text-sm tabular-nums text-[#E2C985]">{String(i + 1).padStart(2, "0")}</span>
                        <span className={`min-w-0 flex-1 leading-snug ${lead ? "font-display text-xl md:text-2xl" : "text-base md:text-lg"}`}>{type.label}</span>
                        <span className={`survey-pct shrink-0 font-display tabular-nums transition-colors duration-700 ${lead ? "text-5xl md:text-6xl" : "text-2xl md:text-3xl"}`}>
                          <CountUp value={`${type.value}%`} locale={locale} duration={1.4} />
                        </span>
                      </div>
                      <div className="mt-4 flex h-5 items-end justify-between pl-11" aria-hidden>
                        {Array.from({ length: TICKS }, (_, k) => (
                          <span
                            key={k}
                            className={`tick h-full w-px shrink-0 rounded-full sm:w-[2px] ${k % 10 === 0 ? "tick-major" : ""} ${k < type.value ? "tick-on" : ""} ${k === type.value - 1 ? "tick-lead" : ""}`}
                            style={{ transitionDelay: `${k * 22 + i * 120}ms` }}
                          />
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </Bezel>
      </div>
    </section>
  );
}
