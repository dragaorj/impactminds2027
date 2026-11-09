"use client";

import { useEffect, useState } from "react";
import { Cookie } from "@phosphor-icons/react";
import type { PrivacyCopy } from "@/lib/privacy";
import { readConsent, saveConsent } from "./consent";

const LEAVE_MS = 500;

const btn = "h-7 whitespace-nowrap rounded-full px-3 text-[0.6875rem] font-medium transition-colors duration-300";

// LGPD notice, kept small and discreet: necessary cookies always on, optional
// ones only on "Accept". A slim frosted pill in the bottom-left corner, the
// line and both buttons side by side; on phones a little stacked card. Shown
// on every page once the intro curtain has lifted. The privacy page
// can bring it back (im:consent-open).
export default function CookieConsent({ t, privacyHref }: { t: PrivacyCopy["banner"]; privacyHref: string }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let timer = 0;
    const show = (delay: number) => {
      window.clearTimeout(timer);
      setOpen(true);
      timer = window.setTimeout(() => setShown(true), delay);
    };
    const onReady = () => show(700);
    const onAsk = () => show(30);
    window.addEventListener("im:consent-open", onAsk);

    if (!readConsent()) {
      const ready = (window as Window & { __imReady?: boolean }).__imReady === true;
      if (ready || !document.querySelector(".preloader")) show(900);
      else window.addEventListener("im:ready", onReady, { once: true });
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("im:consent-open", onAsk);
      window.removeEventListener("im:ready", onReady);
    };
  }, []);

  const choose = (analytics: boolean) => {
    saveConsent(analytics);
    setShown(false);
    window.setTimeout(() => setOpen(false), LEAVE_MS);
  };

  if (!open) return null;

  return (
    <div
      role="region"
      aria-label={t.label}
      className={`consent-ui fixed bottom-3 left-3 z-[60] w-[min(16.5rem,calc(100vw-5.5rem))] rounded-2xl bg-[rgb(42_18_64/0.9)] p-3 text-white sm:flex sm:w-auto sm:items-center sm:gap-4 sm:rounded-full sm:py-2 sm:pl-4 sm:pr-2 shadow-[var(--shadow)] ring-1 ring-white/15 backdrop-blur-md transition-[opacity,translate] duration-700 ease-[var(--ease-out-expo)] sm:bottom-5 sm:left-5 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <p className="flex items-start gap-2 text-[0.6875rem] leading-snug text-white/75 sm:items-center sm:whitespace-nowrap sm:text-xs">
        <Cookie aria-hidden size="0.95rem" weight="light" className="mt-px shrink-0 text-[#D9B865]" />
        <span>
          {t.textShort}{" "}
          <a href={privacyHref} className="font-medium text-white underline decoration-[#D9B865]/70 underline-offset-2 transition-colors hover:text-[#D9B865]">
            {t.linkShort}
          </a>
        </span>
      </p>
      <div className="mt-2.5 flex shrink-0 gap-1.5 sm:mt-0">
        <button type="button" onClick={() => choose(false)} className={`${btn} ring-1 ring-white/25 hover:bg-white/10`}>
          {t.rejectShort}
        </button>
        <button type="button" onClick={() => choose(true)} className={`${btn} bg-[#D9B865] text-[#2A1240] hover:bg-white`}>
          {t.acceptShort}
        </button>
      </div>
    </div>
  );
}
