"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowsOut, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import FullVideo from "./FullVideo";
import { prefersReducedMotion } from "./prefs";
import { keepLooping, loadYouTube, loopVars, type YTPlayer } from "./youtube";

type Labels = {
  soundOn: string;
  soundOff: string;
  watch: string;
  close: string;
  videoLabel: string;
  play: string;
  pause: string;
};

const pill =
  "group inline-flex h-12 items-center gap-2.5 rounded-full btn-outline p-1.5 pr-5 text-[0.9375rem] font-medium transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] active:scale-[0.97] disabled:opacity-50";
const pillIcon =
  "grid size-9 place-items-center rounded-full bg-brand text-brand-ink transition-colors duration-500 group-hover:bg-brand-ink group-hover:text-brand";

// Inline video that plays muted on a loop (unless motion is reduced). One
// button lets the visitor turn the sound on in place; the other opens the full
// video with sound in a lightbox (our own controls, no YouTube chrome).
export default function VideoPanel({ videoId, labels }: { videoId: string; labels: Labels }) {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    let firstReveal = true;
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
            if (e.data === 1) {
              timer = window.setTimeout(() => setStarted(true), firstReveal ? 4000 : 2200);
              firstReveal = false;
            }
            else if (e.data === -1 || e.data === 0 || e.data === 2 || e.data === 3) setStarted(false);
          },
        },
      });
    });

    const stopLoop = keepLooping(
      () => player.current,
      () => {
        window.clearTimeout(timer);
        setStarted(false);
        timer = window.setTimeout(() => setStarted(true), 2200);
      },
    );

    return () => {
      stopLoop();
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

      <FullVideo
        videoId={videoId}
        open={open}
        onClose={onClosed}
        labels={{
          videoLabel: labels.videoLabel,
          close: labels.close,
          play: labels.play,
          pause: labels.pause,
          soundOn: labels.soundOn,
          soundOff: labels.soundOff,
        }}
      />
    </>
  );
}
