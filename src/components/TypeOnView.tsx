"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./prefs";

const TYPE_MS = 70;

// Types its lines in, letter by letter with a blinking caret, the first time
// it scrolls into view. Each line keeps its full text as an invisible copy
// underneath, so the block has its final size from the start and nothing
// moves while the letters appear. With reduced motion the text is just there.
export default function TypeOnView({ lines, className = "" }: { lines: string[]; className?: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const total = lines.reduce((n, l) => n + l.length, 0);
  const [count, setCount] = useState(total);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let timer = 0;
    setCount(0);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        let n = 0;
        const step = () => {
          n += 1;
          setCount(n);
          if (n < total) timer = window.setTimeout(step, TYPE_MS);
        };
        timer = window.setTimeout(step, 250);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [total]);

  // Which line the caret is on: the first one not yet complete (or the last).
  let left = count;
  const shown = lines.map((l) => {
    const s = l.slice(0, Math.max(0, left));
    left -= l.length;
    return s;
  });
  const caretLine = Math.max(0, shown.findIndex((s, i) => s.length < lines[i].length));
  const caretAt = count >= total ? lines.length - 1 : caretLine;

  return (
    <span ref={root} className={className}>
      <span className="sr-only">{lines.join(" ")}</span>
      {lines.map((line, i) => (
        <span key={i} aria-hidden className="relative block whitespace-nowrap">
          <span className="invisible">{line}</span>
          <span className="absolute inset-0">
            {shown[i]}
            {i === caretAt && (
              <span className="type-caret ml-[0.06em] inline-block h-[0.8em] w-[0.05em] translate-y-[0.06em] bg-current" />
            )}
          </span>
        </span>
      ))}
    </span>
  );
}
