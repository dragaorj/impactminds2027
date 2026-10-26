"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowsOut, SpeakerHigh, SpeakerSlash, X } from "@phosphor-icons/react";
import { prefersReducedMotion } from "./prefs";
import { loadYouTube, loopVars, type YTPlayer } from "./youtube";

type Labels = { soundOn: string; soundOff: string; watch: string; close: string; videoLabel: string };

const pill =
  "group inline-flex h-12 items-center gap-2.5 rounded-full btn-outline p-1.5 pr-5 text-[0.9375rem] font-medium transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] active:scale-[0.97] disabled:opacity-50";
const pillIcon =
  "grid size-9 place-items-center rounded-full bg-brand text-brand-ink transition-colors duration-500 group-hover:bg-brand-ink group-hover:text-brand";

// Inline video that plays muted on a loop (unless motion is reduced). One
// button lets the visitor turn the sound on in place; the other opens the full
// video, with sound and YouTube's controls, in a lightbox.
export default function VideoPanel({ videoId, labels }: { videoId: string; labels: Labels }) {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const host = holder.current;
    const mount = document.createElement("div");
    host?.appendChild(mount);
    const autoplay = !prefersReducedMotion();

    loadYouTube().then((YT) => {
      if (cancelled) return;
      player.current = new YT.Player(mount, {
        host: "https://www.youtube-nocookie.com",
        videoId,
        playerVars: loopVars(videoId, autoplay),
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.mute();
            setReady(true);
            if (autoplay) e.target.playVideo();
          },
          onStateChange: (e: { data: number }) => {
            // Same trick as the hero: keep the poster up until playback is steady
            // so YouTube's start-up chrome never shows.
            window.clearTimeout(timer);
            if (e.data === 1) timer = window.setTimeout(() => setStarted(true), 1800);
            else if (e.data === -1 || e.data === 0 || e.data === 3) setStarted(false);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      player.current?.destroy();
      player.current = null;
      if (host) host.innerHTML = "";
    };
  }, [videoId]);

  const toggleSound = () => {
    const p = player.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      p.setVolume(80);
      p.playVideo();
    } else p.mute();
    setMuted(!muted);
  };

  const openFull = () => {
    player.current?.pauseVideo();
    setOpen(true);
    dialog.current?.showModal();
  };

  const onClosed = () => {
    setOpen(false);
    if (!prefersReducedMotion()) player.current?.playVideo();
  };

  return (
    <>
      <div className="rounded-[2rem] bg-ink/[0.04] p-1.5 ring-1 ring-line">
        <div className="relative isolate aspect-video overflow-hidden rounded-[calc(2rem-6px)] bg-block">
          <Image
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt=""
            fill
            sizes="(min-width:1024px) 58vw, 100vw"
            className={`z-10 object-cover transition-opacity ${started ? "opacity-0 duration-1000" : "opacity-100 duration-150"}`}
          />
          <div ref={holder} className="yt-cover absolute inset-0 overflow-hidden" aria-hidden />
        </div>
      </div>

      {/* Controls sit under the video, never over the picture. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={toggleSound} disabled={!ready} aria-pressed={!muted} className={pill}>
          <span className={pillIcon}>{muted ? <SpeakerSlash size="0.95rem" /> : <SpeakerHigh size="0.95rem" />}</span>
          {muted ? labels.soundOn : labels.soundOff}
        </button>
        <button type="button" onClick={openFull} aria-haspopup="dialog" className={pill}>
          <span className={pillIcon}>
            <ArrowsOut size="0.95rem" />
          </span>
          {labels.watch}
        </button>
      </div>

      <dialog
        ref={dialog}
        onClose={onClosed}
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        aria-label={labels.videoLabel}
        className="m-auto w-[min(92vw,1100px)] max-w-none overflow-visible bg-transparent p-0 backdrop:bg-[rgb(34_14_52/0.9)] backdrop:backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label={labels.close}
          className="absolute -top-14 right-0 grid size-11 place-items-center rounded-full bg-white text-[#2A1240] transition-transform duration-500 ease-[var(--ease-spring)] hover:scale-105 active:scale-95"
        >
          <X size="1.125rem" />
        </button>
        <div className="aspect-video overflow-hidden rounded-[1.5rem] bg-black shadow-2xl ring-1 ring-white/15">
          {open && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={labels.videoLabel}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="size-full"
            />
          )}
        </div>
      </dialog>
    </>
  );
}
