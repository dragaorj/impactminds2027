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
// Every load draws a fresh random five; then, every few seconds, the row
// glides one place to the left (a transform only): the first speaker fades
// and shrinks away through the left edge as the next one fades in through the
// right. The row sits in a window exactly five faces wide (.faces-clip), so
// the pill and its text never move or change size.
// The next portrait is fetched ahead in a hidden image, so nothing pops in
// half-loaded. Hovering the pill fans the circles apart (globals.css, .faces);
// each circle shows the speaker's name on hover and, clicked, opens that
// speaker's profile in the speakers section (Speakers listens for
// "im:open-speaker").
// On touch screens a passing tap must not jump away: the first tap only opens
// the pill (data-open: the circles fan out and the conveyor holds still; the
// face being picked takes a gold ring), and a second tap on a face picks that speaker. A tap
// elsewhere, or a few idle seconds, closes it again.
export default function SpeakerFaces({ label }: { label: string }) {
  const root = useRef<HTMLSpanElement>(null);
  // Server and first client render agree on the first five; the shuffle
  // happens right after mount.
  const [{ row, queue }, setFaces] = useState<Faces>({ row: POOL.slice(0, COUNT), queue: POOL.slice(COUNT) });
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const hoverRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
    const pill = root.current?.closest(".faces-pill");
    if (open) pill?.setAttribute("data-open", "");
    else pill?.removeAttribute("data-open");
    if (!open) return;
    const idle = window.setTimeout(() => setOpen(false), 6000);
    return () => window.clearTimeout(idle);
  }, [open]);

  // Touch: the first tap anywhere on the pill only opens it.
  useEffect(() => {
    const pill = root.current?.closest<HTMLElement>(".faces-pill");
    if (!pill) return;
    let pointer = "mouse";
    const onDown = (e: PointerEvent) => {
      pointer = e.pointerType;
    };
    const onClick = (e: MouseEvent) => {
      if (pointer === "mouse" || openRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    };
    const onOutside = (e: PointerEvent) => {
      if (openRef.current && !pill.contains(e.target as Node)) setOpen(false);
    };
    // The conveyor holds still while a mouse is over the pill (it fans out).
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hoverRef.current = true;
    };
    const onLeave = () => {
      hoverRef.current = false;
    };
    pill.addEventListener("pointerenter", onEnter);
    pill.addEventListener("pointerleave", onLeave);
    pill.addEventListener("pointerdown", onDown, true);
    pill.addEventListener("click", onClick, true);
    document.addEventListener("pointerdown", onOutside, true);
    return () => {
      pill.removeEventListener("pointerenter", onEnter);
      pill.removeEventListener("pointerleave", onLeave);
      pill.removeEventListener("pointerdown", onDown, true);
      pill.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerdown", onOutside, true);
    };
  }, []);

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
      if (document.hidden || openRef.current || hoverRef.current || window.scrollY > window.innerHeight) return;
      setFaces((f) => (f.row.length > COUNT || !f.queue.length ? f : { row: [...f.row, f.queue[0]], queue: f.queue.slice(1) }));
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    const track = root.current;
    if (!track) return;
    // Back to five (the leader just dropped): the next one now sits where the
    // slide left it, so the slide resets in the same frame, with no jump.
    if (row.length <= COUNT) {
      gsap.set(track, { x: 0 });
      return;
    }
    const faces = track.querySelectorAll<HTMLElement>(".face");
    const firstIn = faces[0].querySelector<HTMLElement>(".face-in");
    const lastIn = faces[faces.length - 1].querySelector<HTMLElement>(".face-in");
    const step = faces[1].offsetLeft - faces[0].offsetLeft;
    const tl = gsap.timeline({
      onComplete: () => setFaces((f) => ({ row: f.row.slice(1), queue: [...f.queue, f.row[0]] })),
    });
    tl.to(track, { x: -step, duration: 1.2, ease: "power2.inOut" }, 0)
      .to(firstIn, { opacity: 0, scale: 0.6, duration: 0.8, ease: "power2.in" }, 0)
      .fromTo(lastIn, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 1, ease: "power2.out" }, 0.15);
    return () => {
      tl.kill();
    };
  }, [row]);

  return (
    <span className="faces-clip">
    <span ref={root} className="faces flex">
      {row.map((f) => (
        <button
          key={f.name}
          type="button"
          aria-label={`${label} ${f.name}`}
          onClick={() => {
            setOpen(false);
            window.dispatchEvent(new CustomEvent("im:open-speaker", { detail: f.name }));
          }}
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
    </span>
      {/* Warm the cache for the next face in line. */}
      {queue[0] && (
        <span aria-hidden className="pointer-events-none absolute size-px overflow-hidden opacity-0">
          <Image src={queue[0].photo!} alt="" fill sizes={SIZES} />
        </span>
      )}
    </span>
  );
}
