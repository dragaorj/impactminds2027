"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MusicNotes, Pause, Play, X } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import Image from "next/image";
import { photos, speakers } from "@/lib/site";
import Art from "./Art";
import { burstConfetti } from "./confetti";
import { scrollToTarget } from "./scrollTarget";
import { prefersReducedMotion } from "./prefs";

gsap.registerPlugin(Draggable, InertiaPlugin);

type T = Dict["numbers"];
// The two bits of the page's copy the trailer borrows.
export type ShowCopy = Pick<Dict, "survey" | "connections">;

const RING_TICKS = 60;

// Faces for the "voices" wall and photos for the scattered prints.
const FACES = speakers.flatMap((s) => (s.photo ? [s.photo] : [])).slice(0, 12);
// In stacking order (later ones lie on top): the members' dinner, the
// closing party, the forest visit, the talk, the opening cocktail.
const PRINTS = [photos.events[0], photos.events[2], photos.visits[6], photos.visits[2], photos.events[1]];
// Where each print lands (centre in %, turn in degrees), above the title.
const PRINT_SPOTS = [
  { x: 17, y: 28, r: -8 },
  { x: 51, y: 18, r: 2 },
  { x: 84.5, y: 59, r: 5 },
  { x: 40, y: 63.5, r: 3 },
  { x: 68, y: 31, r: -3 },
];

// After the trailer is closed by a scroll, the rest of that gesture (a
// trackpad's or a phone's momentum) would carry the page past the numbers;
// swallow scrolling for a moment so it lands there, just as "Skip" does.
function holdScroll(ms: number) {
  const stop = (e: Event) => e.preventDefault();
  const keys = (e: KeyboardEvent) => ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "End", "Home"].includes(e.key) && e.preventDefault();
  window.addEventListener("wheel", stop, { passive: false });
  window.addEventListener("touchmove", stop, { passive: false });
  window.addEventListener("keydown", keys);
  window.setTimeout(() => {
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchmove", stop);
    window.removeEventListener("keydown", keys);
  }, ms);
}

// Jump to a chapter (forwards or back) and play on from its start.
function goToChapter(t1: gsap.core.Timeline, starts: number[], i: number) {
  if (i < 0 || i >= starts.length) return;
  t1.seek(starts[i]).play();
}

// A short trailer of Impact Minds 2026, started by the hero CTA (event
// "im:numbers-show") while the page scrolls to the numbers. It does not
// repeat the page: six quick beats (Manaus, the voices, the four connections,
// the moments, the wish to come back, thank you) over an opaque overlay
// (portal on body), about 25 seconds, ending in a soft confetti burst and an
// invitation to keep exploring. The timeline at the bottom shows the
// chapters; any can be picked (or ← →) to jump there and back. "Skip" or Esc
// ends it; with reduced motion it never plays. Only opacity and transforms
// animate.
export default function NumbersShow({ t, show, locale }: { t: T; show: ShowCopy; locale: string }) {
  const root = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const confetti = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  // Chapters (one per scene): where each starts on the timeline, the gold fill
  // of each segment (set straight on the DOM every frame) and the current one.
  const starts = useRef<number[]>([]);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const [chapter, setChapter] = useState(0);
  // Fetch the trailer's photos (at the sizes it uses) shortly after the page
  // loads, so a click starts it with everything already cached.
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setWarm(true), 2500);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onShow = () => {
      if (prefersReducedMotion()) return;
      tl.current?.kill();
      setActive(true);
    };
    window.addEventListener("im:numbers-show", onShow);
    return () => window.removeEventListener("im:numbers-show", onShow);
  }, []);

  // The background music, paused or resumed from beside "Skip" (MusicPlayer
  // listens for "im:music-toggle" and reports back with "im:music-state").
  const [musicOn, setMusicOn] = useState(false);
  useEffect(() => {
    if (!active) return;
    const sync = (e: Event) => setMusicOn((e as CustomEvent<boolean>).detail);
    const id = window.setTimeout(() => setMusicOn((window as Window & { __imMusicPlaying?: boolean }).__imMusicPlaying === true), 0);
    window.addEventListener("im:music-state", sync);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("im:music-state", sync);
    };
  }, [active]);

  const back = show.survey.scores[0].value;
  const words = show.connections.items.map((c) => c.title);

  useEffect(() => {
    if (!active) return;
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const grid = anchor.current?.parentElement;
    const cards = grid ? [...grid.querySelectorAll<HTMLElement>(":scope > :not([data-show-anchor])")] : [];
    const panel = q(".show-panel");
    let stopConfetti = () => {};
    const back = show.survey.scores[0].value;
    const words = show.connections.items.map((c) => c.title);

    const count = (sel: string, to: number, decimals = 0) => {
      const node = q(sel)[0] as HTMLElement | undefined;
      const o = { n: 0 };
      return gsap.to(o, {
        n: to,
        duration: 1.6,
        ease: "expo.out",
        onUpdate: () => {
          if (node) node.textContent = o.n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        },
      });
    };
    const scene = (n: number) => q(`.show-${n}`);
    const rise = (n: number) => q(`.show-${n} .show-rise`);
    const leave = (n: number, at: string) => t1.to(scene(n), { autoAlpha: 0, y: -24, duration: 0.45, ease: "power2.in" }, at);

    // Once finishing, the cards' own rise (below) owns their opacity and
    // clears it when done; the unmount must not reset it halfway (a blink).
    let finishing = false;
    const finish = () => {
      finishing = true;
      // Always land on the section, whatever happened to the scroll meanwhile.
      const numbers = document.getElementById("numeros");
      if (numbers) scrollToTarget(numbers);
      gsap.to(panel, { y: -20, duration: 0.6, ease: "power2.in" });
      gsap.to(el, {
        autoAlpha: 0,
        duration: 0.6,
        ease: "power2.in",
        onComplete: () => {
          // Land on the section once more, in case a scroll moved the page.
          if (numbers) scrollToTarget(numbers, { immediate: true });
          setActive(false);
        },
      });
      gsap.fromTo(
        cards,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, stagger: 0.07, ease: "expo.out", delay: 0.35, clearProps: "transform,opacity" },
      );
    };

    gsap.set(cards, { opacity: 0 });
    gsap.set(q(".show-scene"), { autoAlpha: 0 });
    gsap.set(q(".show-art [pathLength]"), { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(q(".show-tick"), { opacity: 0 });
    gsap.set(q(".show-word"), { yPercent: 110 });

    const t1 = gsap.timeline({ onComplete: finish });
    tl.current = t1;
    t1.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" })
      // Once the overlay covers the page, jump to the section underneath (no
      // smooth scroll competing with the animation).
      .add(() => {
        const sec = document.getElementById("numeros");
        if (!sec) return;
        window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
        // The section's own entrances (ScrollFx) would otherwise still play
        // as the overlay lifts, making the cards blink: settle them now,
        // unseen, so only the cards' single rise below is left.
        const reveals = sec.querySelectorAll<HTMLElement>("[data-reveal]");
        reveals.forEach((r) => r.setAttribute("data-revealed", ""));
        gsap.killTweensOf(reveals);
        gsap.set(reveals, { opacity: 1, y: 0, clearProps: "transform" });
      })
      .fromTo(panel, { y: 30, scale: 0.97 }, { y: 0, scale: 1, duration: 0.7, ease: "expo.out" }, "<")
      // 1 · Manaus: the community photo eases in, the skyline draws itself and
      // the people count up.
      .addLabel("c0")
      .to(scene(1), { autoAlpha: 1, duration: 0.3 })
      .fromTo(q(".show-kb"), { scale: 1.15 }, { scale: 1, duration: 3.6, ease: "power1.out" }, "<")
      .to(q(".show-art [pathLength]"), { strokeDashoffset: 0, duration: 1.6, stagger: 0.015, ease: "power2.inOut" }, "<")
      .fromTo(rise(1), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "expo.out" }, "<0.1")
      .add(count(".show-580", 580), "<");
    leave(1, "+=0.9")
      // 2 · Voices: two rows of speakers' faces glide past in opposite
      // directions under the line.
      .addLabel("c1")
      .to(scene(2), { autoAlpha: 1, duration: 0.3 })
      .fromTo(rise(2), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "expo.out" }, "<")
      .fromTo(q(".show-faces-a"), { xPercent: 0 }, { xPercent: -10, duration: 4, ease: "none" }, "<0.1")
      .fromTo(q(".show-faces-b"), { xPercent: -10 }, { xPercent: 0, duration: 4, ease: "none" }, "<")
      // The faces show in full almost at once; only the glide is slow.
      .fromTo(q(".show-faces-a, .show-faces-b"), { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }, "<");
    leave(2, "-=0.5")
      // 3 · Connections: "we connected" and the four key words in four equal
      // steps (STEP each): a word rises out of its mask, its marker fills for
      // the whole step, and it leaves just as the step ends. The scene closes
      // the moment the fourth marker is full.
      .addLabel("c2")
      .to(scene(3), { autoAlpha: 1, duration: 0.3 })
      .fromTo(rise(3), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "expo.out" }, "<");
    const STEP = 1.4;
    const first = 0.4;
    const at = (s: number) => `c2+=${s}`;
    t1.fromTo(q(".show-kb3"), { scale: 1.1 }, { scale: 1, duration: first + words.length * STEP, ease: "power1.out" }, "c2");
    words.forEach((_, i) => {
      const word = q(`.show-word-${i}`);
      const start = first + i * STEP;
      t1.to(word, { yPercent: 0, duration: 0.6, ease: "expo.out" }, at(start)).fromTo(
        q(`.show-mark-${i}`),
        { scaleX: 0 },
        { scaleX: 1, duration: STEP, ease: "none" },
        at(start),
      );
      if (i < words.length - 1) t1.to(word, { yPercent: -110, duration: 0.4, ease: "power2.in" }, at(start + STEP - 0.4));
    });
    leave(3, at(first + words.length * STEP))
      // 4 · Moments: prints from the evenings and the field visits are dealt
      // across the screen around the line, then drift. (The chapter turns as
      // the connections close.)
      .addLabel("c3", "<")
      .to(scene(4), { autoAlpha: 1, duration: 0.3, onStart: () => gsap.set(q(".show-drag"), { x: 0, y: 0 }) })
      .fromTo(rise(4), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "expo.out" }, "<")
      .fromTo(
        q(".show-print"),
        { y: 120, rotate: 0, scale: 0.7, opacity: 0 },
        { y: 0, rotate: (i: number) => PRINT_SPOTS[i].r, scale: 1, opacity: 1, duration: 0.9, stagger: 0.18, ease: "back.out(1.4)" },
        "<0.2",
      )
      .to(q(".show-print"), { y: -14, duration: 2.6, ease: "sine.inOut", stagger: 0.1 }, ">-0.2");
    leave(4, "+=0.1")
      // 5 · Coming back: the ring lights up to the score while it counts.
      .addLabel("c4")
      .to(scene(5), { autoAlpha: 1, duration: 0.3 })
      .fromTo(q(".show-kb5"), { scale: 1.1 }, { scale: 1, duration: 3.6, ease: "power1.out" }, "<")
      .fromTo(rise(5), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "expo.out" }, "<")
      .to(q(".show-5 .show-tick"), { opacity: 1, duration: 0.2, stagger: 0.022, ease: "none" }, "<0.2")
      .add(count(".show-back", back, 1), "<");
    leave(5, "+=1")
      // 6 · Thank you, word by word, the invitation to Cartagena, confetti,
      // and a nudge to keep exploring the page.
      .addLabel("c5")
      .to(scene(6), { autoAlpha: 1, duration: 0.3 })
      .fromTo(q(".show-6 .show-glow4"), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: "expo.out" }, "<")
      .fromTo(q(".show-6 .show-star"), { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.9, ease: "back.out(2)" }, "<")
      .fromTo(q(".show-thanks"), { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.07, ease: "expo.out" }, "<0.15")
      .fromTo(q(".show-6 .show-sub"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out" }, "-=0.4")
      .add(() => {
        stopConfetti();
        if (confetti.current) stopConfetti = burstConfetti(confetti.current);
      }, "-=0.5")
      .fromTo(q(".show-explore"), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out" }, "+=0.6")
      .to({}, { duration: 2.8 });

    // Each chapter's segment fills gold as its scene plays; the bullets show
    // where the trailer is.
    starts.current = t.chapters.map((_, i) => t1.labels[`c${i}`]);
    const ends = [...starts.current.slice(1), t1.duration()];
    let current = -1;
    // Puts every print back where it was dealt (set once the prints exist).
    let tidy = (smooth: boolean) => void smooth;
    const paint = () => {
      const now = t1.time();
      starts.current.forEach((s, i) => {
        const fill = fills.current[i];
        if (fill) fill.style.transform = `scaleX(${gsap.utils.clamp(0, 1, (now - s) / (ends[i] - s))})`;
      });
      const at = Math.max(0, starts.current.findLastIndex((s) => now >= s));
      if (at !== current) {
        current = at;
        tidy(false);
        // Past the faces, back to full speed (a hover may not have ended).
        if (at !== 1 && t1.timeScale() !== 1) {
          gsap.killTweensOf(t1);
          t1.timeScale(1);
        }
        setChapter(at);
      }
    };
    t1.eventCallback("onUpdate", paint);
    paint();

    // The prints can be picked up and thrown anywhere on the screen, never
    // past its edges (bounds: the overlay itself; Inertia carries the throw
    // and stops it at the edge). The trailer holds still while a print is in
    // hand and plays on a moment after it lands.
    let resume = 0;
    const hold = () => {
      window.clearTimeout(resume);
      t1.pause();
    };
    const letGo = (ms: number) => {
      window.clearTimeout(resume);
      resume = window.setTimeout(() => t1.play(), ms);
    };
    // Bounds: the whole screen less a margin, so a tilted print and its
    // shadow stay fully in view (in the coordinates of the prints' box).
    const screenBounds = (node: HTMLElement) => {
      const box = node.parentElement!.getBoundingClientRect();
      const pad = 28;
      return { left: pad - box.left, top: pad - box.top, width: window.innerWidth - pad * 2, height: window.innerHeight - pad * 2 };
    };
    const drags = Draggable.create(q(".show-drag"), {
      type: "x,y",
      bounds: screenBounds(q(".show-drag")[0] as HTMLElement),
      inertia: true,
      edgeResistance: 0.9,
      zIndexBoost: true,
      onPress(this: Draggable) {
        this.applyBounds(screenBounds(this.target as HTMLElement));
        hold();
      },
      onRelease: () => letGo(2200),
      onThrowComplete: () => letGo(1200),
    });

    // The prints always arrive neatly dealt, and anything else the visitor
    // does (a new chapter, the wheel, a key, resizing, a tap away from them)
    // glides them back into place.
    const prints = q(".show-drag");
    tidy = (smooth) => {
      gsap.killTweensOf(prints, "x,y");
      gsap.to(prints, { x: 0, y: 0, duration: smooth ? 0.9 : 0, ease: "expo.out", onComplete: () => drags.forEach((d) => d.update()) });
    };
    const tidyNow = () => tidy(true);
    const onTapAway = (e: PointerEvent) => {
      if (!(e.target as Element).closest(".show-drag")) tidy(true);
    };
    const panelEl = panel[0] as HTMLElement;
    // A mouse resting on the faces eases the trailer to a crawl (never a
    // full stop), so the rows barely drift while the visitor looks; it picks
    // up again on leave.
    const faces = q(".show-faces")[0] as HTMLElement | undefined;
    const slow = (e: PointerEvent) => e.pointerType === "mouse" && gsap.to(t1, { timeScale: 0.08, duration: 0.8, ease: "power2.out", overwrite: true });
    const normal = () => gsap.to(t1, { timeScale: 1, duration: 0.6, ease: "power2.inOut", overwrite: true });
    faces?.addEventListener("pointerenter", slow);
    faces?.addEventListener("pointerleave", normal);
    panelEl.addEventListener("wheel", tidyNow, { passive: true });
    panelEl.addEventListener("pointerdown", onTapAway);
    window.addEventListener("keydown", tidyNow);
    window.addEventListener("resize", tidyNow);

    // On the last chapter, which invites the visitor to keep exploring, any
    // attempt to scroll (wheel either way, a swipe, scroll keys) does exactly
    // what "Skip" does.
    const onLast = () => current === t.chapters.length - 1;
    const close = () => {
      if (finishing || !onLast()) return;
      holdScroll(1400);
      t1.progress(1);
    };
    const onWheelClose = (e: WheelEvent) => {
      if (finishing || !onLast()) return;
      e.preventDefault();
      close();
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (finishing || !onLast() || Math.abs(touchY - e.touches[0].clientY) < 30) return;
      e.preventDefault();
      close();
    };
    const onKeyClose = (e: KeyboardEvent) => ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "End", "Home"].includes(e.key) && close();
    window.addEventListener("wheel", onWheelClose, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyClose);

    return () => {
      t1.kill();
      drags.forEach((d) => d.kill());
      panelEl.removeEventListener("wheel", tidyNow);
      faces?.removeEventListener("pointerenter", slow);
      faces?.removeEventListener("pointerleave", normal);
      panelEl.removeEventListener("pointerdown", onTapAway);
      window.removeEventListener("keydown", tidyNow);
      window.removeEventListener("resize", tidyNow);
      window.removeEventListener("wheel", onWheelClose);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyClose);
      window.clearTimeout(resume);
      stopConfetti();
      if (!finishing) gsap.set(cards, { clearProps: "opacity,transform" });
    };
  }, [active, locale, show, t.chapters]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") tl.current?.progress(1);
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const t1 = tl.current;
        if (!t1) return;
        const at = Math.max(0, starts.current.findLastIndex((s) => t1.time() >= s));
        goToChapter(t1, starts.current, at + (e.key === "ArrowRight" ? 1 : -1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Pointer position as CSS variables (rAF-throttled): -1..1 for parallax,
  // pixels for the cursor glow.
  const frame = useRef(0);
  const onPanelMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      el.style.setProperty("--px", ((clientX / w) * 2 - 1).toFixed(3));
      el.style.setProperty("--py", ((clientY / h) * 2 - 1).toFixed(3));
      el.style.setProperty("--gx", `${clientX}px`);
      el.style.setProperty("--gy", `${clientY}px`);
    });
  };

  const skip = () => {
    const t1 = tl.current;
    if (!t1) return;
    t1.progress(1);
  };

  const anchorEl = (
    <span ref={anchor} data-show-anchor hidden>
      {warm &&
        [
          [photos.numbersHero, "68rem"],
          [photos.gallery[2], "100vw"],
          ["/photos/editions/2026/08.jpg", "100vw"],
          ...PRINTS.map((src) => [src, "(min-width:640px) 18rem, 40vw"]),
          ...FACES.map((src) => [src, "8rem"]),
        ].map(([src, sizes], i) => <Image key={`${src}-${i}`} src={src} alt="" width={16} height={16} sizes={sizes} loading="eager" />)}
    </span>
  );
  if (!active) return anchorEl;

  const sceneBox = "show-scene absolute inset-0 grid grid-cols-1 place-items-center overflow-hidden px-5 pb-32 pt-20 sm:px-8 sm:pb-36 sm:pt-24";
  const lit = Math.round((back / 10) * RING_TICKS);
  const faceRow = (cls: string, list: string[]) => (
    <div className={`${cls} flex w-max gap-3 sm:gap-4`}>
      {[...list, ...list].map((src, i) => (
        <div key={i} className="relative size-24 shrink-0 overflow-hidden rounded-full show-card-line sm:size-32">
          <Image src={src} alt="" fill sizes="8rem" className="scale-[1.2] object-cover object-[50%_30%]" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      {anchorEl}
      {createPortal(
    <div
      ref={root}
      role="dialog"
      aria-label={t.title}
      className="invisible fixed inset-0 z-[85] show-root"
      aria-live="polite"
    >
      {/* Full screen, no frame: the scenes sit straight on an opaque overlay (cream in light mode, purple in dark). */}
      <div className="show-panel relative size-full overflow-hidden" onPointerMove={onPanelMove}>
        {/* Soft gold light that follows the cursor. */}
        <span aria-hidden className="show-glow pointer-events-none absolute inset-0 z-[1]" />
        {/* The closing confetti, above the scenes and under the controls. */}
        <canvas ref={confetti} aria-hidden className="pointer-events-none absolute inset-0 z-[5] size-full" />

      {/* Top right, out of the scenes' way: pause or resume the music, and skip. */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-8 sm:top-8">
        {/* The music: a note with a small pause (or play) badge, so it never
            reads as pausing the presentation. */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("im:music-toggle"))}
          aria-pressed={!musicOn}
          className="group relative grid size-11 place-items-center rounded-full show-chip transition-colors hover:bg-sun hover:text-sun-ink"
        >
          <MusicNotes size="1.25rem" />
          <span aria-hidden className="absolute -bottom-0.5 -right-0.5 grid size-[1.125rem] place-items-center rounded-full bg-sun text-sun-ink shadow-[0_2px_6px_rgb(0_0_0/0.3)]">
            {musicOn ? <Pause size="0.5625rem" weight="fill" /> : <Play size="0.5625rem" weight="fill" />}
          </span>
          <span className="sr-only">{musicOn ? t.teaser.musicPause : t.teaser.musicPlay}</span>
        </button>
        <button
          type="button"
          onClick={skip}
          className="flex h-11 items-center gap-2 rounded-full show-chip pl-4 pr-2 text-sm transition-colors hover:bg-sun hover:text-sun-ink"
        >
          {t.skip}
          <span className="grid size-7 place-items-center rounded-full show-chip">
            <X size="0.875rem" />
          </span>
        </button>
      </div>

      {/* Bottom bar: the chapters (one per scene) as a timeline of bullets and
          segments that fill gold as each scene plays; any of them can be picked
          to jump there, forwards or back (also ← →). Below sm only the current
          chapter's name shows, above the line. */}
      <nav aria-label={t.chaptersLabel} className="absolute inset-x-0 bottom-6 z-10 mx-auto w-[min(56rem,90vw)] sm:bottom-9">
        <p className="mb-3 text-center text-sm show-fig sm:hidden" aria-hidden>
          {t.chapters[chapter]}
        </p>
        <ol className="flex w-full gap-2 sm:gap-3">
          {t.chapters.map((label, i) => {
            const state = i < chapter ? "done" : i === chapter ? "now" : "next";
            return (
              <li key={label} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => tl.current && goToChapter(tl.current, starts.current, i)}
                  aria-current={state === "now" ? "step" : undefined}
                  aria-label={label}
                  className="group flex w-full flex-col items-start gap-2.5 py-2 text-left outline-none"
                >
                  <span className="flex w-full items-center gap-2">
                    <span
                      aria-hidden
                      className={`relative size-2.5 shrink-0 rounded-full transition-[background-color,box-shadow,scale] duration-500 ease-[var(--ease-spring)] group-hover:scale-125 group-focus-visible:scale-125 sm:size-3 ${
                        state === "next"
                          ? "show-muted shadow-[inset_0_0_0_1.5px_currentColor]"
                          : state === "now"
                            ? "bg-sun shadow-[0_0_0_5px_rgb(217_184_101/0.2)]"
                            : "bg-sun"
                      }`}
                    />
                    <span aria-hidden className="relative h-[2px] flex-1 overflow-hidden rounded-full show-tick-track">
                      <span
                        ref={(node) => {
                          fills.current[i] = node;
                        }}
                        style={{ transform: "scaleX(0)" }}
                        className="absolute inset-0 origin-left rounded-full bg-sun"
                      />
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`hidden max-w-full truncate text-[0.8125rem] leading-tight transition-[color,opacity] duration-300 sm:block ${
                      state === "now" ? "show-fig font-medium" : "show-muted opacity-75 group-hover:opacity-100 group-focus-visible:opacity-100"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* 1 · Manaus */}
      <div className="show-scene show-1 absolute inset-0 flex flex-col items-center p-6 pt-[15dvh]">
        <Image src={photos.numbersHero} alt="" fill sizes="68rem" className="show-kb par-far object-cover object-[50%_40%] show-bgphoto [--o:0.45]" />
        <span aria-hidden className="absolute inset-0 show-wash-1" />
        <Art name="skyline" className="show-art par-mid pointer-events-none absolute inset-x-0 bottom-[9.5rem] mx-auto sm:bottom-[max(9dvh,7rem)] w-[min(56rem,82%)] !opacity-35 [color:var(--sun)]" />
        <div className="relative text-center">
          <p className="show-rise mx-auto w-max rounded-full show-chip px-4 py-1.5 text-sm">Connecting Us · {t.place}</p>
          <p className="show-rise show-580 show-hot par-near mt-4 font-display text-[clamp(6rem,17vw,14rem)] leading-none show-fig tabular-nums">0</p>
          <p className="show-rise mt-2 text-2xl show-muted md:text-4xl">{t.participants}</p>
        </div>
      </div>

      {/* 2 · Voices: the line over two rows of faces gliding apart. */}
      <div className={`${sceneBox} show-2`}>
        <span aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgb(217_184_101/0.12),transparent_65%)]" />
        <div className="relative w-full">
          <div className="text-center">
            <p className="show-rise mx-auto max-w-[16ch] text-balance font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.02]">{t.teaser.voices}</p>
            <p className="show-rise mx-auto mt-4 max-w-[44ch] text-balance text-base show-muted sm:text-lg">{t.teaser.voicesSub}</p>
          </div>
          <div className="show-faces mt-8 flex flex-col gap-3 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] sm:mt-12 sm:gap-4">
            {faceRow("show-faces-a", FACES)}
            {faceRow("show-faces-b", [...FACES.slice(6), ...FACES.slice(0, 6)])}
          </div>
        </div>
      </div>

      {/* 3 · Connections: one word at a time, in the site's display type. */}
      <div className={`${sceneBox} show-3`}>
        <Image src={photos.gallery[2]} alt="" fill sizes="100vw" className="show-kb3 par-far object-cover show-bgphoto [--o:0.22]" />
        <span aria-hidden className="absolute inset-0 show-wash-1" />
        <div className="relative text-center">
          <p className="show-rise mx-auto w-max rounded-full show-chip px-4 py-1.5 text-sm">Connecting Us</p>
          <p className="show-rise mt-6 text-2xl show-muted sm:text-4xl">{t.teaser.connect}</p>
          <div className="relative mt-1 h-[clamp(4.25rem,13vw,10rem)] w-[min(90vw,60rem)] overflow-hidden">
            {words.map((w, i) => (
              <span
                key={w}
                className={`show-word show-word-${i} absolute inset-x-0 top-0 block font-display text-[clamp(3.5rem,11vw,8.5rem)] leading-[1.15] show-fig`}
              >
                {w}
              </span>
            ))}
          </div>
          <div aria-hidden className="show-rise mx-auto mt-6 flex w-[min(20rem,70vw)] gap-2">
            {words.map((w, i) => (
              <span key={w} className="relative h-[3px] flex-1 overflow-hidden rounded-full show-tick-track">
                <span className={`show-mark-${i} absolute inset-0 origin-left scale-x-0 rounded-full bg-sun`} />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4 · Moments: prints dealt around the line. */}
      <div className={`${sceneBox} show-4`}>
        <div className="relative size-full">
          {/* Each print sits in a wrapper that Draggable moves (x, y), while the
              print inside keeps the timeline's own turn, scale and drift. */}
          {PRINTS.map((src, i) => (
            <div
              key={src}
              className="show-drag absolute w-[42%] -translate-x-1/2 -translate-y-1/2 touch-none select-none sm:w-[24%]"
              style={{ left: `${PRINT_SPOTS[i].x}%`, top: `${PRINT_SPOTS[i].y}%` }}
            >
              <div className="show-print rounded-[1.1rem] bg-[#fbfaf8] p-1.5 pb-5 shadow-[0_24px_60px_rgb(0_0_0/0.35)] sm:rounded-[1.4rem] sm:p-2 sm:pb-7">
                <div className="pointer-events-none relative aspect-[4/3] overflow-hidden rounded-[0.8rem] sm:rounded-[1rem]">
                  <Image src={src} alt="" fill draggable={false} sizes="(min-width:640px) 18rem, 40vw" className="object-cover" />
                </div>
              </div>
            </div>
          ))}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] text-center">
            <p className="show-rise mx-auto max-w-[18ch] text-balance font-display text-[clamp(2.25rem,6vw,4.75rem)] leading-[1.02] [text-shadow:0_4px_30px_rgb(28_11_44/0.5)]">{t.teaser.moments}</p>
            <p className="show-rise mx-auto mt-3 max-w-[46ch] text-balance text-sm show-muted sm:text-lg">{t.teaser.momentsSub}</p>
          </div>
        </div>
      </div>

      {/* 5 · Coming back: a tick ring lit to the score. */}
      <div className={`${sceneBox} show-5`}>
        <Image src="/photos/editions/2026/08.jpg" alt="" fill sizes="100vw" className="show-kb5 par-far object-cover object-[50%_55%] show-bgphoto [--o:0.25]" />
        <span aria-hidden className="absolute inset-0 show-wash-2" />
        <div className="relative flex flex-col items-center text-center">
          <div className="show-rise show-hot relative grid size-56 place-items-center sm:size-72 lg:size-80">
            <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full -rotate-90">
              {Array.from({ length: RING_TICKS }, (_, i) => (
                <line
                  key={i}
                  x1="84"
                  y1="50"
                  x2={i % 5 === 0 ? "96" : "93"}
                  y2="50"
                  transform={`rotate(${(i * 360) / RING_TICKS} 50 50)`}
                  strokeWidth={i % 5 === 0 ? 1.6 : 1}
                  strokeLinecap="round"
                  className={i < lit ? "show-tick stroke-sun" : "show-track"}
                />
              ))}
            </svg>
            <p className="flex items-baseline gap-1">
              <span className="show-back font-display text-[clamp(4rem,10vw,6.5rem)] leading-none tabular-nums show-fig">
                {(0).toLocaleString(locale, { minimumFractionDigits: 1 })}
              </span>
              <span className="text-lg show-muted sm:text-2xl">/10</span>
            </p>
          </div>
          <p className="show-rise mt-6 max-w-[22ch] text-balance font-display text-[clamp(1.6rem,3.6vw,2.75rem)] leading-[1.1]">{t.teaser.back}</p>
        </div>
      </div>

      {/* 6 · Thank you, over a soft gold light; confetti on the canvas above. */}
      <div className="show-scene show-6 absolute inset-0 grid place-items-center p-6 pb-32">
        <span aria-hidden className="show-glow4 pointer-events-none absolute left-1/2 top-1/2 size-[min(48rem,120vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(217_184_101/0.22),transparent_62%)]" />
        <div className="relative mx-auto w-full max-w-[60rem] text-center">
          {/* Four-point sparkle, like the ornaments around "MINDS" on the banner. */}
          <svg aria-hidden viewBox="0 0 24 24" className="show-star mx-auto size-8 fill-current show-fig sm:size-10">
            <path d="M12 0c.9 6.4 5 10.6 12 12-7 1.4-11.1 5.6-12 12-.9-6.4-5-10.6-12-12C7 10.6 11.1 6.4 12 0Z" />
          </svg>
          <p className="mt-6 text-balance font-display text-[clamp(2.4rem,6.5vw,5.75rem)] leading-[1.04]">
            {t.thanks.split(" ").map((w, i) => (
              <span key={i}>
                {i > 0 && " "}
                <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <span className="show-thanks inline-block">{w}</span>
                </span>
              </span>
            ))}
          </p>
          <p className="show-sub mt-5 font-display text-[clamp(1.4rem,3.2vw,2.75rem)] show-fig">{t.thanksSub}</p>
          {/* A quiet nudge, not a button: the words over a little mouse whose
              gold wheel rolls down, and two chevrons lighting up in turn. */}
          <div className="show-explore mx-auto mt-10 flex flex-col items-center gap-3.5">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.22em] show-muted sm:text-xs">{t.teaser.explore}</p>
            <span aria-hidden className="flex flex-col items-center gap-1.5">
              <span className="relative block h-10 w-6 rounded-full shadow-[inset_0_0_0_1.5px_currentColor] show-muted">
                <span className="absolute left-1/2 top-2 h-2 w-1 -translate-x-1/2 animate-[scrollWheel_1.8s_cubic-bezier(0.65,0,0.35,1)_infinite] rounded-full bg-sun" />
              </span>
              <svg viewBox="0 0 12 14" className="h-3.5 w-3 fill-none stroke-sun" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 2l4 4 4-4" className="animate-[scrollChevron_1.8s_ease-in-out_infinite]" />
                <path d="M2 8l4 4 4-4" className="animate-[scrollChevron_1.8s_ease-in-out_0.2s_infinite]" />
              </svg>
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>,
        document.body,
      )}
    </>
  );
}
