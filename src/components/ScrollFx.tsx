"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "./prefs";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
// Effects are wired by selector for the whole page; a section without a given
// effect (or one taken off the page) is fine, so no console noise for it.
gsap.config({ nullTargetWarn: false });

// One client island owns every scroll-driven effect on the page, wired by
// data attributes so the sections themselves stay Server Components:
//   h2, h3, p, ...      text rises line by line behind a mask (SplitText)
//   [data-reveal]       fade-up when entering the viewport (batched)
//   [data-ticks]        tick meters light up gold, tick by tick
//   .art                Cartagena line art fades in, complete, on first view
//   [data-count]        number counts up once (data-decimals, data-locale)
//   [data-img-scale]    image grows from 0.86 to 1 on approach
//   [data-words] span   paragraph words brighten in sequence (scrub)
//   [data-bar]          chart bars grow from the baseline
//   [data-dot]          rating dots fill one by one
// SplitText turns non-breaking spaces into plain ones, which would let a line
// break inside "Impact Minds". Wrapping each occurrence in a nowrap span first
// keeps the name on one line in the split result.
const BRAND = "Impact Minds";
function keepTogether(el: HTMLElement) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.nodeValue?.includes(BRAND) && !node.parentElement?.dataset.brand) nodes.push(node);
  }
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    node.nodeValue!.split(BRAND).forEach((part, i) => {
      if (i > 0) {
        const span = document.createElement("span");
        span.dataset.brand = "";
        span.style.whiteSpace = "nowrap";
        span.textContent = BRAND;
        frag.append(span);
      }
      if (part) frag.append(part);
    });
    node.replaceWith(frag);
  }
}

export default function ScrollFx() {
  const [reduce, setReduce] = useState<boolean | null>(null);

  // In-page links (#agenda-2027, #sobre…): a long smooth scroll aims at where
  // the section was when it started, but images and reveals load on the way
  // and shift it. On arrival the target is measured again and the page settles
  // on it (a couple of passes), so it never ends up above or below.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href^=\"#\"]");
      const id = link?.getAttribute("href")?.slice(1);
      if (!link || !id) return;
      const target = document.getElementById(decodeURIComponent(id));
      if (!target) return;
      e.preventDefault();
      history.pushState(null, "", `#${id}`);
      const offset = () => target.getBoundingClientRect().top - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
      let passes = 0;
      const settle = () => {
        window.removeEventListener("scrollend", settle);
        if (Math.abs(offset()) > 2 && passes++ < 3) {
          window.addEventListener("scrollend", settle, { once: true });
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          window.setTimeout(settle, 900);
        }
      };
      window.addEventListener("scrollend", settle, { once: true });
      window.setTimeout(settle, 1500);
      target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const sync = () => setReduce(prefersReducedMotion());
    sync();
    window.addEventListener("im:motion", sync);
    return () => window.removeEventListener("im:motion", sync);
  }, []);

  useGSAP(
    (_, contextSafe) => {
      if (reduce === null) return;
      // Right after a language switch the page shows its final state at once
      // (no entrances, line splits or counts to replay) at the scroll position
      // the visitor left.
      const root = document.documentElement;
      const switched = root.dataset.switch === "1";
      if (switched) {
        let y = 0;
        try {
          y = Number(sessionStorage.getItem("im-switch")) || 0;
          sessionStorage.removeItem("im-switch");
        } catch {}
        window.scrollTo({ top: y, behavior: "instant" });
        delete root.dataset.switch;
      }

      const counters = gsap.utils.toArray<HTMLElement>("[data-count]");
      const format = (el: HTMLElement, n: number) => {
        const decimals = Number(el.dataset.decimals ?? 0);
        const text = n.toLocaleString(el.dataset.locale ?? "pt-BR", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        el.textContent = el.dataset.pad ? text.padStart(Number(el.dataset.pad), "0") : text;
      };

      if (reduce || switched) {
        gsap.set("[data-reveal], [data-hero], [data-stagger-item], [data-stagger-dot]", { opacity: 1, y: 0, clearProps: "transform" });
        gsap.set("main .art, footer .art", { visibility: "visible" });
        gsap.set("[data-bar]", { scaleY: 1 });
        document.querySelectorAll("[data-ticks]").forEach((g) => g.setAttribute("data-lit", ""));
        gsap.set("[data-words] span", { opacity: 1 });
        gsap.set("[data-img-scale]", { scale: 1 });
        gsap.set("[data-dot]", { "--fill": 1 });
        counters.forEach((el) => {
          format(el, Number(el.dataset.count));
          el.dataset.done = "";
        });
        return;
      }

      // Every entrance plays once. None of the triggers use `once: true`: after a
      // language switch the page keeps its scroll position, so many triggers are
      // created already passed, and a trigger that kills itself while it is
      // being set up crashes ScrollTrigger ("reading 'end'"). Played-once state
      // lives on the element (data-revealed) or in the tween instead.
      const reveal = (batch: Element[]) => {
        const els = (batch as HTMLElement[]).filter((el) => !el.hasAttribute("data-revealed"));
        if (!els.length) return;
        els.forEach((el) => el.setAttribute("data-revealed", ""));
        gsap.fromTo(
          els,
          { y: 48, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: "expo.out", clearProps: "transform" },
        );
      };
      ScrollTrigger.batch("[data-reveal]", { start: "top 88%", onEnter: reveal, onEnterBack: reveal });

      // [data-stagger]: a slower, softer entrance for a row of cards. The rule
      // ([data-stagger-line]) draws across, then each card ([data-stagger-item])
      // rises out of a light blur one after another, with its node
      // ([data-stagger-dot]) popping in as it lands.
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
        const items = group.querySelectorAll("[data-stagger-item]");
        const dots = group.querySelectorAll("[data-stagger-dot]");
        const line = group.querySelectorAll("[data-stagger-line]");
        // (No blur on the way in: animating a filter on every card is heavy.)
        gsap.set(items, { opacity: 0, y: 56, scale: 0.97 });
        gsap.set(dots, { scale: 0, opacity: 0 });
        gsap
          .timeline({ scrollTrigger: { trigger: group, start: "top 85%", toggleActions: "play none none none" } })
          .fromTo(line, { scaleX: 0, scaleY: 0 }, { scaleX: 1, scaleY: 1, duration: 1.6, ease: "power2.inOut" }, 0)
          .to(
            items,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1.5,
              stagger: 0.18,
              ease: "power3.out",
              clearProps: "transform,filter",
            },
            0.15,
          )
          .to(dots, { scale: 1, opacity: 1, duration: 0.7, stagger: 0.18, ease: "back.out(2.2)" }, 0.45);
      });

      // Every heading and text block outside the hero rises line by line from
      // behind a mask as it enters view. Splitting measures every line, so each
      // block is only split once it comes within about a screen of the viewport
      // (not all at once on load, which was the page's longest task). SplitText
      // re-splits on resize until then; once a block has risen, the split is
      // undone (the text is back to plain DOM: fewer nodes, and nothing to
      // re-split on later resizes).
      const textSel = [
        "main h2",
        "main h3",
        "main p",
        "main blockquote",
        "main li > span",
        "footer p",
      ].join(",");
      const split = contextSafe!((el: HTMLElement) => {
        const heading = /^H[23]$/.test(el.tagName) || el.classList.contains("font-display");
        keepTogether(el);
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
              scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
              onComplete: () => self.revert(),
            });
          },
        });
      });
      const nearText = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            nearText.unobserve(e.target);
            split(e.target as HTMLElement);
          }
        },
        { rootMargin: "100% 0px" },
      );
      gsap.utils.toArray<HTMLElement>(textSel).forEach((el) => {
        if (
          el.closest("#top, [data-words], [data-nosplit], a, button, [aria-hidden='true']") ||
          el.querySelector("[data-count], svg, img") ||
          !el.textContent?.trim()
        )
          return;
        nearText.observe(el);
      });

      // [data-ticks]: tick meters light up (CSS transitions, staggered per tick)
      // once the group scrolls into view.
      gsap.utils.toArray<HTMLElement>("[data-ticks]").forEach((group) => {
        const light = () => group.setAttribute("data-lit", "");
        ScrollTrigger.create({ trigger: group, start: "top 85%", onEnter: light, onEnterBack: light });
      });

      // Line art arrives complete: a one-off fade and settle when it enters view.
      gsap.utils.toArray<SVGSVGElement>("main .art:not([data-still]):not(.show-art), footer .art:not([data-still])").forEach((svg) => {
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
            scrollTrigger: { trigger: svg, start: "top 92%", toggleActions: "play none none none" },
          },
        );
      });

      // Each number counts up from zero once per visit. Scrolling away and back
      // leaves it as it is; the back-to-top button (im:replay) rewinds them
      // all so they count again on the way down, as does a full reload.
      const counterTweens = counters.map((el) => {
        const target = Number(el.dataset.count);
        const state = { n: 0 };
        format(el, 0);
        return gsap.to(state, {
          n: target,
          duration: Number(el.dataset.duration ?? 2),
          ease: "expo.out",
          onUpdate: () => format(el, state.n),
          onComplete: () => {
            el.dataset.done = "";
          },
          scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
        });
      });
      const replayCounters = () => {
        counterTweens.forEach((tw) => tw.pause(0));
        counters.forEach((el) => {
          format(el, 0);
          delete el.dataset.done;
        });
      };
      window.addEventListener("im:replay", replayCounters);

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
            scrollTrigger: { trigger: group, start: "top 80%", toggleActions: "play none none none" },
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
            scrollTrigger: { trigger: group, start: "top 85%", toggleActions: "play none none none" },
          },
        );
      });

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("im:ready", refresh);
      document.fonts?.ready.then(refresh);
      // After a language switch the intro is skipped and the new page streams
      // in under these triggers, so re-measure whenever the page height settles.
      // A refresh jumps the page to the top and back to measure, which cuts a
      // smooth scroll short (a link to a section lands above it): while the
      // page is scrolling, wait until it has been still for a moment.
      let timer = 0;
      let lastScroll = 0;
      const onScroll = () => (lastScroll = performance.now());
      window.addEventListener("scroll", onScroll, { passive: true });
      const refreshWhenStill = () => {
        clearTimeout(timer);
        const wait = 250 - (performance.now() - lastScroll);
        if (wait > 0) timer = window.setTimeout(refreshWhenStill, wait);
        else refresh();
      };
      let height = document.body.offsetHeight;
      const ro = new ResizeObserver(() => {
        if (document.body.offsetHeight === height) return;
        height = document.body.offsetHeight;
        clearTimeout(timer);
        timer = window.setTimeout(refreshWhenStill, 150);
      });
      ro.observe(document.body);
      const frame = requestAnimationFrame(refresh);
      return () => {
        nearText.disconnect();
        ro.disconnect();
        window.removeEventListener("scroll", onScroll);
        clearTimeout(timer);
        cancelAnimationFrame(frame);
        window.removeEventListener("im:ready", refresh);
        window.removeEventListener("im:replay", replayCounters);
      };
    },
    { dependencies: [reduce], revertOnUpdate: true },
  );

  return null;
}
