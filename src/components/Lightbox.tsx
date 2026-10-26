"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";

export type LightboxItem = { src: string; title: string; subtitle?: string };
type Labels = { label: string; close: string; prev: string; next: string };

const navBtn =
  "grid size-12 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-md transition-[transform,background-color] duration-500 ease-[var(--ease-spring)] hover:bg-white/20 active:scale-95";

// Full-screen photo viewer shared by the field visits and the editions grid.
// Controlled by `index` (null = closed). The photo box takes the image's own
// aspect ratio inside the stage (container units), so the rounded corners
// always sit on the photo whatever its orientation.
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
  const [ratio, setRatio] = useState(1.5);
  const total = items.length;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % total);
      if (e.key === "ArrowLeft") onIndex((index - 1 + total) % total);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total, onIndex]);

  const item = index === null ? null : items[index];
  const close = () => onIndex(null);

  return (
    <dialog
      ref={dialog}
      onClose={close}
      onClick={(e) => e.target === e.currentTarget && close()}
      aria-label={labels.label}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-[rgb(34_14_52/0.94)] p-0 backdrop:bg-transparent"
    >
      {index !== null && item && (
        <div className="flex h-full flex-col px-4 pb-6 pt-4 sm:px-8" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="flex items-center justify-between text-white">
            <p className="text-sm tabular-nums text-white/70">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </p>
            <button type="button" onClick={close} aria-label={labels.close} className={navBtn}>
              <X size="1.125rem" />
            </button>
          </div>

          <div className="my-4 grid min-h-0 flex-1 place-items-center [container-type:size]">
            <div
              key={item.src}
              className="relative animate-[menuIn_0.6s_var(--ease-out-expo)_both] overflow-hidden rounded-[1.5rem] ring-1 ring-white/15"
              style={{ aspectRatio: ratio, width: `min(100cqw, calc(100cqh * ${ratio}))` }}
            >
              <Image
                src={item.src}
                alt={item.subtitle ? `${item.title}: ${item.subtitle}` : item.title}
                fill
                sizes="(min-width:1024px) 80vw, 100vw"
                className="object-cover"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
                }}
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-6 text-white">
            <div>
              <p className="font-display text-2xl leading-tight sm:text-3xl">{item.title}</p>
              {item.subtitle && <p className="mt-1 text-sm text-[#E2C985] sm:text-base">{item.subtitle}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => onIndex((index - 1 + total) % total)} aria-label={labels.prev} className={navBtn}>
                <ArrowLeft size="1.125rem" />
              </button>
              <button type="button" onClick={() => onIndex((index + 1) % total)} aria-label={labels.next} className={navBtn}>
                <ArrowRight size="1.125rem" />
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
