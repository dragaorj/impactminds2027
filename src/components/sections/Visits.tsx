"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowsOut } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { photos } from "@/lib/site";
import Lightbox from "../Lightbox";
import { prefersReducedMotion } from "../prefs";
import { container, section } from "../ui";

// How long a card stays in focus, and how long the move to the next takes
// (the same curve as the card's width change in globals.css, .visit-rail).
const FOCUS_MS = 6500;
const MOVE_MS = 1200;
const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
// The list is laid out three times so the rail never runs out either way.
const COPIES = 3;

const ctrlBtn =
  "grid size-12 place-items-center rounded-full text-ink ring-1 ring-line transition-[transform,background-color,color,box-shadow] duration-500 ease-[var(--ease-spring)] hover:bg-sun hover:text-sun-ink hover:ring-sun active:scale-95";

const pad = (n: number) => String(n).padStart(2, "0");

// The twelve visits as an endless rail of photo cards running edge to edge
// of the screen. One card at a time is in focus, in full colour (on desktop
// also wide, filling the left of the rail), with a gold line filling along
// its foot; when it is full the rail glides on and the next card takes the
// focus. The others wear the speakers' lilac wash. The line fills without a
// break, waiting only while the rail is dragged, a photo is open or the rail
// is off screen. A swipe or scroll settles on the nearest card by itself (no
// CSS snap, which fought the glide and nudged the rail by a few pixels).
// The card in focus always sits at the rail's start, and every card before it
// is narrow, so card k starts at k * step. The rail is the list three times
// over: when it drifts into an outer copy it jumps back by one copy (same
// picture, with the width transition switched off for that frame).
export default function Visits({ t }: { t: Dict["visits"] }) {
  const [viewing, setViewing] = useState<number | null>(null);
  const total = photos.visits.length;
  // Card in focus: its place on the rail (0..35); the visit is abs % total.
  const [abs, setAbs] = useState(total);
  const [dragging, setDragging] = useState(false);
  const [gliding, setGliding] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [inView, setInView] = useState(false);
  const running = inView && !dragging && !gliding && viewing === null;
  const rail = useRef<HTMLOListElement>(null);
  const loop = Array.from({ length: total * COPIES }, (_, k) => k % total);

  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const swallowClick = useRef(false);
  const idle = useRef(0);
  const frame = useRef(0);
  const glidingRef = useRef(false);
  const absRef = useRef(abs);
  useEffect(() => {
    absRef.current = abs;
  }, [abs]);

  const geo = () => {
    const r = rail.current;
    const a = r?.children[0] as HTMLElement | undefined;
    const b = r?.children[1] as HTMLElement | undefined;
    if (!r || !a || !b) return null;
    // Measured from the layout boxes, not offsetLeft: cards have fractional
    // widths, and a rounded step drifts by pixels a dozen cards along.
    return { r, step: b.getBoundingClientRect().left - a.getBoundingClientRect().left, edge: parseFloat(getComputedStyle(r).paddingLeft) };
  };
  const glide = (on: boolean) => {
    glidingRef.current = on;
    setGliding(on);
  };

  // Back into the middle copy without anything visibly moving.
  const recentre = (k: number) => {
    const g = geo();
    if (!g || (k >= total * 0.5 && k < total * 1.5)) return;
    const shift = k < total * 0.5 ? total : -total;
    setJumping(true);
    setAbs(k + shift);
    g.r.scrollLeft += shift * g.step;
  };
  useEffect(() => {
    if (!jumping) return;
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => setJumping(false))));
    return () => cancelAnimationFrame(id);
  }, [jumping]);

  // Glide card k to the rail's start, scrolling in step with the widths.
  const go = (target: number) => {
    const g = geo();
    if (!g) return;
    cancelAnimationFrame(frame.current);
    // An interrupted glide can leave the rail at the end of the copies: step
    // back a copy first, so the card asked for always exists (and is lit).
    let k = target;
    if (k < 1 || k > total * COPIES - 2) {
      const shift = k < 1 ? total : -total;
      setJumping(true);
      g.r.scrollLeft += shift * g.step;
      k += shift;
    }
    setAbs(k);
    const from = g.r.scrollLeft;
    const to = k * g.step;
    if (prefersReducedMotion()) {
      g.r.scrollLeft = to;
      recentre(k);
      return;
    }
    glide(true);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / MOVE_MS);
      g.r.scrollLeft = from + (to - from) * ease(p);
      if (p < 1) frame.current = requestAnimationFrame(tick);
      else {
        glide(false);
        recentre(k);
      }
    };
    frame.current = requestAnimationFrame(tick);
  };

  // The card whose start is nearest the scroll position (leaning if asked).
  const nearest = (lean = 0) => {
    const g = geo();
    if (!g) return absRef.current;
    const x = g.r.scrollLeft + lean;
    let best = 0;
    let gap = Infinity;
    Array.from(g.r.children).forEach((c, k) => {
      const d = Math.abs(c.getBoundingClientRect().left - g.r.getBoundingClientRect().left + g.r.scrollLeft - g.edge - x);
      if (d < gap) [gap, best] = [d, k];
    });
    return best;
  };

  // Start on the middle copy; keep the card in focus in place across resizes.
  useEffect(() => {
    const place = () => {
      const g = geo();
      if (g) g.r.scrollLeft = absRef.current * g.step;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  // Someone scrolled or swiped: once the rail is still, focus the card there.
  const onScroll = () => {
    if (glidingRef.current || drag.current) return;
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => {
      if (drag.current || glidingRef.current) return;
      const g = geo();
      const k = nearest();
      if (k !== absRef.current || (g && Math.abs(g.r.scrollLeft - k * g.step) > 4)) go(k);
    }, 160);
  };

  // The timer line only runs while the rail is on screen.
  useEffect(() => {
    const r = rail.current;
    if (!r) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 });
    io.observe(r);
    return () => io.disconnect();
  }, []);

  // Mouse grab: drag the rail; on release it settles on the nearest card,
  // leaning the way it was pulled. Touch keeps the native swipe.
  const onPointerDown = (e: React.PointerEvent) => {
    const r = rail.current;
    if (!r || e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { x: e.clientX, left: r.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const r = rail.current;
    if (!d || !r) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      cancelAnimationFrame(frame.current);
      glide(false);
      setDragging(true);
      d.left = r.scrollLeft;
      d.x = e.clientX;
      r.setPointerCapture(e.pointerId);
    }
    if (d.moved) r.scrollLeft = d.left - (e.clientX - d.x);
  };
  const onPointerUp = () => {
    const d = drag.current;
    const g = geo();
    drag.current = null;
    if (!d?.moved || !g) return;
    setDragging(false);
    swallowClick.current = true;
    window.setTimeout(() => (swallowClick.current = false));
    const moved = g.r.scrollLeft - d.left;
    go(nearest(Math.abs(moved) > g.step * 0.15 ? Math.sign(moved) * g.step * 0.35 : 0));
  };

  const step = (by: number) => {
    go(absRef.current + by);
  };

  return (
    <section id="visitas" className={section} aria-labelledby="visitas-title">
      <div className={`${container} flex items-end justify-between gap-12`}>
        <div>
          <h2 id="visitas-title" className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.02] text-ink">
            {t.title}
          </h2>
          <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-ink-2 sm:mt-5 sm:text-xl">{t.lead}</p>
        </div>
        {/* Desktop: arrows by the title (phones just swipe). */}
        <div className="hidden shrink-0 gap-2 lg:flex">
          <button type="button" onClick={() => step(-1)} aria-label={t.prev} className={ctrlBtn}>
            <ArrowLeft size="1.0625rem" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label={t.next} className={ctrlBtn}>
            <ArrowRight size="1.0625rem" />
          </button>
        </div>
      </div>

      {/* The rail spans the whole screen at any width; its side padding (--edge)
          lines the cards up with the page's content column, which stops at
          132rem, and the vertical padding leaves room for focus rings and, below
          (taken back by the negative margin), for the focus card's glow to fade out. */}
      <div className="relative z-[1] mt-7 lg:mt-11" data-reveal>
        <ol
          ref={rail}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={(e) => {
            if (!swallowClick.current) return;
            e.preventDefault();
            e.stopPropagation();
          }}
          data-jump={jumping || undefined}
          aria-label={t.title}
          className={`visit-rail flex cursor-grab select-none gap-3 overflow-x-auto px-[var(--edge)] pb-14 pt-3 -mb-11 [--edge:1.25rem] [scroll-padding-inline:var(--edge)] [scrollbar-width:none] sm:[--edge:2rem] lg:gap-5 lg:[--edge:max(5vw,calc((100%-132rem)/2+5vw))] [&::-webkit-scrollbar]:hidden ${
            dragging ? "cursor-grabbing" : ""
          }`}
        >
          {loop.map((i, k) => {
            const v = t.list[i];
            const copy = k < total || k >= total * 2;
            const on = k === abs;
            return (
              <li
                key={k}
                aria-hidden={copy || undefined}
                data-on={on || undefined}
                className="w-[80%] shrink-0 sm:w-[46%]"
              >
                <button
                  type="button"
                  tabIndex={copy ? -1 : undefined}
                  onClick={() => setViewing(i)}
                  aria-label={`${t.enlarge}: ${v.name}`}
                  className="visit-card group relative block aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] bg-block text-left ring-1 ring-line"
                >
                  <Image
                    src={photos.visits[i]}
                    alt={copy ? "" : `${v.name}: ${v.theme}`}
                    fill
                    draggable={false}
                    sizes="(min-width:1024px) 50vw, (min-width:640px) 46vw, 80vw"
                    className="pointer-events-none object-cover group-hover:scale-[1.04]"
                  />
                  <span aria-hidden className="visit-wash pointer-events-none absolute inset-0" />
                  <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(34_14_52/0.35),rgb(34_14_52/0)_30%,rgb(34_14_52/0)_45%,rgb(34_14_52/0.9))]" />
                  <span className="absolute left-5 top-5 flex items-center gap-3 font-display text-lg tabular-nums text-[#E2C985] lg:left-6 lg:top-6">
                    {pad(i + 1)}
                    <span aria-hidden className="h-px w-8 bg-[linear-gradient(90deg,#E2C985,transparent)] opacity-70" />
                  </span>
                  <span
                    aria-hidden
                    className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-[rgb(34_14_52/0.45)] text-white ring-1 ring-white/25 transition-[background-color,color,scale] duration-500 ease-[var(--ease-spring)] group-hover:scale-110 group-hover:bg-sun group-hover:text-sun-ink lg:right-5 lg:top-5 lg:size-10"
                  >
                    <ArrowsOut size="0.95rem" />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 p-5 text-white lg:p-7">
                    <span className="block max-w-[24ch] font-display text-[1.625rem] leading-[1.08] lg:text-[clamp(1.625rem,2vw,2.125rem)]">{v.name}</span>
                    <span className="mt-1.5 block text-sm leading-snug text-white/80 lg:text-base">{v.theme}</span>
                    {/* The focus timer: when the line is full, the next card. */}
                    {on && (
                      <span aria-hidden className="mt-4 block h-0.5 overflow-hidden rounded-full bg-white/20 lg:mt-5">
                        <span
                          className="visit-timer block h-full origin-left rounded-full bg-sun"
                          style={{ animationDuration: `${FOCUS_MS}ms`, animationPlayState: running ? "running" : "paused" }}
                          onAnimationEnd={() => go(abs + 1)}
                        />
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <Lightbox
        items={photos.visits.map((src, i) => ({ src, title: t.list[i].name, subtitle: t.list[i].theme }))}
        index={viewing}
        onIndex={setViewing}
        labels={{ label: t.title, close: t.close, prev: t.prev, next: t.next }}
      />
    </section>
  );
}
