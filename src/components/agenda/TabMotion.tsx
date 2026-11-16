"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { EASE, reduced } from "./motion";

type Tab = "agenda" | "speakers";
const KEY = "im-tab-from";
// Agenda sits left of Speakers: going to Speakers moves the page to the
// left (the new one comes in from the right), and back the other way.
const dirTo = (to: Tab) => (to === "speakers" ? 1 : -1);

// Moving between Agenda and Speakers, without a hard cut: the page glides
// out a little toward the side it leaves by and fades, the next one glides
// in from the other side, and the chosen tab (or the phone's capsule) lands
// softly. Plain links still work as links (new tab, keyboard, no script).
export default function TabMotion({ tab }: { tab: Tab }) {
  const router = useRouter();
  useLayoutEffect(() => {
    // Arriving from the other tab.
    let from: string | null = null;
    try {
      from = sessionStorage.getItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch {}
    if (from && from !== tab && !reduced()) {
      const d = dirTo(tab);
      const page = document.querySelector(".platform-page");
      if (page) gsap.fromTo(page, { autoAlpha: 0, x: d * 36 }, { autoAlpha: 1, x: 0, duration: 0.65, ease: EASE, clearProps: "opacity,visibility,transform" });
      for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="tab-${tab}"]`)) {
        const icon = el.querySelector("[data-tab-icon]");
        if (icon) gsap.fromTo(icon, { scale: 0.6, rotate: -8 }, { scale: 1, rotate: 0, duration: 0.6, ease: EASE, clearProps: "transform" });
        // The phone's capsule opens from a round icon to its full width.
        if (el.closest("[data-pill]")) {
          const w = el.offsetWidth;
          gsap.fromTo(el, { width: 48 }, { width: w, duration: 0.55, ease: EASE, clearProps: "width" });
        }
      }
    }

    // Leaving for the other tab.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[data-tab-link]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const to = a.dataset.tabLink as Tab;
      e.preventDefault();
      if (to === tab) return;
      try {
        sessionStorage.setItem(KEY, tab);
      } catch {}
      const href = a.getAttribute("href") || "/";
      const page = document.querySelector(".platform-page");
      if (!page || reduced()) return router.push(href);
      gsap.to(page, { autoAlpha: 0, x: -dirTo(to) * 24, duration: 0.2, ease: "power2.in", onComplete: () => router.push(href) });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [tab, router]);
  return null;
}
