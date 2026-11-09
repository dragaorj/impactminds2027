"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { ArrowDown } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { HERO_VIDEO_ID } from "@/lib/site";
import SpeakerFaces from "./SpeakerFaces";
import { prefersReducedMotion } from "./prefs";
import { keepLooping, loadYouTube, loopVars, type YTPlayer } from "./youtube";
import NativeLoop from "./NativeLoop";
import TypeLine from "./TypeLine";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// The two corner captions (signature top left, dates bottom right).
const ED_CAPTION = "text-[0.625rem] font-medium uppercase leading-[1.75] tracking-[0.24em] text-white/80 sm:text-[0.6875rem] lg:text-xs";

// The background loop stays muted and chrome-less. With a self-hosted file
// (videoSrc) it plays in a native <video>, which has no player chrome at all;
// otherwise it falls back to the YouTube embed with the poster cover.
export default function Hero({
  t,
  videoSrc,
  agendaLink,
  speakerLabel,
  variant = "classic",
}: {
  t: Dict["hero"];
  variant?: "classic" | "editorial";
  videoSrc?: string;
  agendaLink: string;
  speakerLabel: string;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [started, setStarted] = useState(false);
  const root = useRef<HTMLElement>(null);
  // The info bar shows the event facts (only when turned on in the
  // accessibility menu); the cookie notice (CookieConsent) takes it while the
  // visitor has not chosen yet.
  const [consentAsk, setConsentAsk] = useState(false);
  const shown = consentAsk ? "consent" : "facts";
  useEffect(() => {
    window.dispatchEvent(new Event("im:hero-shift"));
  }, [shown]);
  const consent = shown === "consent";
  useEffect(() => {
    const onConsent = (e: Event) => setConsentAsk((e as CustomEvent<boolean>).detail);
    window.addEventListener("im:consent-bar", onConsent);
    return () => window.removeEventListener("im:consent-bar", onConsent);
  }, []);

  // Scrolling away flies through the title: "Impact Minds" grows towards the
  // viewer, blurs and dissolves, while the rest of the hero parts (pill and
  // gold line up, CTA and info bar down) and the video eases in, all scrubbed
  // to the scroll. The tweens run on wrappers / inner spans, never on the
  // [data-hero] elements the intro animates.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({
        defaults: { ease: "power1.in" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 },
      });
      // The title dissolves into a blur as it grows: the signature move, on
      // every device (phones and lite mode included).
      tl.to(".hero-media", { scale: 1.14, ease: "none", duration: 1 }, 0)
        .to(".hero-title", { scale: 3.4, y: () => window.innerHeight * 0.3, filter: "blur(22px)", opacity: 0, duration: 0.75 }, 0)
        .to(".hero-typed", { y: -50, filter: "blur(8px)", opacity: 0, duration: 0.45 }, 0)
        .to(".hero-out-up", { y: -70, opacity: 0, duration: 0.4 }, 0)
        .to(".hero-out-down", { y: 80, opacity: 0, duration: 0.45, stagger: 0.05 }, 0);
    },
    { scope: root },
  );

  // The editorial headline fills the width between the gutters (--ed-w, its
  // widest line measured here), up to a cap set by the
  // screen's height (CSS), whatever the language, screen or orientation.
  const edHead = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const h = edHead.current;
    const box = h?.parentElement;
    if (!h || !box) return;
    const fit = () => {
      // Measured at a known size (100px), then scaled to the room there is.
      h.style.fontSize = "100px";
      const k = h.getBoundingClientRect().width / (h.offsetWidth || 1);
      let widest = 0;
      for (const line of h.querySelectorAll<HTMLElement>(".ed-line")) widest = Math.max(widest, line.getBoundingClientRect().width / k);
      const tall = h.offsetHeight;
      h.style.fontSize = "";
      if (widest) h.style.setProperty("--ed-w", `${((100 * box.clientWidth) / widest) * 0.97}px`);
      // Height: whatever the screen leaves once everything else in the hero
      // (signature, pill, dates, buttons, paddings) has its room, so the whole
      // block always shows in the first screen, browser bars included.
      const page = h.closest<HTMLElement>(".ed-root");
      if (!page || !tall) return;
      const outer = (el: Element) => {
        const cs = getComputedStyle(el);
        return cs.display === "none" ? 0 : (el as HTMLElement).offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
      };
      const [top, middle, bottom] = Array.from(page.children);
      const pad = getComputedStyle(page);
      const others =
        parseFloat(pad.paddingTop) +
        parseFloat(pad.paddingBottom) +
        Array.from(top.children).reduce((sum, el) => sum + outer(el), 0) +
        (middle as HTMLElement).offsetHeight -
        h.offsetHeight +
        Array.from(bottom.children).reduce((sum, el) => sum + outer(el), 0);
      const room = window.innerHeight - others - 8;
      h.style.setProperty("--ed-h", `${Math.max(16, (100 * room) / tall)}px`);
    };
    fit();
    document.fonts?.ready.then(fit);
    // Again a moment later too: a resize can swap the layout (orientation)
    // after the observer has already fired.
    const refit = () => {
      fit();
      window.setTimeout(fit, 120);
    };
    const ro = new ResizeObserver(refit);
    ro.observe(box);
    // Turning the screen swaps the layout without always changing the width.
    window.addEventListener("resize", refit);
    const portrait = window.matchMedia("(orientation: portrait)");
    portrait.addEventListener("change", refit);

    // Hovering a line (mouse only): its letters lift one after another and
    // flash gold, then spring back; its serif words tilt and brighten.
    const lines = Array.from(h.querySelectorAll<HTMLElement>(".ed-line"));
    const plays = new Map<HTMLElement, gsap.core.Timeline>();
    const offs = lines.map((line) => {
      const chars = line.querySelectorAll(".ed-ch");
      const serif = line.querySelectorAll(".ed-serif");
      const play = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" || plays.get(line)?.isActive() || prefersReducedMotion()) return;
        const tl = gsap
          .timeline({ onComplete: () => gsap.set([chars, serif], { clearProps: "transform,color" }) })
          .to(chars, { y: "-0.12em", rotate: (k: number) => (k % 2 ? 4 : -4), color: "#D9B865", duration: 0.28, ease: "power2.out", stagger: 0.03 }, 0)
          .to(chars, { y: 0, rotate: 0, duration: 0.8, ease: "elastic.out(1, 0.45)", stagger: 0.03 }, 0.28)
          .to(chars, { color: "#fff", duration: 0.5, ease: "power1.inOut", stagger: 0.03 }, 0.45)
          .to(serif, { rotate: -4, scale: 1.08, color: "#fff", duration: 0.35, ease: "power2.out" }, 0)
          .to(serif, { rotate: 0, scale: 1, duration: 0.9, ease: "elastic.out(1, 0.4)" }, 0.35)
          .to(serif, { color: "#D9B865", duration: 0.5, ease: "power1.inOut" }, 0.5);
        plays.set(line, tl);
      };
      line.addEventListener("pointerenter", play);
      return () => line.removeEventListener("pointerenter", play);
    });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", refit);
      portrait.removeEventListener("change", refit);
      offs.forEach((off) => off());
      plays.forEach((tl) => tl.kill());
    };
  }, []);

  const cta = (size: string) => (
    <a
      href="#sobre"
      // Down to "What is Impact Minds", right under the hero.
      className={`shimmer group flex items-center gap-2 rounded-full sm:gap-3 bg-white font-medium text-[#2A1240] transition-[transform,background-color] duration-500 ease-[var(--ease-spring)] hover:bg-[#D9B865] active:scale-[0.98] ${size}`}
    >
      {/* Phones: the label centred in the room left of the arrow, its size
          following the button's own width (cqi) so it never pushes the arrow
          out; on the narrowest screens it wraps to two balanced lines. */}
      <span className="max-sm:min-w-0 max-sm:flex-1 max-sm:text-balance max-sm:text-center max-sm:text-[clamp(0.6875rem,calc(9.2cqi_-_6px),0.8125rem)] max-sm:leading-[1.15]">{t.cta}</span>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#2A1240] sm:size-11 text-white transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-y-0.5 group-hover:scale-105">
        <ArrowDown size="1rem" />
      </span>
    </a>
  );

  useEffect(() => {
    if (videoSrc) return;
    let cancelled = false;
    let revealTimer = 0;
    let firstReveal = true;
    const host = holder.current;
    const mount = document.createElement("div");
    host?.appendChild(mount);
    const autoplay = !prefersReducedMotion();

    loadYouTube().then((YT) => {
      if (cancelled) return;
      player.current = new YT.Player(mount, {
        host: "https://www.youtube-nocookie.com",
        videoId: HERO_VIDEO_ID,
        playerVars: loopVars(HERO_VIDEO_ID, autoplay),
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.mute();
            if (autoplay) e.target.playVideo();
          },
          onStateChange: (e: { data: number }) => {
            // YouTube flashes its own play/pause chrome whenever playback
            // starts, buffers or loops. The poster covers the video in those
            // moments and only lifts once playback has been steady for a while.
            window.clearTimeout(revealTimer);
            if (e.data === 1) {
              revealTimer = window.setTimeout(() => setStarted(true), firstReveal ? 4000 : 3500);
              firstReveal = false;
            } else if (e.data === -1 || e.data === 0 || e.data === 2 || e.data === 3) {
              setStarted(false);
            }
          },
        },
      });
    });

    const stopLoop = keepLooping(
      () => player.current,
      () => {
        window.clearTimeout(revealTimer);
        setStarted(false);
        revealTimer = window.setTimeout(() => setStarted(true), 3500);
      },
    );

    return () => {
      stopLoop();
      cancelled = true;
      window.clearTimeout(revealTimer);
      player.current?.destroy();
      player.current = null;
      if (host) host.innerHTML = "";
    };
  }, [videoSrc]);

  // Shared by both layouts: the bar with the facts / cookie notice.
  const bar = (place = "") => (
    <>
        {/* The event's key facts, loose on the video (no box, a soft shadow
            under the text keeps it legible). The facts view is hidden unless turned on in the accessibility menu
            (data-view + html[data-facts], globals.css). On phones and tablets, with no bar on show its
            room folds away (.hero-bar-slot), so the block sits near the bottom
            edge, and it opens again, lifting the block, for the cookie notice
            or the facts. */}
        <div className={`hero-out-down hero-bar-slot w-full ${place}`}>
          <div className="p-px">
          <div
            data-hero
            data-hero-bar
            data-view={shown}
            className="@container/hbar relative mx-auto mt-6 w-full max-w-3xl [text-shadow:0_1px_14px_rgb(28_11_44/0.7)] sm:mt-10"
          >
            <dl
              aria-hidden={shown !== "facts"}
              className={`grid grid-cols-4 px-3 py-3 text-center transition-[opacity,filter,translate] duration-500 ease-out sm:px-5 sm:py-3.5 ${
                shown !== "facts" ? "pointer-events-none -translate-y-1 opacity-0 blur-[2px]" : "opacity-100"
              }`}
            >
              {t.facts.map((f, i) => (
                <div key={f.label} className={`flex flex-col-reverse items-center justify-start px-1 sm:px-2 ${i > 0 ? "border-l border-white/15" : ""}`}>
                  <dt className="mt-1 text-[0.625rem] leading-tight text-white/75 sm:text-[0.8125rem]">{f.label}</dt>
                  <dd className="font-display text-base leading-none sm:text-[1.65rem]">{f.value}</dd>
                </div>
              ))}
            </dl>
            {/* Cookie notice: CookieConsent renders its choice in here (portal). */}
            <div
              id="hero-consent"
              aria-hidden={!consent}
              inert={!consent}
              className={`absolute inset-0 transition-[opacity,filter,translate] duration-500 ease-out ${
                consent ? "opacity-100 delay-150" : "pointer-events-none translate-y-1 opacity-0 blur-[2px]"
              }`}
            />
          </div>
          </div>
        </div>
    </>
  );

  // Editorial layout: the headline staggered across the screen in a wide
  // black sans (capitals) played against an italic serif (lower case), fonts
  // from the preview route (--font-ed-*), with the speakers pill under it and
  // two small captions in the corners (signature top left, dates bottom
  // right). From lg the controls part to the bottom corners: the CTA on
  // the left, the agenda button on the right, the info bar between them. The type is sized to the smaller of the screen's width and
  // height, so the whole block always fits the first fold.
  // One headline line: sans words letter by letter (so they can wave on hover,
  // read whole by screen readers), serif words whole, in gold. Every line is
  // centred.
  const edLine = (line: readonly { text: string; serif?: boolean }[], i: number) => (
    <span key={i} data-hero className="ed-line block whitespace-nowrap">
      {line.map((seg, j) =>
        seg.serif ? (
          <span
            key={j}
            className="ed-serif mx-[0.12em] inline-block first:ml-0 origin-bottom font-[family-name:var(--font-ed-serif)] text-[1.22em] font-normal normal-case italic leading-[0.7] tracking-[-0.035em] text-[#D9B865] [font-stretch:100%] last:mr-0"
          >
            {seg.text}
          </span>
        ) : (
          <span key={j}>
            <span className="sr-only">{seg.text}</span>
            {/* Word by word, so a line that has to wrap breaks between words. */}
            <span aria-hidden>
              {seg.text.split(" ").map((word, w) => (
                <span key={w}>
                  {w > 0 && " "}
                  <span className="inline-block whitespace-nowrap">
                    {Array.from(word).map((ch, k) => (
                      <span key={k} className="ed-ch inline-block">
                        {ch}
                      </span>
                    ))}
                  </span>
                </span>
              ))}
            </span>
          </span>
        ),
      )}
    </span>
  );

  const editorial = (
    // Three bands: an empty one on top, the headline in the middle, the two
    // buttons centred at the bottom. The outer bands grow
    // from zero and share the spare height equally, so the headline sits on
    // the screen's centre on any device; when one band needs more room than its
    // share it keeps it and the other takes the rest, so nothing ever overlaps.
    <div className="ed-root mx-auto flex min-h-[100dvh] w-full max-w-[132rem] flex-col px-5 pb-[max(3.5rem,env(safe-area-inset-bottom))] pt-20 sm:px-8 sm:pb-28 sm:pt-24 lg:px-[5vw] lg:pb-28 [@media(max-height:500px)]:pb-4! [@media(max-height:500px)]:pt-20!">
      <div className="flex flex-1 basis-0 flex-col items-start max-lg:flex-none">
      </div>

      <div className="flex shrink-0 flex-col items-center py-[min(3vw,2.5svh)] text-center max-lg:my-auto [@media(max-height:500px)]:py-1!">
        {/* The farewell to Manaus and the invitation to Cartagena. */}
        {/* Sized by the fit effect: as wide as the gutters allow, capped by a
            share of the screen's height (--ed-cap) so the whole block stays in
            the first fold. Landscape screens get the four-line layout,
            portrait ones the taller, narrower one. */}
        <h1
          ref={edHead}
          className="hero-title flex flex-col items-center font-[family-name:var(--font-ed-sans)] text-[min(var(--ed-cap),var(--ed-w,8vw),var(--ed-h,100vh))] font-extrabold uppercase leading-[1.1] tracking-[-0.025em] [--ed-cap:10svh] [font-stretch:110%] will-change-[transform,filter] sm:[font-stretch:118%] lg:[--ed-cap:9.4svh] portrait:[--ed-cap:7svh] [@media(max-height:500px)]:[--ed-cap:7svh]! [@media(min-width:1024px)_and_(max-height:820px)]:[--ed-cap:8.4svh]!"
        >
          <span className="contents portrait:hidden">{t.editorial.lines.map(edLine)}</span>
          <span className="hidden portrait:contents">{t.editorial.tall.map(edLine)}</span>
        </h1>
      </div>

      <div className="flex flex-1 basis-0 flex-col justify-end max-lg:flex-none">
      {/* The CTA and the agenda button, centred together (on phones side by
          side, the same width). The details bar (facts, from the accessibility
          menu) floats just below them, so it never moves the headline. */}
      <div className="relative mt-5 grid grid-cols-2 items-center gap-2 sm:flex sm:justify-center sm:gap-4 lg:mt-6">
        <div className="hero-out-down flex min-w-0 flex-1 sm:flex-none">
          <div data-hero className="flex w-full">
            {cta("h-[3.25rem] w-full min-w-0 justify-between max-sm:[container-type:inline-size] sm:w-auto sm:whitespace-nowrap pl-3.5 pr-1.5 text-[0.8125rem] sm:h-16 sm:pl-7 sm:pr-2.5 sm:text-base")}
          </div>
        </div>
        <div className="hero-out-down min-w-0 sm:shrink-0">
          <div data-hero className="flex">
            <a
              href="#agenda-2027"
              className="flex h-[3.25rem] w-full items-center justify-center whitespace-nowrap rounded-full bg-[rgb(34_14_52/0.35)] px-5 text-[0.8125rem] font-medium text-white ring-1 ring-white/30 backdrop-blur-sm transition-[background-color,color,box-shadow,transform] duration-500 ease-[var(--ease-spring)] hover:bg-[#D9B865] hover:text-[#2A1240] hover:ring-[#D9B865] active:scale-[0.98] sm:h-16 sm:w-auto sm:px-8 sm:text-base"
            >
              {agendaLink}
            </a>
          </div>
        </div>
        {bar("absolute inset-x-0 top-full mt-3 [&_[data-hero-bar]]:mt-0")}
      </div>
      </div>
    </div>
  );

  // The section is one wave taller than the screen at its largest (lvh: the
  // height with the browser bars hidden), so the video always fills the whole
  // first fold and the wave into the next section only shows once scrolling.
  // The content itself is laid out in the always-visible height (svh/dvh).
  return (
    <section ref={root} id="top" className="wave-b relative isolate min-h-[calc(100lvh+var(--wave))] overflow-hidden bg-[#1c0c2c] text-white">
      <div className="hero-media absolute inset-0 -z-10" aria-label={t.videoLabel} role="img">
        {/* The self-hosted loop shows its own poster (the thumbnail through the
            image optimiser, a fraction of the original's weight); the separate
            image is only for the YouTube fallback. */}
        {videoSrc ? (
          <NativeLoop
            ambient
            deferLoad
            announce
            src={videoSrc}
            poster={`/_next/image?url=${encodeURIComponent(`https://i.ytimg.com/vi/${HERO_VIDEO_ID}/maxresdefault.jpg`)}&w=1080&q=75`}
          />
        ) : (
          <>
            <Image
              src={`https://i.ytimg.com/vi/${HERO_VIDEO_ID}/maxresdefault.jpg`}
              alt=""
              fill
              priority
              sizes="100vw"
              className={`object-cover transition-opacity ${started ? "opacity-0 duration-1000" : "opacity-100 duration-150"}`}
            />
            <div ref={holder} className="yt-cover absolute inset-0 overflow-hidden" aria-hidden />
          </>
        )}
        {/* Dark purple film over the video so the centred text never competes
            with it: an even tint, a gradient deepening towards the nav and the
            info bar, and a darker pool right behind the title. */}
        <div className="absolute inset-0 bg-[rgb(28_11_44/0.42)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(34_14_52/0.7)_0%,rgb(34_14_52/0.25)_28%,rgb(42_18_64/0.3)_55%,rgb(34_14_52/0.95)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_50%_at_50%_52%,rgb(34_14_52/0.6),transparent_75%)]" />
      </div>


      {/* Centred, in the first screen: the speakers pill, the title with the
          typed gold line and the CTA with the agenda button beside it; the
          event's key facts sit in a frosted bar at the bottom. On phones the
          block sits low so the video's upper half stays clear. */}
      {variant === "editorial" ? (
        editorial
      ) : (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[132rem] flex-col px-5 pb-[max(5.5rem,env(safe-area-inset-bottom))] pt-24 sm:px-8 sm:pb-14 lg:px-[5vw]">
        <div className="flex flex-1 flex-col items-center justify-end text-center lg:justify-center lg:pt-[14vh]">
          <div className="hero-out-up">
            <p
              data-hero
              className="faces-pill inline-flex items-center gap-3 rounded-full bg-[rgb(34_14_52/0.5)] py-1.5 pl-1.5 pr-4 text-xs ring-1 ring-white/20 sm:text-sm"
            >
              <SpeakerFaces label={speakerLabel} />
              {/* Phones: the short label. */}
              <span className="sm:hidden">{t.speakersPillShort}</span>
              <span className="max-sm:hidden">{t.speakersPill}</span>
            </p>
          </div>
          <h1 data-hero className="-mt-3 font-display leading-[0.92] sm:mt-7">
            {/* Phones: one word per line, set much larger; from sm on one line. */}
            <span className="hero-title block text-[clamp(3.25rem,11vw,9.5rem)] will-change-[transform,filter] max-sm:text-[24vw] max-sm:leading-[1.14]">
              {/* The title joins its words with a non-breaking space: split on any space. */}
              {t.title.split(/\s+/).map((word, i, all) => (
                <span key={word} className="max-sm:block">
                  {word}
                  {i < all.length - 1 && " "}
                </span>
              ))}
            </span>
            {/* Closing the 2026 edition while inviting to 2027: the line opens on
                "Connecting Us" in white, already written; it fades and the gold
                thank-you and invitation type themselves in, taking turns.
                A fixed min-height keeps the layout still while the text changes length. */}
            <TypeLine
              phrases={t.typed}
              className="hero-typed mt-[clamp(0.625rem,1.5vw,1.6rem)] block min-h-[1.15em] text-[clamp(1.35rem,3.6vw,3.25rem)] text-[#D9B865]"
            />
          </h1>
          <div className="hero-out-down w-full sm:w-auto">
            <div data-hero className="mt-7 flex w-full items-center justify-center gap-2 sm:mt-9 sm:w-auto sm:gap-4">
              {cta("h-[3.25rem] min-w-0 flex-1 justify-between max-sm:[container-type:inline-size] sm:whitespace-nowrap pl-3.5 pr-1.5 text-[0.8125rem] sm:h-16 sm:flex-none sm:pl-7 sm:pr-2.5 sm:text-base")}
              <a
              href="#agenda-2027"
              className="flex h-[3.25rem] w-full items-center justify-center whitespace-nowrap rounded-full bg-[rgb(34_14_52/0.35)] px-5 text-[0.8125rem] font-medium text-white ring-1 ring-white/30 backdrop-blur-sm transition-[background-color,color,box-shadow,transform] duration-500 ease-[var(--ease-spring)] hover:bg-[#D9B865] hover:text-[#2A1240] hover:ring-[#D9B865] active:scale-[0.98] sm:h-16 sm:w-auto sm:px-8 sm:text-base"
            >
              {agendaLink}
            </a>
            </div>
          </div>
        </div>

        {bar()}
      </div>
      )}
    </section>
  );
}
