"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ArrowLeft, ArrowRight, Pause, Play, Question, X } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";

type TourT = Dict["agendaApp"]["tour"];
export type TourStep = { target?: string; title: string; text: string };

// A guided tour of the page. It plays by itself: the page dims, one control
// at a time is lit (a soft cut-out gliding from one to the next) and a card,
// always in the same place at the bottom of the screen, says what it does;
// a thin bar shows the time left on each step. Next / Back / Pause / Skip,
// Esc and the arrow keys; pointing at the card pauses it.
// First visit, viewing only (not signed in, not embedded): it starts on its
// own. Seen once per page and device (kept in this browser); the "?" beside
// the search plays it again.

const KEY = "im-agenda-tour-v1:";
const EVENT = "im:agenda-tour";
const PAD = 6;
const TOP = 76; // clear of the top bar

// The element a step points at: the first one with that data-tour that is
// actually on screen (some controls exist twice, for phones and for desktop).
function findTarget(name?: string): HTMLElement | null {
  if (!name) return null;
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
  }
  return null;
}

// The card's usual place ("home"): at the bottom on phones, from the middle
// of the screen down on wider ones. Its top edge there:
const homeTop = (cardH: number) => (window.innerWidth < 640 ? window.innerHeight - cardH - 12 : window.innerHeight / 2);
// A control that stays put when the page scrolls (the phone tab bar).
function isFixed(el: HTMLElement) {
  for (let e: HTMLElement | null = el; e; e = e.parentElement) if (getComputedStyle(e).position === "fixed") return true;
  return false;
}
const atEnd = () => Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2;
// Where the card goes: home; just above a control fixed low on the screen
// (the tab bar); or at the top when the control is low and the page cannot
// scroll it any higher.
type Place = { mode: "home" } | { mode: "above"; bottom: number } | { mode: "top" };

// Reading time: longer texts stay longer.
const duration = (s: TourStep) => Math.min(5.5, Math.max(2.8, (s.title.length + s.text.length) / 26));

type Box = { x: number; y: number; w: number; h: number; r: number } | null;

export default function Tour({ page, steps, t, enabled }: { page: string; steps: TourStep[]; t: TourT; enabled: boolean }) {
  const [i, setI] = useState(-1);
  const [box, setBox] = useState<Box>(null);
  const [paused, setPaused] = useState(false);
  const [place, setPlace] = useState<Place>({ mode: "home" });
  const [hover, setHover] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const timer = useRef<gsap.core.Tween | null>(null);
  const live = steps.filter((s) => !s.target || typeof document === "undefined" || findTarget(s.target));
  const step = i >= 0 ? live[i] : null;
  const last = i === live.length - 1;

  const finish = useCallback(() => {
    try {
      localStorage.setItem(KEY + page, "1");
    } catch {}
    setI(-1);
  }, [page]);
  const next = useCallback(() => setI((n) => (n + 1 < live.length ? n + 1 : (finish(), -1))), [live.length, finish]);

  // First visit: starts after the page settles. Never when signed in or
  // embedded in another site.
  useEffect(() => {
    if (!enabled || document.documentElement.hasAttribute("data-embed")) return;
    let seen: string | null = "1";
    try {
      seen = localStorage.getItem(KEY + page);
    } catch {}
    if (seen) return;
    const id = window.setTimeout(() => setI(0), 900);
    return () => window.clearTimeout(id);
  }, [enabled, page]);

  // The "?" plays it again, from the start.
  useEffect(() => {
    const again = () => {
      setPaused(false);
      setI(0);
    };
    window.addEventListener(EVENT, again);
    return () => window.removeEventListener(EVENT, again);
  }, []);

  // The light: on the step's control, never under the card. The page
  // scrolls, gently, only when the control is not already in the free part
  // (between the top bar and the card); the card moves only when it would
  // otherwise cover the control.
  const measure = useCallback(() => {
    const el = findTarget(step?.target);
    if (!el) {
      setPlace({ mode: "home" });
      return setBox(null);
    }
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const cardH = card.current?.offsetHeight ?? 220;
    const home = homeTop(cardH);
    let p: Place = { mode: "home" };
    let top = Math.max(8, r.top - PAD);
    let bottom = Math.min(vh - 8, r.bottom + PAD);
    if (isFixed(el) && r.top > vh / 2) p = { mode: "above", bottom: vh - r.top + PAD + 28 };
    else if (r.bottom + PAD > home - 12 && r.top > vh * 0.35 && atEnd()) {
      p = { mode: "top" };
      top = Math.max(top, (window.innerWidth < 640 ? 12 : 24) + cardH + 12);
    } else bottom = Math.min(bottom, home - 12);
    setPlace((old) => (old.mode === p.mode && (p.mode !== "above" || (old.mode === "above" && old.bottom === p.bottom)) ? old : p));
    const h = Math.max(0, bottom - top);
    const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 14;
    setBox({ x: Math.max(4, r.left - PAD), y: top, w: Math.min(window.innerWidth - 8, r.width + PAD * 2), h, r: Math.min(radius + PAD, h / 2) });
  }, [step]);
  useLayoutEffect(() => {
    if (!step) return;
    const el = findTarget(step.target);
    if (el && !isFixed(el)) {
      const r = el.getBoundingClientRect();
      const free = homeTop(card.current?.offsetHeight ?? 220) - 16;
      const room = free - TOP;
      if (r.top < TOP || r.bottom > free) {
        // Fits: in the middle of the free part. Bigger: its start at the top.
        const to = r.height > room ? r.top - TOP : r.top - TOP - (room - r.height) / 2;
        window.scrollBy({ top: to, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    }
    measure();
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, measure]);

  // The card's text changes softly at each step (the card itself stays).
  useLayoutEffect(() => {
    if (!step || !card.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = card.current.querySelectorAll("[data-step-text]");
    const tw = gsap.fromTo(els, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.05, clearProps: "opacity,visibility,transform" });
    return () => void tw.revert();
  }, [i, step]);

  // Plays by itself: the bar fills over the step's reading time, then the
  // next one. Paused by the button or while the pointer is on the card.
  useEffect(() => {
    if (!step || !bar.current) return;
    const tw = gsap.fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, duration: duration(step), ease: "none", onComplete: next });
    timer.current = tw;
    return () => {
      tw.kill();
      timer.current = null;
    };
  }, [i, step, next]);
  useEffect(() => {
    if (paused || hover) timer.current?.pause();
    else timer.current?.resume();
  }, [paused, hover, i]);

  useEffect(() => {
    if (!step) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [step, next, finish]);

  if (!step || typeof document === "undefined") return null;

  return createPortal(
    // The platform's colours, on a clear ground (the class brings a fill).
    <div className="platform font-sans" style={{ background: "transparent" }}>
      <div data-tour-open className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={step.title} onClick={(e) => e.stopPropagation()}>
        {/* The dim, with the lit control cut out of it (it glides between
            controls; a full dim when the step points at nothing). */}
        <div
          aria-hidden
          className="pointer-events-none absolute transition-[top,left,width,height,border-radius] duration-[520ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={
            box
              ? { top: box.y, left: box.x, width: box.w, height: box.h, borderRadius: box.r, boxShadow: "0 0 0 9999px rgb(18 10 28 / 0.62), 0 0 0 2px rgb(255 255 255 / 0.95), 0 0 0 7px rgb(91 42 134 / 0.35)" }
              : { top: "40%", left: "50%", width: 0, height: 0, boxShadow: "0 0 0 9999px rgb(18 10 28 / 0.62)" }
          }
        />

        {/* The card: always in the same place for every step: at the bottom
            on phones (under the thumb), from the middle of the screen down on
            wider ones; the lit control always stays above it. */}
        <div
          className={`absolute inset-x-0 flex justify-center px-3 sm:px-4 ${
            place.mode === "home"
              ? "bottom-0 pb-[calc(12px+env(safe-area-inset-bottom))] sm:top-1/2 sm:bottom-auto sm:pb-0"
              : place.mode === "top"
                ? "top-0 pt-3 sm:pt-6"
                : ""
          }`}
          style={place.mode === "above" ? { bottom: place.bottom } : undefined}
        >
          <div
            ref={card}
            onPointerEnter={() => setHover(true)}
            onPointerLeave={() => setHover(false)}
            className="relative w-full max-w-[440px] overflow-hidden rounded-[22px] bg-surface text-ink shadow-[0_30px_80px_-24px_rgb(0_0_0/0.55)] ring-1 ring-line"
          >
            {/* Time left on this step */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-[rgb(118_118_128/0.15)]">
              <span ref={bar} className="block h-full origin-left bg-brand" style={{ transform: "scaleX(0)" }} />
            </span>

            <div className="p-5 pt-[18px]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-semibold tabular-nums text-brand">
                  {i + 1} {t.of} {live.length}
                </p>
                <div className="-mr-1.5 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setPaused((p) => !p)}
                    aria-label={paused ? t.play : t.pause}
                    title={paused ? t.play : t.pause}
                    className="grid size-8 place-items-center rounded-full text-muted hover:bg-[rgb(118_118_128/0.12)] hover:text-ink"
                  >
                    {paused ? <Play size={15} weight="fill" /> : <Pause size={15} weight="fill" />}
                  </button>
                  <button type="button" onClick={finish} aria-label={t.skip} title={t.skip} className="grid size-8 place-items-center rounded-full text-muted hover:bg-[rgb(118_118_128/0.12)] hover:text-ink">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <h2 data-step-text className="mt-1 text-[18px] font-semibold leading-snug tracking-[-0.015em] sm:text-[19px]">
                {step.title}
              </h2>
              <p data-step-text className="mt-1 min-h-[3em] text-[15px] leading-relaxed text-ink-2">
                {step.text}
              </p>
              <div className="mt-4 flex items-center gap-2">
                {/* Progress dots */}
                <div className="flex min-w-0 flex-1 items-center gap-1.5" aria-hidden>
                  {live.map((_, k) => (
                    <span key={k} className={`h-1.5 shrink-0 rounded-full transition-all duration-300 ${k === i ? "w-5 bg-brand" : k < i ? "w-1.5 bg-brand/40" : "w-1.5 bg-[rgb(118_118_128/0.3)]"}`} />
                  ))}
                </div>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => setI(i - 1)}
                    aria-label={t.back}
                    title={t.back}
                    className="grid size-10 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-[rgb(118_118_128/0.1)] hover:text-ink"
                  >
                    <ArrowLeft size={17} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={next}
                  autoFocus
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand px-5 text-[14px] font-semibold text-brand-ink shadow-[0_8px_20px_-10px_rgb(91_42_134/0.7)] transition-transform active:scale-[0.97]"
                >
                  {last ? t.done : t.next} {!last && <ArrowRight size={15} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// The round "?" beside the search: plays the page's tour again. Each time
// the page opens, a small bubble points at it for a few seconds ("Take a
// quick tour") with a soft pulse, so everyone knows it is there; never while
// the tour itself is open.
export function HelpButton({ label, hint, className = "" }: { label: string; hint: string; className?: string }) {
  const [tip, setTip] = useState(false);
  const bubble = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let hide = 0;
    const show = window.setTimeout(function tryShow() {
      // The tour is open (first visit): wait for it to close.
      if (document.querySelector("[data-tour-open]")) return void (hide = window.setTimeout(tryShow, 800));
      setTip(true);
      hide = window.setTimeout(() => setTip(false), 5000);
    }, 1400);
    const off = () => setTip(false);
    window.addEventListener(EVENT, off);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
      window.removeEventListener(EVENT, off);
    };
  }, []);
  useLayoutEffect(() => {
    if (!tip || !bubble.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tw = gsap.fromTo(bubble.current, { autoAlpha: 0, y: -6, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.8)", clearProps: "opacity,visibility,transform" });
    return () => void tw.revert();
  }, [tip]);
  return (
    <span className={`relative shrink-0 ${className}`}>
      {tip && <span aria-hidden className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-brand/30" />}
      <button
        type="button"
        data-tour="howto"
        onClick={() => {
          setTip(false);
          window.dispatchEvent(new Event(EVENT));
        }}
        title={label}
        aria-label={label}
        className={`relative grid size-11 place-items-center rounded-full transition-[background-color,color,transform] duration-200 active:scale-95 ${
          tip ? "bg-brand text-brand-ink" : "bg-[rgb(118_118_128/0.12)] text-ink-2 hover:bg-[rgb(118_118_128/0.18)] hover:text-ink"
        }`}
      >
        <Question size={19} weight="bold" aria-hidden />
      </button>
      {tip && (
        // Under the button, its right edge on the button's (always inside
        // the screen: the button sits at the end of its row).
        <span ref={bubble} role="status" className="absolute right-0 top-full z-30 mt-2.5 whitespace-nowrap rounded-[12px] bg-ink px-3 py-2 text-[13px] font-medium text-white shadow-[0_12px_30px_-10px_rgb(0_0_0/0.45)]">
          <span aria-hidden className="absolute -top-1 right-4 size-2.5 rotate-45 rounded-[2px] bg-ink" />
          {hint}
        </span>
      )}
    </span>
  );
}
