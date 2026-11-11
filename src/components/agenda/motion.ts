"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

// Soft entrances for the platform: when the content changes (a day, list ↔
// grid, a tab, a filter) its pieces rise a few pixels into place, one after
// the other. Never on the page's first paint: that arrives ready from the
// server, and animating it would make it blink. Off for reduced motion.

let hydrated = false;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Marks the end of the first paint (call once, high in the tree).
export function useHydrated() {
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => (hydrated = true));
    return () => cancelAnimationFrame(id);
  }, []);
}

// The container's [data-reveal] children enter whenever `key` changes.
export function useReveal<E extends HTMLElement>(key: unknown) {
  const ref = useRef<E>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !hydrated || reduced()) return;
    const items = el.querySelectorAll<HTMLElement>("[data-reveal]");
    const targets = items.length ? Array.from(items).slice(0, 40) : [el];
    const tween = gsap.fromTo(
      targets,
      { autoAlpha: 0, y: 10, scale: 0.985 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out", stagger: { each: 0.025, from: "start" }, clearProps: "opacity,visibility,transform" },
    );
    return () => void tween.kill();
  }, [key]);
  return ref;
}

