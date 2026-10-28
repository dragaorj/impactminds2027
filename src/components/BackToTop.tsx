"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { prefersReducedMotion } from "./prefs";

const TICKS = 40;

// Floating "back to top", in the same language as the countdown ring above
// it: a glass disc ringed with fine ticks that light up gold as the page is
// read (scroll progress), the arrow in the middle. It shows as soon as the
// page leaves the very top (1px sentinel); hover fills it gold.
export default function BackToTop({ label }: { label: string }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Reading progress, at most once per frame and only when the lit count changes.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      setLit(Math.round(p * TICKS));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-px" />
      <button
        type="button"
        aria-label={label}
        tabIndex={visible ? 0 : -1}
        onClick={() => {
          // Rewinds the stat counters so they count up again on the way down.
          window.dispatchEvent(new Event("im:replay"));
          window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
          document.getElementById("conteudo")?.focus({ preventScroll: true });
        }}
        data-dock="3"
        className={`group fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full bg-surface/60 text-ink shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150 transition-[opacity,transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 hover:bg-sun hover:text-sun-ink active:scale-95 sm:bottom-8 sm:right-8 sm:size-14 ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        {/* Tooltip, to the left like the countdown and music buttons'. */}
        <span aria-hidden className="fab-tip fab-tip-side">
          {label}
        </span>
        <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full -rotate-90">
          {Array.from({ length: TICKS }, (_, i) => (
            <line
              key={i}
              x1="84"
              y1="50"
              x2={i % 5 === 0 ? "95" : "92"}
              y2="50"
              transform={`rotate(${(i * 360) / TICKS} 50 50)`}
              strokeWidth={i % 5 === 0 ? 2.6 : 1.8}
              strokeLinecap="round"
              className={`transition-[stroke] duration-300 ${i < lit ? "stroke-sun group-hover:stroke-sun-ink/50" : "stroke-ink/15 group-hover:stroke-sun-ink/20"}`}
            />
          ))}
        </svg>
        <ArrowUp size="1.125rem" weight="bold" className="relative transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-0.5" />
      </button>
    </>
  );
}
