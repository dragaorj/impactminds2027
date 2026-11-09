"use client";

import { useEffect, useState } from "react";
import { Cookie } from "@phosphor-icons/react";
import type { PrivacyCopy } from "@/lib/privacy";
import { readConsent, saveConsent } from "./consent";

const LEAVE_MS = 500;

const btn = "h-10 whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors duration-300 sm:h-7 sm:text-[0.6875rem]";

// LGPD notice, kept small and discreet: necessary cookies always on, optional
// ones only on "Accept". A slim frosted pill in the bottom-left corner, the
// line and both buttons side by side; on phones a full-width card (the line,
// then both buttons) over the blurred page. Shown on every page once the
// intro curtain has lifted. The privacy page
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
    <>
    {/* Phones: the page behind blurs while the notice is up. */}
    <div
      aria-hidden
      className={`consent-ui fixed inset-0 z-[59] bg-[rgb(21_11_32/0.35)] backdrop-blur-sm transition-opacity duration-700 sm:hidden ${
        shown ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    />
    <div
      role="region"
      aria-label={t.label}
      className={`consent-ui fixed inset-x-3 bottom-3 z-[60] rounded-2xl bg-[rgb(42_18_64/0.94)] p-4 text-white sm:inset-x-auto sm:flex sm:w-auto sm:items-center sm:gap-4 sm:rounded-full sm:bg-[rgb(42_18_64/0.9)] sm:py-2 sm:pl-4 sm:pr-2 shadow-[var(--shadow)] ring-1 ring-white/15 backdrop-blur-md transition-[opacity,translate] duration-700 ease-[var(--ease-out-expo)] sm:bottom-5 sm:left-5 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      {/* One line everywhere: on phones the type scales with the screen. */}
      <p className="flex items-center gap-2 whitespace-nowrap text-[clamp(0.625rem,3.05vw,0.8125rem)] leading-snug text-white/80 sm:text-xs sm:text-white/75">
        <Cookie aria-hidden size="1em" weight="light" className="shrink-0 text-[#D9B865] max-sm:size-[1.15em]" />
        <span>
          {t.textShort}{" "}
          <a href={privacyHref} className="font-medium text-white underline decoration-[#D9B865]/70 underline-offset-2 transition-colors hover:text-[#D9B865]">
            {t.linkShort}
          </a>
        </span>
      </p>
      {/* Phones: the two buttons share the full width under the line. */}
      <div className="mt-3 grid shrink-0 grid-cols-2 gap-2 sm:mt-0 sm:flex sm:gap-1.5">
        <button type="button" onClick={() => choose(false)} className={`${btn} ring-1 ring-white/25 hover:bg-white/10`}>
          {t.rejectShort}
        </button>
        <button type="button" onClick={() => choose(true)} className={`${btn} bg-[#D9B865] text-[#2A1240] hover:bg-white`}>
          {t.acceptShort}
        </button>
      </div>
    </div>
    </>
  );
}
