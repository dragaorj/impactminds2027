"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowRight } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { EVENT_END, EVENT_START, HERO_VIDEO_ID, speakers } from "@/lib/site";
import Countdown from "./Countdown";
import { prefersReducedMotion } from "./prefs";
import { keepLooping, loadYouTube, loopVars, type YTPlayer } from "./youtube";
import NativeLoop from "./NativeLoop";
import TypeLine from "./TypeLine";

// Five speaker portraits for the social-proof pill above the title.
const FACES = speakers.filter((s) => s.photo).slice(0, 5);

// The background loop stays muted and chrome-less. With a self-hosted file
// (videoSrc) it plays in a native <video>, which has no player chrome at all;
// otherwise it falls back to the YouTube embed with the poster cover.
export default function Hero({ t, videoSrc, agendaLink }: { t: Dict["hero"]; videoSrc?: string; agendaLink: string }) {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [started, setStarted] = useState(false);
  // The countdown ring beside the CTA swaps the info bar to its details.
  const [countdown, setCountdown] = useState(false);

  useEffect(() => {
    const on = (e: Event) => setCountdown((e as CustomEvent<boolean>).detail);
    window.addEventListener("im:countdown-bar", on);
    return () => window.removeEventListener("im:countdown-bar", on);
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
      className={`shimmer group flex items-center gap-3 rounded-full bg-white font-medium text-[#2A1240] transition-[transform,background-color] duration-500 ease-[var(--ease-spring)] hover:bg-[#D9B865] active:scale-[0.98] ${size}`}
    >
      {t.cta}
      <span className="grid size-11 place-items-center rounded-full bg-[#2A1240] text-white transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-y-0.5 group-hover:scale-105">
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

  // The section is one wave taller than the screen: the video fills the whole
  // first fold and the wave into the next section only shows once scrolling.
  return (
    <section id="top" className="wave-b relative isolate min-h-[calc(100svh+var(--wave))] overflow-hidden lg:min-h-[calc(100dvh+var(--wave))] bg-[#1c0c2c] text-white">
      <div className="absolute inset-0 -z-10" aria-label={t.videoLabel} role="img">
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
      <div className="mx-auto flex min-h-[100svh] w-full max-w-[132rem] flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-24 sm:px-8 md:pb-10 lg:min-h-[100dvh] lg:px-[5vw]">
        <div className="flex flex-1 flex-col items-center justify-end text-center lg:justify-center lg:pt-[14vh]">
          <p
            data-hero
            className="faces-pill inline-flex items-center gap-3 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 text-xs ring-1 ring-white/20 backdrop-blur-md sm:text-sm"
          >
            {/* Hovering the pill fans the portraits apart and hops them in turn. */}
            <span aria-hidden className="faces flex">
              {FACES.map((f) => (
                <span key={f.name} className="face relative size-7 overflow-hidden rounded-full bg-[#2a1240] ring-2 ring-[#2a1240] sm:size-8">
                  <Image src={f.photo!} alt="" fill sizes="2rem" className="scale-[1.24] object-cover object-[50%_30%]" />
                </span>
              ))}
            </span>
            {t.speakersPill}
          </p>
          <h1 data-hero className="mt-5 font-display leading-[0.92] sm:mt-7">
            <span className="block text-[clamp(3.25rem,11vw,9.5rem)]">{t.title}</span>
            {/* Closing the 2026 edition while inviting to 2027: the gold line opens on
                "Connecting Us", then types a thank-you and the invitation, on a loop.
                A fixed min-height keeps the layout still while the text changes length. */}
            <TypeLine
              phrases={t.typed}
              className="mt-3 block min-h-[1.15em] text-[clamp(1.35rem,3.6vw,3.25rem)] text-[#D9B865]"
            />
          </h1>
          {/* The countdown ring parks in the slot beside the CTA (same height)
              while the page is at the top; CountdownRing measures it. */}
          <div data-hero className="mt-7 flex w-full items-center justify-center gap-4 sm:mt-9 sm:w-auto sm:gap-6">
            {cta("h-16 min-w-0 flex-1 justify-between whitespace-nowrap pl-5 pr-2.5 text-[0.95rem] sm:flex-none sm:pl-7 sm:text-base")}
            <span data-countdown-slot aria-hidden className="size-16 shrink-0 lg:size-20" />
          </div>
        </div>

        {/* Frosted bar with the event's key facts. Clicking the countdown ring
            cross-fades it to the countdown's details (same box, same size). */}
        <div
          data-hero
          data-countdown-bar
          className="relative mx-auto mt-6 w-full max-w-4xl rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-xl backdrop-saturate-150 sm:mt-10"
        >
          <dl
            aria-hidden={countdown}
            className={`grid grid-cols-4 px-3 py-3.5 text-center transition-[opacity,filter,translate] duration-500 ease-out sm:px-6 sm:py-5 ${
              countdown ? "pointer-events-none -translate-y-1 opacity-0 blur-[2px]" : "opacity-100"
            }`}
          >
            {t.facts.map((f, i) => (
              <div key={f.label} className={`flex flex-col-reverse items-center justify-start px-1 sm:px-2 ${i > 0 ? "border-l border-white/15" : ""}`}>
                <dt className="mt-1 text-[0.625rem] leading-tight text-white/75 sm:text-sm">{f.label}</dt>
                <dd className="font-display text-[1.05rem] leading-none sm:text-[2.1rem]">{f.value}</dd>
              </div>
            ))}
          </dl>
          <div
            id="hero-countdown"
            aria-hidden={!countdown}
            className={`absolute inset-0 flex flex-col justify-center gap-1.5 px-7 text-left transition-[opacity,filter,translate] duration-500 ease-out sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8 ${
              countdown ? "opacity-100 delay-150" : "pointer-events-none translate-y-1 opacity-0 blur-[2px]"
            }`}
          >
            {/* Phones: the dates over the four units; the full title from sm. */}
            <div className="sm:shrink-0">
              <p className="hidden text-sm text-white/75 sm:block">{t.countdown}</p>
              <p className="text-[0.6875rem] font-medium text-[#D9B865] sm:mt-1 sm:text-sm">{t.dates}</p>
            </div>
            <div className="[&_dd]:text-2xl [&_dt]:mt-0.5 sm:max-w-xs sm:flex-1 sm:[&_dd]:text-3xl">
              <Countdown start={EVENT_START} end={EVENT_END} labels={t} compact />
            </div>
            <a
              href="#agenda-2027"
              tabIndex={countdown ? 0 : -1}
              className="group hidden shrink-0 items-center gap-2 rounded-full py-2 pl-4 pr-2 text-sm font-medium ring-1 ring-white/25 transition-colors hover:bg-[#D9B865] hover:text-[#2A1240] md:flex"
            >
              {agendaLink}
              <ArrowRight size="1rem" className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
