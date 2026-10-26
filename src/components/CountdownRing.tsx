"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { COUNTDOWN_FROM, EVENT_END, EVENT_START } from "@/lib/site";
import Countdown from "./Countdown";

type Labels = Dict["hero"] & { agendaLink: string };

const TICKS = 60;

type State = { phase: "before"; days: number; progress: number } | { phase: "live" } | { phase: "after" };

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
        setState({
          phase: "before",
          days: Math.floor((s - now) / 86_400_000),
          progress: Math.min(1, Math.max(0, (now - from) / (s - from))),
        });
      } else if (now <= e) setState({ phase: "live" });
      else setState({ phase: "after" });
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

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
              className="group mt-5 flex items-center justify-between rounded-full py-2 pl-4 pr-2 text-sm font-medium text-brand ring-1 ring-line transition-colors hover:bg-brand hover:text-brand-ink"
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
          className="group relative grid size-16 place-items-center rounded-full bg-surface/60 text-ink shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150 transition-transform duration-500 ease-[var(--ease-spring)] hover:scale-105 active:scale-95 sm:size-20"
        >
          <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full -rotate-90">
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
                  className={`transition-[stroke] duration-500 ${on ? "stroke-sun" : "stroke-ink/15"} ${lead ? "animate-pulse" : ""}`}
                  style={{ transitionDelay: `${i * 12}ms` }}
                />
              );
            })}
          </svg>
          <span className="relative flex flex-col items-center leading-none">
            {state?.phase === "before" || state === null ? (
              <>
                <span className="font-display text-xl tabular-nums sm:text-[1.625rem]">
                  {state?.phase === "before" ? state.days : "--"}
                </span>
                <span className="mt-0.5 text-[0.5625rem] uppercase tracking-[0.12em] text-ink-2 sm:text-[0.625rem]">
                  {labels.days}
                </span>
              </>
            ) : (
              <span className="font-display text-base sm:text-lg">2027</span>
            )}
          </span>
        </button>
      </div>
    </>
  );
}
