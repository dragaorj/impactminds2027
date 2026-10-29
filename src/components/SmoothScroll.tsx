"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./prefs";
import { setLenis } from "./scrollTarget";

gsap.registerPlugin(ScrollTrigger);

// Smooth, inertial scrolling for the wheel and trackpad (Lenis), driven by
// GSAP's ticker so every scroll-linked animation moves in the same frame as
// the page. Touch keeps the device's own scrolling. Panels with their own
// scroll keep it (allowNestedScroll), sideways gestures pass through to the
// rails, and in-page links glide too (anchors). It pauses while the menu or a
// dialog holds the page still, and switches off with reduced motion.
export default function SmoothScroll() {
  useEffect(() => {
    let lenis: Lenis | null = null;
    const raf = (time: number) => lenis?.raf(time * 1000);

    const syncLock = () => {
      if (!lenis) return;
      const locked = document.body.style.overflow === "hidden" || !!document.querySelector("dialog[open]");
      if (locked) lenis.stop();
      else lenis.start();
    };
    const start = () => {
      if (lenis || prefersReducedMotion()) return;
      lenis = new Lenis({
        autoRaf: false,
        lerp: 0.085,
        smoothWheel: true,
        anchors: true,
        allowNestedScroll: true,
      });
      lenis.on("scroll", ScrollTrigger.update);
      setLenis(lenis);
      syncLock();
    };
    const stop = () => {
      lenis?.destroy();
      lenis = null;
      setLenis(null);
    };

    gsap.ticker.add(raf);
    // Lenis smooths the motion itself; GSAP's lag catch-up would fight it.
    gsap.ticker.lagSmoothing(0);
    // The menu locks the body; dialogs open as modals.
    const lock = new MutationObserver(syncLock);
    lock.observe(document.body, { attributes: true, attributeFilter: ["style", "open"], subtree: true });
    const onMotion = () => (prefersReducedMotion() ? stop() : start());
    window.addEventListener("im:motion", onMotion);
    start();

    return () => {
      lock.disconnect();
      window.removeEventListener("im:motion", onMotion);
      gsap.ticker.remove(raf);
      stop();
    };
  }, []);

  return null;
}
