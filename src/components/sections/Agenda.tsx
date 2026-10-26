import type { Dict } from "@/lib/dictionaries/pt";
import Art from "../Art";
import { container } from "../ui";

// Cartagena chapter: the only brand-block section on the page. The left column
// is sticky (CSS, not a scroll hijack) while the four days scroll past it.
export default function Agenda({ t, place }: { t: Dict["agenda"]; place: string }) {
  return (
    <section
      id="agenda-2027"
      className="relative overflow-hidden bg-block py-24 text-block-ink md:py-36 [--art:var(--gold)] [--art-opacity:0.75]"
      aria-labelledby="agenda-title"
    >
      <div className={`${container} grid gap-14 xl:grid-cols-12 xl:gap-12`}>
        <div className="xl:col-span-5">
          <div className="pin:sticky pin:top-32" data-reveal>
            <p className="text-sm text-block-muted">{place}</p>
            <h2 id="agenda-title" className="mt-4 font-display text-[clamp(2.25rem,5.2vw,4.25rem)] leading-[1.02]">
              {t.title}
            </h2>
            <p className="mt-6 max-w-[36ch] text-lg leading-relaxed text-block-muted">{t.lead}</p>
            <Art name="skyline" className="mt-12 hidden w-full max-w-md lg:block" />
          </div>
        </div>

        <ol className="relative xl:col-span-7">
          {t.days.map((d, i) => (
            <li key={d.day} data-reveal className={i > 0 ? "mt-4" : ""}>
              <div className="rounded-[2rem] bg-white/5 p-1.5 ring-1 ring-white/12">
                <div className="relative grid gap-6 overflow-hidden rounded-[calc(2rem-6px)] bg-[rgb(255_255_255/0.04)] p-7 shadow-[inset_0_1px_1px_rgb(255_255_255/0.08)] sm:grid-cols-[9rem_1fr] sm:items-center md:p-9">
                  <p className="flex items-baseline gap-2 sm:flex-col sm:gap-1" data-nosplit>
                    <span className="font-display text-7xl leading-none md:text-8xl">{d.day}</span>
                    <span className="text-sm text-block-muted">{t.month}</span>
                  </p>
                  <ul className="space-y-2">
                    {d.items.map((item) => (
                      <li key={item} className="font-display text-2xl leading-snug md:text-3xl">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
          <Art name="arcs" className="pointer-events-none absolute -right-20 -bottom-28 hidden w-56 md:block" />
        </ol>
      </div>
    </section>
  );
}
