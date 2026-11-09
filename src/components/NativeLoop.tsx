"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { prefersReducedMotion } from "./prefs";
import InlineScript from "./InlineScript";

export type NativeLoopHandle = { setMuted(m: boolean): void; pause(): void; play(): void };

// How often an ambient loop checks it is really moving, and how long without a
// new frame on screen counts as frozen.
const WATCH_MS = 1500;
const FROZEN_MS = 2000;

// Starts the video just before it (deferLoad) once the page has loaded (its
// scripts first: 5 MB of video would otherwise hold them up on a slow line),
// muted, unless motion is reduced (html[data-motion], set by the prefs script).
const START_SOON = `(function(){var v=document.currentScript.previousElementSibling;if(!v||document.documentElement.dataset.motion==="reduce")return;if(v.hasAttribute("data-hero-video"))v.addEventListener("playing",function(){window.__imHeroVideo=true;dispatchEvent(new Event("im:hero-video"))},{once:true});function go(){v.preload="auto";v.muted=true;var p=v.play();if(p)p.catch(function(){})}if(document.readyState==="complete")go();else addEventListener("load",go,{once:true})})();`;

// Self-hosted background video: muted, looping, inline, with no controls of
// any kind. Autoplay is skipped when the visitor asked for reduced motion
// (the poster frame shows instead).
const NativeLoop = forwardRef<
  NativeLoopHandle,
  { src: string; poster?: string; className?: string; ambient?: boolean; deferLoad?: boolean; announce?: boolean }
>(function NativeLoop({ src, poster, className = "", ambient = false, deferLoad = false, announce = false }, ref) {
  const video = useRef<HTMLVideoElement>(null);
  // deferLoad: the file is requested just after the page's first frame (not
  // in the same breath as what has to appear first), but without waiting for
  // the whole page to load, so it is already playing when the opening curtain
  // lifts, even on a phone.
  const [loadable, setLoadable] = useState(!deferLoad);
  useEffect(() => {
    if (!deferLoad) return;
    let t = 0;
    const frame = requestAnimationFrame(() => (t = window.setTimeout(() => setLoadable(true), 0)));
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(t);
    };
  }, [deferLoad]);
  // announce: tell the page when the loop is really moving ("im:hero-video",
  // and window.__imHeroVideo for late listeners); the opening curtain waits
  // for it.
  useEffect(() => {
    const v = video.current;
    if (!announce || !v) return;
    const onPlaying = () => {
      (window as Window & { __imHeroVideo?: boolean }).__imHeroVideo = true;
      window.dispatchEvent(new Event("im:hero-video"));
    };
    // Already rolling (started by the inline script before this ran).
    if (!v.paused && v.readyState >= 3) onPlaying();
    v.addEventListener("playing", onPlaying);
    return () => v.removeEventListener("playing", onPlaying);
  }, [announce]);
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
  }, [src, ambient, loadable]);

  // With deferLoad the file is named from the start but held back
  // (preload="none"); the tiny script right after the element starts it just
  // after the first frame, before the page's own code has even loaded. (On a
  // client-side render the effect above does the same.)
  return (
    <>
      <video
        ref={video}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload={loadable ? "auto" : "none"}
        disablePictureInPicture
        disableRemotePlayback
        controls={false}
        aria-hidden
        data-hero-video={announce ? "" : undefined}
        suppressHydrationWarning
        className={`absolute inset-0 size-full object-cover ${className}`}
      />
      {deferLoad && <InlineScript html={START_SOON} />}
    </>
  );
});

export default NativeLoop;
