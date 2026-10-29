"use client";

import { useEffect, useRef, useState } from "react";
import { CaretLeft } from "@phosphor-icons/react";

const IDLE_MS = 10000;

// The floating corner buttons (music, countdown, back to top: [data-dock])
// tuck away off the right edge after 10 s in the corner without use, or at
// once from the round X above them (MusicPlayer, "im:dock-hide"). A small tab
// then peeks from the edge with a gentle nudge; tapping it brings them back
// (and the 10 s start again). Using any of them restarts the count; they stay
// while one of their panels is open; back at the top of the page (hero) they
// always return.
export default function DockToggle({ label }: { label: string }) {
  const [hidden, setHidden] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    const d = document.documentElement;
    const busy = () => !!document.querySelector("[data-dock] [aria-expanded='true']");
    const set = (on: boolean) => {
      setHidden(on);
      if (on) d.dataset.dockHidden = "";
      else delete d.dataset.dockHidden;
    };
    const arm = () => {
      window.clearTimeout(timer.current);
      if (!("ringRaised" in d.dataset)) return set(false);
      if ("dockHidden" in d.dataset) return;
      timer.current = window.setTimeout(function tuck() {
        // A panel is open: try again later instead of hiding it.
        if (busy()) timer.current = window.setTimeout(tuck, IDLE_MS);
        else set(true);
      }, IDLE_MS);
    };
    const onHide = () => {
      window.clearTimeout(timer.current);
      set(true);
    };
    const onShow = () => {
      set(false);
      arm();
    };
    // Any touch on the dock counts as use: restart the count.
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest?.("[data-dock]")) arm();
    };
    const mo = new MutationObserver(arm);
    mo.observe(d, { attributes: true, attributeFilter: ["data-ring-raised"] });
    window.addEventListener("im:dock-hide", onHide);
    window.addEventListener("im:dock-show", onShow);
    document.addEventListener("pointerdown", onDown, true);
    arm();
    return () => {
      mo.disconnect();
      window.removeEventListener("im:dock-hide", onHide);
      window.removeEventListener("im:dock-show", onShow);
      document.removeEventListener("pointerdown", onDown, true);
      window.clearTimeout(timer.current);
      delete d.dataset.dockHidden;
    };
  }, []);

  return (
    <button
      type="button"
      aria-label={label}
      aria-hidden={!hidden}
      tabIndex={hidden ? 0 : -1}
      onClick={() => window.dispatchEvent(new Event("im:dock-show"))}
      className={`dock-tab fixed bottom-[8.5rem] right-0 z-40 grid h-14 w-7 place-items-center rounded-l-2xl bg-surface/90 text-gold shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-md transition-[translate,opacity] duration-500 ease-[var(--ease-out-expo)] sm:bottom-[10.5rem] sm:h-16 sm:w-8 ${
        // Glides in once the buttons have left; slips away at once on return.
        hidden ? "translate-x-0 opacity-100 delay-500" : "pointer-events-none translate-x-full opacity-0"
      }`}
    >
      <CaretLeft size="1rem" weight="bold" className="dock-nudge" />
    </button>
  );
}
