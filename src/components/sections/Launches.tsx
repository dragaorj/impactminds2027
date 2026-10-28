import Image from "next/image";
import type { Dict } from "@/lib/dictionaries/pt";
import Art from "../Art";
import CountUp from "../CountUp";
import { Bezel, H2, container, section } from "../ui";

// Three launches as an asymmetric trio: the flagship bioeconomy initiative
// leads over a forest photo from the field visits, the two calls stack beside it.
export default function Launches({ t, locale }: { t: Dict["launches"]; locale: string }) {
  const [a, b, c] = t.items;
  const order = [c, a, b];
  return (
    <section id="lancamentos" className={section} aria-labelledby="lancamentos-title">
      <Art name="mosaic" className="pointer-events-none absolute bottom-6 left-[1.25vw] hidden w-20 lg:block" />
      <div className={container}>
        <div className="max-w-3xl">
          <H2 id="lancamentos-title">{t.title}</H2>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-ink-2">{t.lead}</p>
        </div>

        <div className="mt-14 grid gap-3 md:mt-20 lg:grid-cols-12 lg:grid-rows-2 lg:gap-4">
          {order.map((item, i) => {
            const lead = i === 0;
            return (
              <Bezel
                key={item.title}
                className={lead ? "lg:col-span-7 lg:row-span-2" : "lg:col-span-5"}
                inner={lead ? "bg-block text-block-ink" : i === 1 ? "bg-surface" : "bg-brand-soft"}
              >
                <article data-reveal className={`flex h-full flex-col justify-between gap-10 p-7 md:p-10 ${lead ? "min-h-[26rem]" : ""}`}>
                  {lead && (
                    <>
                      <Image
                        src="/photos/visit-07.jpg"
                        alt=""
                        fill
                        sizes="(min-width:1024px) 58vw, 100vw"
                        className="-z-10 object-cover object-[50%_58%]"
                      />
                      {/* Purple wash: deep behind the title, the story and the figure,
                          lighter only further down so the people still read. */}
                      <span
                        aria-hidden
                        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(34_14_52/0.94)_0%,rgb(34_14_52/0.84)_40%,rgb(34_14_52/0.55)_62%,rgb(34_14_52/0.45)_74%,rgb(34_14_52/0.95)_100%)]"
                      />
                    </>
                  )}
                  <div className="relative">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        lead ? "bg-sun text-sun-ink" : "bg-ink/6 text-ink"
                      }`}
                    >
                      {item.tag}
                    </span>
                    <h3 className={`mt-5 font-display leading-[1.08] ${lead ? "text-[clamp(2rem,3.6vw,3rem)]" : "text-2xl md:text-3xl"}`}>
                      {item.title}
                    </h3>
                    <p
                      className={`mt-4 max-w-[46ch] text-base leading-relaxed ${
                        lead ? "text-white/90 [text-shadow:0_1px_14px_rgb(34_14_52/0.7)]" : "text-ink-2"
                      }`}
                    >
                      {item.text}
                    </p>
                  </div>
                  {/* Stat row: the figure and what it measures share one baseline,
                      ruled off from the story above. */}
                  <p
                    className={`relative flex items-end justify-between gap-6 border-t pt-6 ${lead ? "border-white/15" : "border-line"}`}
                    data-nosplit
                  >
                    <span className={`flex items-baseline gap-2 whitespace-nowrap font-display leading-none ${lead ? "text-6xl text-sun md:text-7xl" : "text-5xl text-brand"}`}>
                      {item.figure.startsWith("USD ") && (
                        <span className={`font-sans text-xs font-medium tracking-[0.18em] md:text-sm ${lead ? "text-block-muted" : "text-muted"}`}>
                          USD
                        </span>
                      )}
                      <span>
                        <CountUp value={item.figure.replace(/^USD /, "")} locale={locale} />
                      </span>
                    </span>
                    <span
                      className={`max-w-[12ch] pb-1 text-right text-xs font-medium uppercase leading-snug tracking-[0.14em] md:text-[0.8125rem] ${lead ? "text-white/85 [text-shadow:0_1px_10px_rgb(34_14_52/0.7)]" : "text-ink-2"}`}
                    >
                      {item.figureLabel}
                    </span>
                  </p>
                </article>
              </Bezel>
            );
          })}
        </div>
      </div>
    </section>
  );
}
