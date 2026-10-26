import type { Dict } from "@/lib/dictionaries/pt";
import Art from "../Art";
import { Bezel, H2, container, section } from "../ui";

// Three launches as an asymmetric trio: the flagship bioeconomy initiative
// leads in deep purple, the two calls stack beside it.
export default function Launches({ t }: { t: Dict["launches"] }) {
  const [a, b, c] = t.items;
  const order = [c, a, b];
  return (
    <section id="lancamentos" className={section} aria-labelledby="lancamentos-title">
      <Art name="mosaic" className="pointer-events-none absolute bottom-6 left-[calc(4vw_-_13rem)] hidden w-52 lg:block" />
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
                    <Art name="skyline" className="absolute inset-x-6 bottom-28 -z-10 hidden w-[calc(100%-3rem)] !opacity-25 [color:var(--gold)] lg:block" />
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
                    <p className={`mt-4 max-w-[46ch] text-base leading-relaxed ${lead ? "text-block-muted" : "text-ink-2"}`}>{item.text}</p>
                  </div>
                  <p className="relative flex flex-col items-start gap-2" data-nosplit>
                    <span className={`whitespace-nowrap font-display leading-none ${lead ? "text-6xl text-sun md:text-7xl" : "text-4xl text-brand"}`}>
                      {item.figure.startsWith("USD ") ? (
                        <>
                          <span className="mr-1.5 align-top font-sans text-[0.32em] font-medium tracking-wide">USD</span>
                          {item.figure.slice(4)}
                        </>
                      ) : (
                        item.figure
                      )}
                    </span>
                    <span className={`text-base ${lead ? "text-block-muted" : "text-muted"}`}>{item.figureLabel}</span>
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
