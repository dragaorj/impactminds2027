import type { Dict } from "@/lib/dictionaries/pt";
import { EVENT_START } from "@/lib/site";
import Art from "../Art";
import { container } from "../ui";

// Cartagena chapter: a light lavender band in light mode, the deep purple
// brand block in dark mode. The intro shares a
// row with the skyline drawing; below it the four days run as a timeline: a
// gold rule with one node per day (vertical on phones, across on desktop)
// and a glass card for each day.
export default function Agenda({
  t,
  place,
  dates,
  locale,
}: {
  t: Dict["agenda"];
  place: string;
  dates: string;
  locale: string;
}) {
  // Weekday names come from the real dates, in the page's language.
  const start = new Date(EVENT_START);
  const weekday = (i: number) =>
    new Date(start.getTime() + i * 86_400_000).toLocaleDateString(locale, { weekday: "long", timeZone: "America/Bogota" });

  return (
    <section
      id="agenda-2027"
      className="wave-y relative overflow-hidden bg-bg-2 py-24 text-ink md:py-32 dark:bg-block dark:text-block-ink [--art:var(--gold)] [--art-opacity:0.75]"
      aria-labelledby="agenda-title"
    >
      <div className={container}>
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
          <div className="lg:col-span-6" data-reveal>
            <p
              className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-ink/5 px-4 py-1.5 text-sm ring-1 ring-line dark:bg-white/8 dark:ring-white/15"
              data-nosplit
            >
              <span>{place}</span>
              <span aria-hidden className="h-3 w-px bg-line dark:bg-white/30" />
              <span className="font-medium text-gold dark:text-[#E2C985]">{dates}</span>
            </p>
            <h2 id="agenda-title" className="mt-6 font-display text-[clamp(2.25rem,5.2vw,4.25rem)] leading-[1.02]">
              {t.title}
            </h2>
            <p className="mt-5 max-w-[40ch] text-lg leading-relaxed text-ink-2 dark:text-block-muted">{t.lead}</p>
          </div>
          <Art name="skyline" className="w-full max-w-2xl lg:col-span-6 lg:justify-self-end" />
        </div>

        <ol className="relative mt-14 grid gap-4 md:mt-20 lg:grid-cols-4 lg:gap-5" data-stagger>
          {/* Timeline rule: down the left on phones, across the top on desktop. */}
          <span aria-hidden data-stagger-line className="absolute bottom-6 left-[1.4rem] top-6 w-px origin-top bg-gradient-to-b from-[#E2C985]/70 via-[#E2C985]/30 to-transparent lg:hidden" />
          <span aria-hidden data-stagger-line className="absolute inset-x-6 top-[1.4rem] hidden h-px origin-left bg-gradient-to-r from-[#E2C985]/70 via-[#E2C985]/40 to-[#E2C985]/10 lg:block" />

          {t.days.map((d, i) => (
            <li key={d.day} className="relative pl-12 lg:pl-0 lg:pt-12">
              <span
                aria-hidden
                data-stagger-dot
                className="absolute left-[1.4rem] top-7 grid size-3 -translate-x-1/2 place-items-center rounded-full bg-[#E2C985] shadow-[0_0_0_6px_rgb(226_201_133/0.15)] lg:left-8 lg:top-[1.4rem] lg:-translate-y-1/2"
              />
              <article data-stagger-item className="group h-full rounded-[2rem] bg-ink/[0.04] p-1.5 ring-1 ring-line dark:bg-white/[0.06] dark:ring-white/12 transition-[box-shadow,transform] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 hover:ring-[#E2C985]/50">
                <div className="flex h-full flex-col rounded-[calc(2rem-6px)] bg-surface p-6 shadow-[inset_0_1px_1px_rgb(255_255_255/0.08)] dark:bg-[rgb(255_255_255/0.035)] md:p-7">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold dark:text-[#E2C985]" data-nosplit>
                    {weekday(i)}
                  </p>
                  <p className="mt-4 flex items-baseline gap-2" data-nosplit>
                    <span className="font-display text-7xl leading-none md:text-8xl">{d.day}</span>
                    <span className="text-sm text-ink-2 dark:text-block-muted">{t.month}</span>
                  </p>
                  <ul className="mt-6 space-y-3 border-t border-line pt-5 dark:border-white/12">
                    {d.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-gold dark:bg-[#E2C985]" />
                        <span className="font-display text-xl leading-snug md:text-[1.375rem]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
