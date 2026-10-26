import type { Dict } from "@/lib/dictionaries/pt";
import { links } from "@/lib/site";
import Art from "../Art";
import { Button, H2, container, section } from "../ui";

const art = ["door", "palm", "church", "bougainvillea"] as const;

// Text pinned on the left; the four connections as rounded cards in a 2x2 grid.
export default function Connections({ t }: { t: Dict["connections"] }) {
  return (
    <section id="conexoes" className={`${section} scroll-mt-20 bg-bg-2`} aria-labelledby="conexoes-title">
      <div className={`${container} grid gap-14 xl:grid-cols-12 xl:gap-12`}>
        <div className="xl:col-span-5">
          <div className="pin:sticky pin:top-28" data-reveal>
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
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 xl:col-span-7">
          {t.items.map((item, i) => (
            <li key={item.title} data-reveal>
              <div className="group flex h-full flex-col rounded-[2rem] bg-surface p-7 ring-1 ring-line transition-[box-shadow,transform] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 hover:shadow-[var(--shadow)] hover:ring-brand/30 md:p-8">
                <Art
                  name={art[i]}
                  className="h-20 w-20 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-rotate-3 group-hover:scale-110"
                />
                <h3 className="mt-6 font-display text-[clamp(1.75rem,2.6vw,2.4rem)] leading-[1.05] text-ink transition-colors duration-500 group-hover:text-brand">
                  {item.title}
                </h3>
                <p className="mt-2 text-base font-medium text-brand">{item.sub}</p>
                <p className="mt-4 text-base leading-relaxed text-ink-2">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
