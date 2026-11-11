"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ShareNetwork } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { Sheet, fieldBox } from "./ui";

type T = Dict["agendaApp"];

// The current view's own link, and the code to embed it in another site (the
// same link with ?embed=1: only the content, no bars).
// `ask`: another control (a phone menu) opens it by changing the number;
// `triggerClassName` can hide the round button where that menu stands in.
export default function ShareButton({ t, ask = 0, triggerClassName = "" }: { t: T; ask?: number; triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<"" | "link" | "code">("");
  const [url, setUrl] = useState("");

  const show = () => {
    const u = new URL(location.href);
    u.searchParams.delete("s");
    u.searchParams.delete("embed");
    setUrl(u.toString());
    setDone("");
    setOpen(true);
  };
  useEffect(() => {
    if (ask) show();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask]);
  const embed = (() => {
    if (!url) return "";
    const u = new URL(url);
    u.searchParams.set("embed", "1");
    return `<iframe src="${u.toString()}" title="Impact Minds 2027" width="100%" height="900" style="border:0;border-radius:16px" loading="lazy"></iframe>`;
  })();
  const copy = async (text: string, which: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(which);
    } catch {}
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        title={t.share}
        aria-label={t.share}
        className={`platform-chrome ${triggerClassName} grid size-11 shrink-0 place-items-center rounded-full bg-[rgb(118_118_128/0.12)] text-ink-2 transition-colors hover:bg-[rgb(118_118_128/0.2)] hover:text-ink`}
      >
        <ShareNetwork size={18} />
      </button>
      <Sheet centered open={open} onClose={() => setOpen(false)} label={t.share} closeLabel={t.close}>
        <h2 className="text-2xl font-semibold tracking-tight">{t.share}</h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{t.shareLead}</p>
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
    </>
  );
}
