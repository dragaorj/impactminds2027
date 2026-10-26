import type { Dict } from "@/lib/dictionaries/pt";
import Art from "../Art";
import { Bezel, H2, container, section } from "../ui";

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
        {nodes.map(([x, y], i) => (
          <line key={i} x1={80} y1={80} x2={x} y2={y} stroke="var(--gold)" strokeWidth={1} opacity={0.6} />
        ))}
        <circle cx={80} cy={80} r={R} fill="none" stroke="var(--lavender)" strokeWidth={0.75} strokeDasharray="2 4" opacity={0.6} />
        {nodes.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={5.5} fill="var(--lavender)" />
        ))}
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
  const ringCls = tone === "gold" ? "ring-sun/50" : "ring-brand/40";
  return (
    <div className="flex flex-wrap gap-1.5 md:gap-2" data-dots aria-hidden>
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className={`relative ${size} overflow-hidden rounded-full ring-1 ${ringCls}`}>
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
          {t.scores.map((s) => (
            <li
              key={s.label}
              data-reveal
              className="grid gap-5 border-t border-line py-8 md:grid-cols-12 md:items-center md:gap-8 md:py-10"
            >
              <p className="md:col-span-3">
                <span className="font-display text-[clamp(3.5rem,7vw,5.5rem)] leading-none text-brand">{fmt(s.value)}</span>
                <span className="ml-2 text-base text-muted">/10</span>
                <span className="sr-only"> {t.outOf}</span>
              </p>
              <div className="md:col-span-5">
                <Dots value={s.value} max={10} />
              </div>
              <p className="text-lg leading-snug text-ink md:col-span-4">
                {s.label}
                <span aria-hidden className="text-muted">*</span>
              </p>
            </li>
          ))}
        </ul>
        <p className="border-t border-line pt-5 text-sm text-muted">* {t.note}</p>

        <Bezel className="mt-16 md:mt-24" inner="bg-block text-block-ink">
          <div className="relative grid gap-12 p-7 md:p-12 lg:grid-cols-12 lg:gap-14 [--art:var(--gold)] [--art-opacity:0.5]">
            <Art name="arcs" className="absolute -bottom-2 -left-2 -z-10 hidden w-56 -scale-x-100 xl:block" />

            <div className="lg:col-span-5">
              <h3 className="font-display text-3xl leading-tight md:text-[2.75rem]">{t.connectionsTitle}</h3>

              <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <Network count={11} label={<span data-count={11} data-locale={locale}>11</span>} />
                  <p className="mt-4 max-w-[24ch] text-[0.9375rem] leading-snug text-block-muted">{t.avgConnections}</p>
                </div>
                <div className="flex flex-col justify-end">
                  <p className="font-display text-7xl leading-none text-sun">
                    {fmt(4.2)}
                    <span className="ml-1 font-sans text-lg text-block-muted">/5</span>
                  </p>
                  <div className="mt-4">
                    <Dots value={4.2} max={5} size="size-5" tone="gold" />
                  </div>
                  <p className="mt-4 max-w-[26ch] text-[0.9375rem] leading-snug text-block-muted">{t.interactAgain}</p>
                </div>
              </div>
            </div>

            {/* Ranked share of connection types: one gold bar per type, labeled, no track. */}
            <div className="relative lg:col-span-7 lg:border-l lg:border-white/12 lg:pl-14">
              <p className="text-sm font-medium tracking-wide text-block-muted">{t.typesTitle}</p>
              <ul className="mt-8 space-y-6" data-hbars>
                {t.types.map((type, i) => (
                  <li key={type.label}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-base leading-snug md:text-lg">{type.label}</span>
                      <span className={`font-display tabular-nums ${i === 0 ? "text-4xl text-sun" : "text-2xl"}`}>{type.value}%</span>
                    </div>
                    <div
                      data-hbar
                      className={`mt-2.5 h-2 rounded-r-full ${i === 0 ? "bg-sun" : "bg-lavender"}`}
                      style={{ width: `${(type.value / t.types[0].value) * 100}%` }}
                      aria-hidden
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Bezel>
      </div>
    </section>
  );
}
