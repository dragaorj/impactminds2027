import type { Dict } from "@/lib/dictionaries/pt";
import Art from "../Art";
import { H2, container, section } from "../ui";

// Stat values never wrap: a currency prefix drops to a small label instead.
function Figure({ value }: { value: string }) {
  const m = value.match(/^(USD)\s(.+)$/);
  if (!m) return <>{value}</>;
  return (
    <>
      <span className="mr-1.5 align-top font-sans text-[0.32em] font-medium tracking-wide">{m[1]}</span>
      {m[2]}
    </>
  );
}

function Group({ label, items }: { label: string; items: { value: string; label: string }[] }) {
  return (
    <div>
      <p className="border-b border-line pb-3 text-sm font-medium text-muted">{label}</p>
      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10">
        {items.map((item) => (
          <div key={item.label} data-reveal className="flex flex-col">
            <dt className="order-last mt-2 text-[0.9375rem] leading-snug text-ink-2">{item.label}</dt>
            <dd className="whitespace-nowrap font-display text-[clamp(2rem,3.6vw,3.25rem)] leading-none text-brand">
              <Figure value={item.value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Reach in two plain stat groups: no cards, the numbers carry the section.
export default function Digital({ t }: { t: Dict["digital"] }) {
  return (
    <section id="alcance" className={section} aria-labelledby="alcance-title">
      <Art name="arcs" className="absolute bottom-0 right-0 hidden w-56 xl:block" />
      <div className={container}>
        <H2 id="alcance-title" className="max-w-3xl">
          {t.title}
        </H2>
        <div className="mt-14 grid gap-14 md:mt-20 lg:grid-cols-2 lg:gap-20">
          <Group label={t.online} items={t.onlineItems} />
          <Group label={t.media} items={t.mediaItems} />
        </div>
        <p className="mt-16 max-w-[60ch] font-display text-2xl leading-snug text-ink">{t.intl}</p>
      </div>
    </section>
  );
}
