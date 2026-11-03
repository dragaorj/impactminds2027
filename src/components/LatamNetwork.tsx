"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { latam } from "./latamMap";

type Labels = {
  title: string;
  places: string;
  host2027: string;
  host2026: string;
};
type Place = (typeof latam.places)[number];

// 10.39 -> 10°23′N
const dms = (v: number, pos: string, neg: string) => {
  const a = Math.abs(v);
  const d = Math.floor(a);
  const m = Math.round((a - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}′${v >= 0 ? pos : neg}`;
};

// Latin America and the Caribbean as a finely drawn map (globals.css, .lm-*):
// when it comes into view the coast and borders trace themselves, the places
// light up and a few arcs link them to Cartagena. One place is always "active"
// (its country lit, its links bright, its coordinates in the corner); it moves
// through the network on its own and follows the pointer or keyboard, on the
// map or in the list. Hovering a country lights it and names it. With reduced
// motion it is shown complete, resting on Cartagena.
export default function LatamNetwork({ lang, labels }: { lang: Locale; labels: Labels }) {
  const root = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false); // drawn (once)
  const [inView, setInView] = useState(false);
  const [auto, setAuto] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);

  const regionName = useMemo(() => {
    const names = new Intl.DisplayNames([lang], { type: "region" });
    return (cc: string) => names.of(cc) ?? cc;
  }, [lang]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting) setOn(true);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Walk through the places while the map is in view and nobody is pointing.
  useEffect(() => {
    if (!inView || pick || document.documentElement.dataset.motion === "reduce") return;
    const id = window.setInterval(() => setAuto((i) => (i + 1) % latam.places.length), 2800);
    return () => window.clearInterval(id);
  }, [inView, pick]);

  const active: Place = latam.places.find((p) => p.id === pick) ?? latam.places[auto];
  const lit = country ?? active.cc;

  // In the chip row (below lg) keep the active place in view, scrolling the row only.
  useEffect(() => {
    const ul = list.current;
    if (!ul || ul.scrollWidth <= ul.clientWidth || !inView) return;
    const li = ul.children[latam.places.findIndex((p) => p.id === active.id)] as HTMLElement | undefined;
    if (li)
      ul.scrollTo({
        left: li.offsetLeft - (ul.clientWidth - li.offsetWidth) / 2,
        behavior: "smooth",
      });
  }, [active.id, inView]);
  const linked = (l: (typeof latam.links)[number]) => l.a === active.id || l.b === active.id;
  const tag = (p: Place) => (p.host === 2027 ? labels.host2027 : p.host === 2026 ? labels.host2026 : null);
  const name = (p: Place) => p.name[lang];

  return (
    // Phones and tablets: the map with the readout in its empty top-right corner,
    // then the places as a row of chips. From lg it fills the box behind the text
    // (AboutLatimpacto): map large on the right, the readout top right, the list
    // bottom right over the Atlantic.
    <div ref={root} className="lm pointer-events-none relative lg:absolute lg:inset-0" data-on={on || undefined} data-nosplit>
      <div className="pointer-events-auto relative mx-auto aspect-[600/720] w-full max-w-[36rem] lg:absolute lg:inset-y-[-3%] lg:left-[33%] lg:right-[17%] lg:aspect-auto lg:w-auto lg:max-w-none">
        <svg viewBox={latam.viewBox} role="img" aria-label={labels.title} className="absolute inset-0 h-full w-full overflow-visible">
          <g onPointerLeave={() => setCountry(null)}>
            {latam.countries.map((c) => (
              <path key={c.id} d={c.d} className="lm-country" data-lit={c.id === lit || undefined} onPointerEnter={() => setCountry(c.id)} />
            ))}
          </g>
          <path d={latam.borders} pathLength={1} data-draw className="lm-border" />
          <path d={latam.coast} pathLength={1} data-draw className="lm-coast" />

          <g>
            {latam.links.map((l, i) => (
              <g key={i} data-hot={linked(l) || undefined} className="lm-link">
                <path d={l.d} pathLength={1} data-draw style={{ "--d": `${1.6 + i * 0.12}s` } as React.CSSProperties} />
                <circle
                  r={2.2}
                  className="lm-packet"
                  style={
                    {
                      offsetPath: `path("${l.d}")`,
                      animationDelay: `${2.6 + i * 0.7}s`,
                    } as React.CSSProperties
                  }
                />
              </g>
            ))}
          </g>

          {latam.places.map((p, i) => {
            const isActive = p.id === active.id;
            const left = p.x > 420;
            return (
              <g
                key={p.id}
                transform={`translate(${p.x} ${p.y})`}
                className="lm-place"
                data-host={p.host ? "" : undefined}
                data-active={isActive || undefined}
                style={{ "--d": `${1.1 + i * 0.08}s` } as React.CSSProperties}
                onPointerEnter={() => setPick(p.id)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setPick(null)}
              >
                <circle r={16} className="lm-hit" />
                <circle r={p.host ? 5 : 4} className="lm-halo" />
                <circle r={isActive ? 9 : 0} className="lm-ring" />
                <circle r={15} pathLength={100} className="lm-orbit" />
                <circle r={p.host ? 4.2 : 3.2} className="lm-dot" />
                <g className="lm-label" transform={`translate(${left ? -14 : 14} 0)`} textAnchor={left ? "end" : "start"}>
                  <text y={tag(p) ? -2 : 4.5} className="lm-name">
                    {name(p)}
                  </text>
                  {tag(p) && (
                    <text y={12} className="lm-tag">
                      {tag(p)}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Readout in the empty Atlantic corner: where the active place is. */}
      <div
        aria-live="polite"
        className="absolute right-0 top-0 text-right text-[0.625rem] uppercase leading-relaxed tracking-[0.18em] text-muted tabular-nums sm:text-[0.6875rem] lg:right-0 lg:top-24"
      >
        <p>
          {dms(active.ll[1], "N", "S")} · {dms(active.ll[0], "E", "W")}
        </p>
        <p className="text-ink-2">{regionName(lit)}</p>
      </div>

      {/* The places, as a list. */}
      <div className="pointer-events-auto mt-8 lg:absolute lg:bottom-24 lg:right-0 lg:mt-0 lg:text-right">
        <p className="text-center text-[0.6875rem] uppercase tracking-[0.18em] text-muted lg:text-right">{labels.places}</p>
        <ul
          ref={list}
          className="lm-list relative -mx-5 mt-4 flex snap-x gap-2 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:mt-3 lg:block lg:space-y-0.5 lg:overflow-visible lg:p-0"
        >
          {latam.places.map((p) => (
            <li key={p.id} className="shrink-0 snap-center">
              <button
                type="button"
                className="lm-item font-display text-lg leading-snug lg:text-2xl"
                data-active={p.id === active.id || undefined}
                onPointerEnter={() => setPick(p.id)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setPick(null)}
                onFocus={() => setPick(p.id)}
                onBlur={() => setPick(null)}
                onClick={() => setPick(p.id)}
              >
                {name(p)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
