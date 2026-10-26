"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Art from "./Art";
import { prefersReducedMotion } from "./prefs";

gsap.registerPlugin(useGSAP);

// Opening sequence: a Cartagena balcony draws itself, the wordmark rises,
// then the curtain lifts and the hero elements ([data-hero]) settle in.
export default function Preloader({ caption }: { caption: string }) {
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
      const softNav = w.__imIntroDone === true;
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
        sessionStorage.setItem("im-intro", "1");
      } catch {}

      const tl = gsap.timeline({
        defaults: { ease: "expo.out" },
        onComplete: () => {
          if (root.current) root.current.style.display = "none";
          window.dispatchEvent(new Event("im:ready"));
        },
      });

      const speed = seen ? 2.2 : 1;
      tl.timeScale(speed);
      tl.to(".pl-art [pathLength]", { strokeDashoffset: 0, duration: 1.4, stagger: 0.02, ease: "power2.inOut" })
        .from(".pl-letter", { yPercent: 110, duration: 1, stagger: 0.035 }, 0.35)
        .from(".pl-caption", { opacity: 0, y: 12, duration: 0.8 }, 0.9)
        .to(".pl-inner", { opacity: 0, y: -30, duration: 0.6, ease: "power3.in" }, "+=0.25")
        .to(root.current, { yPercent: -100, duration: 1, ease: "expo.inOut" }, "-=0.2")
        .add(() => {
          revealHero(0);
        }, "-=0.55");
    },
    { scope: root },
  );

  const word = "Impact Minds";

  return (
    <div
      ref={root}
      aria-hidden
      className="preloader fixed inset-0 z-[90] items-center justify-center bg-block text-block-ink"
    >
      <div className="pl-inner flex flex-col items-center gap-6 px-6">
        <Art name="skyline" className="pl-art w-64 !opacity-90 [color:var(--sun)] sm:w-96" />
        <p className="flex overflow-hidden pb-2 font-display text-5xl leading-[1.1] sm:text-7xl">
          {word.split("").map((ch, i) => (
            <span key={i} className="pl-letter inline-block whitespace-pre">
              {ch}
            </span>
          ))}
        </p>
        <p className="pl-caption text-sm tracking-wide text-block-muted">{caption}</p>
      </div>
    </div>
  );
}
