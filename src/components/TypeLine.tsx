"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./prefs";

const TYPE_MS = 60;
const HOLD_MS = 3000;
const FADE_MS = 450;

// The first phrase is on screen from the start (it is also the server-rendered
// text). After a pause it fades out and the next phrase types itself in,
// letter by letter, with a blinking caret; then the cycle repeats. Nothing is
// ever deleted character by character. The cycle starts once the intro has
// finished (im:ready); with reduced motion the first phrase simply stays.
export default function TypeLine({ phrases, className = "" }: { phrases: string[]; className?: string }) {
  const [text, setText] = useState(phrases[0]);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let timer = 0;
    let cancelled = false;
    const later = (fn: () => void, ms: number) => {
      timer = window.setTimeout(() => !cancelled && fn(), ms);
    };

    // Hold the phrase that is showing, fade it, then type the next one.
    const hold = (phrase: number) =>
      later(() => {
        setFading(true);
        later(() => {
          setFading(false);
          type((phrase + 1) % phrases.length, 1);
        }, FADE_MS);
      }, HOLD_MS);

    const type = (phrase: number, chars: number) => {
      const full = phrases[phrase];
      setText(full.slice(0, chars));
      if (chars < full.length) later(() => type(phrase, chars + 1), TYPE_MS);
      else hold(phrase);
    };

    const start = () => {
      window.removeEventListener("im:ready", start);
      window.clearTimeout(timer);
      if (!prefersReducedMotion()) hold(0);
    };
    window.addEventListener("im:ready", start);
    // Fallback when the intro already ran (language switch) or was skipped.
    timer = window.setTimeout(start, 3200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("im:ready", start);
    };
  }, [phrases]);

  return (
    <span className={className}>
      {/* Screen readers get every phrase at once; the animation is visual only. */}
      <span className="sr-only">{phrases.join(". ")}</span>
      <span
        aria-hidden
        className={`whitespace-nowrap transition-opacity ease-out ${fading ? "opacity-0" : "opacity-100"}`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        {text}
        <span className="type-caret ml-[0.06em] inline-block h-[0.85em] w-[0.06em] translate-y-[0.08em] bg-current" />
      </span>
    </span>
  );
}
