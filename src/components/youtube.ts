"use client";

// Minimal typing and loader for the YouTube IFrame API, shared by the hero
// background and the "What is Impact Minds" video.

export type YTPlayer = {
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

// Muted, chrome-less, looping player options for background-style video.
export const loopVars = (videoId: string, autoplay: boolean) => ({
  autoplay: autoplay ? 1 : 0,
  mute: 1,
  controls: 0,
  loop: 1,
  playlist: videoId,
  playsinline: 1,
  rel: 0,
  modestbranding: 1,
  iv_load_policy: 3,
  disablekb: 1,
  fs: 0,
});
