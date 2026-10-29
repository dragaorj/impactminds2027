"use client";

import { prefersReducedMotion } from "./prefs";

// Scroll the page to an element (respecting its scroll-margin) or a y offset,
// with the browser's own smooth scrolling. onComplete fires once the page has
// arrived (scrollend, with a fallback delay where that event is missing).
export function scrollToTarget(
  target: HTMLElement | number,
  { immediate = false, onComplete }: { immediate?: boolean; onComplete?: () => void } = {},
) {
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
