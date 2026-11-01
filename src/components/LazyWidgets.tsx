"use client";

import dynamic from "next/dynamic";

// The corner widgets only ever render in the browser (their buttons are
// portals into the hero slots or the corner), so their code, the heaviest on
// the page, loads in its own chunk instead of with everything the first paint
// needs. They are up long before the intro curtain lifts.
export const MusicPlayer = dynamic(() => import("./MusicPlayer"), { ssr: false });
export const CountdownRing = dynamic(() => import("./CountdownRing"), { ssr: false });
