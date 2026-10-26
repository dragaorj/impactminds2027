"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, Play, X } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { EVENT_END, EVENT_START, HERO_VIDEO_ID } from "@/lib/site";
import Countdown from "./Countdown";
import Art from "./Art";
import { prefersReducedMotion } from "./prefs";

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  setVolume(v: number): void;
  destroy(): void;
};
type YTNamespace = {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTube(): Promise<YTNamespace> {
  return new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    if (!document.getElementById("yt-api")) {
      const s = document.createElement("script");
      s.id = "yt-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

// The background loop stays muted and chrome-less; watching with sound
// happens in a lightbox with YouTube's own controls.
export default function Hero({ t }: { t: Dict["hero"] }) {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [started, setStarted] = useState(false);
  const [open, setOpen] = useState(false);

  const openVideo = () => {
    player.current?.pauseVideo();
    setOpen(true);
    dialog.current?.showModal();
  };

  const closeVideo = () => {
    dialog.current?.close();
  };

  const onClosed = () => {
    setOpen(false);
    if (!prefersReducedMotion()) player.current?.playVideo();
  };

  useEffect(() => {
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
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          mute: 1,
          controls: 0,
          loop: 1,
          playlist: HERO_VIDEO_ID,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
        },
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
              revealTimer = window.setTimeout(() => setStarted(true), firstReveal ? 3000 : 1600);
              firstReveal = false;
            } else if (e.data === -1 || e.data === 0 || e.data === 3) {
              setStarted(false);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      window.clearTimeout(revealTimer);
      player.current?.destroy();
      player.current = null;
      if (host) host.innerHTML = "";
    };
  }, []);


  return (
    <section id="top" className="relative isolate min-h-[100dvh] overflow-hidden bg-[#1c0c2c] text-white">
      <div className="absolute inset-0 -z-10" aria-label={t.videoLabel} role="img">
        <Image
          src={`https://i.ytimg.com/vi/${HERO_VIDEO_ID}/maxresdefault.jpg`}
          alt=""
          fill
          priority
          sizes="100vw"
          className={`object-cover transition-opacity ${started ? "opacity-0 duration-1000" : "opacity-100 duration-150"}`}
        />
        <div ref={holder} className="yt-cover absolute inset-0 overflow-hidden" aria-hidden />
        {/* Mobile keeps the upper half nearly clear so the video reads; the wash only builds behind the text. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(34_14_52/0.45)_0%,rgb(34_14_52/0)_22%,rgb(34_14_52/0)_45%,rgb(34_14_52/0.94)_100%)] md:bg-[linear-gradient(180deg,rgb(34_14_52/0.5)_0%,rgb(34_14_52/0.1)_35%,rgb(34_14_52/0.35)_60%,rgb(34_14_52/0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_95%,rgb(91_42_134/0.55),transparent_55%)] md:bg-[radial-gradient(ellipse_at_15%_85%,rgb(91_42_134/0.6),transparent_60%)]" />
      </div>

      <Art name="birds" className="pointer-events-none absolute right-[8%] top-[22%] hidden w-40 !opacity-40 [color:#fff] md:block" />

      <div className="mx-auto flex min-h-[100dvh] max-w-[77.5rem] flex-col justify-end gap-5 px-4 pb-6 pt-28 sm:gap-10 sm:px-6 md:pb-12 lg:grid lg:grid-cols-12 lg:items-end lg:gap-8">
        <div className="lg:col-span-7">
          <p data-hero className="mb-3 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/20 backdrop-blur-md sm:mb-5 sm:px-4 sm:py-1.5 sm:text-sm">
            <span>{t.eyebrow}</span>
            <span aria-hidden className="h-3 w-px bg-white/40" />
            <span className="text-white/80">{t.dates}</span>
          </p>
          <h1 data-hero className="font-display leading-[0.95]">
            <span className="block text-[clamp(2.6rem,10.5vw,8.75rem)]">{t.title}</span>
            <span className="mt-1 block text-[clamp(1.6rem,5.4vw,4.5rem)] text-[#D9B865]">{t.subtitle}</span>
          </h1>
          <p data-hero className="mt-3 max-w-[34ch] text-sm text-white/85 sm:mt-6 sm:text-xl">
            {t.launch}
          </p>
          <div data-hero className="mt-4 flex flex-wrap gap-3 sm:mt-8">
            <a
              href="#numeros"
              className="group flex h-10 items-center gap-3 rounded-full bg-white pl-5 pr-1 text-sm font-medium text-[#2A1240] transition-[transform,background-color] hover:bg-[#D9B865] duration-500 ease-[var(--ease-spring)] active:scale-[0.98] sm:h-12 sm:pl-6 sm:pr-1.5 sm:text-[0.9375rem]"
            >
              {t.cta}
              <span className="grid size-8 place-items-center rounded-full bg-[#2A1240] text-white transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-y-0.5 group-hover:scale-105 sm:size-9">
                <ArrowDown size="1rem" />
              </span>
            </a>
            <button
              type="button"
              onClick={openVideo}
              aria-label={t.watch}
              aria-haspopup="dialog"
              className="group relative grid size-10 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/40 backdrop-blur-md transition-[transform,background-color] duration-500 ease-[var(--ease-spring)] hover:scale-105 hover:bg-white hover:text-[#2A1240] active:scale-95 sm:size-12"
            >
              <span aria-hidden className="absolute inset-0 animate-ping rounded-full ring-1 ring-white/40 [animation-duration:2.4s] motion-reduce:hidden" />
              <Play size="1rem" weight="fill" className="translate-x-px" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 lg:flex lg:justify-end">
          <div data-hero className="w-full max-w-md rounded-[1.5rem] bg-white/8 p-1 ring-1 ring-white/20 backdrop-blur-xl sm:rounded-[2rem] sm:p-1.5">
            <div className="rounded-[calc(1.5rem-4px)] bg-[rgb(34_14_52/0.55)] px-4 py-3 shadow-[inset_0_1px_1px_rgb(255_255_255/0.12)] sm:rounded-[calc(2rem-6px)] sm:p-6">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 sm:mb-4">
                <p className="text-xs text-white/80 sm:text-sm">{t.countdown}</p>
                <p className="text-xs font-medium text-[#D9B865] sm:text-sm">{t.dates}</p>
              </div>
              <Countdown start={EVENT_START} end={EVENT_END} labels={t} />
            </div>
          </div>
        </div>
      </div>

      <dialog
        ref={dialog}
        onClose={onClosed}
        onClick={(e) => e.target === e.currentTarget && closeVideo()}
        aria-label={t.videoLabel}
        className="m-auto w-[min(92vw,1100px)] max-w-none overflow-visible bg-transparent p-0 backdrop:bg-[rgb(34_14_52/0.88)] backdrop:backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={closeVideo}
          aria-label={t.close}
          className="absolute -top-14 right-0 grid size-11 place-items-center rounded-full bg-white text-[#2A1240] transition-transform duration-500 ease-[var(--ease-spring)] hover:scale-105 active:scale-95"
        >
          <X size="1.125rem" />
        </button>
        <div className="aspect-video overflow-hidden rounded-[1.5rem] bg-black shadow-2xl ring-1 ring-white/15">
          {open && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${HERO_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={t.videoLabel}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="size-full"
            />
          )}
        </div>
      </dialog>
    </section>
  );
}
