"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ChatsCircle, PresentationChart, Tree, X } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import Image from "next/image";
import { photos } from "@/lib/site";
import Art from "./Art";
import { prefersReducedMotion } from "./prefs";

type T = Dict["numbers"];

const RING_TICKS = 48;
const PROGRESS_TICKS = 60;
const CARD_TICKS = 30;

// A ring of ticks like the countdown; it lights up gold all the way round as
// the figure counts (decorative, it does not encode a share).
function TickRing() {
  const ticks = (cls: string) =>
    Array.from({ length: RING_TICKS }, (_, i) => (
      <line
        key={i}
        x1="84"
        y1="50"
        x2={i % 4 === 0 ? "96" : "93"}
        y2="50"
        transform={`rotate(${(i * 360) / RING_TICKS} 50 50)`}
        strokeWidth={i % 4 === 0 ? 1.8 : 1.1}
        strokeLinecap="round"
        className={cls}
      />
    ));
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full -rotate-90">
      {ticks("show-track")}
      {ticks("show-tick stroke-sun")}
    </svg>
  );
}

// Short motion presentation of the 2026 figures, started by the hero CTA
// (event "im:numbers-show") while the page scrolls to the numbers. It fills the
// screen on a purple overlay (portal on body), with no frame around it, runs three scenes of about
// eight seconds in all, then fades away and the bento cards settle back in.
// "Skip" or Esc ends it at once; with reduced motion it never plays. Only
// opacity and transforms are animated, and the overlay has no backdrop blur,
// so it stays smooth.
export default function NumbersShow({ t }: { t: T }) {
  const root = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  // Fetch the presentation's photos (at the sizes it uses) shortly after the
  // page loads, so a click starts it with everything already cached.
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

  useEffect(() => {
    if (!active) return;
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const grid = anchor.current?.parentElement;
    const cards = grid ? [...grid.querySelectorAll<HTMLElement>(":scope > :not([data-show-anchor])")] : [];
    const panel = q(".show-panel");

    const count = (sel: string, to: number, prefix = "") => {
      const node = q(sel)[0] as HTMLElement | undefined;
      const o = { n: 0 };
      return gsap.to(o, {
        n: to,
        duration: 1.4,
        ease: "expo.out",
        onUpdate: () => {
          if (node) node.textContent = prefix + Math.round(o.n).toLocaleString();
        },
      });
    };

    const finish = () => {
      // Always land on the section, whatever happened to the scroll meanwhile.
      document.getElementById("numeros")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      gsap.to(panel, { y: -20, duration: 0.6, ease: "power2.in" });
      gsap.to(el, { autoAlpha: 0, duration: 0.6, ease: "power2.in", onComplete: () => setActive(false) });
      gsap.fromTo(
        cards,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, stagger: 0.07, ease: "expo.out", delay: 0.35, clearProps: "transform,opacity" },
      );
    };

    gsap.set(cards, { opacity: 0 });
    gsap.set(q(".show-scene"), { autoAlpha: 0 });
    gsap.set(q(".show-art [pathLength]"), { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(q(".show-card-tick"), { opacity: 0 });
    gsap.set(q(".show-tick"), { opacity: 0 });
    gsap.set(q(".show-art2 [pathLength]"), { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(q(".show-prog"), { opacity: 0 });

    const t1 = gsap.timeline({ onComplete: finish });
    tl.current = t1;
    t1.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" })
      // Once the overlay covers the page, jump to the section underneath (no
      // smooth scroll competing with the animation).
      .add(() => {
        const sec = document.getElementById("numeros");
        if (sec) window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
      })
      .fromTo(panel, { y: 30, scale: 0.97 }, { y: 0, scale: 1, duration: 0.7, ease: "expo.out" }, "<")
      // Scene 1: the community photo eases in, the skyline draws itself and the
      // participants count up.
      .to(q(".show-1"), { autoAlpha: 1, duration: 0.3 })
      .fromTo(q(".show-kb"), { scale: 1.15 }, { scale: 1, duration: 3.4, ease: "power1.out" }, "<")
      .to(q(".show-art [pathLength]"), { strokeDashoffset: 0, duration: 1.6, stagger: 0.015, ease: "power2.inOut" }, "<")
      .fromTo(q(".show-1 .show-rise"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "expo.out" }, "<0.1")
      .add(count(".show-580", 580), "<")
      .to(q(".show-1"), { autoAlpha: 0, y: -24, duration: 0.4, ease: "power2.in" }, "+=0.4")
      // Scene 2: three rings light up while their figures count.
      .to(q(".show-2"), { autoAlpha: 1, duration: 0.3 })
      .fromTo(q(".show-kb2"), { scale: 1.1 }, { scale: 1, duration: 3, ease: "power1.out" }, "<")
      .fromTo(q(".show-2 .show-rise"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "expo.out" }, "<")
      .to(q(".show-2 .show-tick"), { opacity: 1, duration: 0.2, stagger: 0.008, ease: "none" }, "<0.2")
      .add(count(".show-350", 350), "<")
      .add(count(".show-33", 33), "<")
      .add(count(".show-220", 220, "+"), "<")
      .to(q(".show-2"), { autoAlpha: 0, y: -24, duration: 0.4, ease: "power2.in" }, "+=0.3")
      // Scene 3: three photo cards rise, their photos ease out of a zoom, the
      // figures count and the tick meters light up; palms draw at the sides.
      .to(q(".show-3"), { autoAlpha: 1, duration: 0.3 })
      .fromTo(q(".show-card"), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "expo.out" }, "<")
      .fromTo(q(".show-card-img"), { scale: 1.18 }, { scale: 1, duration: 2.6, stagger: 0.12, ease: "power2.out" }, "<")
      .to(q(".show-art2 [pathLength]"), { strokeDashoffset: 0, duration: 1.6, stagger: 0.02, ease: "power2.inOut" }, "<")
      .to(q(".show-card-tick"), { opacity: 1, duration: 0.15, stagger: 0.025, ease: "none" }, "<0.5")
      .add(count(".show-65", 65, "+"), "<")
      .add(count(".show-23", 23), "<")
      .add(count(".show-12", 12), "<")
      .to(q(".show-3"), { autoAlpha: 0, y: -24, duration: 0.4, ease: "power2.in" }, "+=0.7")
      // Scene 4: the thank-you, word by word, then the invitation to Cartagena.
      .to(q(".show-4"), { autoAlpha: 1, duration: 0.3 })
      .fromTo(q(".show-4 .show-glow4"), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: "expo.out" }, "<")
      .fromTo(q(".show-4 .show-star"), { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.9, ease: "back.out(2)" }, "<")
      .fromTo(q(".show-word"), { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.07, ease: "expo.out" }, "<0.15")
      .fromTo(q(".show-4 .show-sub"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out" }, "-=0.4")
      .to({}, { duration: 1.8 });
    // The progress ticks span the whole timeline, after the overlay fades in.
    const span = t1.duration() - 0.45;
    t1.to(q(".show-prog"), { opacity: 1, duration: 0.12, stagger: span / PROGRESS_TICKS, ease: "none" }, 0.45);

    return () => {
      t1.kill();
      gsap.set(cards, { clearProps: "opacity,transform" });
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && tl.current?.progress(1);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Pointer position as CSS variables (rAF-throttled): -1..1 for parallax,
  // pixels for the cursor glow. Cards get their own tilt and spotlight.
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
  const onCardMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    card.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
    card.style.setProperty("--rx", `${((0.5 - y) * 8).toFixed(2)}deg`);
  };
  const onCardLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
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
          ["/photos/editions/2026/08.jpg", "100vw"],
          [photos.gallery[0], "(min-width:1024px) 22rem, (min-width:640px) 33vw, 100vw"],
          [photos.gallery[2], "(min-width:1024px) 22rem, (min-width:640px) 33vw, 100vw"],
          [photos.visits[0], "(min-width:1024px) 22rem, (min-width:640px) 33vw, 100vw"],
        ].map(([src, sizes]) => <Image key={src} src={src} alt="" width={16} height={16} sizes={sizes} loading="eager" />)}
    </span>
  );
  if (!active) return anchorEl;

  const ring = "relative grid size-28 place-items-center sm:size-40 lg:size-56";
  const bars = [
    { cls: "show-65", label: t.sessions, h: 1, photo: photos.gallery[0], icon: ChatsCircle },
    { cls: "show-23", label: t.panels, h: 23 / 65, photo: photos.gallery[2], icon: PresentationChart },
    { cls: "show-12", label: t.fieldVisits, h: 12 / 65, photo: photos.visits[0], icon: Tree },
  ];

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
      {/* Bottom bar: the progress ticks (the site's meter language, lighting up
          gold from the first scene to the last) beside the skip button. */}
      <div className="absolute inset-x-0 bottom-6 z-10 mx-auto flex w-[min(44rem,88vw)] flex-col items-center gap-4 sm:bottom-10 sm:flex-row sm:gap-6">
        <div aria-hidden className="flex h-4 w-full flex-1 items-end justify-between">
          {Array.from({ length: PROGRESS_TICKS }, (_, i) => (
            <span key={i} className={`relative w-[2px] rounded-full show-tick-track ${i % 6 === 0 ? "h-full" : "h-[60%]"}`}>
              <span className="show-prog absolute inset-0 rounded-full bg-sun" />
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={skip}
          className="flex h-11 shrink-0 items-center gap-2 rounded-full show-chip pl-4 pr-2 text-sm transition-colors hover:bg-sun hover:text-sun-ink"
        >
          {t.skip}
          <span className="grid size-7 place-items-center rounded-full show-chip">
            <X size="0.875rem" />
          </span>
        </button>
      </div>

      {/* Scene 1 */}
      <div className="show-scene show-1 absolute inset-0 flex flex-col items-center p-6 pt-[13dvh]">
        <Image src={photos.numbersHero} alt="" fill sizes="68rem" className="show-kb par-far object-cover object-[50%_40%] show-bgphoto [--o:0.45]" />
        <span aria-hidden className="absolute inset-0 show-wash-1" />
        <Art name="skyline" className="show-art par-mid pointer-events-none absolute inset-x-0 bottom-[9.5rem] mx-auto sm:bottom-[max(9dvh,7rem)] w-[min(56rem,82%)] !opacity-35 [color:var(--sun)]" />
        <div className="relative text-center">
          <p className="show-rise mx-auto w-max rounded-full show-chip px-4 py-1.5 text-sm">{t.place}</p>
          <p className="show-rise show-580 show-hot par-near mt-4 font-display text-[clamp(6rem,17vw,14rem)] leading-none show-fig tabular-nums">0</p>
          <p className="show-rise mt-2 text-2xl show-muted md:text-4xl">{t.participants}</p>
        </div>
      </div>

      {/* Scene 2 */}
      <div className="show-scene show-2 absolute inset-0 grid place-items-center p-6">
        <Image src="/photos/editions/2026/08.jpg" alt="" fill sizes="100vw" className="show-kb2 par-far object-cover object-[50%_55%] show-bgphoto [--o:0.3]" />
        <span aria-hidden className="absolute inset-0 show-wash-2" />
        <div className="relative grid grid-cols-3 gap-4 md:gap-20">
          {[
            { cls: "show-350", label: t.organizations },
            { cls: "show-33", label: t.countries },
            { cls: "show-220", label: t.speakers },
          ].map((s) => (
            <div key={s.cls} className="show-rise show-ringwrap par-near flex flex-col items-center text-center">
              <div className={`${ring} show-hot`}>
                <TickRing />
                <span className={`${s.cls} font-display text-2xl leading-none tabular-nums sm:text-4xl lg:text-5xl`}>0</span>
              </div>
              <p className="mt-5 max-w-[16ch] text-sm leading-snug show-muted sm:text-lg">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scene 3 */}
      <div className="show-scene show-3 absolute inset-0 grid place-items-center p-6">
        <Art name="palm" className="show-art2 pointer-events-none absolute bottom-0 left-[3%] hidden h-[42%] !opacity-30 [color:var(--sun)] xl:block" />
        <Art name="palm" className="show-art2 pointer-events-none absolute bottom-0 right-[3%] hidden h-[34%] -scale-x-100 !opacity-25 [color:var(--sun)] xl:block" />
        {/* Three tall photo cards in the bento's language: photo under a purple
            wash, gold icon chip, the figure counting up and a tick meter sized
            against the largest figure (65 sessions = full). On phones they
            stack as three wide, landscape cards instead of narrow columns. */}
        <div className="relative grid w-[min(64rem,100%)] grid-cols-1 gap-3 pb-24 sm:grid-cols-3 sm:gap-5 sm:pb-0">
          {bars.map((b) => {
            const Icon = b.icon;
            const on = Math.round(b.h * CARD_TICKS);
            return (
              <div
                key={b.cls}
                className="show-card relative h-[min(10.5rem,21dvh)] [perspective:900px] sm:h-[min(30rem,62dvh)]"
                onPointerMove={onCardMove}
                onPointerLeave={onCardLeave}
              >
                <div className="show-card-in relative flex size-full flex-col justify-end overflow-hidden sm:justify-between rounded-[1.5rem] p-4 show-card-line sm:rounded-[2rem] sm:p-7">
                <Image src={b.photo} alt="" fill sizes="(min-width:1024px) 22rem, (min-width:640px) 33vw, 100vw" className="show-card-img object-cover" />
                <span aria-hidden className="show-spot pointer-events-none absolute inset-0 z-[1]" />
                <span aria-hidden className="absolute inset-0 show-card-wash" />
                <span className="absolute right-4 top-4 z-[2] grid size-10 place-items-center rounded-full show-chip show-fig sm:relative sm:right-auto sm:top-auto sm:size-12">
                  <Icon size="1.25rem" weight="light" />
                </span>
                <div className="relative z-[2]">
                  <span className={`${b.cls} block font-display text-4xl leading-none tabular-nums show-fig sm:text-6xl lg:text-7xl`}>0</span>
                  <p className="mt-2 text-sm leading-snug show-text sm:text-lg">{b.label}</p>
                  <div aria-hidden className="mt-4 flex h-3 items-end justify-between">
                    {Array.from({ length: CARD_TICKS }, (_, k) => (
                      <span key={k} className={`relative w-px rounded-full show-tick-track sm:w-[2px] ${k % 5 === 0 ? "h-full" : "h-[60%]"}`}>
                        {k < on && <span className="show-card-tick absolute inset-0 rounded-full bg-sun" />}
                      </span>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scene 4: closing thank-you over a soft gold light. */}
      <div className="show-scene show-4 absolute inset-0 grid place-items-center p-6 pb-28">
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
                  <span className="show-word inline-block">{w}</span>
                </span>
              </span>
            ))}
          </p>
          <p className="show-sub mt-5 font-display text-[clamp(1.4rem,3.2vw,2.75rem)] show-fig">{t.thanksSub}</p>
        </div>
      </div>
      </div>
    </div>,
        document.body,
      )}
    </>
  );
}
