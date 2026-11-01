"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Cookie } from "@phosphor-icons/react";
import type { PrivacyCopy } from "@/lib/privacy";
import { readConsent, saveConsent } from "./consent";

const LEAVE_MS = 500;

// LGPD notice, kept discreet: necessary cookies always on, optional ones only
// on "Accept". On the home page it takes the hero's info bar, the same slot
// as the countdown and music details (#hero-consent; Hero.tsx cross-fades to
// it via "im:consent-bar"), once the intro curtain has lifted. Anywhere else,
// or with the hero scrolled away, the same slim bar floats at the bottom. The
// privacy page can bring it back (im:consent-open).
export default function CookieConsent({ t, privacyHref }: { t: PrivacyCopy["banner"]; privacyHref: string }) {
  const [mode, setMode] = useState<"hero" | "float" | null>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let timer = 0;
    const open = (delay: number) => {
      window.clearTimeout(timer);
      const el = document.getElementById("hero-consent");
      if (el && window.scrollY < window.innerHeight * 0.5) {
        setSlot(el);
        setMode("hero");
        window.dispatchEvent(new CustomEvent("im:consent-bar", { detail: true }));
        return;
      }
      setMode("float");
      timer = window.setTimeout(() => setShown(true), delay);
    };
    const onReady = () => open(700);
    const onAsk = () => open(30);
    window.addEventListener("im:consent-open", onAsk);

    if (!readConsent()) {
      const ready = (window as Window & { __imReady?: boolean }).__imReady === true;
      if (ready || !document.querySelector(".preloader")) open(900);
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
    if (mode === "hero") {
      // The bar cross-fades back to the facts; the content leaves with it.
      window.dispatchEvent(new CustomEvent("im:consent-bar", { detail: false }));
    } else setShown(false);
    window.setTimeout(() => setMode(null), LEAVE_MS);
  };

  if (!mode) return null;

  const body = (
    <div role="region" aria-label={t.label} className="flex h-full items-center gap-3 px-3 text-white sm:gap-4 sm:px-5">
      <span aria-hidden className="hidden size-8 shrink-0 place-items-center rounded-full bg-[#D9B865]/15 text-[#D9B865] ring-1 ring-[#D9B865]/40 sm:grid">
        <Cookie size="1rem" weight="light" />
      </span>
      <p className="min-w-0 flex-1 text-[0.6875rem] leading-snug text-white/80 sm:text-[0.8125rem]">
        <span className="sm:hidden">{t.textShort}</span>
        <span className="max-sm:hidden">{t.text}</span>{" "}
        <a href={privacyHref} className="font-medium text-white underline decoration-[#D9B865]/70 underline-offset-[3px] transition-colors hover:text-[#D9B865]">
          <span className="sm:hidden">{t.linkShort}</span>
          <span className="max-sm:hidden">{t.link}</span>
        </a>
      </p>
      <div className="flex shrink-0 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => choose(false)}
          className="h-8 whitespace-nowrap rounded-full px-3 text-[0.6875rem] font-medium ring-1 ring-white/25 transition-colors duration-300 hover:bg-white/10 sm:h-9 sm:px-4 sm:text-[0.8125rem]"
        >
          <span className="sm:hidden">{t.rejectShort}</span>
          <span className="max-sm:hidden">{t.reject}</span>
        </button>
        <button
          type="button"
          onClick={() => choose(true)}
          className="h-8 whitespace-nowrap rounded-full bg-[#D9B865] px-3 text-[0.6875rem] font-medium text-[#2A1240] transition-colors duration-300 hover:bg-white sm:h-9 sm:px-4 sm:text-[0.8125rem]"
        >
          <span className="sm:hidden">{t.acceptShort}</span>
          <span className="max-sm:hidden">{t.accept}</span>
        </button>
      </div>
    </div>
  );

  if (mode === "hero") return slot ? createPortal(body, slot) : null;

  // Floating: the hero bar's own look, a slim frosted pill at the bottom.
  return (
    <div
      className={`consent-ui fixed inset-x-3 bottom-3 z-[60] mx-auto h-14 max-w-3xl rounded-full bg-[rgb(42_18_64/0.88)] shadow-[var(--shadow)] ring-1 ring-white/20 backdrop-blur-md transition-[opacity,translate] duration-700 ease-[var(--ease-out-expo)] sm:bottom-6 sm:h-16 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      {body}
    </div>
  );
}
