"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { speakers } from "@/lib/site";
import { prefersReducedMotion } from "./prefs";

const COUNT = 5;
const STEP_MS = 3200;
const POOL = speakers.filter((s) => s.photo);
const SIZES = "2rem";
// Overlap between neighbouring circles (globals.css: .faces > .face + .face).
const OVERLAP = 10;

function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Faces = { row: typeof POOL; queue: typeof POOL };

// The overlapping portraits in the hero's speakers pill, as a little conveyor.
// Every load draws a fresh random five; then, every few seconds, a new speaker
// pops in at the end of the row with a springy bounce, pushing the others
// along, while the first one shrinks away. Widths animate in step (the
// newcomer opens as the leaver closes), so the row glides without a jump.
// The next portrait is fetched ahead in a hidden image, so nothing pops in
// half-loaded. Hovering the pill fans the circles apart (globals.css, .faces);
// each circle shows the speaker's name on hover and, clicked, opens that
// speaker's profile in the speakers section (Speakers listens for
// "im:open-speaker").
export default function SpeakerFaces({ label }: { label: string }) {
  const root = useRef<HTMLSpanElement>(null);
  // Server and first client render agree on the first five; the shuffle
  // happens right after mount.
  const [{ row, queue }, setFaces] = useState<Faces>({ row: POOL.slice(0, COUNT), queue: POOL.slice(COUNT) });

  useEffect(() => {
    const order = shuffle(POOL);
    const id = requestAnimationFrame(() => setFaces({ row: order.slice(0, COUNT), queue: order.slice(COUNT) }));
    return () => cancelAnimationFrame(id);
  }, []);

  // Each step adds the next speaker to the end of the row (six on show for a
  // moment); the layout effect below animates the hand-over and drops the first.
  useEffect(() => {
    if (prefersReducedMotion() || POOL.length <= COUNT) return;
    const id = window.setInterval(() => {
      // Paused while the tab is hidden or the hero is scrolled away.
      if (document.hidden || window.scrollY > window.innerHeight) return;
      setFaces((f) => (f.row.length > COUNT || !f.queue.length ? f : { row: [...f.row, f.queue[0]], queue: f.queue.slice(1) }));
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    if (row.length <= COUNT || !root.current) return;
    const faces = root.current.querySelectorAll<HTMLElement>(".face");
    const first = faces[0];
    const last = faces[faces.length - 1];
    // GSAP moves only the slot's width on the button; the shrink, spin and
    // bounce run on the inner circle. The hover hop and scale live on the
    // button (CSS), so the two never fold into each other's transforms.
    const firstIn = first.querySelector<HTMLElement>(".face-in");
    const lastIn = last.querySelector<HTMLElement>(".face-in");
    const size = first.offsetWidth;

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(last, { clearProps: "width" });
        gsap.set(lastIn, { clearProps: "all" });
        // The leaver goes to the back of the queue.
        setFaces((f) => ({ row: f.row.slice(1), queue: [...f.queue, f.row[0]] }));
      },
    });
    // Newcomer: the slot opens while the circle springs in with a bounce.
    tl.fromTo(last, { width: 0 }, { width: size, duration: 0.9, ease: "power2.inOut" }, 0)
      .fromTo(
        lastIn,
        { scale: 0, opacity: 0, rotate: -18 },
        { scale: 1, opacity: 1, rotate: 0, duration: 1.1, ease: "back.out(1.9)" },
        0.15,
      )
      // Leaver: shrinks away as its slot closes; its right margin stands in
      // for the overlap the next circle loses once it becomes first.
      .to(firstIn, { scale: 0, opacity: 0, duration: 0.6, ease: "power2.in" }, 0)
      .to(first, { width: 0, marginRight: OVERLAP, duration: 0.9, ease: "power2.inOut" }, 0);
    return () => {
      tl.kill();
    };
  }, [row]);

  return (
    <span ref={root} className="faces flex">
      {row.map((f) => (
        <button
          key={f.name}
          type="button"
          aria-label={`${label} ${f.name}`}
          onClick={() => window.dispatchEvent(new CustomEvent("im:open-speaker", { detail: f.name }))}
          className="face group/face relative size-7 shrink-0 cursor-pointer rounded-full sm:size-8"
        >
          <span className="face-in absolute inset-0 overflow-hidden rounded-full bg-[#2a1240] ring-2 ring-[#2a1240]">
            <Image src={f.photo!} alt="" fill sizes={SIZES} className="scale-[1.24] object-cover object-[50%_30%]" />
          </span>
          {/* Name tooltip, above the circle. */}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[calc(100%+0.65rem)] left-1/2 z-10 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full bg-[#1c0c2c]/95 px-3 py-1 text-xs font-medium text-white opacity-0 ring-1 ring-white/15 transition-[opacity,translate] duration-300 ease-out group-hover/face:translate-y-0 group-hover/face:opacity-100 group-focus-visible/face:translate-y-0 group-focus-visible/face:opacity-100"
          >
            {f.name}
          </span>
        </button>
      ))}
      {/* Warm the cache for the next face in line. */}
      {queue[0] && (
        <span aria-hidden className="pointer-events-none absolute size-px overflow-hidden opacity-0">
          <Image src={queue[0].photo!} alt="" fill sizes={SIZES} />
        </span>
      )}
    </span>
  );
}
