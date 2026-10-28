"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { ArrowDown, ArrowRight } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { EVENT_END, EVENT_START, HERO_VIDEO_ID } from "@/lib/site";
import Countdown from "./Countdown";
import SpeakerFaces from "./SpeakerFaces";
import { prefersReducedMotion } from "./prefs";
import { keepLooping, loadYouTube, loopVars, type YTPlayer } from "./youtube";
import NativeLoop from "./NativeLoop";
import TypeLine from "./TypeLine";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// The background loop stays muted and chrome-less. With a self-hosted file
// (videoSrc) it plays in a native <video>, which has no player chrome at all;
// otherwise it falls back to the YouTube embed with the poster cover.
export default function Hero({
  t,
  videoSrc,
  agendaLink,
  speakerLabel,
}: {
  t: Dict["hero"];
  videoSrc?: string;
  agendaLink: string;
  speakerLabel: string;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [started, setStarted] = useState(false);
  const root = useRef<HTMLElement>(null);
  // The countdown ring and the music button beside the CTA swap the info bar
  // to their details (one at a time); otherwise it shows the event facts.
  const [view, setView] = useState<"facts" | "countdown" | "music">("facts");
  const countdown = view === "countdown";
  const music = view === "music";

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
      tl.to(".hero-media", { scale: 1.14, ease: "none", duration: 1 }, 0)
        .to(".hero-title", { scale: 3.4, y: () => window.innerHeight * 0.3, filter: "blur(22px)", opacity: 0, duration: 0.75 }, 0)
        .to(".hero-typed", { y: -50, filter: "blur(8px)", opacity: 0, duration: 0.45 }, 0)
        .to(".hero-out-up", { y: -70, opacity: 0, duration: 0.4 }, 0)
        .to(".hero-out-down", { y: 80, opacity: 0, duration: 0.45, stagger: 0.05 }, 0);
    },
    { scope: root },
  );

  useEffect(() => {
    const sync = (which: "countdown" | "music") => (e: Event) => {
      const show = (e as CustomEvent<boolean>).detail;
      setView((v) => (show ? which : v === which ? "facts" : v));
    };
    const onCountdown = sync("countdown");
    const onMusic = sync("music");
    window.addEventListener("im:countdown-bar", onCountdown);
    window.addEventListener("im:music-bar", onMusic);
    return () => {
      window.removeEventListener("im:countdown-bar", onCountdown);
      window.removeEventListener("im:music-bar", onMusic);
    };
  }, []);

  const cta = (size: string) => (
    <a
      href="#numeros"
      // Scrolls to the 2026 numbers and plays their short motion presentation.
      onClick={(e) => {
        // With motion, the presentation takes over (it jumps to the section
        // itself); with reduced motion the link just scrolls there.
        if (!prefersReducedMotion()) e.preventDefault();
        window.dispatchEvent(new Event("im:numbers-show"));
      }}
      className={`shimmer group flex items-center gap-2 rounded-full sm:gap-3 bg-white font-medium text-[#2A1240] transition-[transform,background-color] duration-500 ease-[var(--ease-spring)] hover:bg-[#D9B865] active:scale-[0.98] ${size}`}
    >
      {t.cta}
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

  // The section is one wave taller than the screen at its largest (lvh: the
  // height with the browser bars hidden), so the video always fills the whole
  // first fold and the wave into the next section only shows once scrolling.
  // The content itself is laid out in the always-visible height (svh/dvh).
  return (
    <section ref={root} id="top" className="wave-b relative isolate min-h-[calc(100lvh+var(--wave))] overflow-hidden bg-[#1c0c2c] text-white">
      <div className="hero-media absolute inset-0 -z-10" aria-label={t.videoLabel} role="img">
        <Image
          src={`https://i.ytimg.com/vi/${HERO_VIDEO_ID}/maxresdefault.jpg`}
          alt=""
          fill
          priority={!videoSrc}
          sizes="100vw"
          className={`object-cover transition-opacity ${started || videoSrc ? "opacity-0 duration-1000" : "opacity-100 duration-150"}`}
        />
        {videoSrc ? (
          <NativeLoop src={videoSrc} poster={`https://i.ytimg.com/vi/${HERO_VIDEO_ID}/maxresdefault.jpg`} />
        ) : (
          <div ref={holder} className="yt-cover absolute inset-0 overflow-hidden" aria-hidden />
        )}
        {/* Dark purple film over the video so the centred text never competes
            with it: an even tint, a gradient deepening towards the nav and the
            info bar, and a darker pool right behind the title. */}
        <div className="absolute inset-0 bg-[rgb(28_11_44/0.42)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(34_14_52/0.7)_0%,rgb(34_14_52/0.25)_28%,rgb(42_18_64/0.3)_55%,rgb(34_14_52/0.95)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_50%_at_50%_52%,rgb(34_14_52/0.6),transparent_75%)]" />
      </div>


      {/* Centred, in the first screen: the speakers pill, the title with the
          typed gold line and the CTA with the countdown ring beside it; the
          event's key facts sit in a frosted bar at the bottom. On phones the
          block sits low so the video's upper half stays clear. */}
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[132rem] flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-24 sm:px-8 md:pb-10 lg:px-[5vw]">
        <div className="flex flex-1 flex-col items-center justify-end text-center lg:justify-center lg:pt-[14vh]">
          <div className="hero-out-up">
            <p
              data-hero
              className="faces-pill inline-flex items-center gap-3 rounded-full bg-[rgb(34_14_52/0.5)] py-1.5 pl-1.5 pr-4 text-xs ring-1 ring-white/20 sm:text-sm"
            >
              <SpeakerFaces label={speakerLabel} />
              {t.speakersPill}
            </p>
          </div>
          <h1 data-hero className="mt-5 font-display leading-[0.92] sm:mt-7">
            <span className="hero-title block text-[clamp(3.25rem,11vw,9.5rem)] will-change-[transform,filter]">{t.title}</span>
            {/* Closing the 2026 edition while inviting to 2027: the gold line opens on
                "Connecting Us", then types a thank-you and the invitation, on a loop.
                A fixed min-height keeps the layout still while the text changes length. */}
            <TypeLine
              phrases={t.typed}
              className="hero-typed mt-[clamp(0.625rem,1.5vw,1.6rem)] block min-h-[1.15em] text-[clamp(1.35rem,3.6vw,3.25rem)] text-[#D9B865]"
            />
          </h1>
          {/* The countdown ring parks in the slot beside the CTA (same height)
              while the page is at the top; CountdownRing measures it. */}
          <div className="hero-out-down w-full sm:w-auto">
            <div data-hero className="mt-7 flex w-full items-center justify-center gap-2 sm:mt-9 sm:w-auto sm:gap-4">
              {cta("h-[3.25rem] min-w-0 flex-1 justify-between whitespace-nowrap pl-3.5 pr-1.5 text-[0.8125rem] sm:h-16 sm:flex-none sm:pl-7 sm:pr-2.5 sm:text-base")}
              <span data-countdown-slot aria-hidden className="size-[3.25rem] shrink-0 sm:size-16 lg:size-20" />
            {/* The music player's slot, beside the ring (MusicPlayer measures it). */}
            <span data-music-slot aria-hidden className="size-[3.25rem] shrink-0 sm:size-16 lg:size-20" />
            </div>
          </div>
        </div>

        {/* Frosted bar with the event's key facts. Clicking the countdown ring
            cross-fades it to the countdown's details (same box, same size). */}
        <div className="hero-out-down w-full">
          <div
            data-hero
            data-countdown-bar
            className="relative mx-auto mt-6 w-full max-w-3xl rounded-full bg-[rgb(42_18_64/0.6)] ring-1 ring-white/20 sm:mt-10"
          >
            <dl
              aria-hidden={view !== "facts"}
              className={`grid grid-cols-4 px-3 py-3 text-center transition-[opacity,filter,translate] duration-500 ease-out sm:px-5 sm:py-3.5 ${
                view !== "facts" ? "pointer-events-none -translate-y-1 opacity-0 blur-[2px]" : "opacity-100"
              }`}
            >
              {t.facts.map((f, i) => (
                <div key={f.label} className={`flex flex-col-reverse items-center justify-start px-1 sm:px-2 ${i > 0 ? "border-l border-white/15" : ""}`}>
                  <dt className="mt-1 text-[0.625rem] leading-tight text-white/75 sm:text-[0.8125rem]">{f.label}</dt>
                  <dd className="font-display text-base leading-none sm:text-[1.65rem]">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div
              id="hero-countdown"
              aria-hidden={!countdown}
              className={`absolute inset-0 flex flex-col justify-center px-3 text-left transition-[opacity,filter,translate] duration-500 ease-out sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-7 ${
                countdown ? "opacity-100 delay-150" : "pointer-events-none translate-y-1 opacity-0 blur-[2px]"
              }`}
            >
              {/* Phones: just the four units, laid out like the facts they replace
                  (four centred columns with dividers); a short title and the dates
                  from sm, so the units keep room to breathe. */}
              <div className="hidden sm:block sm:shrink-0">
                <p className="text-[0.8125rem] text-white/75">{t.title} 2027</p>
                <p className="mt-0.5 text-[0.8125rem] font-medium text-[#D9B865]">{t.dates}</p>
              </div>
              <div className="w-full [&_dd]:text-xl [&_dt]:mt-1 max-sm:[&_dl]:gap-0 max-sm:[&_dl>div]:items-center max-sm:[&_dl>div+div]:border-l max-sm:[&_dl>div+div]:border-white/15 max-sm:[&_dt]:text-[0.625rem] sm:w-auto sm:flex-1 sm:[&_dl]:flex sm:[&_dl]:justify-between sm:[&_dl]:gap-5 sm:[&_dd]:text-[1.65rem] sm:[&_dt]:text-xs">
                <Countdown start={EVENT_START} end={EVENT_END} labels={t} compact />
              </div>
              <a
                href="#agenda-2027"
                tabIndex={countdown ? 0 : -1}
                className="group hidden shrink-0 items-center gap-2 rounded-full py-1.5 pl-3.5 pr-2 text-[0.8125rem] font-medium ring-1 ring-white/25 transition-colors hover:bg-[#D9B865] hover:text-[#2A1240] md:flex"
              >
                {agendaLink}
                <ArrowRight size="1rem" className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-x-0.5" />
              </a>
            </div>
            {/* Music: MusicPlayer renders its controls in here (portal). */}
            <div
              id="hero-music"
              aria-hidden={!music}
              inert={!music}
              className={`absolute inset-0 transition-[opacity,filter,translate] duration-500 ease-out ${
                music ? "opacity-100 delay-150" : "pointer-events-none translate-y-1 opacity-0 blur-[2px]"
              }`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
