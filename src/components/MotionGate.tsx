"use client";

import { useEffect } from "react";

// Marks every section (and the footer) that is well outside the viewport with
// data-idle; a CSS rule then pauses all looping animations inside it. The
// page keeps dozens of infinite loops (line art, marquee, shimmer, rating
// dots, timers), and only the ones on screen should cost frames.
export default function MotionGate() {
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("main > section, footer")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) delete (e.target as HTMLElement).dataset.idle;
          else (e.target as HTMLElement).dataset.idle = "";
        }
      },
      { rootMargin: "25% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      els.forEach((el) => delete el.dataset.idle);
    };
  }, []);

  return null;
}
