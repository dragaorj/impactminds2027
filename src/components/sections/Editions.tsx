"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import { ArrowUpRight, FilePdf } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
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
const SIZES = "(min-width:1024px) 40vw, 60vw";

// Fast galleries: the photos of the other editions are fetched ahead, in the
// browser's idle time (the very files the gallery will ask for), so picking
// an edition shows its photos at once. Each file only once.
const warmed = new Set<string>();
function warm(srcs: string[], high = false) {
  for (const src of srcs) {
    if (warmed.has(src)) continue;
    warmed.add(src);
    const { props } = getImageProps({ src, alt: "", fill: true, sizes: SIZES });
    const img = new window.Image();
    img.decoding = "async";
    if (high) img.fetchPriority = "high";
    if (props.sizes) img.sizes = props.sizes;
    if (props.srcSet) img.srcset = props.srcSet;
    img.src = props.src;
  }
}
// An image already in the cache (loaded before the page woke up) shows at once.
const reveal = (img: HTMLImageElement | null) => {
  if (img?.complete && img.naturalWidth) img.setAttribute("data-ready", "");
};
// Safari lacks requestIdleCallback: a short timeout there.
const idle = (fn: () => void) => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 400));

// Photos and report per edition come from the page (lib/editions.ts finds
// them by file name). On the editions page (asPage) the page's own heading
// names it, so the section shows only the selected edition and its report.
export default function Editions({
  t,
  media,
  asPage = false,
}: {
  t: Dict["editions"];
  media: { photos: string[]; report: string | null }[];
  asPage?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [viewing, setViewing] = useState<number | null>(null);
  const photos = media[active]?.photos ?? [];
  const current = t.list[active];
  const report = media[active]?.report ?? null;
  const [tick, setTick] = useState(0);
  const root = useRef<HTMLElement>(null);

  // Near the screen: the other editions' photos load in the background, one
  // edition after the other.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const queue = media.map((m) => m.photos.slice(0, 12)).filter((p) => p.length);
        const next = () => {
          const batch = queue.shift();
          if (!batch) return;
          warm(batch);
          idle(next);
        };
        idle(next);
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [media]);
  // Pointing at an edition: its photos at once.
  const warmEdition = useCallback((i: number) => warm(media[i]?.photos.slice(0, 12) ?? [], true), [media]);

  useEffect(() => {
    if (viewing !== null || prefersReducedMotion()) return;
    // No reflow work while the grid is off screen or the tab is hidden.
    const id = window.setInterval(() => {
      if (document.hidden || document.getElementById("edicoes")?.hasAttribute("data-idle")) return;
      setTick((n) => n + 1);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [viewing]);

  return (
    <section ref={root} id="edicoes" className={asPage ? "relative pb-24 md:pb-36" : `${section} scroll-mt-20`} aria-labelledby={asPage ? undefined : "edicoes-title"} aria-label={asPage ? t.title : undefined}>
      <div className={container}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          {asPage ? (
            <p className="font-display text-3xl text-brand md:text-4xl" aria-live="polite" data-nosplit>
              {current.city} <span className="text-terra">{current.year}</span>
            </p>
          ) : (
            <H2 id="edicoes-title">{t.title}</H2>
          )}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3" data-nosplit>
            {!asPage && (
              <p className="font-display text-2xl text-brand md:text-3xl" aria-live="polite">
                {current.city} <span className="text-terra">{current.year}</span>
              </p>
            )}
            {/* The edition's full report (PDF), when there is one. */}
            {report && (
              <a
                href={report}
                {...(report.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group inline-flex min-h-12 items-center gap-3 rounded-full py-1.5 pl-2 pr-5 text-[0.9375rem] font-medium uppercase tracking-[0.06em] btn-outline transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:bg-sun hover:text-sun-ink active:scale-[0.98]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sun/15 text-gold transition-colors group-hover:bg-sun-ink/10 group-hover:text-sun-ink">
                  <FilePdf size="1.05rem" weight="light" />
                </span>
                {t.report} {current.year}
                <ArrowUpRight size="1rem" className="shrink-0" />
              </a>
            )}
          </div>
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
                    sizes={SIZES}
                    // The first tiles of the open edition first.
                    priority={i < 4}
                    // Each photo comes in softly once it is ready (none
                    // painting in halfway).
                    ref={reveal}
                    onLoad={(e) => e.currentTarget.setAttribute("data-ready", "")}
                    className="object-cover opacity-0 transition-[transform,opacity] duration-[1800ms,500ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06] data-[ready]:opacity-100"
                    style={{ objectPosition: current.year === "2026" ? FOCUS_2026[i] : "50% 40%" }}
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
              <Art name="bloom" className="w-12 !visible" />
              <p className="max-w-[32ch] font-display text-2xl leading-snug text-ink">{t.soon}</p>
            </div>
          </div>
        )}

        <div className="mt-10">
          <p className="text-sm text-muted">{t.choose}</p>
          <div role="tablist" aria-label={t.choose} className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {t.list.map((e, i) => {
              const on = i === active;
              // An edition without photos yet (2022, for now) shows, but
              // cannot be picked; it turns on by itself once its photos are in.
              const empty = !media[i]?.photos.length;
              return (
                <button
                  key={e.year}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  disabled={empty}
                  aria-disabled={empty}
                  title={empty ? t.soon : undefined}
                  onPointerEnter={() => warmEdition(i)}
                  onFocus={() => warmEdition(i)}
                  onTouchStart={() => warmEdition(i)}
                  onClick={() => {
                    setActive(i);
                    setViewing(null);
                  }}
                  className={`group shrink-0 rounded-full px-5 py-3 text-left transition-[background-color,color,box-shadow] duration-300 ${
                    on ? "bg-brand text-brand-ink" : "btn-outline"
                  } disabled:pointer-events-none disabled:opacity-40`}
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
