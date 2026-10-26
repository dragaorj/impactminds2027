"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "./prefs";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

// One client island owns every scroll-driven effect on the page, wired by
// data attributes so the sections themselves stay Server Components:
//   h2, h3, p, ...      text rises line by line behind a mask (SplitText)
//   [data-reveal]       fade-up when entering the viewport (batched)
//   [data-hbar]         horizontal bars grow from the left
//   .art                Cartagena line art fades in, complete, on first view
//   [data-count]        number counts up once (data-decimals, data-locale)
//   [data-img-scale]    image grows from 0.86 to 1 on approach
//   [data-words] span   paragraph words brighten in sequence (scrub)
//   [data-bar]          chart bars grow from the baseline
//   [data-dot]          rating dots fill one by one
export default function ScrollFx() {
  const [reduce, setReduce] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setReduce(prefersReducedMotion());
    sync();
    window.addEventListener("im:motion", sync);
    return () => window.removeEventListener("im:motion", sync);
  }, []);

  useGSAP(
    () => {
      if (reduce === null) return;

      const counters = gsap.utils.toArray<HTMLElement>("[data-count]");
      const format = (el: HTMLElement, n: number) => {
        const decimals = Number(el.dataset.decimals ?? 0);
        el.textContent = n.toLocaleString(el.dataset.locale ?? "pt-BR", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      };

      if (reduce) {
        gsap.set("[data-reveal], [data-hero]", { opacity: 1, y: 0, clearProps: "transform" });
        gsap.set("main .art, footer .art", { visibility: "visible" });
        gsap.set("[data-bar]", { scaleY: 1 });
        gsap.set("[data-hbar]", { scaleX: 1 });
        gsap.set("[data-words] span", { opacity: 1 });
        gsap.set("[data-img-scale]", { scale: 1 });
        gsap.set("[data-dot]", { "--fill": 1 });
        counters.forEach((el) => format(el, Number(el.dataset.count)));
        return;
      }

      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { y: 48, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: "expo.out", clearProps: "transform" },
          ),
      });

      // Every heading and text block outside the hero rises line by line from
      // behind a mask as it enters view. SplitText re-splits on resize.
      const textSel = [
        "main h2",
        "main h3",
        "main p",
        "main blockquote",
        "main li > span",
        "footer p",
      ].join(",");
      gsap.utils.toArray<HTMLElement>(textSel).forEach((el) => {
        if (
          el.closest("#top, [data-words], [data-nosplit], a, button, [aria-hidden='true']") ||
          el.querySelector("[data-count], svg, img") ||
          !el.textContent?.trim()
        )
          return;
        const heading = /^H[23]$/.test(el.tagName) || el.classList.contains("font-display");
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => {
            // Give each mask room for descenders (g, p, ç) without shifting the layout.
            gsap.set(self.masks, { paddingBottom: "0.16em", marginBottom: "-0.16em" });
            return gsap.from(self.lines, {
              yPercent: heading ? 110 : 100,
              opacity: heading ? 1 : 0,
              duration: heading ? 1.2 : 1,
              stagger: heading ? 0.1 : 0.06,
              ease: "expo.out",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            });
          },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-hbars]").forEach((group) => {
        gsap.fromTo(
          group.querySelectorAll("[data-hbar]"),
          { scaleX: 0, transformOrigin: "0% 50%" },
          {
            scaleX: 1,
            duration: 1.4,
            stagger: 0.1,
            ease: "expo.out",
            scrollTrigger: { trigger: group, start: "top 85%", once: true },
          },
        );
      });

      // Line art arrives complete: a one-off fade and settle when it enters view.
      gsap.utils.toArray<SVGSVGElement>("main .art:not([data-still]), footer .art:not([data-still])").forEach((svg) => {
        const target = Number(getComputedStyle(svg).opacity) || 0.2;
        gsap.fromTo(
          svg,
          { autoAlpha: 0, y: 48, scale: 0.94 },
          {
            autoAlpha: target,
            y: 0,
            scale: 1,
            duration: 1.6,
            ease: "expo.out",
            scrollTrigger: { trigger: svg, start: "top 92%", once: true },
          },
        );
      });

      counters.forEach((el) => {
        const target = Number(el.dataset.count);
        const state = { n: 0 };
        format(el, 0);
        gsap.to(state, {
          n: target,
          duration: 2,
          ease: "expo.out",
          onUpdate: () => format(el, state.n),
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-img-scale]").forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 0.86 },
          { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 30%", scrub: true } },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-words]").forEach((el) => {
        gsap.fromTo(
          el.querySelectorAll("span"),
          { opacity: 0.14 },
          {
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-bars]").forEach((group) => {
        gsap.fromTo(
          group.querySelectorAll("[data-bar]"),
          { scaleY: 0, transformOrigin: "50% 100%" },
          {
            scaleY: 1,
            transformOrigin: "50% 100%",
            duration: 1.3,
            stagger: 0.12,
            ease: "expo.out",
            scrollTrigger: { trigger: group, start: "top 80%", once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-dots]").forEach((group) => {
        gsap.fromTo(
          group.querySelectorAll("[data-dot]"),
          { "--fill": 0 },
          {
            "--fill": 1,
            duration: 0.5,
            stagger: 0.07,
            ease: "power2.out",
            scrollTrigger: { trigger: group, start: "top 85%", once: true },
          },
        );
      });

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("im:ready", refresh);
      document.fonts?.ready.then(refresh);
      return () => window.removeEventListener("im:ready", refresh);
    },
    { dependencies: [reduce], revertOnUpdate: true },
  );

  return null;
}
