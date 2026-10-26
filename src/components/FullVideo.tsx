"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play, SpeakerHigh, SpeakerSlash, X } from "@phosphor-icons/react";
import { loadYouTube, type YTPlayer } from "./youtube";

type Labels = {
  videoLabel: string;
  close: string;
  play: string;
  pause: string;
  soundOn: string;
  soundOff: string;
};

const ctrl =
  "group inline-flex h-12 items-center gap-2.5 rounded-full bg-white/10 p-1.5 pr-5 text-[0.9375rem] font-medium text-white ring-1 ring-white/25 backdrop-blur-md transition-[transform,background-color] duration-500 ease-[var(--ease-spring)] hover:bg-white/20 active:scale-[0.97]";
const ctrlIcon = "grid size-9 place-items-center rounded-full bg-white text-[#2A1240]";

// Full video with sound in a lightbox, with no YouTube chrome at any moment:
// the player runs with controls=0, the visitor uses our buttons, and the poster
// covers the frame whenever YouTube would draw anything of its own (start,
// buffering, pause, end).
export default function FullVideo({
  videoId,
  src,
  open,
  onClose,
  labels,
}: {
  videoId: string;
  src?: string;
  open: boolean;
  onClose: () => void;
  labels: Labels;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [steady, setSteady] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (!open || src) return;
    let cancelled = false;
    let timer = 0;
    const host = holder.current;
    const mount = document.createElement("div");
    host?.appendChild(mount);

    loadYouTube().then((YT) => {
      if (cancelled) return;
      player.current = new YT.Player(mount, {
        host: "https://www.youtube-nocookie.com",
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.unMute();
            e.target.setVolume(85);
            e.target.playVideo();
          },
          onStateChange: (e: { data: number }) => {
            window.clearTimeout(timer);
            setPlaying(e.data === 1);
            if (e.data === 1) timer = window.setTimeout(() => setSteady(true), 3500);
            else setSteady(false);
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
      setPlaying(false);
      setSteady(false);
      setMuted(false);
    };
  }, [open, videoId, src]);

  const togglePlay = () => {
    const v = video.current;
    if (src && v) {
      if (v.paused) void v.play();
      else v.pause();
      return;
    }
    const p = player.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  };

  const toggleSound = () => {
    if (src && video.current) {
      video.current.muted = !muted;
      setMuted(!muted);
      return;
    }
    const p = player.current;
    if (!p) return;
    if (muted) p.unMute();
    else p.mute();
    setMuted(!muted);
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-label={labels.videoLabel}
      className="m-auto w-[min(92vw,70rem)] max-w-none overflow-visible bg-transparent p-0 backdrop:bg-[rgb(34_14_52/0.92)] backdrop:backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={labels.close}
        className="absolute -top-14 right-0 grid size-11 place-items-center rounded-full bg-white text-[#2A1240] transition-transform duration-500 ease-[var(--ease-spring)] hover:scale-105 active:scale-95"
      >
        <X size="1.125rem" />
      </button>

      <div className="relative isolate aspect-video overflow-hidden rounded-[1.5rem] bg-black shadow-2xl ring-1 ring-white/15">
        {src ? (
          open && (
            <video
              ref={video}
              src={src}
              autoPlay
              playsInline
              controls={false}
              disablePictureInPicture
              onPlay={() => {
                setPlaying(true);
                setSteady(true);
              }}
              onPause={() => {
                setPlaying(false);
                setSteady(false);
              }}
              onEnded={() => {
                setPlaying(false);
                setSteady(false);
              }}
              className="absolute inset-0 size-full object-cover"
            />
          )
        ) : (
          <div ref={holder} className="yt-cover yt-full absolute inset-0 overflow-hidden" aria-hidden />
        )}
        {/* Poster + our own play button cover every moment YouTube shows chrome. */}
        <button
          type="button"
          onClick={togglePlay}
          tabIndex={steady ? -1 : 0}
          aria-label={labels.play}
          className={`absolute inset-0 z-10 grid place-items-center transition-opacity ${
            steady ? "pointer-events-none opacity-0 duration-700" : "opacity-100 duration-150"
          }`}
        >
          <Image src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`} alt="" fill sizes="70rem" className="object-cover" />
          <span className="relative grid size-20 place-items-center rounded-full bg-white/90 text-[#2A1240] shadow-2xl">
            <Play size="1.75rem" weight="fill" className="translate-x-0.5" />
          </span>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={togglePlay} aria-pressed={playing} className={ctrl}>
          <span className={ctrlIcon}>{playing ? <Pause size="0.95rem" weight="fill" /> : <Play size="0.95rem" weight="fill" />}</span>
          {playing ? labels.pause : labels.play}
        </button>
        <button type="button" onClick={toggleSound} aria-pressed={!muted} className={ctrl}>
          <span className={ctrlIcon}>{muted ? <SpeakerSlash size="0.95rem" /> : <SpeakerHigh size="0.95rem" />}</span>
          {muted ? labels.soundOn : labels.soundOff}
        </button>
      </div>
    </dialog>
  );
}
