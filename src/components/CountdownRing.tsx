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
  // The corner popup's height cap: the room above the ring (phones) or up to
  // its bottom edge (larger screens), so it scrolls instead of being cut.
  const [maxH, setMaxH] = useState<number | null>(null);
  const [raised, setRaised] = useState(false);
  // Fixed-position box (px). null until measured, so the ring never flashes
  // in the wrong place.
  const [box, setBox] = useState<{ top: number; left: number; size: number } | null>(null);
  // Moving between the hero and the corner is a fade, not a trip across the
  // page: fade out, jump while invisible, fade back in at the new spot.
  const [swapping, setSwapping] = useState(false);
  const firstPlace = useRef(true);
  const [open, setOpen] = useState(false);
  // While the corner panel is open (not the hero bar view) the page behind
  // wears the same blurred veil as the bar's menus (html[data-countdown-open], body::after in globals.css).
  useEffect(() => {
    const d = document.documentElement;
    if (open && raised) d.setAttribute("data-countdown-open", "");
    else d.removeAttribute("data-countdown-open");
    return () => d.removeAttribute("data-countdown-open");
  }, [open, raised]);

  const [state, setState] = useState<State | null>(null);

  // In the hero the ring doesn't open a popup: its details replace the
  // content of the hero's frosted info bar (Hero listens). In the corner the
  // popup opens as usual, and the bar goes back to the event facts.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("im:countdown-bar", { detail: open && !raised }));
  }, [open, raised]);
  // The music player taking the hero bar closes the countdown's details.
  useEffect(() => {
    const onMusic = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail && !raised) setOpen(false);
    };
    window.addEventListener("im:music-bar", onMusic);
    return () => window.removeEventListener("im:music-bar", onMusic);
  }, [raised]);

  // While the ring is in the corner, its hero slot collapses (CSS) so the CTA
  // sits centred on its own.
  useEffect(() => {
    const d = document.documentElement;
    if (raised) d.dataset.ringRaised = "";
    else delete d.dataset.ringRaised;
  }, [raised]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btn.current?.focus();
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Element;
      // In the hero the details live in the hero's info bar: clicks there
      // (the agenda link) must not close them.
      if (!wrap.current?.contains(target) && !target.closest?.("[data-countdown-bar]")) setOpen(false);
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
        // Back in the hero, the slot is still reopening: follow it.
        if (!raised) follow(700);
      }, SWAP_MS);
    }
    // The hero slides in after the intro and the fonts may still swap: follow the slot then too.
    const onReady = () => follow();
    const onFonts = () => follow(600);
    window.addEventListener("im:ready", onReady);
    window.addEventListener("resize", schedule);
    // The hero bar opening or folding moves the slot (Hero.tsx): follow it.
    const onShift = () => follow(1000);
    window.addEventListener("im:hero-shift", onShift);
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
      window.removeEventListener("im:hero-shift", onShift);
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
  useLayoutEffect(() => {
    if (!open || !raised || !box) return;
    const gap = 12;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- layout measurement before paint
    setMaxH((window.innerWidth >= 640 ? box.top + box.size : box.top - gap) - gap);
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
        data-dock="2"
        className={`fixed z-[35] transition-opacity ease-out ${
          box && !swapping ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{
          transitionDuration: `${SWAP_MS}ms`,
          ...(box ? { top: box.top, left: box.left, width: box.size, height: box.size } : {}),
        }}
      >
        {open && raised && (
          <div
            id="countdown-panel"
            role="dialog"
            aria-label={labels.countdown}
            style={maxH ? { maxHeight: maxH } : undefined}
            className="absolute bottom-[calc(100%+0.75rem)] right-0 w-[min(22rem,calc(100vw-1.5rem))] origin-bottom-right animate-[menuDrop_0.5s_var(--ease-out-expo)_both] overflow-y-auto rounded-[1.75rem] bg-surface/90 p-5 text-ink shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150 sm:bottom-0 sm:right-[calc(100%+0.75rem)] sm:w-[22rem] sm:p-6"
          >
            <p className="text-xs text-ink-2 sm:text-sm">{labels.countdown}</p>
            <p className="mb-4 mt-1 text-xs font-medium text-gold sm:text-sm">
              {labels.eyebrow} · {labels.dates}
            </p>
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
          className={`group relative grid size-full place-items-center rounded-full shadow-[var(--shadow)] ring-1 transition-[transform,background-color,color,box-shadow] duration-500 ease-[var(--ease-spring)] hover:scale-105 active:scale-95 ${
            raised ? "bg-surface/60 text-ink ring-line backdrop-blur-xl backdrop-saturate-150" : "bg-[rgb(34_14_52/0.6)] text-white ring-white/20"
          }`}
        >
          <span aria-hidden className={`fab-tip ${raised ? "fab-tip-side" : ""}`}>
            {labels.countdownTip}
          </span>
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
          {/* Text sized to the ring itself (container units), so number and label
              keep clear of the ticks at every ring size. */}
          <span className="relative flex h-[66%] w-[66%] flex-col items-center justify-center overflow-hidden leading-none [container-type:inline-size]">
            {state?.phase === "before" || state === null ? (
              <span key={unit} className="ring-unit flex flex-col items-center">
                <span className="font-display text-[40cqw] tabular-nums">
                  {state?.phase === "before" ? String(units[unit].value).padStart(unit === 0 ? 1 : 2, "0") : "--"}
                </span>
                <span className={`mt-[3cqw] text-[20cqw] uppercase tracking-[0.04em] ${raised ? "text-ink-2" : "text-white/75"}`}>
                  {units[unit].label}
                </span>
              </span>
            ) : (
              <span className="font-display text-[30cqw]">2027</span>
            )}
          </span>
        </button>
      </div>
    </>
  );
}
