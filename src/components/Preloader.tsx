"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Art from "./Art";
import { LOGO_PATHS, LOGO_VIEWBOX } from "./latimpactoLogo";
import { prefersReducedMotion } from "./prefs";

gsap.registerPlugin(useGSAP);

const TICKS = 28;

// Opening sequence, logo only: the Cartagena skyline draws itself in gold
// line art, the Latimpacto wordmark rises in piece by piece beneath it, then
// the mark drifts forward and dissolves and the hero settles in. Underneath,
// a row of fine ticks (the presentation's progress bar) fills gold from left
// to right until the page is ready. Small and soft on purpose.
// The starting state lives in CSS (globals.css, .pl-*), so nothing flashes
// before hydration; GSAP only animates towards the final state.
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // [data-hero] lives outside this component, so query the document, not the scope.
      const heroEls = () => document.querySelectorAll("[data-hero]");
      const revealHero = (delay = 0) =>
        gsap.fromTo(
          heroEls(),
          { y: 36, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.2, stagger: 0.09, ease: "expo.out", delay, clearProps: "transform" },
        );

      // A language switch is a client-side navigation that remounts the page:
      // the intro already played in this document, so skip straight to the content.
      const w = window as Window & { __imIntroDone?: boolean };
      const softNav = w.__imIntroDone === true || document.documentElement.dataset.switch === "1";
      w.__imIntroDone = true;

      if (softNav || prefersReducedMotion()) {
        if (root.current) root.current.style.display = "none";
        gsap.set(heroEls(), { opacity: 1 });
        window.dispatchEvent(new Event("im:ready"));
        return;
      }

      let seen = false;
      try {
        seen = sessionStorage.getItem("im-intro") === "1";
      } catch {}

      // The wordmark's pieces in reading order (the file lists them in any order).
      const parts = gsap.utils.toArray<SVGPathElement>(".pl-part").sort((a, b) => a.getBBox().x - b.getBBox().x);

      // Same values as the CSS starting state, so GSAP tracks them as transforms.
      gsap.set(parts, { y: 24, opacity: 0 });

      let finished = false;
      const tl = gsap.timeline({
        defaults: { ease: "expo.out" },
        onComplete: () => {
          finished = true;
          try {
            sessionStorage.setItem("im-intro", "1");
          } catch {}
          if (root.current) root.current.style.display = "none";
          window.dispatchEvent(new Event("im:ready"));
        },
      });

      tl.timeScale(seen ? 2 : 1);
      tl.to(".pl-art [pathLength]", { strokeDashoffset: 0, duration: 1.5, stagger: 0.02, ease: "power2.inOut" }, 0)
        .to(parts, { y: 0, opacity: 1, duration: 1.1, stagger: 0.05, ease: "power3.out" }, 0.7)
        .to(".pl-bar", { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.5)
        .to(".pl-fill", { opacity: 1, duration: 0.1, stagger: 1.5 / TICKS, ease: "none" }, 0.6)
        // Bar full: if the page is still loading, hold here until it's done.
        .add(() => {
          if (document.readyState === "complete") return;
          tl.pause();
          window.addEventListener("load", () => tl.play(), { once: true });
        }, 2.15)
        // Then the mark drifts forward softly and the curtain dissolves.
        .to(".pl-inner", { scale: 1.15, opacity: 0, filter: "blur(6px)", duration: 0.8, ease: "power2.inOut" }, 2.2)
        .to(root.current, { opacity: 0, duration: 0.7, ease: "power2.inOut" }, 2.55)
        .add(() => {
          revealHero(0);
        }, 2.5);

      // Torn down before the end (React mounts effects twice in development,
      // and a remount can do the same): the intro hasn't really played, so let
      // the next run play it instead of skipping straight to the content.
      // Safety net: if frames stall (a background tab, a busy device), never
      // leave the site behind the curtain.
      const guard = window.setTimeout(() => tl.progress(1), 6000);
      return () => {
        window.clearTimeout(guard);
        if (!finished) w.__imIntroDone = false;
      };
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden
      className="preloader fixed inset-0 z-[90] items-center justify-center overflow-hidden bg-[#1c0c2c] text-white"
    >
      <div className="pl-inner relative flex w-[min(10.5rem,44vw)] flex-col items-center will-change-[transform,filter]">
        <Art name="skyline" className="pl-art w-[150%] max-w-none !opacity-90 [color:var(--sun)]" />
        <svg viewBox={LOGO_VIEWBOX} className="mt-5 w-full overflow-visible">
          {LOGO_PATHS.map((d, i) => (
            <path key={i} d={d} className="pl-part fill-white" />
          ))}
        </svg>
        {/* Progress, in the presentation's tick style: grey track, gold fill. */}
        <div className="pl-bar mt-5 flex h-2.5 w-full items-end justify-between">
          {Array.from({ length: TICKS }, (_, i) => (
            <span key={i} className={`relative w-[2px] rounded-full bg-white/20 ${i % 4 === 0 ? "h-full" : "h-[60%]"}`}>
              <span className="pl-fill absolute inset-0 rounded-full bg-[#D9B865]" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
