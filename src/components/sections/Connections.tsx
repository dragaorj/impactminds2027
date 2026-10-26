import type { Dict } from "@/lib/dictionaries/pt";
import { links } from "@/lib/site";
import Art from "../Art";
import { Button, H2, container, section } from "../ui";

const art = ["door", "palm", "church", "bougainvillea"] as const;

// Stacked rows that open on hover or keyboard focus; always open on touch.
export default function Connections({ t }: { t: Dict["connections"] }) {
  return (
    <section id="conexoes" className={`${section} scroll-mt-20 bg-bg-2`} aria-labelledby="conexoes-title">
      <div className={`${container} grid gap-14 xl:grid-cols-12 xl:gap-12`}>
        <div className="xl:col-span-5" data-reveal>
          <H2 id="conexoes-title">{t.title}</H2>
          <div className="mt-8 max-w-[62ch] space-y-5 text-lg leading-relaxed text-ink-2">
            <p>{t.p1}</p>
            <p>{t.p2}</p>
            <p>{t.p3}</p>
            <p className="font-display text-xl leading-snug text-brand">{t.proposals}</p>
          </div>
          <div className="mt-10">
            <Button href={links.agenda2026Page} external>
              {t.cta}
            </Button>
          </div>
        </div>

        <ul className="xl:col-span-7">
          {t.items.map((item, i) => (
            <li key={item.title} data-reveal>
              <div
                tabIndex={0}
                className="group relative overflow-hidden border-t border-line py-8 outline-none transition-colors duration-500 focus-visible:bg-ink/5 md:py-10 [@media(hover:hover)]:hover:bg-surface"
              >
                <div className="relative z-10 flex items-start justify-between gap-6 px-1 md:px-4">
                  <div>
                    <h3 className="font-display text-[clamp(1.85rem,3.6vw,3rem)] leading-[1.05] text-ink transition-colors duration-500 group-hover:text-brand">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-base font-medium text-brand">{item.sub}</p>
                    <p className="mt-3 max-w-[40ch] text-base leading-relaxed text-ink-2 transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] [@media(hover:hover)]:translate-y-3 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:translate-y-0 [@media(hover:hover)]:group-focus-visible:opacity-100">
                      {item.text}
                    </p>
                  </div>
                  <Art
                    name={art[i]}
                    className="h-24 w-24 shrink-0 transition-[transform,opacity] duration-700 ease-[var(--ease-out-expo)] md:h-28 md:w-28 [@media(hover:hover)]:group-hover:-rotate-3 [@media(hover:hover)]:group-hover:scale-110 [@media(hover:hover)]:group-hover:!opacity-60"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
