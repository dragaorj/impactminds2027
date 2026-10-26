import { Leaf } from "@phosphor-icons/react/dist/ssr";
import type { Dict } from "@/lib/dictionaries/pt";
import Art from "../Art";
import CountUp from "../CountUp";
import { container, section } from "../ui";

// Manifesto layout: centered statement, the paragraph brightens word by word.
export default function Carbon({ t, locale }: { t: Dict["carbon"]; locale: string }) {
  return (
    <section id="carbono" className={`${section} overflow-hidden bg-bg-2`} aria-labelledby="carbono-title">
      <Art name="laurel" className="absolute bottom-10 left-[3%] w-28 md:left-[8%] md:w-44" />
      <Art name="laurel" className="absolute bottom-10 right-[3%] w-28 -scale-x-100 md:right-[8%] md:w-44" />
      <div className={`${container} relative text-center`}>
        <p data-reveal className="mx-auto inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 text-sm text-ink">
          <Leaf size="1rem" weight="light" className="text-brand" />
          The Carbon Sink
        </p>
        <h2 id="carbono-title" data-reveal className="mx-auto mt-6 max-w-4xl font-display text-[clamp(2.25rem,5.2vw,4.25rem)] leading-[1.02] text-ink">
          {t.title}
        </h2>
        <p data-words className="mx-auto mt-8 max-w-[52ch] text-xl leading-relaxed text-ink md:text-2xl">
          {t.text.split(" ").map((w, i) => (
            <span key={i}>{w} </span>
          ))}
        </p>
        <div data-reveal className="mt-16">
          <p className="font-display text-[clamp(4.5rem,14vw,11rem)] leading-none text-brand">
            <CountUp value={t.value} locale={locale} />
            <span className="ml-3 align-top font-sans text-[clamp(1.25rem,2.4vw,2rem)] text-ink-2">
              tCO<sub>2</sub>e
            </span>
          </p>
          <p className="mx-auto mt-5 max-w-[40ch] text-base text-muted">{t.label}</p>
        </div>
      </div>
    </section>
  );
}
