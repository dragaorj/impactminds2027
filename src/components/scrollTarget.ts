"use client";

import type Lenis from "lenis";
import { prefersReducedMotion } from "./prefs";

// The page's Lenis instance while smooth scrolling is on (SmoothScroll.tsx),
// so scripted scrolls glide the same way the wheel does.
let lenis: Lenis | null = null;
export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};

// Scroll the page to an element (respecting its scroll-margin) or a y offset,
// through Lenis when it runs and natively otherwise. onComplete fires once the
// page has arrived (or after a fallback delay where scrollend is missing).
export function scrollToTarget(
  target: HTMLElement | number,
  { immediate = false, onComplete }: { immediate?: boolean; onComplete?: () => void } = {},
) {
  if (lenis) {
    lenis.scrollTo(target, { immediate, force: true, onComplete: () => onComplete?.() });
    return;
  }
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.removeEventListener("scrollend", finish);
    onComplete?.();
  };
  if (onComplete) {
    window.addEventListener("scrollend", finish, { once: true });
    window.setTimeout(finish, 1200);
  }
  const behavior = immediate || prefersReducedMotion() ? "auto" : "smooth";
  if (typeof target === "number") window.scrollTo({ top: target, behavior });
  else target.scrollIntoView({ behavior, block: "start" });
}
