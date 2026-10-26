"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { COUNTDOWN_FROM, EVENT_END, EVENT_START } from "@/lib/site";
import Countdown from "./Countdown";
import { prefersReducedMotion } from "./prefs";

type Labels = Dict["hero"] & { agendaLink: string };

const TICKS = 60;

type State =
  | { phase: "before"; days: number; hours: number; minutes: number; seconds: number; progress: number }
  | { phase: "live" }
  | { phase: "after" };

// Floating countdown: a ring of ticks fills from COUNTDOWN_FROM to the first
// day, with the days left in the middle; clicking it opens the full countdown.
// It shares the back-to-top button's vertical axis: in that slot at the top of
// the page, then raised above the button once it appears (phones keep it
// hidden over the hero, where the full-width CTA owns the bottom edge).
export default function CountdownRing({ labels }: { labels: Labels }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const [raised, setRaised] = useState(false);
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
        className={`fixed right-3 z-[35] transition-[bottom,opacity] duration-700 ease-[var(--ease-out-expo)] sm:right-5 ${
          raised
            ? "bottom-20 opacity-100 sm:bottom-[6.25rem]"
            : "pointer-events-none bottom-5 opacity-0 sm:pointer-events-auto sm:opacity-100"
        }`}
      >
        {open && (
          <div
            id="countdown-panel"
            role="dialog"
            aria-label={labels.countdown}
            className="absolute bottom-[calc(100%+0.75rem)] right-0 w-[min(22rem,calc(100vw-1.5rem))] origin-bottom-right sm:bottom-0 sm:right-[calc(100%+0.75rem)] animate-[menuDrop_0.5s_var(--ease-out-expo)_both] rounded-[1.75rem] bg-surface/75 p-5 text-ink shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150 sm:w-[22rem] sm:p-6"
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
          className={`group relative grid size-16 place-items-center rounded-full shadow-[var(--shadow)] ring-1 backdrop-blur-xl backdrop-saturate-150 transition-[transform,background-color,color,box-shadow] duration-500 ease-[var(--ease-spring)] hover:scale-105 active:scale-95 sm:size-20 ${
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
          <span className="relative flex h-10 flex-col items-center justify-center overflow-hidden leading-none sm:h-12">
            {state?.phase === "before" || state === null ? (
              <span key={unit} className="ring-unit flex flex-col items-center">
                <span className="font-display text-lg tabular-nums sm:text-[1.375rem]">
                  {state?.phase === "before" ? String(units[unit].value).padStart(unit === 0 ? 1 : 2, "0") : "--"}
                </span>
                <span className={`mt-0.5 text-[0.5rem] uppercase tracking-[0.14em] sm:text-[0.5625rem] ${raised ? "text-ink-2" : "text-white/75"}`}>
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
