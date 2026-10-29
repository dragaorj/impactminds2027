"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { prefersReducedMotion } from "./prefs";

export type NativeLoopHandle = { setMuted(m: boolean): void; pause(): void; play(): void };

// How often an ambient loop checks it is really moving, and how long without a
// new frame on screen counts as frozen.
const WATCH_MS = 1500;
const FROZEN_MS = 2000;

// Self-hosted background video: muted, looping, inline, with no controls of
// any kind. Autoplay is skipped when the visitor asked for reduced motion
// (the poster frame shows instead).
const NativeLoop = forwardRef<NativeLoopHandle, { src: string; poster?: string; className?: string; ambient?: boolean }>(function NativeLoop(
  { src, poster, className = "", ambient = false },
  ref,
) {
  const video = useRef<HTMLVideoElement>(null);
  // Paused on purpose by the page (e.g. while the full video is open): the
  // loop's own recovery leaves it alone until play() is called again.
  const held = useRef(false);
  const resumeRef = useRef<() => void>(() => {});

  useImperativeHandle(ref, () => ({
    setMuted: (m) => {
      if (!video.current) return;
      video.current.muted = m;
      if (!m) void video.current.play().catch(() => {});
    },
    pause: () => {
      held.current = true;
      video.current?.pause();
    },
    play: () => {
      held.current = false;
      resumeRef.current();
    },
  }));

  // Start the loop. An ambient loop (one that should simply always be running
  // while in view) also looks after itself: it starts again whenever it may
  // have been left still (data arriving after a refused or aborted first play,
  // as on a language switch; the page restored from the back/forward cache;
  // the tab back in front), rests while scrolled out of sight (decoding video
  // nobody sees is the heaviest thing a page can do), and a watchdog re-syncs
  // it if frames stop reaching the screen while it is meant to be playing (a
  // decoder stall, or a frame stuck after a big repaint such as a theme switch).
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = true;
    let onScreen = true;
    const resume = () => {
      if (v.paused && onScreen && !held.current && !prefersReducedMotion() && !document.hidden) void v.play().catch(() => {});
    };
    resumeRef.current = resume;
    resume();
    if (!ambient) return;

    const onVisible = () => !document.hidden && resume();
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) resume();
      else v.pause();
    });
    io.observe(v);

    // Frames actually shown (requestVideoFrameCallback), or, where that is
    // missing, the clock moving.
    let lastFrame = performance.now();
    let lastTime = v.currentTime;
    let frameCb = 0;
    const hasFrameCb = typeof v.requestVideoFrameCallback === "function";
    const onFrame = () => {
      lastFrame = performance.now();
      frameCb = v.requestVideoFrameCallback(onFrame);
    };
    if (hasFrameCb) frameCb = v.requestVideoFrameCallback(onFrame);
    const watch = window.setInterval(() => {
      const meant = onScreen && !held.current && !document.hidden && !prefersReducedMotion();
      if (!meant) {
        lastFrame = performance.now();
        return;
      }
      if (v.paused) return resume();
      if (!hasFrameCb && v.currentTime !== lastTime) lastFrame = performance.now();
      lastTime = v.currentTime;
      if (performance.now() - lastFrame < FROZEN_MS || v.readyState < 2) return;
      // Frozen: a tiny seek makes the decoder hand over fresh frames.
      lastFrame = performance.now();
      try {
        v.currentTime = (v.currentTime + 0.05) % (v.duration || Infinity);
      } catch {}
      void v.play().catch(() => {});
    }, WATCH_MS);

    v.addEventListener("canplay", resume);
    window.addEventListener("pageshow", resume);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      io.disconnect();
      window.clearInterval(watch);
      if (frameCb && hasFrameCb) v.cancelVideoFrameCallback(frameCb);
      v.removeEventListener("canplay", resume);
      window.removeEventListener("pageshow", resume);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [src, ambient]);

  return (
    <video
      ref={video}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      controls={false}
      aria-hidden
      className={`absolute inset-0 size-full object-cover ${className}`}
    />
  );
});

export default NativeLoop;
