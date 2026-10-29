"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  SpeakerHigh,
  SpeakerLow,
  SpeakerSlash,
  Repeat,
  X,
} from "@phosphor-icons/react";
import { playlist } from "@/lib/site";
import Waveform from "./Waveform";
import { prefersQuiet } from "./prefs";

// Progress ring around the record (viewBox units).
const R = 47;
const C = 2 * Math.PI * R;
const SWAP_MS = 280;
const DEFAULT_VOLUME = 0.3;

// Phones and tablets: iOS keeps every media element at full volume (setting
// it does nothing, and some versions even read the new value back), so on any
// touch device the level goes through Web Audio. Elsewhere the element's own
// volume works and is used; the probe still catches other fixed-volume cases.
let gainNeeded: boolean | undefined;
const needsGain = () => {
  if (gainNeeded === undefined) {
    const probe = document.createElement("audio");
    probe.volume = 0.5;
    gainNeeded = probe.volume !== 0.5 || window.matchMedia("(pointer: coarse)").matches;
  }
  return gainNeeded;
};

type Labels = {
  label: string;
  nowPlaying: string;
  play: string;
  pause: string;
  stop: string;
  prev: string;
  next: string;
  shuffle: string;
  repeat: string;
  hint: string;
  hideControls: string;
  volume: string;
  mute: string;
  unmute: string;
  seek: string;
};

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

// A random track other than `not`.
const pick = (not: number) => {
  if (playlist.length < 2) return 0;
  let i = not;
  while (i === not) i = Math.floor(Math.random() * playlist.length);
  return i;
};

// The site's music, as a vinyl record: the album cover is the label, the
// record turns while a track plays and a gold line around it fills as the
// track advances; when it ends the next one starts (or a random one, with
// shuffle on). Every visit starts on a random track, not the one the visitor
// started on last time. Volume starts at 30% and is remembered once changed.
// Placement follows the countdown ring: in the hero it sits in its slot
// beside the ring ([data-music-slot]) and a click turns the hero's info bar
// into the player (rendered into #hero-music, like the countdown's details);
// once the page scrolls (html[data-ring-raised], set by CountdownRing) it
// fades to the corner stack just above the ring, where a click opens a glass
// panel with the same controls.
// Playback starts after the intro (im:ready). Browsers only allow sound after
// a user gesture, so if that first attempt is refused, the first click, tap
// or key press starts it instead.
export default function MusicPlayer({ labels }: { labels: Labels }) {
  const audio = useRef<HTMLAudioElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ cur: 0, dur: 0 });
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [shuffle, setShuffle] = useState(false);
  // Repeat the current track instead of moving on.
  const [repeat, setRepeat] = useState(false);
  // Corner panel / hero bar.
  const [open, setOpen] = useState(false);

  const [barOpen, setBarOpen] = useState(false);
  const [barEl, setBarEl] = useState<HTMLElement | null>(null);
  const [raised, setRaised] = useState(false);
  // While the corner panel is open (not the hero bar view) the page behind
  // wears the same blurred veil as the bar's menus (html[data-music-open], body::after in globals.css).
  useEffect(() => {
    const d = document.documentElement;
    if (open && raised) d.setAttribute("data-music-open", "");
    else d.removeAttribute("data-music-open");
    return () => d.removeAttribute("data-music-open");
  }, [open, raised]);
  // A one-time hint, the first time the buttons land in the corner.
  const [hint, setHint] = useState(false);
  const hintShown = useRef(false);
  // Once the hint has had its moment, a round X sits atop the corner stack so
  // the visitor can tuck the buttons away (DockToggle).
  const [hintDone, setHintDone] = useState(false);
  const [box, setBox] = useState<{ top: number; left: number; size: number } | null>(null);
  const [swapping, setSwapping] = useState(false);
  const firstPlace = useRef(true);
  // Whether playback should carry on (on a track change, after autoplay).
  const wantPlay = useRef(false);
  // The visitor paused or stopped: never start again on their behalf.
  const userHalted = useRef(false);
  // Something with its own sound is on (see musicDuck): the keys still holding
  // the music down, and whether it was playing when the first one arrived.
  const ducks = useRef(new Set<string>());
  const resumeAfterDuck = useRef(false);
  const fadeFrame = useRef(0);
  const volumeRef = useRef(DEFAULT_VOLUME);
  // Playing silently because the browser refused sound before a gesture.
  const autoMuted = useRef(false);

  const track = playlist[index];
  const total = playlist.length;
  const progress = time.dur > 0 ? Math.min(1, time.cur / time.dur) : 0;

  // The level the visitor hears. iPhone and iPad ignore an audio element's
  // volume (it stays at 1, only the hardware buttons change loudness), so on
  // those the sound goes through a Web Audio gain node instead. The node is
  // built on the visitor's first gesture (iOS starts audio contexts only
  // then); until that moment the element plays at full level as before.
  const graph = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
  const levelRef = useRef(1);
  const level = useCallback((v: number) => {
    const a = audio.current;
    levelRef.current = v;
    if (!a) return;
    if (graph.current) graph.current.gain.gain.value = v;
    else a.volume = v;
  }, []);
  // Call from a gesture: builds the gain path where the element's volume can't
  // be set, or wakes it if the system suspended it.
  const unlock = useCallback(() => {
    const a = audio.current;
    if (graph.current) {
      if (graph.current.ctx.state !== "running") graph.current.ctx.resume().catch(() => {});
      return;
    }
    if (!a || !needsGain()) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    try {
      const ctx = new Ctx();
      const gain = ctx.createGain();
      gain.gain.value = levelRef.current;
      ctx.createMediaElementSource(a).connect(gain).connect(ctx.destination);
      ctx.resume().catch(() => {});
      graph.current = { ctx, gain };
      // From now on the gain alone sets the level (where the element's
      // volume does work, as on Android, the two would multiply).
      a.volume = 1;
    } catch {}
  }, []);

  // iOS only lets audio start on some events (the end of a tap, a click), not
  // on a touch's pointerdown: every one of those makes sure the path runs, so
  // a path built on the wrong event is woken by the next tap.
  useEffect(() => {
    const wake = () => unlock();
    document.addEventListener("touchend", wake, { capture: true, passive: true });
    document.addEventListener("click", wake, true);
    return () => {
      document.removeEventListener("touchend", wake, true);
      document.removeEventListener("click", wake, true);
    };
  }, [unlock]);

  // Glide the heard level to `to` (the volume setting itself is untouched).
  const fadeTo = useCallback((to: number, ms: number, done?: () => void) => {
    const a = audio.current;
    cancelAnimationFrame(fadeFrame.current);
    if (!a) return;
    const from = levelRef.current;
    const t0 = performance.now();
    const step = (now: number) => {
      // A frame's timestamp can precede t0: clamp, or the first step could ask
      // for a negative volume (which throws and stalls the fade).
      const k = Math.min(1, Math.max(0, (now - t0) / ms));
      level(Math.min(1, Math.max(0, from + (to - from) * (1 - Math.pow(1 - k, 2)))));
      if (k < 1) fadeFrame.current = requestAnimationFrame(step);
      else {
        fadeFrame.current = 0;
        done?.();
      }
    };
    fadeFrame.current = requestAnimationFrame(step);
  }, [level]);

  const play = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    unlock();
    wantPlay.current = true;
    userHalted.current = false;
    // Pressing play is the visitor's call: it overrides any ducking.
    ducks.current.clear();
    cancelAnimationFrame(fadeFrame.current);
    fadeFrame.current = 0;
    level(volumeRef.current);
    a.play().catch(() => {});
  }, [level, unlock]);
  const pause = useCallback(() => {
    wantPlay.current = false;
    userHalted.current = true;
    audio.current?.pause();
  }, []);
  const stop = useCallback(() => {
    const a = audio.current;
    wantPlay.current = false;
    userHalted.current = true;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  }, []);
  const next = useCallback(() => setIndex((i) => (shuffle ? pick(i) : (i + 1) % total)), [shuffle, total]);
  const prev = useCallback(() => {
    const a = audio.current;
    // Like any player: a few seconds in, "back" restarts the track.
    if (a && a.currentTime > 3) a.currentTime = 0;
    else setIndex((i) => (shuffle ? pick(i) : (i - 1 + total) % total));
  }, [shuffle, total]);

  // A random first track on every visit, never the one started on last time;
  // and the volume, if the visitor changed it before.
  useEffect(() => {
    let last = -1;
    let stored = NaN;
    try {
      last = Number(localStorage.getItem("im-track") ?? -1);
      stored = Number(localStorage.getItem("im-volume-v6"));
    } catch {}
    const first = pick(last);
    try {
      localStorage.setItem("im-track", String(first));
    } catch {}
    const id = requestAnimationFrame(() => {
      setIndex(first);
      if (Number.isFinite(stored) && stored > 0 && stored <= 1) setVolume(stored);
    });
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    volumeRef.current = volume;
    mutedRef.current = muted;
    const a = audio.current;
    if (!a) return;
    // While ducked or fading, the fade owns the element's volume.
    if (!ducks.current.size && !fadeFrame.current) level(volume);
    a.muted = muted || autoMuted.current;
  }, [volume, muted, level]);

  // Duck: fade out and pause while something else has sound; fade back in
  // once everything has let go (only if it was playing before).
  useEffect(() => {
    const onDuck = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      const first = ducks.current.size === 0;
      ducks.current.add(key);
      if (!first) return;
      const a = audio.current;
      resumeAfterDuck.current = !!a && !a.paused;
      if (a && !a.paused) fadeTo(0, 450, () => a.pause());
    };
    const onUnduck = (e: Event) => {
      if (!ducks.current.delete((e as CustomEvent<string>).detail) || ducks.current.size) return;
      const a = audio.current;
      const resume = resumeAfterDuck.current;
      resumeAfterDuck.current = false;
      if (!a || !resume || userHalted.current) return;
      cancelAnimationFrame(fadeFrame.current);
      fadeFrame.current = 0;
      level(0);
      wantPlay.current = true;
      a.play()
        .then(() => fadeTo(volumeRef.current, 900))
        .catch(() => {
          level(volumeRef.current);
        });
    };
    window.addEventListener("im:music-duck", onDuck);
    window.addEventListener("im:music-unduck", onUnduck);
    return () => {
      window.removeEventListener("im:music-duck", onDuck);
      window.removeEventListener("im:music-unduck", onUnduck);
    };
  }, [fadeTo, level]);
  const changeVolume = (v: number) => {
    unlock();
    setVolume(v);
    setMuted(false);
    try {
      localStorage.setItem("im-volume-v6", String(v));
    } catch {}
  };

  // A new track: load it and keep playing if we were.
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    a.load();
    if (wantPlay.current) a.play().catch(() => {});
  }, [index]);

  // Start after the intro; if the browser refuses sound without a gesture,
  // the first click / tap / key press starts it.
  useEffect(() => {
    let armed = false;
    // First click / tap / key: the sound comes in (fading up), or playback
    // starts if even muted autoplay was refused.
    const onGesture = () => {
      disarm();
      unlock();
      const a = audio.current;
      if (!a || userHalted.current) return;
      if (autoMuted.current) {
        autoMuted.current = false;
        level(0);
        a.muted = mutedRef.current;
        if (a.paused) a.play().catch(() => {});
        fadeTo(volumeRef.current, 900);
      } else if (a.paused) play();
    };
    const disarm = () => {
      if (!armed) return;
      armed = false;
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
      window.removeEventListener("touchend", onGesture, true);
    };
    const start = () => {
      window.removeEventListener("im:ready", start);
      window.clearTimeout(fallback);
      if (userHalted.current) return;
      // The visitor chose to start without music (accessibility menu).
      if (prefersQuiet()) return;
      wantPlay.current = true;
      const a = audio.current;
      if (!a) return;
      const arm = () => {
        armed = true;
        window.addEventListener("pointerdown", onGesture, true);
        window.addEventListener("keydown", onGesture, true);
        window.addEventListener("touchend", onGesture, true);
      };
      // Sound if the browser allows it; otherwise start muted (always allowed)
      // so the record turns from the start, and bring the sound in on the
      // visitor's first gesture.
      a.play().catch(() => {
        autoMuted.current = true;
        a.muted = true;
        a.play().catch(() => {});
        arm();
      });
    };
    window.addEventListener("im:ready", start);
    const fallback = window.setTimeout(start, 4000);
    return () => {
      window.removeEventListener("im:ready", start);
      window.clearTimeout(fallback);
      disarm();
    };
  }, [play, fadeTo, level, unlock]);

  // First arrival in the corner after each page load: point the buttons out
  // for a few seconds; any click dismisses it.
  useEffect(() => {
    if (!raised) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the hint belongs to the corner only
      setHint(false);
      // Cut short by a return to the top: it has had its moment, so the X
      // must be there next time the buttons reach the corner.
      if (hintShown.current) setHintDone(true);
      return;
    }
    if (hintShown.current) return;
    // Marked only when it actually shows (an effect torn down early, as in
    // development's double run, must not use it up).
    const show = window.setTimeout(() => {
      hintShown.current = true;
      setHint(true);
    }, SWAP_MS + 450);
    const end = () => {
      setHint(false);
      setHintDone(true);
    };
    const hide = window.setTimeout(end, SWAP_MS + 5500);
    const dismiss = () => {
      if (hintShown.current) end();
    };
    window.addEventListener("pointerdown", dismiss, { once: true });
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
      window.removeEventListener("pointerdown", dismiss);
    };
  }, [raised]);

  // "Start without music" switched on in the accessibility menu: stop now.
  useEffect(() => {
    const onQuiet = () => pause();
    window.addEventListener("im:music-quiet", onQuiet);
    return () => window.removeEventListener("im:music-quiet", onQuiet);
  }, [pause]);

  // Screen locked, browser minimised or another tab/app in front: stop at
  // once (no fade: frames don't run in a hidden page); back in view, the
  // music picks up again with a fade, unless the visitor had paused it.
  useEffect(() => {
    let hiddenPaused = false;
    const onHide = () => {
      const a = audio.current;
      if (!a || a.paused) return;
      hiddenPaused = true;
      cancelAnimationFrame(fadeFrame.current);
      fadeFrame.current = 0;
      a.pause();
    };
    const onShow = () => {
      const a = audio.current;
      if (!hiddenPaused || !a) return;
      hiddenPaused = false;
      if (userHalted.current || ducks.current.size) return;
      unlock();
      level(0);
      a.play()
        .then(() => fadeTo(volumeRef.current, 700))
        .catch(() => {
          level(volumeRef.current);
        });
    };
    const onVisibility = () => (document.hidden ? onHide() : onShow());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
    };
  }, [fadeTo, level, unlock]);

  // System media controls (lock screen, keyboard media keys).
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: "Impact Minds 2027",
      artwork: [{ src: track.cover, sizes: "500x500", type: "image/svg+xml" }],
    });
    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("stop", stop);
    navigator.mediaSession.setActionHandler("nexttrack", next);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
  }, [track, play, pause, stop, next, prev]);

  // In the hero or in the corner: follow the countdown ring's state.
  useEffect(() => {
    const d = document.documentElement;
    const read = () => setRaised("ringRaised" in d.dataset);
    read();
    const mo = new MutationObserver(read);
    mo.observe(d, { attributes: true, attributeFilter: ["data-ring-raised"] });
    return () => mo.disconnect();
  }, []);

  // The hero bar's music layer (Hero renders it; we fill it).
  useEffect(() => {
    const id = requestAnimationFrame(() => setBarEl(document.getElementById("hero-music")));
    return () => cancelAnimationFrame(id);
  }, []);

  // Hero bar: tell Hero to show the player (or not); the countdown taking the
  // bar closes it here, and leaving the hero closes it too.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("im:music-bar", { detail: barOpen && !raised }));
  }, [barOpen, raised]);
  useEffect(() => {
    const onCountdown = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail) setBarOpen(false);
    };
    window.addEventListener("im:countdown-bar", onCountdown);
    return () => window.removeEventListener("im:countdown-bar", onCountdown);
  }, []);

  // Where the button sits (fixed, px): the visible hero slot, or the corner
  // just above the countdown ring (same axis, 12px gap).
  useEffect(() => {
    let frame = 0;
    let until = 0;
    let dead = false;
    let unswap = 0;
    let swap = 0;
    const put = (top: number, left: number, size: number) =>
      setBox((b) =>
        b && Math.abs(b.top - top) < 0.5 && Math.abs(b.left - left) < 0.5 && b.size === size ? b : { top, left, size },
      );
    const measure = () => {
      if (!raised) {
        const slot = [...document.querySelectorAll<HTMLElement>("[data-music-slot]")].find(
          (el) => el.getBoundingClientRect().width > 0,
        );
        if (slot) {
          const r = slot.getBoundingClientRect();
          put(r.top, r.left, r.height);
          return;
        }
      }
      const sm = window.innerWidth >= 640;
      const ring = sm ? 80 : 64; // the countdown ring in the corner
      const ringAbove = sm ? 100 : 80; // its bottom edge from the screen's bottom
      const axisRight = sm ? 60 : 44; // the stack's centre from the right edge
      const size = sm ? 60 : 52;
      const w = document.documentElement.clientWidth;
      put(window.innerHeight - ringAbove - ring - 12 - size, w - axisRight - size / 2, size);
    };
    const tick = () => {
      measure();
      frame = performance.now() < until ? requestAnimationFrame(tick) : 0;
    };
    const follow = (ms = 2600) => {
      if (dead) return;
      until = Math.max(until, performance.now() + ms);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    // A resize settles over a few frames (the scroll effects recompute after a
    // short debounce, sizes switch at breakpoints): follow the slot until it has.
    const schedule = () => follow(1200);
    if (firstPlace.current) {
      firstPlace.current = false;
      follow(4000);
    } else {
      // Moving between the hero and the corner is a fade, not a trip.
      setSwapping(true);
      setOpen(false);
      setBarOpen(false);
      swap = window.setTimeout(() => {
        measure();
        unswap = requestAnimationFrame(() => setSwapping(false));
        if (!raised) follow(700);
      }, SWAP_MS);
    }
    // In the hero the slot can move at any time (window resized or dragged,
    // the bar opening, fonts, scroll effects settling): follow it on every
    // frame for as long as the button sits there. Only a moved box re-renders.
    if (!raised) follow(Infinity);
    const onReady = () => follow();
    window.addEventListener("im:ready", onReady);
    window.addEventListener("resize", schedule);
    // The hero bar opening or folding moves the slot (Hero.tsx): follow it.
    const onShift = () => follow(1000);
    window.addEventListener("im:hero-shift", onShift);
    document.fonts?.ready.then(() => follow(600));
    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(unswap);
      window.clearTimeout(swap);
      window.removeEventListener("im:ready", onReady);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("im:hero-shift", onShift);
    };
  }, [raised]);

  // Panel or bar: Escape or a click elsewhere closes it.
  useEffect(() => {
    if (!open && !barOpen) return;
    const close = () => {
      setOpen(false);
      setBarOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (wrap.current?.contains(t) || t.closest?.("#hero-music")) return;
      close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, barOpen]);

  const iconBtn =
    "grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,color,transform] duration-300 hover:text-gold active:scale-90";
  const VolumeIcon = muted || volume === 0 ? SpeakerSlash : volume < 0.5 ? SpeakerLow : SpeakerHigh;

  // Shared pieces of the corner panel and the hero bar.
  const cover = (size: string) => (
    <div className={`relative shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15 ${size}`}>
      <Image src={track.cover} alt="" fill unoptimized className="object-cover" />
    </div>
  );
  const eq = (
    <span className={`music-eq ${playing ? "" : "is-paused"}`} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
  // Shuffle · previous · play/pause · next · repeat (toggles turn gold when on).
  const controls = (hover: string, big: string, icon: string, on: string) => (
    <>
      <button
        type="button"
        onClick={() => setShuffle((v) => !v)}
        aria-label={labels.shuffle}
        aria-pressed={shuffle}
        className={`${iconBtn} ${hover} ${shuffle ? on : ""}`}
      >
        <Shuffle size={icon} weight={shuffle ? "bold" : "regular"} />
      </button>
      <button type="button" onClick={prev} aria-label={labels.prev} className={`${iconBtn} ${hover}`}>
        <SkipBack size={icon} weight="fill" />
      </button>
      <button
        type="button"
        onClick={playing ? pause : play}
        aria-label={playing ? labels.pause : labels.play}
        className={`mx-0.5 grid shrink-0 place-items-center rounded-full bg-sun text-sun-ink shadow-[0_8px_24px_rgb(217_184_101/0.35)] transition-transform duration-300 ease-[var(--ease-spring)] hover:scale-105 active:scale-95 ${big}`}
      >
        {playing ? <Pause size={icon} weight="fill" /> : <Play size={icon} weight="fill" className="translate-x-[2%]" />}
      </button>
      <button type="button" onClick={next} aria-label={labels.next} className={`${iconBtn} ${hover}`}>
        <SkipForward size={icon} weight="fill" />
      </button>
      <button
        type="button"
        onClick={() => setRepeat((v) => !v)}
        aria-label={labels.repeat}
        aria-pressed={repeat}
        className={`${iconBtn} ${hover} ${repeat ? on : ""}`}
      >
        <Repeat size={icon} weight={repeat ? "bold" : "regular"} />
      </button>
    </>
  );
  // Seek bar as the track's waveform (Waveform decodes the real peaks).
  const seek = (bars: number, cls: string, tone: "light" | "theme", active = true) => (
    <Waveform
      src={track.src}
      seed={index}
      bars={bars}
      progress={progress}
      current={time.cur}
      duration={time.dur}
      label={labels.seek}
      valueText={`${fmt(time.cur)} / ${fmt(time.dur)}`}
      onSeek={(sec) => {
        const el = audio.current;
        if (el) el.currentTime = sec;
      }}
      tone={tone}
      active={active}
      className={cls}
    />
  );
  const volumeCtl = (hover: string, width: string) => (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? labels.unmute : labels.mute}
        aria-pressed={muted}
        className={`${iconBtn} ${hover}`}
      >
        <VolumeIcon size="1.05rem" />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        aria-label={labels.volume}
        onChange={(e) => changeVolume(Number(e.target.value))}
        className={`music-range ${width}`}
        style={{ "--p": `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
      />
    </div>
  );
  // The hint square (112px) centred over the button, but kept 8px clear of
  // the screen's right edge.
  const hintReach =
    box && typeof window !== "undefined"
      ? Math.max(0, Math.min((112 - box.size) / 2, document.documentElement.clientWidth - (box.left + box.size) - 8))
      : 0;
  const counter = `${String(index + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}`;

  // The hero bar's player: one line on desktop (cover, track, controls, seek,
  // volume); on phones the track and the main controls, with the seek line
  // along the bottom edge.
  const bar = (
    <div className="relative flex h-full items-center gap-2 px-3.5 text-white sm:gap-4 sm:px-6">
      {cover("size-9 sm:size-11")}
      <div className="min-w-0 flex-1 sm:w-36 sm:flex-none">
        <p className="flex items-center gap-1.5 whitespace-nowrap text-[0.625rem] font-medium uppercase tracking-[0.14em] text-[#D9B865]">
          {eq}
          {counter}
        </p>
        <p className="truncate font-display text-base leading-tight sm:text-lg">{track.title}</p>
        <p className="truncate text-xs text-white/70">{track.artist}</p>
      </div>
      <div className="flex shrink-0 items-center gap-0 sm:gap-1">
        <span className="hidden sm:contents">{controls("hover:bg-white/10", "size-10", "1.05rem", "text-[#D9B865]")}</span>
        <span className="contents sm:hidden">{controls("size-8! hover:bg-white/10", "size-8", "0.95rem", "text-[#D9B865]")}</span>
      </div>
      <div className="hidden min-w-0 flex-1 items-center gap-3 text-[0.6875rem] tabular-nums text-white/70 md:flex">
        <span className="shrink-0">{fmt(time.cur)}</span>
        {seek(28, "h-7 min-w-0 flex-1 gap-[1.5px]", "light", barOpen)}
        <span className="shrink-0">{fmt(time.dur)}</span>
      </div>
      <div className="hidden shrink-0 lg:block">{volumeCtl("hover:bg-white/10", "music-range-light w-16 min-w-0")}</div>
      {/* Phones and tablets: the track's progress as a thin line along the bottom. */}
      <span aria-hidden className="absolute inset-x-8 bottom-2 h-0.5 overflow-hidden rounded-full bg-white/15 md:hidden">
        <span className="block h-full bg-[#D9B865]" style={{ width: `${progress * 100}%` }} />
      </span>
    </div>
  );

  return (
    <>
      {barEl && createPortal(bar, barEl)}
      <div
        ref={wrap}
        data-dock="1"
        className={`fixed z-[36] transition-opacity ease-out ${box && !swapping ? "opacity-100" : "pointer-events-none opacity-0"}`}
        style={{
          transitionDuration: `${SWAP_MS}ms`,
          ...(box ? { top: box.top, left: box.left, width: box.size, height: box.size } : {}),
        }}
      >
        <audio
          ref={audio}
          src={track.src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime({ cur: e.currentTarget.currentTime, dur: e.currentTarget.duration || 0 })}
          onLoadedMetadata={(e) => setTime({ cur: 0, dur: e.currentTarget.duration || 0 })}
          onEnded={(e) => {
            wantPlay.current = true;
            if (repeat) {
              e.currentTarget.currentTime = 0;
              e.currentTarget.play().catch(() => {});
            } else next();
          }}
        />

        {/* Hint above the corner stack (music on top, countdown below it). */}
        {raised && (
          <p
            role="status"
            aria-hidden={!hint}
            style={{ right: -hintReach }}
            className={`pointer-events-none absolute bottom-[calc(100%+0.9rem)] flex min-h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-2xl bg-surface p-2.5 text-center text-[0.6875rem] font-medium leading-snug text-ink shadow-[var(--shadow)] ring-1 ring-line transition-[opacity,translate] duration-500 ease-[var(--ease-out-expo)] ${
              hint ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
            }`}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 shrink-0 fill-gold">
              <path d="M12 0c.9 6.4 5 10.6 12 12-7 1.4-11.1 5.6-12 12-.9-6.4-5-10.6-12-12C7 10.6 11.1 6.4 12 0Z" />
            </svg>
            {labels.hint}
            {/* Pointer down at the music button's centre: a solid triangle that
                covers the box's outline where they meet and carries it only
                along its two outer edges, so there's no seam. */}
            <svg
              aria-hidden
              viewBox="0 0 14 8"
              className="absolute -bottom-[7px] h-2 w-3.5 overflow-visible"
              style={{ right: hintReach + (box?.size ?? 56) / 2 - 7 }}
            >
              <path d="M-0.5 -1 H14.5 L7 7 Z" className="fill-surface" />
              <path d="M0 0 L7 7 L14 0" fill="none" strokeWidth="1" className="stroke-line" />
            </svg>
          </p>
        )}

        {/* After the hint: a round X above the stack tucks the buttons away. */}
        {raised && (
          <button
            type="button"
            aria-label={labels.hideControls}
            tabIndex={hintDone && !hint ? 0 : -1}
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new Event("im:dock-hide"));
            }}
            className={`absolute bottom-[calc(100%+0.6rem)] left-1/2 grid size-7 -translate-x-1/2 place-items-center rounded-full text-muted ring-1 ring-line transition-[opacity,scale,background-color,color] duration-500 ease-[var(--ease-spring)] hover:bg-surface/80 hover:text-ink hover:opacity-100 active:scale-90 ${
              hintDone && !hint ? "scale-100 opacity-60" : "pointer-events-none scale-50 opacity-0"
            }`}
          >
            <X size="0.75rem" weight="bold" />
          </button>
        )}

        {/* Corner panel (after scrolling). */}
        {open && raised && (
          <div
            id="music-panel"
            role="dialog"
            aria-label={labels.label}
            className="absolute bottom-[calc(100%+0.75rem)] right-0 w-[min(19rem,calc(100vw-1.5rem))] origin-bottom-right animate-[menuDrop_0.5s_var(--ease-out-expo)_both] rounded-[1.75rem] bg-surface/80 p-4 text-ink shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150 sm:bottom-0 sm:right-[calc(100%+0.75rem)] sm:origin-bottom-right"
          >
            <div className="flex items-center gap-3.5">
              {cover("size-16 rounded-2xl")}
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-gold">
                  {eq}
                  {labels.nowPlaying} · {counter}
                </p>
                <p className="mt-1 truncate font-display text-xl leading-tight">{track.title}</p>
                <p className="truncate text-sm text-ink-2">{track.artist}</p>
              </div>
            </div>
            {seek(56, "mt-4 h-9 w-full gap-[2px]", "theme")}
            <div className="mt-1 flex justify-between text-[0.6875rem] tabular-nums text-muted">
              <span>{fmt(time.cur)}</span>
              <span>{fmt(time.dur)}</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1">{controls("text-ink hover:bg-ink/8", "mx-1 size-12", "1.1rem", "text-gold")}</div>
            <div className="mt-2 px-1 [&_input]:flex-1 [&>div]:flex">{volumeCtl("text-ink hover:bg-ink/8", "flex-1")}</div>
          </div>
        )}

        <button
          type="button"
          aria-label={`${labels.label}: ${track.title} · ${track.artist}`}
          aria-expanded={raised ? open : barOpen}
          aria-controls={raised ? "music-panel" : "hero-music"}
          onClick={() => (raised ? setOpen((v) => !v) : setBarOpen((v) => !v))}
          className={`group relative grid size-full place-items-center rounded-full shadow-[var(--shadow)] ring-1 transition-[transform,background-color,box-shadow] duration-500 ease-[var(--ease-spring)] hover:scale-105 active:scale-95 ${
            raised ? "bg-surface/60 ring-line backdrop-blur-xl backdrop-saturate-150" : "bg-[rgb(34_14_52/0.55)] ring-white/15"
          }`}
        >
          <span aria-hidden className={`fab-tip ${raised ? "fab-tip-side" : ""}`}>
            {labels.label}
          </span>
          {/* A vinyl record: grooves, a sheen and the album cover as the label,
              turning while the track plays. */}
          <span className={`music-disc vinyl absolute inset-[9%] rounded-full ${playing ? "" : "is-paused"}`}>
            <span className="absolute inset-[29%] overflow-hidden rounded-full ring-1 ring-black/40">
              <Image key={track.cover} src={track.cover} alt="" fill unoptimized className="object-cover" />
            </span>
            <span className="absolute left-1/2 top-1/2 size-[7%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#120818] ring-1 ring-white/25" />
          </span>
          {/* Static light across the grooves (doesn't turn with the record). */}
          <span aria-hidden className="vinyl-sheen pointer-events-none absolute inset-[9%] rounded-full" />
          {/* Progress: a gold line around the record, filling as the track plays. */}
          <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" strokeWidth={2.2} className={raised ? "stroke-ink/15" : "stroke-white/20"} />
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              className="stroke-sun transition-[stroke-dashoffset] duration-300 ease-linear"
            />
          </svg>
          {/* Paused: a play mark over the label. */}
          {!playing && (
            <span aria-hidden className="absolute grid size-[34%] place-items-center rounded-full bg-[rgb(28_11_44/0.7)] text-white ring-1 ring-white/30">
              <Play size="50%" weight="fill" className="translate-x-[2%]" />
            </span>
          )}
        </button>
      </div>
    </>
  );
}
