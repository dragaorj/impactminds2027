"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";
import { useDialogDismiss } from "./useDialogDismiss";

export type LightboxItem = { src: string; title: string; subtitle?: string };
type Labels = { label: string; close: string; prev: string; next: string };

const navBtn =
  "grid size-12 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-md transition-[transform,background-color] duration-500 ease-[var(--ease-spring)] hover:bg-sun hover:text-sun-ink active:scale-95";

// Full-screen photo viewer shared by the field visits and the editions grid.
// Controlled by `index` (null = closed). The photo box takes the image's own
// aspect ratio inside the stage (container units), so the rounded corners
// always sit on the photo whatever its orientation.
// On touch screens a sideways swipe pages through the photos: the photo
// follows the finger, and past a short distance the next one slides in from
// the side it came from (a short drag springs back).
export default function Lightbox({
  items,
  index,
  onIndex,
  labels,
}: {
  items: LightboxItem[];
  index: number | null;
  onIndex: (i: number | null) => void;
  labels: Labels;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Aspect ratio per photo, learned from the preloads below, so each photo
  // opens at its final size instead of resizing once it arrives.
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const remember = (src: string, img: HTMLImageElement) => {
    if (!img.naturalWidth || !img.naturalHeight) return;
    const r = img.naturalWidth / img.naturalHeight;
    setRatios((m) => (m[src] === r ? m : { ...m, [src]: r }));
  };
  const total = items.length;
  // Direction of the last step (1 next, -1 previous, 0 opened) for the slide-in,
  // and the live horizontal drag while a finger is on the screen.
  const [dir, setDir] = useState<-1 | 0 | 1>(0);
  const [dx, setDx] = useState(0);
  const touch = useRef<{ x: number; y: number; dx: number; axis: "x" | "y" | null } | null>(null);
  const step = (by: -1 | 1) => {
    if (index === null) return;
    setDir(by);
    onIndex((index + by + total) % total);
  };

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const item = index === null ? null : items[index];
  const close = () => {
    setDir(0);
    onIndex(null);
  };
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY, dx: 0, axis: null } : null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = touch.current;
    const t = e.touches[0];
    if (!s || !t) return;
    const x = t.clientX - s.x;
    if (!s.axis && Math.max(Math.abs(x), Math.abs(t.clientY - s.y)) > 10) s.axis = Math.abs(x) > Math.abs(t.clientY - s.y) ? "x" : "y";
    if (s.axis !== "x") return;
    s.dx = x;
    setDx(x);
  };
  const onTouchEnd = () => {
    const s = touch.current;
    touch.current = null;
    setDx(0);
    if (s?.axis === "x" && Math.abs(s.dx) > 60) step(s.dx < 0 ? 1 : -1);
  };
  // Closes on a click outside the photo or on a scroll gesture.
  useDialogDismiss(dialog, index !== null, close);
  const ratio = (item && ratios[item.src]) ?? 1.5;
  const SIZES = "(min-width:1024px) 80vw, 100vw";

  return (
    <>
    {/* Warm the cache: every photo is fetched at the exact size the viewer asks
        for (same sizes attribute) as soon as its section nears the screen
        (lazy), so opening the lightbox is instant. */}
    <div aria-hidden className="pointer-events-none absolute left-0 top-0 size-px overflow-hidden opacity-0">
      {items.map((it) => (
        <div key={it.src} className="relative size-px">
          <Image src={it.src} alt="" fill sizes={SIZES} loading="lazy" onLoad={(e) => remember(it.src, e.currentTarget)} />
        </div>
      ))}
    </div>
    <dialog
      ref={dialog}
      onClose={close}
      aria-label={labels.label}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-[rgb(34_14_52/0.94)] p-0 backdrop:bg-transparent"
    >
      {index !== null && item && (
        <div
          className="flex h-full touch-pan-y flex-col px-4 pb-6 pt-4 sm:px-8"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div className="flex items-center justify-between text-white">
            <p className="text-sm tabular-nums text-white/70">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </p>
            <button type="button" onClick={close} aria-label={labels.close} className={navBtn}>
              <X size="1.125rem" />
            </button>
          </div>

          <div
            className={`my-4 grid min-h-0 flex-1 place-items-center [container-type:size] ${
              dx ? "" : "transition-[translate,opacity] duration-500 ease-[var(--ease-out-expo)]"
            }`}
            style={{ translate: `${dx}px 0`, opacity: 1 - Math.min(Math.abs(dx) / 500, 0.5) }}
          >
            <div
              key={item.src}
              data-keep
              className={`relative overflow-hidden rounded-[1.5rem] ring-1 ring-white/15 ${
                dir === 1 ? "animate-[lightboxNext_0.6s_var(--ease-out-expo)_both]" : dir === -1 ? "animate-[lightboxPrev_0.6s_var(--ease-out-expo)_both]" : "animate-[menuIn_0.6s_var(--ease-out-expo)_both]"
              }`}
              style={{ aspectRatio: ratio, width: `min(100cqw, calc(100cqh * ${ratio}))` }}
            >
              <Image
                src={item.src}
                alt={item.subtitle ? `${item.title}: ${item.subtitle}` : item.title}
                fill
                sizes={SIZES}
                className="object-cover"
                onLoad={(e) => remember(item.src, e.currentTarget)}
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-6 text-white">
            <div>
              <p className="font-display text-2xl leading-tight sm:text-3xl">{item.title}</p>
              {item.subtitle && <p className="mt-1 text-sm text-[#E2C985] sm:text-base">{item.subtitle}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => step(-1)} aria-label={labels.prev} className={navBtn}>
                <ArrowLeft size="1.125rem" />
              </button>
              <button type="button" onClick={() => step(1)} aria-label={labels.next} className={navBtn}>
                <ArrowRight size="1.125rem" />
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
    </>
  );
}
