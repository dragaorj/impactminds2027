"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowsOut, Pause, Play } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { photos } from "@/lib/site";
import Lightbox from "../Lightbox";
import { prefersReducedMotion } from "../prefs";
import { container, section } from "../ui";

const SLIDE_MS = 5000;

const ctrlBtn =
  "grid size-11 place-items-center rounded-full bg-[rgb(34_14_52/0.45)] text-white ring-1 ring-white/25 backdrop-blur-md transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:bg-sun hover:text-sun-ink active:scale-95";

// Index of the twelve visits on one side, one photo at a time on the other.
// The photos advance on their own: the active item's border fills like a
// timer and the next visit starts when it closes (the CSS animation drives
// the timing, so pausing freezes the border exactly where it is). Picking an
// item jumps to it; the photo opens the lightbox with every caption.
export default function Visits({ t }: { t: Dict["visits"] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const total = photos.visits.length;
  const go = (i: number) => setActive((i + total) % total);
  const halted = paused || hovering || viewing !== null;

  // The first photo starts its zoom one frame after mount, so the transition runs.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section id="visitas" className={section} aria-labelledby="visitas-title">
      <div className={`${container} grid gap-12 xl:grid-cols-12 xl:items-center xl:gap-x-[5vw]`}>
        <div className="xl:col-span-6">
          <h2 id="visitas-title" className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.02] text-ink">
            {t.title}
          </h2>
          <p className="mt-5 max-w-[46ch] text-xl leading-relaxed text-ink-2">{t.lead}</p>
          <ol className="-mx-3 mt-10 grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2">
            {t.list.map((v, i) => {
              const on = i === active;
              return (
                <li key={v.name}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={on ? "true" : undefined}
                    className={`group relative flex w-full items-baseline gap-3 rounded-2xl px-3 py-2.5 text-left ring-1 ring-transparent transition-[background-color,box-shadow] duration-300 ${
                      on ? "bg-surface/70" : "hover:bg-surface hover:ring-sun/60 focus-visible:ring-sun/60"
                    }`}
                  >
                    {on && (
                      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
                        <rect x="0.75" y="0.75" rx="15" pathLength={100} className="visit-track" />
                        <rect
                          key={active}
                          x="0.75"
                          y="0.75"
                          rx="15"
                          pathLength={100}
                          className="visit-timer"
                          style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: halted ? "paused" : "running" }}
                          onAnimationEnd={() => go(active + 1)}
                        />
                      </svg>
                    )}
                    <span className={`w-7 shrink-0 font-display text-base tabular-nums ${on ? "text-gold" : "text-sun"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block font-display text-lg leading-tight transition-colors md:text-xl ${
                          on ? "text-gold" : "text-ink group-hover:text-gold"
                        }`}
                      >
                        {v.name}
                      </span>
                      <span className={`mt-0.5 block text-sm leading-snug ${on ? "text-ink-2" : "text-muted"}`}>{v.theme}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div
          className="xl:col-span-6"
          data-reveal
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onFocus={() => setHovering(true)}
          onBlur={() => setHovering(false)}
        >
          <div
            className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-block ring-1 ring-line sm:aspect-[4/3] xl:aspect-auto xl:h-[min(78dvh,48rem)]"
            role="group"
            aria-roledescription="carousel"
            aria-label={t.title}
          >
            {/* Slow crossfade; the photo on show drifts into a gentle zoom for the
                whole slide, then resets only once it has faded out. */}
            {photos.visits.map((src, i) => {
              const on = i === active;
              return (
                <div
                  key={src}
                  aria-hidden={!on}
                  className={`absolute inset-0 transition-opacity duration-[1600ms] ease-in-out ${on ? "opacity-100" : "opacity-0"}`}
                >
                  <Image
                    src={src}
                    alt={`${t.list[i].name}: ${t.list[i].theme}`}
                    fill
                    sizes="(min-width:1280px) 45vw, 100vw"
                    className={`object-cover transition-transform ${
                      on && ready
                        ? "scale-[1.08] duration-[7000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                        : "scale-100 duration-0 delay-[1600ms]"
                    }`}
                  />
                </div>
              );
            })}
            {/* The whole photo opens the lightbox; the controls sit above it. */}
            <button
              type="button"
              onClick={() => setViewing(active)}
              aria-label={`${t.enlarge}: ${t.list[active].name}`}
              className="absolute inset-0 block size-full"
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(34_14_52/0)_45%,rgb(34_14_52/0.85))]" />

            <button
              type="button"
              onClick={() => setViewing(active)}
              aria-label={`${t.enlarge}: ${t.list[active].name}`}
              tabIndex={-1}
              className={`${ctrlBtn} absolute right-4 top-4`}
            >
              <ArrowsOut size="1.125rem" />
            </button>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-7">
              <div key={active} className="min-w-0 animate-[visitCaption_1.2s_ease-out_both]" aria-live="polite">
                <p className="text-sm tabular-nums text-[#E2C985]">
                  {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </p>
                <p className="mt-1 font-display text-2xl leading-tight sm:text-3xl">{t.list[active].name}</p>
                <p className="mt-1 text-sm text-white/80 sm:text-base">{t.list[active].theme}</p>
              </div>
              <div className="pointer-events-auto flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  aria-pressed={paused}
                  aria-label={paused ? t.play : t.pause}
                  className={ctrlBtn}
                >
                  {paused ? <Play size="1rem" weight="fill" /> : <Pause size="1rem" weight="fill" />}
                </button>
                <button type="button" onClick={() => go(active - 1)} aria-label={t.prev} className={ctrlBtn}>
                  <ArrowLeft size="1.125rem" />
                </button>
                <button type="button" onClick={() => go(active + 1)} aria-label={t.next} className={ctrlBtn}>
                  <ArrowRight size="1.125rem" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Lightbox
        items={photos.visits.map((src, i) => ({ src, title: t.list[i].name, subtitle: t.list[i].theme }))}
        index={viewing}
        onIndex={(i) => {
          setViewing(i);
          if (i !== null) setActive(i);
        }}
        labels={{ label: t.title, close: t.close, prev: t.prev, next: t.next }}
      />
    </section>
  );
}
