"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { COUNTDOWN_FROM, EVENT_END, EVENT_START } from "@/lib/site";
import Countdown from "./Countdown";
import { prefersReducedMotion } from "./prefs";

type Labels = Dict["hero"] & { agendaLink: string };

const TICKS = 60;
const SWAP_MS = 280;

type State =
  | { phase: "before"; days: number; hours: number; minutes: number; seconds: number; progress: number }
  | { phase: "live" }
  | { phase: "after" };

// Floating countdown: a ring of ticks fills from COUNTDOWN_FROM to the first
// day, with the days left in the middle; clicking it opens the full countdown.
// At the top of the page it parks in the hero, in the slot beside the CTA
// ([data-countdown-slot]); as soon as the page scrolls it fades out and fades
// back in at its corner on the back-to-top button's vertical axis, above that button.
export default function CountdownRing({ labels }: { labels: Labels }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  // Where the open popup fits: `top` (hero, desktop) opens it beside the ring,
  // that many px from the ring's top, because there is no room below; maxH is
  // the room in the direction it opens, so it scrolls instead of being cut.
  const [fit, setFit] = useState<{ top: number | null; maxH: number } | null>(null);
  const sideTop = fit?.top ?? null;
  const [raised, setRaised] = useState(false);
  // Fixed-position box (px). null until measured, so the ring never flashes
  // in the wrong place.
  const [box, setBox] = useState<{ top: number; left: number; size: number } | null>(null);
  // Moving between the hero and the corner is a fade, not a trip across the
  // page: fade out, jump while invisible, fade back in at the new spot.
  const [swapping, setSwapping] = useState(false);
  const firstPlace = useRef(true);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btn.current?.focus();
    };
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setRaised(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Where the ring sits: the visible hero slot while at the top, otherwise the
  // corner slot above back-to-top (centred on its axis, 12px above it).
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const slot = [...document.querySelectorAll<HTMLElement>("[data-countdown-slot]")].find(
        (el) => el.getBoundingClientRect().width > 0,
      );
      if (!raised && slot) {
        const r = slot.getBoundingClientRect();
        put(r.top, r.left, r.height);
        return;
      }
      const sm = window.innerWidth >= 640;
      const size = sm ? 80 : 64;
      const axisRight = sm ? 60 : 44; // centre of the back-to-top button from the right edge
      const above = sm ? 100 : 80; // its top edge plus a 12px gap, from the bottom
      const w = document.documentElement.clientWidth;
      put(window.innerHeight - above - size, w - axisRight - size / 2, size);
    };
    // Only re-render when the box actually moved.
    const put = (top: number, left: number, size: number) =>
      setBox((b) =>
        b && Math.abs(b.top - top) < 0.5 && Math.abs(b.left - left) < 0.5 && b.size === size ? b : { top, left, size },
      );
    // While the hero is still moving (its entrance slides the CTA row up, web
    // fonts swap in and change the CTA's width) a single measurement lands in
    // the wrong place, so follow the slot every frame until it has settled.
    let until = 0;
    const tick = () => {
      measure();
      frame = performance.now() < until ? requestAnimationFrame(tick) : 0;
    };
    const follow = (ms = 2600) => {
      if (dead) return;
      until = Math.max(until, performance.now() + ms);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const schedule = () => follow(0);
    let dead = false;
    let unswap = 0;
    let swap = 0;
    if (firstPlace.current) {
      firstPlace.current = false;
      follow(4000);
    } else {
      setSwapping(true);
      setOpen(false);
      swap = window.setTimeout(() => {
        measure();
        unswap = requestAnimationFrame(() => setSwapping(false));
      }, SWAP_MS);
    }
    // The hero slides in after the intro and the fonts may still swap: follow the slot then too.
    const onReady = () => follow();
    const onFonts = () => follow(600);
    window.addEventListener("im:ready", onReady);
    window.addEventListener("resize", schedule);
    document.fonts?.ready.then(onFonts);
    const late = window.setTimeout(schedule, 1600);
    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(unswap);
      window.clearTimeout(swap);
      window.clearTimeout(late);
      window.removeEventListener("im:ready", onReady);
      window.removeEventListener("resize", schedule);
    };
  }, [raised]);

  useEffect(() => {
    const from = new Date(COUNTDOWN_FROM).getTime();
    const s = new Date(EVENT_START).getTime();
    const e = new Date(EVENT_END).getTime();
    const tick = () => {
      const now = Date.now();
      if (now < s) {
        const left = Math.floor((s - now) / 1000);
        setState({
          phase: "before",
          days: Math.floor(left / 86_400),
          hours: Math.floor((left % 86_400) / 3600),
          minutes: Math.floor((left % 3600) / 60),
          seconds: left % 60,
          progress: Math.min(1, Math.max(0, (now - from) / (s - from))),
        });
      } else if (now <= e) setState({ phase: "live" });
      else setState({ phase: "after" });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // The centre steps through days → hours → minutes → seconds, so the ring
  // always shows the whole countdown, one unit at a time.
  const [unit, setUnit] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setUnit((u) => (u + 1) % 4), 2600);
    return () => window.clearInterval(id);
  }, []);

  // A gold dot orbits once a minute, synced to the current second.
  const orbit = useRef<SVGGElement>(null);
  useEffect(() => {
    if (orbit.current) orbit.current.style.animationDelay = `${-((Date.now() / 1000) % 60)}s`;
  }, []);

  const before = state?.phase === "before" ? state : null;
  const units = [
    { value: before?.days ?? 0, label: labels.days },
    { value: before?.hours ?? 0, label: labels.hours },
    { value: before?.minutes ?? 0, label: labels.minutes },
    { value: before?.seconds ?? 0, label: labels.seconds },
  ];
  const progress = state === null ? 0 : state.phase === "before" ? state.progress : 1;
  const filled = Math.round(progress * TICKS);
  // Before the popup paints, check it fits below the ring; on short screens
  // (laptops, tablets on their side) it moves beside the ring instead, shifted
  // up as far as needed to stay fully on screen.
  useLayoutEffect(() => {
    const el = panel.current;
    let next: { top: number | null; maxH: number } | null = null;
    if (open && box && el) {
      const gap = 12;
      const vh = window.innerHeight;
      const h = el.scrollHeight;
      if (raised) {
        // Phones: above the ring. Larger screens: to its left, bottoms aligned.
        next = { top: null, maxH: (window.innerWidth >= 640 ? box.top + box.size : box.top - gap) - gap };
      } else if (window.innerWidth < 1024) {
        next = { top: null, maxH: box.top - 2 * gap };
      } else if (box.top + box.size + gap + h <= vh - gap) {
        next = { top: null, maxH: vh - box.top - box.size - 2 * gap };
      } else {
        const top = Math.max(gap, Math.min(box.top, vh - gap - h));
        next = { top: top - box.top, maxH: vh - 2 * gap };
      }
    }
    setFit((cur) => (cur && next && cur.top === next.top && cur.maxH === next.maxH ? cur : next));
  }, [open, raised, box]);

  const label =
    state?.phase === "before"
      ? `${labels.countdown}: ${state.days} ${labels.days} · ${labels.dates}`
      : state?.phase === "live"
        ? labels.live
        : state?.phase === "after"
          ? labels.after
          : labels.countdown;

  return (
    <>
      <div ref={sentinel} aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-px" />
      <div
        ref={wrap}
        className={`fixed z-[35] transition-opacity ease-out ${
          box && !swapping ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{
          transitionDuration: `${SWAP_MS}ms`,
          ...(box ? { top: box.top, left: box.left, width: box.size, height: box.size } : {}),
        }}
      >
        {open && (
          <div
            ref={panel}
            id="countdown-panel"
            role="dialog"
            aria-label={labels.countdown}
            style={fit ? { top: sideTop ?? undefined, maxHeight: fit.maxH } : undefined}
            className={`absolute w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto animate-[menuDrop_0.5s_var(--ease-out-expo)_both] ${
              raised
                ? "bottom-[calc(100%+0.75rem)] right-0 origin-bottom-right sm:bottom-0 sm:right-[calc(100%+0.75rem)]"
                : sideTop !== null
                  ? // Short desktop screens: beside the ring, kept inside the viewport.
                    "left-[calc(100%+0.75rem)] origin-left"
                  : // In the hero the popup drops below the ring on desktop; on phones the
                    // ring sits at the bottom of the screen, so it opens above.
                    "bottom-[calc(100%+0.75rem)] right-0 origin-bottom-right lg:bottom-auto lg:right-auto lg:left-0 lg:top-[calc(100%+0.75rem)] lg:origin-top-left"
            } rounded-[1.75rem] bg-surface/75 p-5 text-ink shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150 sm:w-[22rem] sm:p-6`}
          >
            <p className="text-xs text-ink-2 sm:text-sm">{labels.countdown}</p>
            <p className="mb-4 mt-1 text-xs font-medium text-gold sm:text-sm">{labels.dates}</p>
            <Countdown start={EVENT_START} end={EVENT_END} labels={labels} compact />
            <a
              href="#agenda-2027"
              onClick={() => setOpen(false)}
              className="group mt-5 flex items-center justify-between rounded-full py-2 pl-4 pr-2 text-sm font-medium text-brand ring-1 ring-line transition-colors hover:bg-sun hover:text-sun-ink"
            >
              {labels.agendaLink}
              <ArrowRight size="1rem" className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-x-0.5" />
            </a>
          </div>
        )}
        <button
          type="button"
          ref={btn}
          aria-label={label}
          aria-expanded={open}
          aria-controls="countdown-panel"
          onClick={() => setOpen((v) => !v)}
          className={`group relative grid size-full place-items-center rounded-full shadow-[var(--shadow)] ring-1 backdrop-blur-xl backdrop-saturate-150 transition-[transform,background-color,color,box-shadow] duration-500 ease-[var(--ease-spring)] hover:scale-105 active:scale-95 ${
            raised ? "bg-surface/60 text-ink ring-line" : "bg-[rgb(34_14_52/0.45)] text-white ring-white/20"
          }`}
        >
          <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full -rotate-90 overflow-visible">
            {Array.from({ length: TICKS }, (_, i) => {
              const on = i < filled;
              const lead = i === filled - 1 && state?.phase === "before";
              return (
                <line
                  key={i}
                  x1="85"
                  y1="50"
                  x2={i % 5 === 0 ? "95" : "93"}
                  y2="50"
                  transform={`rotate(${(i * 360) / TICKS} 50 50)`}
                  strokeWidth={i % 5 === 0 ? 2.4 : 1.8}
                  strokeLinecap="round"
                  className={`transition-[stroke] duration-500 ${on ? "stroke-sun" : raised ? "stroke-ink/15" : "stroke-white/25"} ${lead ? "animate-pulse" : ""}`}
                  style={{ transitionDelay: `${i * 12}ms` }}
                />
              );
            })}
            <g ref={orbit} className="ring-orbit">
              <circle cx="100" cy="50" r="2.6" className="fill-sun" />
            </g>
          </svg>
          <span className="relative flex h-[56%] w-[56%] flex-col items-center justify-center overflow-hidden leading-none">
            {state?.phase === "before" || state === null ? (
              <span key={unit} className="ring-unit flex flex-col items-center">
                <span className={`font-display tabular-nums ${raised ? "text-lg sm:text-[1.375rem]" : "text-[1.3rem]"}`}>
                  {state?.phase === "before" ? String(units[unit].value).padStart(unit === 0 ? 1 : 2, "0") : "--"}
                </span>
                <span className={`mt-0.5 uppercase tracking-[0.14em] ${raised ? "text-[0.5rem] text-ink-2 sm:text-[0.5625rem]" : "text-[0.5rem] text-white/75"}`}>
                  {units[unit].label}
                </span>
              </span>
            ) : (
              <span className="font-display text-base sm:text-lg">2027</span>
            )}
          </span>
        </button>
      </div>
    </>
  );
}
