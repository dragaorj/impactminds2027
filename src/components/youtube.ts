"use client";

// Minimal typing and loader for the YouTube IFrame API, shared by the hero
// background and the "What is Impact Minds" video.

export type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  setVolume(v: number): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
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

// Resolves once the API is ready; safe to call from several components.
export function loadYouTube(): Promise<YTNamespace> {
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

// Muted, chrome-less player options for background-style video. There is no
// YouTube loop/playlist: letting YouTube restart the video brings back its
// title bar and transport controls, so looping is done by keepLooping().
export const loopVars = (_videoId: string, autoplay: boolean) => ({
  autoplay: autoplay ? 1 : 0,
  mute: 1,
  controls: 0,
  playsinline: 1,
  rel: 0,
  modestbranding: 1,
  iv_load_policy: 3,
  disablekb: 1,
  fs: 0,
});

// Seeks back to the start just before the end so the video never "ends".
// onLoop fires right before the jump so callers can cover the frame.
export function keepLooping(getPlayer: () => YTPlayer | null, onLoop: () => void) {
  const id = window.setInterval(() => {
    const p = getPlayer();
    if (!p) return;
    try {
      const d = p.getDuration();
      if (d > 1 && p.getCurrentTime() >= d - 0.6) {
        onLoop();
        p.seekTo(0, true);
      }
    } catch {}
  }, 200);
  return () => window.clearInterval(id);
}
