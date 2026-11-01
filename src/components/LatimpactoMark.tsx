"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { LOGO_PATHS, LOGO_VIEWBOX } from "./latimpactoLogo";
import { prefersReducedMotion } from "./prefs";

const GOLD = "#D9B865";
// In LOGO_PATHS: the "i" stem and its dot, lilac in the coloured logo.
const ACCENTS = [9, 10];
const DOT = 10;

// The Latimpacto wordmark, inline so each piece can move. Hovering it (or the
// link around it) sends a soft wave through the letters, left to right: each
// lifts a touch and turns gold, then settles back with a little spring, while
// the dot of the "i" hops a beat higher. The wave always plays to the end.
// tone: "white" on photos and video; "brand" is the coloured logo in light
// mode and white in dark mode.
export default function LatimpactoMark({ tone, className = "", title }: { tone: "white" | "brand"; className?: string; title?: string }) {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current;
    const host = el?.closest("a") ?? el;
    if (!el || !host) return;
    const all = Array.from(el.querySelectorAll<SVGPathElement>("path"));
    const dot = all[DOT];
    // Reading order: the file lists the pieces in any order.
    const parts = all.filter((p) => p !== dot).sort((a, b) => a.getBBox().x - b.getBBox().x);
    let tl: gsap.core.Timeline | null = null;
    const play = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || tl?.isActive() || prefersReducedMotion()) return;
      const from = all.map((p) => getComputedStyle(p).fill);
      // The tone fade (CSS) would trail behind every frame of the tween.
      gsap.set(all, { transition: "none" });
      const back = (p: SVGPathElement) => from[all.indexOf(p)];
      tl = gsap
        .timeline({ onComplete: () => gsap.set(all, { clearProps: "fill,transform,transition" }) })
        .to(parts, { y: -14, fill: GOLD, duration: 0.3, ease: "power2.out", stagger: 0.035 }, 0)
        .to(parts, { y: 0, duration: 0.7, ease: "elastic.out(1, 0.5)", stagger: 0.035 }, 0.3)
        .to(parts, { fill: (i: number, p: SVGPathElement) => back(p), duration: 0.5, ease: "power1.inOut", stagger: 0.035 }, 0.45)
        .to(dot, { y: -42, fill: GOLD, duration: 0.32, ease: "power2.out" }, 0.18)
        .to(dot, { y: 0, duration: 0.8, ease: "bounce.out" }, 0.5)
        .to(dot, { fill: back(dot), duration: 0.5, ease: "power1.inOut" }, 0.9);
    };
    host.addEventListener("pointerenter", play as EventListener);
    return () => {
      host.removeEventListener("pointerenter", play as EventListener);
      tl?.kill();
    };
  }, []);

  const base = tone === "white" ? "fill-white" : "fill-[#3D1B5A] dark:fill-white";
  const accent = tone === "white" ? "fill-white" : "fill-[#985CCC] dark:fill-white";
  return (
    <svg
      ref={svg}
      viewBox={LOGO_VIEWBOX}
      className={`overflow-visible ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {LOGO_PATHS.map((d, i) => (
        <path key={i} d={d} className={`transition-[fill] duration-500 ${ACCENTS.includes(i) ? accent : base}`} />
      ))}
    </svg>
  );
}
