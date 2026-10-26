"use client";

import { useEffect, useState } from "react";

type Labels = { days: string; hours: string; minutes: string; seconds: string; live: string; after: string };

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

type State = { phase: "before"; left: ReturnType<typeof split> } | { phase: "live" } | { phase: "after" };

// Counts down to the first day; between start and end (24 to 27 August) it
// announces the event is on, and after the end it thanks participants.
export default function Countdown({
  start,
  end,
  labels,
  compact = false,
  size = "md",
}: {
  start: string;
  end: string;
  labels: Labels;
  compact?: boolean;
  size?: "md" | "lg";
}) {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const tick = () => {
      const now = Date.now();
      if (now < s) setState({ phase: "before", left: split(s - now) });
      else if (now <= e) setState({ phase: "live" });
      else setState({ phase: "after" });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [start, end]);

  if (state && state.phase !== "before") {
    return (
      <p className={`font-display leading-tight ${compact ? "text-2xl" : "text-[clamp(1.4rem,2.6vw,2rem)]"}`} role="status">
        {state.phase === "live" ? labels.live : labels.after}
      </p>
    );
  }

  const left = state?.phase === "before" ? state.left : null;
  const units = [
    { key: "days", label: labels.days, pad: 3 },
    { key: "hours", label: labels.hours, pad: 2 },
    { key: "minutes", label: labels.minutes, pad: 2 },
    { key: "seconds", label: labels.seconds, pad: 2 },
  ] as const;

  return (
    <dl className={`grid grid-cols-4 ${compact ? "gap-3" : "gap-2 sm:gap-4"}`}>
      {units.map((u) => (
        <div key={u.key} className="flex flex-col items-start">
          <dt className={`order-last mt-1 tracking-wide opacity-75 sm:mt-2 ${size === "lg" ? "text-sm" : "text-[11px] sm:text-xs"}`}>{u.label}</dt>
          <dd
            className={`font-display tabular-nums leading-none ${compact ? "text-3xl" : size === "lg" ? "text-[clamp(2.5rem,4.6vw,4.5rem)]" : "text-[clamp(1.6rem,4.2vw,3.25rem)]"}`}
            aria-hidden={u.key === "seconds" ? true : undefined}
          >
            {left ? String(left[u.key]).padStart(u.pad, "0") : "--"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
