"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Dict } from "@/lib/dictionaries/pt";
import { editionGalleries } from "@/lib/site";
import Art from "../Art";
import Lightbox from "../Lightbox";
import { prefersReducedMotion } from "../prefs";
import { H2, container, section } from "../ui";

// A true bento: twelve tiles of different shapes on a 6x4 grid (the areas
// live in globals.css, .editions-bento). Every few seconds the column and row
// track sizes move to a new set, and because track sizes interpolate the tiles
// grow and shrink smoothly in both directions without ever reordering.
// Phones get a static two-column version.
const COLS = [
  "1.5fr 1fr 0.7fr 1fr 0.8fr 1fr",
  "0.8fr 1.1fr 1.2fr 0.7fr 1.3fr 0.9fr",
  "1fr 0.7fr 1fr 1.4fr 0.8fr 1.1fr",
  "1.1fr 1.3fr 0.8fr 0.9fr 1fr 0.7fr",
];
const ROWS = [
  "1fr 1.4fr 0.9fr 0.7fr",
  "1.3fr 0.8fr 1fr 1fr",
  "0.8fr 1fr 1.4fr 0.8fr",
  "1fr 0.9fr 0.8fr 1.3fr",
];
const AREAS = "abcdefghijkl";
// Focal point per tile (object-position) for the 2026 photos, chosen so faces
// stay in frame however narrow or wide the tile gets during the animation.
const FOCUS_2026 = [
  "45% 50%", // group on stage
  "72% 40%", // speaker at the lectern
  "45% 25%", // conversation
  "55% 45%", // panel under the banner
  "40% 42%", // two speakers
  "50% 55%", // group at the backdrop
  "50% 35%", // seated talk
  "58% 42%", // panel by the cube
  "45% 55%", // circle of chairs
  "50% 68%", // stage panel
  "40% 32%", // audience
  "62% 62%", // lounge
];
const STEP_MS = 5000;

export default function Editions({ t }: { t: Dict["editions"] }) {
  const [active, setActive] = useState(0);
  const [viewing, setViewing] = useState<number | null>(null);
  const photos = editionGalleries[active] ?? [];
  const current = t.list[active];
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (viewing !== null || prefersReducedMotion()) return;
    const id = window.setInterval(() => setTick((n) => n + 1), STEP_MS);
    return () => window.clearInterval(id);
  }, [viewing]);

  return (
    <section id="edicoes" className={`${section} scroll-mt-20`} aria-labelledby="edicoes-title">
      <div className={container}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <H2 id="edicoes-title">{t.title}</H2>
          <p className="font-display text-2xl text-brand md:text-3xl" aria-live="polite" data-nosplit>
            {current.city} <span className="text-terra">{current.year}</span>
          </p>
        </div>

        {photos.length ? (
          <ul
            key={active}
            className="editions-bento mt-12 md:mt-16"
            style={{ "--cols": COLS[tick % COLS.length], "--rows": ROWS[(tick + 1) % ROWS.length] } as React.CSSProperties}
          >
            {photos.slice(0, 12).map((src, i) => (
              <li
                key={src}
                className="group relative min-h-0 min-w-0 overflow-hidden rounded-[1.25rem] bg-block ring-1 ring-line transition-shadow duration-500 hover:ring-sun/60 md:rounded-[1.5rem] animate-[menuIn_0.9s_var(--ease-out-expo)_both] motion-reduce:animate-none"
                style={{ gridArea: AREAS[i], animationDelay: `${i * 45}ms` } as React.CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => setViewing(i)}
                  aria-label={`${t.open}: ${current.city} ${current.year}, ${t.photos} ${i + 1}`}
                  className="absolute inset-0 block size-full"
                >
                  <Image
                    src={src}
                    alt={`${current.city} ${current.year}, ${t.photos} ${i + 1}`}
                    fill
                    sizes="(min-width:1024px) 40vw, 60vw"
                    className="object-cover transition-transform duration-[1800ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
                    style={{ objectPosition: active === 0 ? FOCUS_2026[i] : "50% 40%" }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(34_14_52/0)_55%,rgb(34_14_52/0.45))] opacity-60 transition-opacity duration-700 group-hover:opacity-0"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div
            key={active}
            className="mt-12 grid min-h-[22rem] place-items-center rounded-[2rem] bg-bg-2 px-6 text-center ring-1 ring-line md:mt-16"
          >
            <div className="flex flex-col items-center gap-5">
              <Art name="mosaic" className="w-16 !visible" />
              <p className="max-w-[32ch] font-display text-2xl leading-snug text-ink">{t.soon}</p>
            </div>
          </div>
        )}

        <div className="mt-10">
          <p className="text-sm text-muted">{t.choose}</p>
          <div role="tablist" aria-label={t.choose} className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {t.list.map((e, i) => {
              const on = i === active;
              return (
                <button
                  key={e.year}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setActive(i);
                    setViewing(null);
                  }}
                  className={`group shrink-0 rounded-full px-5 py-3 text-left transition-[background-color,color,box-shadow] duration-300 ${
                    on ? "bg-brand text-brand-ink" : "btn-outline"
                  }`}
                >
                  <span className="block font-display text-lg leading-none">{e.year}</span>
                  <span className={`mt-1 block text-xs ${on ? "text-brand-ink/80" : "text-muted group-hover:text-sun-ink/75 group-focus-visible:text-sun-ink/75"}`}>{e.city}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Lightbox
        items={photos.map((src) => ({ src, title: current.city, subtitle: current.year }))}
        index={viewing}
        onIndex={setViewing}
        labels={{ label: t.title, close: t.close, prev: t.prev, next: t.next }}
      />
    </section>
  );
}
