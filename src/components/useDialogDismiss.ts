"use client";

import { type RefObject, useEffect } from "react";

// Image viewers (the photo lightbox, the speaker profile) close the way people
// expect: a click anywhere outside the content (anything not inside a button,
// a link or [data-keep]) or a scroll gesture (a wheel turn, a vertical swipe).
export function useDialogDismiss(ref: RefObject<HTMLDialogElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    const d = ref.current;
    if (!d || !open) return;
    let startY: number | null = null;

    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest("button, a, [data-keep]")) close();
    };
    const onWheel = (e: WheelEvent) => {
      // Vertical scrolling only, so a sideways trackpad swipe doesn't close it.
      if (Math.abs(e.deltaY) > 4 && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) close();
    };
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (startY === null || y === undefined || Math.abs(y - startY) < 40) return;
      startY = null;
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
