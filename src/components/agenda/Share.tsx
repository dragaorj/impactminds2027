"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import type { Locale } from "@/lib/i18n";
import { agendaViewPath, speakersViewPath } from "@/lib/nav";
import { Segmented, Sheet, fieldBox } from "./ui";

type T = Dict["agendaApp"];
type Screen = "agenda-list" | "agenda-grid" | "speakers-cards" | "speakers-list" | "speakers-photos";

const pathOf = (s: Screen, l: Locale) =>
  s === "agenda-list"
    ? agendaViewPath(l, "list")
    : s === "agenda-grid"
      ? agendaViewPath(l, "grid")
      : speakersViewPath(l, s === "speakers-cards" ? "cards" : s === "speakers-list" ? "list" : "photos");

// The screen the editor is on (to start from it).
function currentScreen(): Screen {
  const p = location.pathname;
  const speakers = /\/(palestrantes|ponentes|speakers)/.test(p);
  if (speakers) return /\/(lista|list)$/.test(p) ? "speakers-list" : /\/(fotos|photos)$/.test(p) ? "speakers-photos" : "speakers-cards";
  return /\/(grade|grilla|grid)$/.test(p) ? "agenda-grid" : "agenda-list";
}

// Share / embed (from the editors' gear menu): pick a screen of the
// platform (the agenda as a list or a grid, the speakers as cards, a list or
// photos) and a language; get its link and the code to embed it in another
// site (the same link with ?embed=1: only the content, no bars).
export default function ShareSheet({ open, onClose, t, lang }: { open: boolean; onClose: () => void; t: T; lang: string }) {
  const [screen, setScreen] = useState<Screen>("agenda-list");
  const [l, setL] = useState<Locale>(lang as Locale);
  const [done, setDone] = useState<"" | "link" | "code">("");
  useEffect(() => {
    if (!open) return;
    setScreen(currentScreen());
    setL(lang as Locale);
    setDone("");
  }, [open, lang]);

  const url = typeof window === "undefined" ? "" : `${location.origin}${pathOf(screen, l)}`;
  const embed = url ? `<iframe src="${url}?embed=1" title="Impact Minds 2027" width="100%" height="900" style="border:0;border-radius:16px" loading="lazy"></iframe>` : "";
  const copy = async (text: string, which: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(which);
    } catch {}
  };

  const screens: { id: Screen; group: string; label: string }[] = [
    { id: "agenda-list", group: t.title, label: t.list },
    { id: "agenda-grid", group: t.title, label: t.grid },
    { id: "speakers-cards", group: t.speakers, label: t.cards },
    { id: "speakers-list", group: t.speakers, label: t.list },
    { id: "speakers-photos", group: t.speakers, label: t.photos },
  ];

  return (
    <Sheet centered open={open} onClose={onClose} label={t.share} closeLabel={t.close}>
      <h2 className="text-2xl font-semibold tracking-tight">{t.share}</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{t.shareLead}</p>

      {/* Which screen */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[t.title, t.speakers].map((g) => (
          <div key={g}>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{g}</span>
            <div className="flex flex-wrap gap-1.5">
              {screens
                .filter((s) => s.group === g)
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={screen === s.id}
                    onClick={() => (setScreen(s.id), setDone(""))}
                    className={`h-9 rounded-full px-3.5 text-sm font-medium transition-colors ${
                      screen === s.id ? "bg-brand text-brand-ink" : "bg-[rgb(118_118_128/0.12)] text-ink-2 hover:text-ink"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Which language */}
      <div className="mt-4">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{t.languages}</span>
        <Segmented
          label={t.languages}
          value={l}
          onChange={(v) => (setL(v), setDone(""))}
          className="w-full sm:w-auto"
          options={(["pt", "es", "en"] as const).map((x) => ({ value: x, label: t.langNames[x] }))}
        />
      </div>

      {(
        [
          ["link", t.link, url],
          ["code", t.embedCode, embed],
        ] as const
      ).map(([key, label, value]) => (
        <div key={key} className="mt-5">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
          <div className="flex gap-2">
            <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} className={`${fieldBox} h-11 min-w-0 flex-1 font-mono text-[13px]`} />
            <button
              type="button"
              onClick={() => copy(value, key)}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-brand-ink transition-[filter] hover:brightness-110"
            >
              {done === key ? <Check size={16} weight="bold" /> : <Copy size={16} />}
              {done === key ? t.copied : t.copy}
            </button>
          </div>
        </div>
      ))}
      <p className="mt-3 text-[13px] text-muted">{t.embedHint}</p>
    </Sheet>
  );
}
