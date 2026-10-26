"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { prefersReducedMotion } from "./prefs";

// Floating "back to top": shows as soon as the page leaves the very top. A
// 1px sentinel at the top of the document drives it (no scroll listener).
export default function BackToTop({ label }: { label: string }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-px" />
      <button
        type="button"
        aria-label={label}
        tabIndex={visible ? 0 : -1}
        onClick={() => {
          window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
          document.getElementById("conteudo")?.focus({ preventScroll: true });
        }}
        className={`group fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full btn-solid shadow-[var(--shadow)] ring-1 ring-white/20 transition-[opacity,transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 active:scale-95 sm:bottom-8 sm:right-8 sm:size-14 ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <ArrowUp size="1.25rem" className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-0.5" />
      </button>
    </>
  );
}
