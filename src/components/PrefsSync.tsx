"use client";

import { useLayoutEffect } from "react";
import { restorePrefs } from "./prefs";

// Keeps theme and accessibility attributes on <html> across language switches.
export default function PrefsSync({ lang }: { lang: string }) {
  useLayoutEffect(() => {
    restorePrefs();
  }, [lang]);
  return null;
}
