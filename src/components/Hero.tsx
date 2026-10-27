"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { HERO_VIDEO_ID } from "@/lib/site";
import { prefersReducedMotion } from "./prefs";
import { keepLooping, loadYouTube, loopVars, type YTPlayer } from "./youtube";
import NativeLoop from "./NativeLoop";
import TypeLine from "./TypeLine";

// The background loop stays muted and chrome-less. With a self-hosted file
// (videoSrc) it plays in a native <video>, which has no player chrome at all;
// otherwise it falls back to the YouTube embed with the poster cover.
export default function Hero({ t, videoSrc }: { t: Dict["hero"]; videoSrc?: string }) {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [started, setStarted] = useState(false);

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

  return (
    <section id="top" className="relative isolate min-h-[100svh] overflow-hidden lg:min-h-[100dvh] bg-[#1c0c2c] text-white">
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
        {/* Mobile keeps the upper half nearly clear so the video reads; the wash only builds behind the text. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(34_14_52/0.45)_0%,rgb(34_14_52/0)_22%,rgb(34_14_52/0)_45%,rgb(34_14_52/0.94)_100%)] md:bg-[linear-gradient(180deg,rgb(34_14_52/0.5)_0%,rgb(34_14_52/0.1)_35%,rgb(34_14_52/0.35)_60%,rgb(34_14_52/0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_95%,rgb(91_42_134/0.55),transparent_55%)] md:bg-[radial-gradient(ellipse_at_15%_85%,rgb(91_42_134/0.6),transparent_60%)]" />
      </div>

      {/* Phones: everything fits the first screen (svh = height with the browser
          bars showing): eyebrow, title with the typed line, then the CTA at full width.
          From lg the block sits in the vertical middle with the CTA under the title.
          The countdown floats bottom right. */}
      <div className="mx-auto flex min-h-[100svh] w-full max-w-[132rem] flex-col justify-end gap-4 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-24 sm:gap-8 sm:px-8 md:pb-12 lg:grid lg:min-h-[100dvh] lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-[5vw]">
        <div className="lg:col-span-7">
          <p data-hero className="mb-3 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/20 backdrop-blur-md sm:mb-5 sm:px-4 sm:py-1.5 sm:text-sm">
            <span>{t.eyebrow}</span>
            <span aria-hidden className="h-3 w-px bg-white/40" />
            <span className="text-white/80">{t.dates}</span>
          </p>
          <h1 data-hero className="font-display leading-[0.95]">
            <span className="block text-[clamp(2.5rem,8vw,6.75rem)]">{t.title}</span>
            {/* Closing the 2026 edition while inviting to 2027: the gold line types a
                thank-you, then the invitation, on a loop. A fixed min-height keeps
                the layout still while the text changes length. */}
            <TypeLine
              phrases={t.typed}
              className="mt-2 block min-h-[1.15em] text-[clamp(1.25rem,3.6vw,3.25rem)] text-[#D9B865]"
            />
          </h1>
          {/* The countdown ring parks in the slot beside the CTA (same height)
              while the page is at the top; CountdownRing measures it. */}
          <div data-hero className="mt-8 hidden items-center gap-6 lg:flex">
            {cta("h-16 pl-7 pr-2.5 text-base")}
            <span data-countdown-slot aria-hidden className="size-20 shrink-0" />
          </div>
        </div>

        <div data-hero className="flex items-center gap-4 lg:hidden">
          {cta("h-16 min-w-0 flex-1 justify-between pl-6 pr-2.5 text-base")}
          <span data-countdown-slot aria-hidden className="size-16 shrink-0" />
        </div>
      </div>

    </section>
  );
}
