"use client";

import { useEffect } from "react";

// Sections out of sight (with a margin, so nothing is caught frozen as it
// scrolls in) get data-offscreen, which pauses every CSS loop inside them
// (globals.css): the speakers marquee, the illustrations, rings and waves keep
// their place and carry on when the section comes back.
export default function OffscreenPause() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) e.target.removeAttribute("data-offscreen");
          else e.target.setAttribute("data-offscreen", "");
        }
      },
      { rootMargin: "200px 0px" },
    );
    document.querySelectorAll("main > section, main > div > section, footer").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
