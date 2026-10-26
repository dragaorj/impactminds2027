"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { EVENT_END, EVENT_START, HERO_VIDEO_ID } from "@/lib/site";
import Countdown from "./Countdown";
import { prefersReducedMotion } from "./prefs";
import { keepLooping, loadYouTube, loopVars, type YTPlayer } from "./youtube";
import NativeLoop from "./NativeLoop";

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
      className={`shimmer group flex items-center gap-3 rounded-full bg-white font-medium text-[#2A1240] transition-[transform,background-color] duration-500 ease-[var(--ease-spring)] hover:bg-[#D9B865] active:scale-[0.98] ${size}`}
    >
      {t.cta}
      <span className="grid size-9 place-items-center rounded-full bg-[#2A1240] text-white transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-y-0.5 group-hover:scale-105">
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
          priority
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
          bars showing): eyebrow, title, launch line, the full countdown, then the
          CTA at full width. From lg the CTA sits under the title again. */}
      <div className="flex min-h-[100svh] w-full flex-col justify-end gap-4 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-24 sm:gap-8 sm:px-8 md:pb-12 lg:grid lg:min-h-[100dvh] lg:grid-cols-12 lg:items-end lg:gap-8 lg:px-[5vw]">
        <div className="lg:col-span-7">
          <p data-hero className="mb-3 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/20 backdrop-blur-md sm:mb-5 sm:px-4 sm:py-1.5 sm:text-sm">
            <span>{t.eyebrow}</span>
            <span aria-hidden className="h-3 w-px bg-white/40" />
            <span className="text-white/80">{t.dates}</span>
          </p>
          <h1 data-hero className="font-display leading-[0.95]">
            <span className="block text-[clamp(2.5rem,10.5vw,8.75rem)]">{t.title}</span>
            <span className="mt-1 block text-[clamp(1.6rem,5.4vw,4.5rem)] text-[#D9B865]">{t.subtitle}</span>
          </h1>
          <p data-hero className="mt-2 max-w-[34ch] text-sm text-white/85 sm:mt-6 sm:text-xl">
            {t.launch}
          </p>
          <div data-hero className="mt-8 hidden lg:flex">
            {cta("h-12 pl-6 pr-1.5 text-[0.9375rem]")}
          </div>
        </div>

        <div className="lg:col-span-5 lg:flex lg:justify-end">
          <div data-hero className="w-full rounded-[1.5rem] bg-white/8 p-1 ring-1 ring-white/20 backdrop-blur-xl sm:rounded-[2rem] sm:p-1.5 lg:max-w-md">
            <div className="rounded-[calc(1.5rem-4px)] bg-[rgb(34_14_52/0.55)] px-4 py-3 shadow-[inset_0_1px_1px_rgb(255_255_255/0.12)] sm:rounded-[calc(2rem-6px)] sm:p-6">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 sm:mb-4">
                <p className="text-xs text-white/80 sm:text-sm">{t.countdown}</p>
                <p className="hidden text-xs font-medium text-[#D9B865] sm:block sm:text-sm">{t.dates}</p>
              </div>
              <Countdown start={EVENT_START} end={EVENT_END} labels={t} />
            </div>
          </div>
        </div>

        <div data-hero className="lg:hidden">
          {cta("h-12 w-full justify-between pl-6 pr-1.5 text-[0.9375rem]")}
        </div>
      </div>

    </section>
  );
}
