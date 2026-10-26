"use client";

import { useCallback, useSyncExternalStore } from "react";

// Preferences live on <html> data attributes (set before paint by the layout
// script) and are mirrored to localStorage. React reads them back through a
// MutationObserver so every control stays in sync.

export type A11y = { text: 1 | 2 | 3; contrast: boolean; motion: boolean; links: boolean };
export type Prefs = { theme: "light" | "dark"; a11y: A11y };

const DEFAULT_A11Y: A11y = { text: 1, contrast: false, motion: false, links: false };
const SERVER_SNAPSHOT = "light|1|0|0|0";

function readSnapshot() {
  const d = document.documentElement.dataset;
  const stored = readStoredA11y();
  return [
    d.theme === "dark" ? "dark" : "light",
    d.text ?? "1",
    d.contrast === "high" ? 1 : 0,
    stored.motion ? 1 : 0,
    d.links === "on" ? 1 : 0,
  ].join("|");
}

function readStoredA11y(): A11y {
  try {
    return { ...DEFAULT_A11Y, ...JSON.parse(localStorage.getItem("im-a11y") || "{}") };
  } catch {
    return DEFAULT_A11Y;
  }
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true });
  return () => observer.disconnect();
}

export function applyA11y(a11y: A11y) {
  const d = document.documentElement.dataset;
  if (a11y.text > 1) d.text = String(a11y.text);
  else delete d.text;
  if (a11y.contrast) d.contrast = "high";
  else delete d.contrast;
  if (a11y.links) d.links = "on";
  else delete d.links;
  const systemReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (a11y.motion || systemReduce) d.motion = "reduce";
  else delete d.motion;
  try {
    localStorage.setItem("im-a11y", JSON.stringify(a11y));
  } catch {}
  window.dispatchEvent(new Event("im:motion"));
}

export function usePrefs() {
  const snap = useSyncExternalStore(subscribe, readSnapshot, () => SERVER_SNAPSHOT);
  const [theme, text, contrast, motion, links] = snap.split("|");
  const prefs: Prefs = {
    theme: theme as Prefs["theme"],
    a11y: {
      text: Number(text) as A11y["text"],
      contrast: contrast === "1",
      motion: motion === "1",
      links: links === "1",
    },
  };

  const setTheme = useCallback((next: Prefs["theme"]) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("im-theme", next);
    } catch {}
  }, []);

  const setA11y = useCallback((patch: Partial<A11y>) => {
    applyA11y({ ...readStoredA11y(), ...patch });
  }, []);

  const resetA11y = useCallback(() => applyA11y(DEFAULT_A11Y), []);

  return { prefs, setTheme, setA11y, resetA11y };
}

export function prefersReducedMotion() {
  return document.documentElement.dataset.motion === "reduce";
}
