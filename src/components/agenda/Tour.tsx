"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ArrowLeft, ArrowRight, Question, X } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";

type TourT = Dict["agendaApp"]["tour"];
export type TourStep = { target?: string; title: string; text: string };

// First visit, viewing only (not signed in, not embedded): a short guided
// tour. The page dims, one control at a time is lit (a soft cut-out) with a
// card saying what it does; Next / Back / Skip, Esc. Seen once per page and
// device (kept in this browser); the "?" beside the search plays it again.

const KEY = "im-agenda-tour-v1:";
const EVENT = "im:agenda-tour";
const PAD = 6;

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

type Box = { x: number; y: number; w: number; h: number; r: number } | null;

export default function Tour({ page, steps, t, enabled }: { page: string; steps: TourStep[]; t: TourT; enabled: boolean }) {
  const [i, setI] = useState(-1);
  const [box, setBox] = useState<Box>(null);
  const [view, setView] = useState({ w: 0, h: 0 });
  const [cardH, setCardH] = useState(240);
  const card = useRef<HTMLDivElement>(null);
  const live = steps.filter((s) => !s.target || typeof document === "undefined" || findTarget(s.target));
  const step = i >= 0 ? live[i] : null;

  const finish = useCallback(() => {
    try {
      localStorage.setItem(KEY + page, "1");
    } catch {}
    setI(-1);
  }, [page]);

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

  // "How to use" plays it again.
  useEffect(() => {
    const again = () => setI(0);
    window.addEventListener(EVENT, again);
    return () => window.removeEventListener(EVENT, again);
  }, []);

  // Place the light on the step's control and follow it when the window
  // moves. A control taller than half the screen (the sessions, the
  // speakers) is lit only where it is on screen.
  const measure = useCallback(() => {
    setView({ w: window.innerWidth, h: window.innerHeight });
    const el = findTarget(step?.target);
    if (!el) return setBox(null);
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const top = Math.max(8, r.top - PAD);
    const bottom = Math.min(vh - 8, r.bottom + PAD);
    const h = Math.max(0, bottom - top);
    const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 14;
    setBox({ x: Math.max(4, r.left - PAD), y: top, w: Math.min(window.innerWidth - 8, r.width + PAD * 2), h, r: Math.min(radius + PAD, h / 2) });
  }, [step]);
  useLayoutEffect(() => {
    if (!step) return;
    const el = findTarget(step.target);
    if (el) {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Big: its start just under the top bar. Small: in the middle, clear
      // of the top bar and the phone tab bar.
      if (r.height > vh * 0.5) window.scrollBy({ top: r.top - 96 });
      else if (r.top < 96 || r.bottom > vh - 120) el.scrollIntoView({ block: "center" });
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

  // The card's own height, to keep it whole on screen.
  useLayoutEffect(() => {
    const el = card.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCardH(el.offsetHeight));
    ro.observe(el);
    setCardH(el.offsetHeight);
    return () => ro.disconnect();
  }, [step]);

  // The card settles in at each step.
  useLayoutEffect(() => {
    if (!step || !card.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tw = gsap.fromTo(card.current, { autoAlpha: 0, y: 8, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: "power3.out", clearProps: "opacity,visibility,transform" });
    return () => void tw.revert();
  }, [i, step]);

  useEffect(() => {
    if (!step) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setI((n) => (n + 1 < live.length ? n + 1 : (finish(), -1)));
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [step, live.length, finish]);

  if (!step || typeof document === "undefined") return null;
  const last = i === live.length - 1;
  const next = () => (last ? finish() : setI(i + 1));

  // Where the card goes, always whole on screen:
  // - no control (welcome): the middle of the screen;
  // - phones: full width, at the bottom when the light is in the upper half,
  //   at the top otherwise;
  // - wider screens: under the light, or above it, else the bottom edge;
  //   sideways kept inside the screen.
  const { w: vw, h: vh } = view;
  const phone = vw < 640;
  let place: React.CSSProperties = {};
  let centred = !box;
  if (box && phone) {
    place = box.y + box.h / 2 < vh / 2 ? { left: 12, right: 12, bottom: "calc(12px + env(safe-area-inset-bottom))" } : { left: 12, right: 12, top: 12 };
  } else if (box) {
    const W = Math.min(360, vw - 32);
    const left = Math.max(16, Math.min(box.x + box.w / 2 - W / 2, vw - W - 16));
    const below = box.y + box.h + 14;
    const above = box.y - 14 - cardH;
    const top = below + cardH <= vh - 12 ? below : above >= 12 ? above : Math.max(12, vh - cardH - 12);
    place = { top, left, width: W };
  }
  if (!vw) centred = true;

  return createPortal(
    // The platform's colours, on a clear ground (the class brings a fill).
    <div className="platform font-sans" style={{ background: "transparent" }}>
      <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={step.title} onClick={(e) => e.stopPropagation()}>
        {/* The dim, with the lit control cut out of it. */}
        <div
          aria-hidden
          className="pointer-events-none absolute transition-[top,left,width,height,border-radius] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={
            box
              ? { top: box.y, left: box.x, width: box.w, height: box.h, borderRadius: box.r, boxShadow: "0 0 0 9999px rgb(18 10 28 / 0.66), 0 0 0 2px rgb(255 255 255 / 0.9)" }
              : { top: "50%", left: "50%", width: 0, height: 0, boxShadow: "0 0 0 9999px rgb(18 10 28 / 0.66)" }
          }
        />
        <div className={centred ? "absolute inset-0 grid place-items-center p-4" : "contents"}>
        <div
          ref={card}
          className={`${centred ? "relative w-full max-w-[360px]" : "absolute"} max-h-[calc(100dvh-24px)] overflow-y-auto overscroll-contain rounded-[22px] bg-surface p-5 text-ink shadow-[0_30px_80px_-24px_rgb(0_0_0/0.55)] ring-1 ring-line`}
          style={centred ? undefined : place}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[12px] font-semibold tabular-nums text-brand">
              {i + 1} {t.of} {live.length}
            </p>
            <button type="button" onClick={finish} aria-label={t.skip} className="-m-1.5 grid size-8 place-items-center rounded-full text-muted hover:bg-[rgb(118_118_128/0.12)] hover:text-ink">
              <X size={16} />
            </button>
          </div>
          <h2 className="mt-1 text-[19px] font-semibold leading-snug tracking-[-0.015em]">{step.title}</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{step.text}</p>
          {/* Progress dots */}
          <div className="mt-4 flex items-center gap-1.5" aria-hidden>
            {live.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all duration-300 ${k === i ? "w-5 bg-brand" : "w-1.5 bg-[rgb(118_118_128/0.3)]"}`} />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            {i === 0 ? (
              <button type="button" onClick={finish} className="h-10 rounded-full px-3 text-[14px] font-medium text-muted hover:text-ink">
                {t.skip}
              </button>
            ) : (
              <button type="button" onClick={() => setI(i - 1)} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium text-ink-2 hover:bg-[rgb(118_118_128/0.1)] hover:text-ink">
                <ArrowLeft size={15} /> {t.back}
              </button>
            )}
            <span className="flex-1" />
            <button
              type="button"
              onClick={next}
              autoFocus
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-5 text-[14px] font-semibold text-brand-ink shadow-[0_8px_20px_-10px_rgb(91_42_134/0.7)] transition-transform active:scale-[0.97]"
            >
              {last ? t.done : t.next} {!last && <ArrowRight size={15} />}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// The round "?" beside the search: plays the page's tour again.
export function HelpButton({ label, className = "" }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      data-tour="howto"
      onClick={() => window.dispatchEvent(new Event(EVENT))}
      title={label}
      aria-label={label}
      className={`grid size-11 shrink-0 place-items-center rounded-full bg-[rgb(118_118_128/0.12)] text-ink-2 transition-[background-color,color,transform] duration-200 hover:bg-[rgb(118_118_128/0.18)] hover:text-ink active:scale-95 ${className}`}
    >
      <Question size={19} weight="bold" aria-hidden />
    </button>
  );
}
