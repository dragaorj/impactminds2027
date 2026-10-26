"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { prefersReducedMotion } from "./prefs";

export type NativeLoopHandle = { setMuted(m: boolean): void; pause(): void; play(): void };

// Self-hosted background video: muted, looping, inline, with no controls of
// any kind. Autoplay is skipped when the visitor asked for reduced motion
// (the poster frame shows instead).
const NativeLoop = forwardRef<NativeLoopHandle, { src: string; poster?: string; className?: string }>(function NativeLoop(
  { src, poster, className = "" },
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

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = true;
    if (!prefersReducedMotion()) void v.play().catch(() => {});
  }, [src]);

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
