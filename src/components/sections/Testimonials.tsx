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

// Plain cards, each: the organisation, the quote, then the person with a
// closing quote mark. From md all six show at once in a grid (two, then three
// per row); on phones one card at a time, swiped or stepped with the arrows,
// moving on by itself every few seconds while in view and left alone.
export default function Testimonials({ t, lang }: { t: Dict["testimonials"]; lang: Locale }) {
  const track = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = testimonials.length;

  // The card filling the row is the current one (phones only; from md the row is a grid).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const sync = () => {
      const card = el.children[0] as HTMLElement | undefined;
      if (!card || el.scrollWidth <= el.clientWidth) return;
      setCurrent(Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / (card.offsetWidth + 16)))));
    };
    el.addEventListener("scroll", sync, { passive: true });
    return () => el.removeEventListener("scroll", sync);
  }, [total]);

  const show = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + total) % total;
    const card = el.children[next] as HTMLElement;
    el.scrollTo({ left: card.offsetLeft - (el.children[0] as HTMLElement).offsetLeft, behavior: "smooth" });
    setCurrent(next);
  };

  // Autoplay on phones: every 6s while the row is on screen, unless the reader
  // is touching or has stepped through it themselves, or motion is reduced.
  useEffect(() => {
    const el = track.current;
    if (!el || paused || document.documentElement.dataset.motion === "reduce") return;
    if (!window.matchMedia("(max-width: 47.99rem)").matches) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    const id = window.setInterval(() => visible && show(current + 1), 6000);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, paused]);

  // Hover zoom grows from the pointer: its spot in the card is the transform origin (globals.css, .tm-card).
  const zoomAt = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    e.currentTarget.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  };

  const arrow =
    "grid size-11 place-items-center rounded-full text-ink ring-1 ring-line transition-[background-color,color] duration-300 hover:bg-sun hover:text-sun-ink";

  return (
    <section id="depoimentos" className={`${section} overflow-hidden bg-bg-2 wave-y`} aria-labelledby="depoimentos-title">
      <Art name="petals" className="pointer-events-none absolute bottom-[calc(var(--wave)+0.5rem)] right-[1vw] hidden w-14 lg:block" />
      <div className={container}>
        <H2 id="depoimentos-title" className="max-w-2xl" data-reveal>
          {t.title}
        </H2>

        <ul
          ref={track}
          aria-label={t.title}
          className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] md:mt-16 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
          onPointerDown={() => setPaused(true)}
          data-reveal
        >
          {testimonials.map((item) => (
            <li key={item.name} className="w-full shrink-0 snap-center md:w-auto">
              <figure className="tm-card relative flex h-full flex-col rounded-[1.75rem] bg-surface p-6 ring-1 ring-line md:p-7" onPointerMove={zoomAt}>
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

        {/* Phones: the arrows around one dot per card. */}
        <div className="mt-6 flex items-center justify-center gap-4 md:hidden">
          <button type="button" onClick={() => (setPaused(true), show(current - 1))} aria-label={t.prev} className={arrow}>
            <CaretLeft size="1rem" />
          </button>
          <div className="flex gap-2" aria-hidden>
            {testimonials.map((item, i) => (
              <span key={item.name} className={`h-1.5 rounded-full transition-[width,background-color] duration-500 ${i === current ? "w-6 bg-gold" : "w-1.5 bg-line"}`} />
            ))}
          </div>
          <button type="button" onClick={() => (setPaused(true), show(current + 1))} aria-label={t.next} className={arrow}>
            <CaretRight size="1rem" />
          </button>
        </div>
      </div>
    </section>
  );
}
