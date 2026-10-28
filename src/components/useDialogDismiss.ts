"use client";

import { type RefObject, useEffect } from "react";

// Image viewers (the photo lightbox, the speaker profile) close the way people
// expect: a click anywhere outside the content (anything not inside a button,
// a link or [data-keep]) or a scroll gesture (a wheel turn, a vertical swipe;
// sideways swipes are left to the viewer, which pages through the photos).
export function useDialogDismiss(ref: RefObject<HTMLDialogElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    const d = ref.current;
    if (!d || !open) return;
    let start: { x: number; y: number } | null = null;

    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest("button, a, [data-keep]")) close();
    };
    const onWheel = (e: WheelEvent) => {
      // Vertical scrolling only, so a sideways trackpad swipe doesn't close it.
      if (Math.abs(e.deltaY) > 4 && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) close();
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start = t ? { x: t.clientX, y: t.clientY } : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!start || !t) return;
      const dx = Math.abs(t.clientX - start.x);
      const dy = Math.abs(t.clientY - start.y);
      if (dx > 12 && dx > dy) start = null; // a sideways swipe: not a dismiss
      if (!start || dy < 40) return;
      start = null;
      close();
    };

    d.addEventListener("click", onClick);
    d.addEventListener("wheel", onWheel, { passive: true });
    d.addEventListener("touchstart", onTouchStart, { passive: true });
    d.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      d.removeEventListener("click", onClick);
      d.removeEventListener("wheel", onWheel);
      d.removeEventListener("touchstart", onTouchStart);
      d.removeEventListener("touchmove", onTouchMove);
    };
  }, [ref, open, close]);
}
