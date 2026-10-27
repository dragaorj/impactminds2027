"use client";

import { Play } from "@phosphor-icons/react";
import { prefersReducedMotion } from "./prefs";

// Replays the numbers presentation from inside the section, for visitors who
// skipped the hero CTA. Hidden with reduced motion (the show never plays then).
export default function WatchShow({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!prefersReducedMotion()) window.dispatchEvent(new Event("im:numbers-show"));
      }}
      className="shimmer shimmer-soft group inline-flex h-12 shrink-0 items-center gap-3 rounded-full bg-brand pl-2 pr-6 text-[0.9375rem] font-medium text-brand-ink transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:bg-sun hover:text-sun-ink active:scale-[0.98] motion-reduce:hidden"
    >
      <span className="grid size-9 place-items-center rounded-full bg-brand-ink/15 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-110">
        <Play size="0.875rem" weight="fill" />
      </span>
      {label}
    </button>
  );
}
