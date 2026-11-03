"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import type { Locale } from "@/lib/i18n";
import { testimonials } from "@/lib/site";
import Art from "../Art";
import { H2, container, section } from "../ui";

// The organisation, small above the quote: what follows the last comma of
// the role ("CEO, Fundação Luksic" -> "Fundação Luksic").
const org = (role: string) => role.slice(role.lastIndexOf(",") + 1).trim();

// One row of plain cards that scrolls sideways (swipe, trackpad or the arrows),
// each card: the organisation, the quote, then the person with a closing quote
// mark. A counter and a thin progress line under the row show where you are.
export default function Testimonials({ t, lang }: { t: Dict["testimonials"]; lang: Locale }) {
  const track = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const total = testimonials.length;

  // The card nearest the row's left edge is the current one.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const sync = () => {
      const cards = Array.from(el.children) as HTMLElement[];
      const at = (c: HTMLElement) => c.offsetLeft - cards[0].offsetLeft;
      const start = el.scrollLeft;
      let best = 0;
      cards.forEach((c, i) => {
        if (Math.abs(at(c) - start) < Math.abs(at(cards[best]) - start)) best = i;
      });
      // At the very end the last card counts as current, even if it never reaches the left edge.
      if (start + el.clientWidth >= el.scrollWidth - 4) best = cards.length - 1;
      setCurrent(best);
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    return () => el.removeEventListener("scroll", sync);
  }, []);

  const go = (step: number) => {
    const el = track.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    const next = Math.max(0, Math.min(total - 1, current + step));
    setCurrent(next);
    el.scrollTo({ left: cards[next].offsetLeft - cards[0].offsetLeft, behavior: "smooth" });
  };

  const arrow =
    "grid size-11 place-items-center rounded-full text-ink ring-1 ring-line transition-[background-color,color,opacity] duration-300 hover:bg-sun hover:text-sun-ink disabled:pointer-events-none disabled:opacity-35";

  return (
    <section id="depoimentos" className={`${section} overflow-hidden bg-bg-2 wave-y`} aria-labelledby="depoimentos-title">
      <Art name="mosaic" className="pointer-events-none absolute bottom-[calc(var(--wave)+0.5rem)] right-[1vw] hidden w-16 lg:block" />
      <div className={container}>
        <H2 id="depoimentos-title" className="max-w-2xl" data-reveal>
          {t.title}
        </H2>

        <ul
          ref={track}
          aria-label={t.title}
          className="-mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 md:mt-16 lg:-mx-[5vw] lg:scroll-px-[5vw] lg:px-[5vw] [&::-webkit-scrollbar]:hidden"
          data-reveal
        >
          {testimonials.map((item) => (
            <li key={item.name} className="w-[min(86vw,22rem)] shrink-0 snap-start md:w-[24rem]">
              <figure className="flex h-full flex-col rounded-[1.75rem] bg-surface p-6 ring-1 ring-line md:p-7">
                <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted">{org(item.role[lang])}</p>
                <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-ink">{item.quote[lang]}</blockquote>
                <figcaption className="mt-8 flex items-end gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-brand ring-1 ring-line">
                    {item.photo && <Image src={item.photo} alt="" fill sizes="3rem" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg leading-tight text-ink">{item.name}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">{item.role[lang]}</span>
                  </span>
                  <span aria-hidden className="-mb-3 font-display text-6xl leading-none text-gold">
                    ”
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        {/* Where you are: "2 / 6", a thin line filling up, and the arrows. */}
        <div className="mt-8 flex items-center gap-5">
          <p className="font-display text-lg tabular-nums text-ink" aria-live="polite" data-nosplit>
            {current + 1}
            <span className="text-muted"> / {total}</span>
          </p>
          <span aria-hidden className="h-px flex-1 overflow-hidden bg-line">
            <span
              className="block h-full bg-gold transition-[width] duration-500 ease-out"
              style={{ width: `${((current + 1) / total) * 100}%` }}
            />
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(-1)} disabled={current === 0} aria-label={t.prev} className={arrow}>
              <CaretLeft size="1rem" />
            </button>
            <button type="button" onClick={() => go(1)} disabled={current === total - 1} aria-label={t.next} className={arrow}>
              <CaretRight size="1rem" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
