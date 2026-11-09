import type { Dict } from "@/lib/dictionaries/pt";
import { links } from "@/lib/site";
import { Bezel, Button, container, section } from "../ui";

// Who organises the conference, built like the Cartagena section: a small gold
// label, the network's name set large with a gold line under it, then the two
// paragraphs and the link to its site. Beside it, three key facts taken from
// the text (the place a map will take later).
export default function AboutLatimpacto({ t }: { t: Dict["latimpacto"] }) {
  return (
    <section id="latimpacto" className={section} aria-labelledby="latimpacto-title">
      <div className={`${container} grid gap-10 md:gap-14 xl:grid-cols-12 xl:items-center xl:gap-x-12`}>
        <div className="xl:col-span-6" data-reveal>
          <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-gold md:text-base" data-nosplit>
            <svg aria-hidden viewBox="0 0 24 24" className="size-[1.125rem] shrink-0 fill-current md:size-5">
              <path d="M12 0c.9 6.4 5 10.6 12 12-7 1.4-11.1 5.6-12 12-.9-6.4-5-10.6-12-12C7 10.6 11.1 6.4 12 0Z" />
            </svg>
            {t.title}
          </p>
          <h2 id="latimpacto-title" className="mt-5 font-display text-[calc(clamp(min(2.5rem,10vw),6vw,5.25rem)-1px)] leading-[1] text-ink">
            {t.name}
          </h2>
          <p className="mt-4 font-display text-[clamp(1.375rem,2.6vw,2.25rem)] leading-tight text-balance text-gold" data-nosplit>
            {t.tagline}
          </p>
          <div className="mt-8 max-w-[62ch] space-y-5 text-lg leading-relaxed text-ink-2">
            {t.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="mt-9">
            <Button href={links.latimpacto} external>
              {t.cta}
            </Button>
          </div>
        </div>

        <Bezel className="xl:col-span-6" inner="bg-surface">
          <dl className="grid divide-y divide-line px-7 md:px-10" data-reveal data-nosplit>
            {t.facts.map((f) => (
              <div key={f.value} className="py-7 md:py-8">
                <dt className="font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.05] text-balance text-brand">{f.value}</dt>
                <dd className="mt-2 text-base leading-snug text-ink-2 md:text-lg">{f.label}</dd>
              </div>
            ))}
          </dl>
        </Bezel>
      </div>
    </section>
  );
}
