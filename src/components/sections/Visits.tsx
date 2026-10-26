"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowsOut, X } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { photos } from "@/lib/site";
import { container, section } from "../ui";

// The index on the left stays pinned (CSS sticky, so it never hijacks the
// scroll) while the field photos scroll past; any photo or name opens the
// lightbox, which steps through all twelve with captions.
export default function Visits({ t }: { t: Dict["visits"] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const total = photos.visits.length;

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + total) % total)), [total]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, step]);

  const current = index === null ? null : t.list[index];
  const navBtn =
    "grid size-12 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-md transition-[transform,background-color] duration-500 ease-[var(--ease-spring)] hover:bg-white/20 active:scale-95";

  return (
    <section id="visitas" className={section} aria-labelledby="visitas-title">
      <div className={`${container} grid gap-14 lg:grid-cols-12 lg:gap-14`}>
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <h2 id="visitas-title" className="font-display text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] text-ink">
              {t.title}
            </h2>
            <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-ink-2">{t.lead}</p>
            <ol className="mt-8 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {t.list.map((v, i) => (
                <li key={v.name}>
                  <button
                    type="button"
                    onClick={() => open(i)}
                    className="group flex w-full items-baseline gap-3 border-t border-line py-2.5 text-left"
                  >
                    <span className="w-5 shrink-0 font-display text-sm text-sun tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <span className="block font-display text-base leading-tight text-ink transition-colors group-hover:text-brand">
                        {v.name}
                      </span>
                      <span className="block truncate text-xs text-muted">{v.theme}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <ul className="columns-1 gap-4 sm:columns-2 lg:col-span-7">
          {photos.visits.map((src, i) => (
            <li key={src} data-reveal className="mb-4 break-inside-avoid">
              <figure>
                <button
                  type="button"
                  onClick={() => open(i)}
                  aria-label={t.list[i].name}
                  className="group relative block w-full overflow-hidden rounded-[1.5rem] ring-1 ring-line"
                >
                  <Image
                    src={src}
                    alt={`${t.list[i].name}: ${t.list[i].theme}`}
                    width={900}
                    height={1200}
                    sizes="(min-width:1024px) 28vw, (min-width:640px) 45vw, 100vw"
                    className="h-auto w-full transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <span className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/85 text-[#2A1240] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <ArrowsOut size={16} />
                  </span>
                </button>
                <figcaption className="mt-3 px-1">
                  <span className="block font-display text-lg leading-tight text-ink">{t.list[i].name}</span>
                  <span className="mt-0.5 block text-sm text-muted">{t.list[i].theme}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialog}
        onClose={() => setIndex(null)}
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        aria-label={t.title}
        className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-[rgb(34_14_52/0.94)] p-0 backdrop:bg-transparent"
      >
        {index !== null && current && (
          <div className="flex h-full flex-col px-4 pb-6 pt-4 sm:px-8" onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}>
            <div className="flex items-center justify-between text-white">
              <p className="text-sm tabular-nums text-white/70">
                {String(index + 1).padStart(2, "0")} / {total}
              </p>
              <button type="button" onClick={() => dialog.current?.close()} aria-label={t.close} className={navBtn}>
                <X size={18} />
              </button>
            </div>
            {/* Sized by the photo itself so the rounded corners sit on the image, not the stage. */}
            <div className="my-4 flex min-h-0 flex-1 items-center justify-center">
              <Image
                key={photos.visits[index]}
                src={photos.visits[index]}
                alt={`${current.name}: ${current.theme}`}
                width={1600}
                height={1600}
                sizes="(min-width:1024px) 70vw, 100vw"
                className="h-full max-h-full w-auto max-w-full animate-[menuIn_0.6s_var(--ease-out-expo)_both] rounded-[1.5rem] object-cover ring-1 ring-white/15"
              />
            </div>
            <div className="flex items-end justify-between gap-6 text-white">
              <div>
                <p className="font-display text-2xl leading-tight sm:text-3xl">{current.name}</p>
                <p className="mt-1 text-sm text-[#E2C985] sm:text-base">{current.theme}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => step(-1)} aria-label={t.prev} className={navBtn}>
                  <ArrowLeft size={18} />
                </button>
                <button type="button" onClick={() => step(1)} aria-label={t.next} className={navBtn}>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
