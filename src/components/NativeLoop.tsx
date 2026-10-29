"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { prefersReducedMotion } from "./prefs";

export type NativeLoopHandle = { setMuted(m: boolean): void; pause(): void; play(): void };

// Self-hosted background video: muted, looping, inline, with no controls of
// any kind. Autoplay is skipped when the visitor asked for reduced motion
// (the poster frame shows instead).
const NativeLoop = forwardRef<NativeLoopHandle, { src: string; poster?: string; className?: string; ambient?: boolean }>(function NativeLoop(
  { src, poster, className = "", ambient = false },
  ref,
) {
  const video = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    setMuted: (m) => {
      if (!video.current) return;
      video.current.muted = m;
      if (!m) void video.current.play();
    },
    pause: () => video.current?.pause(),
    play: () => void video.current?.play(),
  }));

  // Start the loop. An ambient loop (the hero's background, never paused by
  // the visitor) is also restarted whenever it may have been left still: data
  // arriving after a refused or aborted first play (as on a language switch, a
  // full page load), the page restored from the back/forward cache, or the tab
  // coming back into view. It also rests while scrolled out of sight:
  // decoding a large video nobody sees is the heaviest thing a page can do.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = true;
    let onScreen = true;
    const resume = () => {
      if (v.paused && onScreen && !prefersReducedMotion() && !document.hidden) void v.play().catch(() => {});
    };
    resume();
    if (!ambient) return;
    const onVisible = () => !document.hidden && resume();
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) resume();
      else v.pause();
    });
    io.observe(v);
    v.addEventListener("canplay", resume);
    window.addEventListener("pageshow", resume);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      io.disconnect();
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
