"use client";

import { useEffect, useRef, useState } from "react";

// Seek bar drawn as the track's waveform: one bar per slice of the song, its
// height the slice's loudness; bars already played are gold, the rest dim.
// Click or drag anywhere to jump; arrow keys step 5 s (it's a slider for
// assistive tech). The peaks are precomputed (scripts/waveform-peaks.mjs ->
// public/music/peaks.json, a few KB for the whole playlist): the browser never
// downloads and decodes a whole MP3 for them. Until the file arrives a gentle
// placeholder shape shows.

const cache = new Map<string, number[]>();
let peaksFile: Promise<Record<string, number[]>> | null = null;

function placeholder(n: number, seed: number) {
  return Array.from({ length: n }, (_, i) => 0.35 + 0.3 * Math.abs(Math.sin(i * 0.55 + seed)) * Math.abs(Math.cos(i * 0.21 + seed * 2)));
}

// The track's slices folded into n bars (each bar the RMS of its slices),
// scaled to the loudest bar with a floor, as the player always drew them.
async function loadPeaks(src: string, n: number) {
  const key = `${src}#${n}`;
  const hit = cache.get(key);
  if (hit) return hit;
  peaksFile ??= fetch("/music/peaks.json").then((r) => r.json());
  const slices = (await peaksFile)[src];
  if (!slices?.length) throw new Error("no peaks");
  const per = slices.length / n;
  const peaks = Array.from({ length: n }, (_, i) => {
    const part = slices.slice(Math.floor(i * per), Math.max(Math.floor((i + 1) * per), Math.floor(i * per) + 1));
    return Math.sqrt(part.reduce((sum, v) => sum + v * v, 0) / part.length);
  });
  const max = Math.max(...peaks) || 1;
  const out = peaks.map((p) => Math.max(0.12, p / max));
  cache.set(key, out);
  return out;
}

export default function Waveform({
  src,
  seed,
  bars,
  progress,
  current,
  duration,
  label,
  valueText,
  onSeek,
  tone = "light",
  active = true,
  className = "",
}: {
  src: string;
  seed: number;
  bars: number;
  progress: number;
  current: number;
  duration: number;
  label: string;
  valueText: string;
  onSeek: (seconds: number) => void;
  tone?: "light" | "theme";
  // Only load while shown.
  active?: boolean;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<number[]>(() => placeholder(bars, seed));
  const dragging = useRef(false);

  useEffect(() => {
    let alive = true;
    const id = requestAnimationFrame(() => setPeaks(cache.get(`${src}#${bars}`) ?? placeholder(bars, seed)));
    // Only when it's actually on screen layout-wise (not display:none), so a
    // hidden copy (the phone layout) doesn't download the track twice.
    if (active && root.current?.offsetParent)
      loadPeaks(src, bars)
        .then((p) => alive && setPeaks(p))
        .catch(() => {});
    return () => {
      alive = false;
      cancelAnimationFrame(id);
    };
  }, [src, bars, seed, active]);

  const seekAt = (clientX: number) => {
    const el = root.current;
    if (!el || !duration) return;
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    onSeek(f * duration);
  };

  const played = Math.round(progress * bars);
  const off = tone === "light" ? "bg-white/25" : "bg-ink/15 dark:bg-white/20";

  return (
    <div
      ref={root}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(current)}
      aria-valuetext={valueText}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        seekAt(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && seekAt(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") onSeek(Math.min(duration, current + 5));
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onSeek(Math.max(0, current - 5));
        else if (e.key === "Home") onSeek(0);
        else return;
        e.preventDefault();
      }}
      className={`group/wave flex cursor-pointer touch-none select-none items-center justify-between rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun/60 ${className}`}
    >
      {peaks.map((p, i) => (
        <span
          key={i}
          aria-hidden
          className={`min-w-px max-w-[3px] flex-1 rounded-full transition-[background-color,height] duration-300 ${i < played ? "bg-sun" : off}`}
          style={{ height: `${Math.round(p * 100)}%` }}
        />
      ))}
    </div>
  );
}
