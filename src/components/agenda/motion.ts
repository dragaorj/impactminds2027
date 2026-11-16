"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

// The platform's motion: one calm language everywhere. Things arrive with a
// short, decelerating glide (an "expo out" curve: quick start, long soft
// landing), a few pixels only, one after the other; nothing bounces or
// spins. Never on the page's first paint: that arrives ready from the
// server, and animating it would make it blink. Off for reduced motion.

let hydrated = false;
export const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const EASE = "expo.out";

// Marks the end of the first paint (call once, high in the tree).
export function useHydrated() {
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => (hydrated = true));
    return () => cancelAnimationFrame(id);
  }, []);
}

// The container's [data-glide] children enter whenever `key` changes.
// dir: where the new content comes from. 1: from the right (a later day),
// -1: from the left (an earlier day), 0: from just below (anything else).
export function useReveal<E extends HTMLElement>(key: unknown, dir: -1 | 0 | 1 = 0) {
  const ref = useRef<E>(null);
  const dirRef = useRef(dir);
  dirRef.current = dir;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !hydrated || reduced()) return;
    const items = el.querySelectorAll<HTMLElement>("[data-glide]");
    const targets = items.length ? Array.from(items).slice(0, 32) : [el];
    const d = dirRef.current;
    const tween = gsap.fromTo(
      targets,
      { autoAlpha: 0, x: d * 28, y: d ? 0 : 14 },
      { autoAlpha: 1, x: 0, y: 0, duration: 0.6, ease: EASE, stagger: { each: 0.04, from: "start" }, clearProps: "opacity,visibility,transform" },
    );
    // Interrupted (the key changed again mid-way): back to normal at once,
    // never left hidden.
    return () => void tween.revert();
  }, [key]);
  return ref;
}

// A small "landing" for the element that just became the chosen one (a day,
// a tab): it settles from a touch smaller.
export function settle(el: Element | null) {
  if (!el || !hydrated || reduced()) return;
  gsap.fromTo(el, { scale: 0.92 }, { scale: 1, duration: 0.5, ease: EASE, clearProps: "transform" });
}

export const isHydrated = () => hydrated;
