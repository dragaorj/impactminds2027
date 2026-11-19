"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowsOut, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import FullVideo from "./FullVideo";
import NativeLoop, { type NativeLoopHandle } from "./NativeLoop";
import { prefersReducedMotion } from "./prefs";
import { keepLooping, keepPlaying, loadYouTube, loopVars, type YTPlayer } from "./youtube";

type Labels = {
  soundOn: string;
  soundOff: string;
  watch: string;
  close: string;
  videoLabel: string;
  play: string;
  pause: string;
  videoError: string;
  retry: string;
  onYouTube: string;
};

const pill =
  "group inline-flex h-12 items-center gap-2.5 rounded-full btn-outline p-1.5 pr-5 text-[0.9375rem] font-medium transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] active:scale-[0.97] disabled:opacity-50";
const pillIcon =
  "grid size-9 place-items-center rounded-full bg-brand text-brand-ink transition-colors duration-500 group-hover:bg-sun-ink group-hover:text-sun";

// Inline video that plays muted on a loop (unless motion is reduced). One
// button lets the visitor turn the sound on in place; the other opens the full
// video with sound in a lightbox (our own controls, no YouTube chrome).
export default function VideoPanel({ videoId, src, labels }: { videoId: string; src?: string; labels: Labels }) {
  const holder = useRef<HTMLDivElement>(null);
  const native = useRef<NativeLoopHandle>(null);
  const player = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  // The player never got ready (YouTube blocked, no network): the sound
  // button goes away instead of staying greyed out; the poster stays.
  const [stuck, setStuck] = useState(false);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const [open, setOpen] = useState(false);

  // The loop should run whenever the lightbox is closed.
  const wanted = useRef(false);
  const lightboxOpen = useRef(false);

  // The YouTube player is set up early, so the loop is already running (and
  // revealed) by the time the visitor reaches the section: right after the
  // page has loaded (once the browser is idle), or sooner if the visitor starts
  // scrolling or the panel comes within two screens.
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = holder.current;
    if (src || !el) return;
    const kinds = ["scroll", "wheel", "touchstart", "pointerdown", "keydown"] as const;
    let idleId = 0;
    const go = () => {
      setNear(true);
      stop();
    };
    const io = new IntersectionObserver(([e]) => e.isIntersecting && go(), { rootMargin: "200% 0px" });
    const soon = () => {
      idleId = window.setTimeout(go, 600);
    };
    const stop = () => {
      io.disconnect();
      kinds.forEach((k) => window.removeEventListener(k, go));
      window.removeEventListener("load", soon);
      window.clearTimeout(idleId);
    };
    io.observe(el);
    kinds.forEach((k) => window.addEventListener(k, go, { passive: true, once: true }));
    if (document.readyState === "complete") soon();
    else window.addEventListener("load", soon, { once: true });
    return stop;
  }, [src]);

  useEffect(() => {
    if (src || !near) return;
    let cancelled = false;
    let timer = 0;
    let revealed = false;
    const giveUp = window.setTimeout(() => !cancelled && setStuck(true), 12000);
    const host = holder.current;
    const mount = document.createElement("div");
    host?.appendChild(mount);
    const autoplay = !prefersReducedMotion();
    // It keeps playing off screen too: every resume after a pause makes
    // YouTube flash its title and controls, so the loop is never paused.
    wanted.current = autoplay;
    // Reduce motion switched on in the site's panel: the loop stops now.
    const onMotion = () => {
      if (!prefersReducedMotion()) return;
      wanted.current = false;
      player.current?.pauseVideo();
    };
    window.addEventListener("im:motion", onMotion);

    loadYouTube().then((YT) => {
      if (cancelled) return;
      player.current = new YT.Player(mount, {
        host: "https://www.youtube-nocookie.com",
        videoId,
        playerVars: loopVars(videoId, autoplay),
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.mute();
            window.clearTimeout(giveUp);
            setStuck(false);
            setReady(true);
            if (wanted.current) e.target.playVideo();
          },
          onStateChange: (e: { data: number }) => {
            // Same trick as the hero: keep the poster up until playback is steady
            // so YouTube's start/resume chrome never shows. Once the video has
            // been revealed, a short buffer (3) leaves things as they are: the
            // last frame stays instead of flashing the poster.
            if (e.data === 3 && revealed) return;
            window.clearTimeout(timer);
            if (e.data === 1) {
              // The poster lifts once playback is steady (YouTube's own start chrome
              // is gone by then); short, as the loop started before the section.
              timer = window.setTimeout(() => setStarted(true), revealed ? 1500 : 2000);
              revealed = true;
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
        window.clearTimeout(timer);
        setStarted(false);
        timer = window.setTimeout(() => setStarted(true), 3500);
      },
    );

    const stopWatchdog = keepPlaying(
      () => player.current,
      () => wanted.current && !lightboxOpen.current,
      () => {
        window.clearTimeout(timer);
        setStarted(false);
        timer = window.setTimeout(() => setStarted(true), 3500);
      },
    );

    return () => {
      window.clearTimeout(giveUp);
      window.removeEventListener("im:motion", onMotion);
      stopWatchdog();
      stopLoop();
      cancelled = true;
      window.clearTimeout(timer);
      player.current?.destroy();
      player.current = null;
      if (host) host.innerHTML = "";
    };
  }, [videoId, src, near]);

  const toggleSound = () => {
    if (src) {
      native.current?.setMuted(!muted);
      setMuted(!muted);
      return;
    }
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
    lightboxOpen.current = true;
    native.current?.pause();
    player.current?.pauseVideo();
    setOpen(true);
  };

  const onClosed = () => {
    lightboxOpen.current = false;
    setOpen(false);
    if (prefersReducedMotion()) return;
    native.current?.play();
    player.current?.playVideo();
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
            className={`z-10 object-cover transition-opacity ${started || src ? "opacity-0 duration-1000" : "opacity-100 duration-150"}`}
          />
          {src ? (
            <NativeLoop ambient ref={native} src={src} poster={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`} />
          ) : (
            <div ref={holder} className="yt-cover yt-full yt-panel absolute inset-0 overflow-hidden" aria-hidden />
          )}
        </div>
      </div>

      {/* Controls sit under the video, never over the picture. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!(stuck && !ready && !src) && (
        <button type="button" onClick={toggleSound} disabled={!ready && !src} aria-pressed={!muted} className={pill}>
          <span className={pillIcon}>{muted ? <SpeakerSlash size="0.95rem" /> : <SpeakerHigh size="0.95rem" />}</span>
          {muted ? labels.soundOn : labels.soundOff}
        </button>
        )}
        <button type="button" onClick={openFull} aria-haspopup="dialog" className={pill}>
          <span className={pillIcon}>
            <ArrowsOut size="0.95rem" />
          </span>
          {labels.watch}
        </button>
      </div>

      <FullVideo
        videoId={videoId}
        src={src}
        open={open}
        onClose={onClosed}
        labels={{
          videoLabel: labels.videoLabel,
          close: labels.close,
          play: labels.play,
          pause: labels.pause,
          soundOn: labels.soundOn,
          soundOff: labels.soundOff,
          videoError: labels.videoError,
          retry: labels.retry,
          onYouTube: labels.onYouTube,
        }}
      />
    </>
  );
}
