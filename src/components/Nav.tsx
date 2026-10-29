"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, ArrowRight, Check, GlobeSimple, Minus, Moon, PersonArmsSpread, Plus, Sun } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { locales, type Locale } from "@/lib/i18n";
import { links } from "@/lib/site";
import { usePrefs } from "./prefs";

type Props = { lang: Locale; nav: Dict["nav"]; controls: Dict["controls"] };

const iconBtn =
  "grid size-10 place-items-center rounded-full text-ink transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:bg-sun hover:text-sun-ink active:scale-[0.96]";

// Same buttons while the bar sits transparent over the hero video.
const iconBtnOnVideo =
  "grid size-10 place-items-center rounded-full text-white transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:bg-sun hover:text-sun-ink active:scale-[0.96]";

// Language switch: a compact button with the current language that opens a
// small menu of the three (on click, tap or Enter; a click outside or Escape closes it).
// Picking one is a real page load on purpose: client-side switching kept
// hidden copies of every visited language in the DOM (same ids, stale
// animations), which made things vanish. To keep it instant, the other
// languages are prefetched and the scroll position is handed over
// (sessionStorage "im-switch"): the new page restores it and skips the intro
// and all entrance animations (html[data-switch]).
// Each language in its own words, shown small under its name in the page's
// language, so a visitor can find theirs whatever the page is in.
const NATIVE: Record<Locale, string> = { pt: "Português", es: "Español", en: "English" };

function LangSwitch({
  lang,
  label,
  names,
  onVideo = false,
  onOpenChange,
}: {
  lang: Locale;
  label: string;
  names: Record<Locale, string>;
  onVideo?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  // Only one of the bar's popovers at a time (menu, accessibility, language):
  // each says "im:popover" when it opens, and the others close.
  useEffect(() => {
    if (open) window.dispatchEvent(new CustomEvent("im:popover", { detail: "lang" }));
    onOpenChange?.(open);
  }, [open, onOpenChange]);
  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== "lang") setOpen(false);
    };
    window.addEventListener("im:popover", onOther);
    return () => window.removeEventListener("im:popover", onOther);
  }, []);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className="relative"
    >
      <button
        type="button"
        aria-label={`${label}: ${names[lang]}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`group relative flex h-10 items-center gap-1.5 rounded-full pl-2.5 pr-3 text-[0.9375rem] font-medium uppercase leading-none tracking-[0.06em] transition-[background-color,color] duration-500 ease-[var(--ease-spring)] ${
          open ? "bg-sun text-sun-ink" : onVideo ? "text-white hover:bg-sun hover:text-sun-ink" : "text-ink hover:bg-sun hover:text-sun-ink"
        }`}
      >
        <GlobeSimple aria-hidden size="1.1875rem" weight="light" className="shrink-0" />
        <span className="translate-y-[0.5px]">{lang}</span>
        <span aria-hidden className="fab-tip fab-tip-below normal-case tracking-normal">
          {label}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 pt-2">
          {/* Same double-bezel glass card as the menu and the accessibility panel. */}
          <div className="w-64 origin-top-right animate-[menuDrop_0.5s_var(--ease-out-expo)_both] rounded-[2rem] bg-surface/95 p-1.5 shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150">
            <div className="relative isolate overflow-hidden rounded-[calc(2rem-6px)] bg-ink/[0.03] px-1.5 pb-1.5 pt-4 shadow-[inset_0_1px_1px_rgb(255_255_255/0.08)]">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-20 -z-10 size-48 rounded-full bg-[radial-gradient(closest-side,rgb(217_184_101/0.22),transparent)]"
              />
              <p className="mb-1 flex items-center gap-3 px-3 text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-muted">
                {label}
                <span aria-hidden className="h-px flex-1 bg-[linear-gradient(90deg,var(--sun),transparent)] opacity-60" />
              </p>
              <ul aria-label={label}>
                {locales.map((l, i) => {
                  const on = l === lang;
                  return (
                    <li key={l} className="animate-[menuItem_0.5s_var(--ease-out-expo)_both]" style={{ animationDelay: `${60 + i * 50}ms` }}>
                      <a
                        href={`/${l}`}
                        hrefLang={l}
                        lang={l}
                        aria-current={on ? "true" : undefined}
                        onClick={(e) => {
                          if (on) {
                            e.preventDefault();
                            setOpen(false);
                            return;
                          }
                          try {
                            sessionStorage.setItem("im-switch", String(Math.round(window.scrollY)));
                          } catch {}
                          document.cookie = `im-lang=${l};path=/;max-age=31536000;samesite=lax`;
                        }}
                        className="group flex items-center gap-3 rounded-[1.25rem] px-3 py-2.5 transition-colors duration-500 hover:bg-sun/10 focus-visible:bg-sun/10 active:bg-sun/10"
                      >
                        <span className="w-6 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-gold">{l}</span>
                        <span
                          className={`flex-1 font-display text-[1.3125rem] leading-tight transition-[translate,color] duration-500 ease-[var(--ease-spring)] group-hover:translate-x-1 group-hover:text-gold ${
                            on ? "text-gold" : "text-ink"
                          }`}
                        >
                          {names[l]}
                          {names[l] !== NATIVE[l] && (
                            <span lang={l} className="mt-1 block font-sans text-[0.6875rem] font-normal leading-none text-muted">
                              {NATIVE[l]}
                            </span>
                          )}
                        </span>
                        <span
                          aria-hidden
                          className={`grid size-9 shrink-0 place-items-center rounded-full ring-1 transition-[background-color,color,box-shadow] duration-500 ${
                            on
                              ? "bg-sun/15 text-gold shadow-[inset_0_1px_1px_rgb(255_255_255/0.12)] ring-sun/55"
                              : "text-ink-2 ring-line group-hover:bg-sun group-hover:text-sun-ink group-hover:ring-sun"
                          }`}
                        >
                          {on ? (
                            <Check size="0.9rem" weight="bold" />
                          ) : (
                            <ArrowRight size="0.9rem" className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-rotate-45" />
                          )}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
      {locales
        .filter((l) => l !== lang)
        .map((l) => (
          <link key={`pf-${l}`} rel="prefetch" href={`/${l}`} as="document" />
        ))}
    </div>
  );
}

// A small two/three-way choice in the accessibility menu (theme, language).
function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; href?: string; lang?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-ink">
      <span>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex rounded-full bg-ink/5 p-1 ring-1 ring-line">
        {options.map((o) => {
          const on = o.value === value;
          const cls = `rounded-full px-3 py-1.5 text-xs font-medium transition-[color,background-color,box-shadow] duration-300 ${
            on ? "bg-sun/15 text-gold shadow-[inset_0_1px_1px_rgb(255_255_255/0.12)] ring-1 ring-sun/55" : "text-ink-2 hover:text-gold"
          }`;
          return o.href ? (
            <a
              key={o.value}
              href={o.href}
              hrefLang={o.lang}
              role="radio"
              aria-checked={on}
              onClick={(e) => {
                if (on) e.preventDefault();
                else onChange(o.value);
              }}
              className={cls}
            >
              {o.label}
            </a>
          ) : (
            <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} className={cls}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-[1.25rem] px-3 py-3 text-left text-sm text-ink transition-colors duration-300 hover:bg-sun/10"
    >
      {label}
      <span aria-hidden className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-sun" : "bg-ink/15 ring-1 ring-line"}`}>
        <span
          className={`absolute top-1 size-4 rounded-full shadow-sm transition-[transform,background-color] ${checked ? "bg-sun-ink" : "bg-ink/70"} duration-500 ease-[var(--ease-spring)] ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

export default function Nav({ lang, nav, controls }: Props) {
  const { prefs, setTheme, setA11y, resetA11y } = usePrefs();
  const [menuOpen, setMenuOpen] = useState(false);
  // Phones: the menu has two tabs, the site's sections and accessibility.
  const [menuTab, setMenuTab] = useState<"nav" | "a11y">("nav");
  const [panelOpen, setPanelOpen] = useState(false);
  // Tooltips (.fab-tip, here and on the corner buttons) go away the moment
  // their button is pressed and stay away until the pointer leaves it.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const host = (e.target as Element).closest?.(".group");
      if (host?.querySelector(":scope > .fab-tip")) host.setAttribute("data-tip-off", "");
    };
    const onOut = (e: PointerEvent) => {
      // Touch fires pointerout right after the tap while :hover can stick
      // (iOS): there the tooltip simply stays away.
      if (e.pointerType !== "mouse") return;
      const host = (e.target as Element).closest?.("[data-tip-off]");
      if (host && !host.contains(e.relatedTarget as Node | null)) host.removeAttribute("data-tip-off");
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointerout", onOut, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerout", onOut, true);
    };
  }, []);
  const [langOpen, setLangOpen] = useState(false);
  // One popover at a time: the menu and the accessibility panel shut each
  // other, and both answer the language menu ("im:popover", see LangSwitch).
  useEffect(() => {
    if (panelOpen || menuOpen) window.dispatchEvent(new CustomEvent("im:popover", { detail: "nav" }));
  }, [panelOpen, menuOpen]);
  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail === "nav") return;
      setPanelOpen(false);
      setMenuOpen(false);
    };
    window.addEventListener("im:popover", onOther);
    return () => window.removeEventListener("im:popover", onOther);
  }, []);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelBtnRef = useRef<HTMLButtonElement>(null);

  const items = [
    { href: "#conexoes", label: nav.agenda2026 },
    { href: "#palestrantes", label: nav.speakers2026 },
    { href: "#edicoes", label: nav.editions },
  ];

  useEffect(() => {
    if (!panelOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPanelOpen(false);
      setMenuOpen(false);
      panelBtnRef.current?.focus();
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelOpen && !panelRef.current?.contains(t) && !panelBtnRef.current?.contains(t)) setPanelOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [panelOpen, menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  // The bar only materialises once the page leaves the top of the hero (96px),
  // read from the scroll position (Safari reports it during momentum scrolling,
  // while observer callbacks there can arrive late).
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const read = () => setScrolled(window.scrollY > 96);
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, []);

  const isDark = prefs.theme === "dark";
  const onVideo = !scrolled;
  const btn = onVideo ? iconBtnOnVideo : iconBtn;

  // The accessibility options: in the panel under the bar's button, and on
  // phones in the menu's second tab (id keeps the two label ids apart).
  const a11yOptions = (id: string) => (
    <>
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-ink">
        <span id={`${id}-text-size`}>{controls.textSize}</span>
        <div className="flex items-center gap-1" role="group" aria-labelledby={`${id}-text-size`}>
          <button
            type="button"
            className={iconBtn + " size-9 ring-1 ring-line disabled:opacity-40"}
            aria-label={controls.smaller}
            disabled={prefs.a11y.text <= 1}
            onClick={() => setA11y({ text: Math.max(1, prefs.a11y.text - 1) as 1 | 2 | 3 })}
          >
            <Minus size="1rem" />
          </button>
          <span className="w-8 text-center tabular-nums" aria-live="polite">
            {[100, 112, 125][prefs.a11y.text - 1]}%
          </span>
          <button
            type="button"
            className={iconBtn + " size-9 ring-1 ring-line disabled:opacity-40"}
            aria-label={controls.larger}
            disabled={prefs.a11y.text >= 3}
            onClick={() => setA11y({ text: Math.min(3, prefs.a11y.text + 1) as 1 | 2 | 3 })}
          >
            <Plus size="1rem" />
          </button>
        </div>
      </div>
      <Toggle label={controls.contrast} checked={prefs.a11y.contrast} onChange={(v) => setA11y({ contrast: v })} />
      <Toggle label={controls.motion} checked={prefs.a11y.motion} onChange={(v) => setA11y({ motion: v })} />
      <Toggle label={controls.links} checked={prefs.a11y.links} onChange={(v) => setA11y({ links: v })} />
      <Toggle label={controls.scrollbar} checked={prefs.a11y.scrollbar} onChange={(v) => setA11y({ scrollbar: v })} />
      <Toggle
        label={controls.facts}
        checked={prefs.a11y.facts}
        onChange={(v) => {
          setA11y({ facts: v });
          // The hero bar opens or folds: the floating buttons follow their slots.
          window.dispatchEvent(new Event("im:hero-shift"));
        }}
      />
      <Toggle
        label={controls.noMusic}
        checked={prefs.a11y.quiet}
        onChange={(v) => {
          setA11y({ quiet: v });
          // Turned on: the music stops now too.
          if (v) window.dispatchEvent(new Event("im:music-quiet"));
        }}
      />
      {/* Saved defaults, per visitor: theme (localStorage) and
        language (cookie read on arrival); picking a language
        also switches the page now. */}
      <div className="mt-1 border-t border-line pt-1">
        <Choice
          label={controls.defaultTheme}
          value={prefs.theme}
          onChange={setTheme}
          options={[
            { value: "dark", label: controls.dark },
            { value: "light", label: controls.light },
          ]}
        />
        <Choice
          label={controls.defaultLanguage}
          value={lang}
          onChange={(l) => {
            try {
              sessionStorage.setItem("im-switch", String(Math.round(window.scrollY)));
            } catch {}
            document.cookie = `im-lang=${l};path=/;max-age=31536000;samesite=lax`;
          }}
          options={locales.map((l) => ({ value: l, label: l.toUpperCase(), href: `/${l}`, lang: l }))}
        />
      </div>
      <button
        type="button"
        onClick={resetA11y}
        className="mt-2 flex w-full items-center gap-2.5 rounded-[1.25rem] bg-ink/5 px-4 py-3.5 text-left text-sm text-ink transition-colors duration-300 hover:bg-sun/12 active:bg-sun/12"
      >
        <ArrowCounterClockwise aria-hidden size="1.125rem" weight="light" className="shrink-0 text-gold" />
        {controls.reset}
      </button>
    </>
  );

  return (
    <>
      <a
        href="#conteudo"
        className="fixed left-4 top-4 z-[80] -translate-y-24 rounded-full bg-brand px-5 py-3 text-sm font-medium text-brand-ink focus:translate-y-0"
      >
        {nav.skip}
      </a>


      <header
        className={`fixed inset-x-0 z-[42] mx-auto max-w-[132rem] px-3 transition-[top] duration-700 ease-[var(--ease-out-expo)] sm:px-8 lg:px-[5vw] ${
          scrolled ? "top-3 sm:top-4" : "top-3 sm:top-6"
        }`}
        data-hero
      >
        <div
          className={`mx-auto flex h-16 items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2 transition-[max-width,background-color,box-shadow,backdrop-filter] duration-700 ease-[var(--ease-out-expo)] ${
            scrolled ? "max-w-[30rem]" : "max-w-full"
          } ${
            scrolled
              ? "bg-surface/75 shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-md"
              : "bg-transparent shadow-none ring-1 ring-transparent backdrop-blur-0"
          }`}
        >
          <a
            href={links.latimpacto}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block h-7 w-[7.6rem] shrink-0 sm:h-8 sm:w-[8.7rem]"
            aria-label="Latimpacto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/latimpacto-white.svg"
              alt=""
              className={`absolute inset-0 size-full transition-opacity duration-500 ${onVideo ? "opacity-100" : "opacity-0 dark:opacity-100"}`}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/latimpacto.svg"
              alt=""
              className={`absolute inset-0 size-full transition-opacity duration-500 ${onVideo ? "opacity-0" : "opacity-100 dark:opacity-0"}`}
            />
          </a>

          <div className="flex items-center gap-1">
            <LangSwitch lang={lang} label={controls.language} names={controls.languages} onVideo={onVideo} onOpenChange={setLangOpen} />
            {/* Phones keep just the language and the menu; these two live in the menu there. */}
            <button
              type="button"
              className={btn + " group relative max-sm:hidden"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? controls.themeToLight : controls.themeToDark}
            >
              {isDark ? <Sun size="1.25rem" weight="light" className="icon-sun" /> : <Moon size="1.25rem" weight="light" className="icon-moon" />}
              <span aria-hidden className="fab-tip fab-tip-below">
                {isDark ? controls.themeToLight : controls.themeToDark}
              </span>
            </button>

            <div className="relative">
              <button
                ref={panelBtnRef}
                type="button"
                className={btn + " group relative max-sm:hidden"}
                aria-label={controls.a11yOpen}
                aria-expanded={panelOpen}
                aria-controls="a11y-panel"
                onClick={() => {
                  setMenuOpen(false);
                  setPanelOpen((v) => !v);
                }}
              >
                <PersonArmsSpread size="1.3125rem" weight="light" className="icon-person" />
                <span aria-hidden className="fab-tip fab-tip-below">
                  {controls.a11yTitle}
                </span>
              </button>
              {panelOpen && (
                <div
                  ref={panelRef}
                  id="a11y-panel"
                  role="dialog"
                  aria-label={controls.a11yTitle}
                  className="fixed inset-x-3 top-[5.25rem] origin-top-right animate-[menuDrop_0.55s_var(--ease-out-expo)_both] rounded-[2rem] bg-surface/95 p-1.5 shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150 sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-[22rem]"
                >
                  {/* Same double-bezel glass card as the menu, gold glow included. */}
                  <div className="relative isolate overflow-hidden rounded-[calc(2rem-6px)] bg-ink/[0.03] px-2 pb-2 pt-5 shadow-[inset_0_1px_1px_rgb(255_255_255/0.08)]">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-16 -top-20 -z-10 size-56 rounded-full bg-[radial-gradient(closest-side,rgb(217_184_101/0.22),transparent)]"
                    />
                    <p className="mb-2 flex items-center gap-3 px-3 text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-muted">
                      {controls.a11yTitle}
                      <span aria-hidden className="h-px flex-1 bg-[linear-gradient(90deg,var(--sun),transparent)] opacity-60" />
                    </p>
                    {a11yOptions("panel")}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className={btn + " group relative"}
              aria-label={menuOpen ? nav.closeMenu : nav.openMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => {
                setMenuTab("nav");
                setPanelOpen(false);
                setMenuOpen((v) => !v);
              }}
            >
              <span aria-hidden className="fab-tip fab-tip-below">
                {nav.openMenu}
              </span>
              {/* Three equal rounded lines; open, the outer two fold into an X. */}
              <span aria-hidden className="relative flex h-3.5 w-[1.375rem] flex-col justify-between">
                <span
                  className={`h-0.5 w-[1.375rem] rounded-full bg-current transition-[translate,rotate] duration-500 ease-[var(--ease-spring)] ${
                    menuOpen ? "translate-y-1.5 rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-[1.375rem] rounded-full bg-current transition-[opacity,scale] delay-75 duration-500 ease-[var(--ease-spring)] ${
                    menuOpen ? "scale-x-0 opacity-0" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-[1.375rem] rounded-full bg-current transition-[translate,rotate] delay-100 duration-500 ease-[var(--ease-spring)] ${
                    menuOpen ? "-translate-y-1.5 -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className={`mx-auto mt-2 flex justify-end ${scrolled ? "max-w-[30rem]" : "max-w-full"}`}>
            {/* Double-bezel glass card that drops under the bar, same material,
                with a faint gold glow in its corner. */}
            <div
              id="mobile-menu"
              className="w-full origin-top-right animate-[menuDrop_0.55s_var(--ease-out-expo)_both] rounded-[2rem] bg-surface/90 p-1.5 shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150 sm:max-w-[30rem]"
            >
              <div className="relative isolate overflow-hidden rounded-[calc(2rem-6px)] bg-ink/[0.03] px-2 pb-2 pt-5 shadow-[inset_0_1px_1px_rgb(255_255_255/0.08)]">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-20 -z-10 size-56 rounded-full bg-[radial-gradient(closest-side,rgb(217_184_101/0.22),transparent)]"
                />
                {/* Phones: two tabs; a gold glass capsule glides to the one in use. */}
                <div role="tablist" aria-label={nav.primary} className="relative mx-2 grid grid-cols-2 rounded-full bg-ink/5 p-1 ring-1 ring-line sm:hidden">
                  <span
                    aria-hidden
                    className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-sun/15 shadow-[inset_0_1px_1px_rgb(255_255_255/0.12)] ring-1 ring-sun/55 transition-transform duration-500 ease-[var(--ease-spring)]"
                    style={{ transform: menuTab === "a11y" ? "translateX(100%)" : "none" }}
                  />
                  {(["nav", "a11y"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      id={`menu-tab-${tab}`}
                      aria-selected={menuTab === tab}
                      aria-controls={`menu-${tab}`}
                      onClick={() => setMenuTab(tab)}
                      className={`relative rounded-full py-2.5 text-sm font-medium transition-colors duration-300 ${menuTab === tab ? "text-gold" : "text-ink-2"}`}
                    >
                      {tab === "nav" ? nav.navTab : controls.a11yTitle}
                    </button>
                  ))}
                </div>
                <p className="hidden items-center gap-3 px-4 text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-muted sm:flex">
                  {nav.primary}
                  <span aria-hidden className="h-px flex-1 bg-[linear-gradient(90deg,var(--sun),transparent)] opacity-60" />
                </p>
                <div id="menu-nav" role="tabpanel" aria-labelledby="menu-tab-nav" className={menuTab === "a11y" ? "max-sm:hidden" : undefined}>
                  <nav aria-label={nav.primary} className="mt-2">
                    <ul className="flex flex-col">
                      {items.map((item, i) => (
                        <li key={item.label} className="animate-[menuItem_0.6s_var(--ease-out-expo)_both]" style={{ animationDelay: `${80 + i * 60}ms` }}>
                          <a
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className="group flex items-center gap-4 rounded-[1.5rem] px-4 py-3.5 text-ink transition-colors duration-500 hover:bg-sun/10 focus-visible:bg-sun/10 active:bg-sun/10"
                          >
                            <span className="self-start pt-1 font-display text-sm tabular-nums text-gold">{String(i + 1).padStart(2, "0")}</span>
                            <span className="flex-1 font-display text-[1.625rem] leading-tight transition-[translate,color] duration-500 ease-[var(--ease-spring)] group-hover:translate-x-1 group-hover:text-gold group-focus-visible:text-gold">
                              {item.label}
                            </span>
                            <span
                              aria-hidden
                              className="grid size-10 shrink-0 place-items-center rounded-full text-ink-2 ring-1 ring-line transition-[background-color,color,box-shadow] duration-500 group-hover:bg-sun group-hover:text-sun-ink group-hover:ring-sun"
                            >
                              <ArrowRight size="1rem" className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-rotate-45" />
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  {/* Phones only: the theme switch (the bar shows it from sm up). */}
                  <button
                    type="button"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    aria-label={isDark ? controls.themeToLight : controls.themeToDark}
                    className="mt-2 flex w-full animate-[menuItem_0.6s_var(--ease-out-expo)_both] items-center gap-2.5 rounded-[1.25rem] bg-ink/5 px-4 py-3.5 text-left text-sm text-ink transition-colors duration-300 hover:bg-sun/12 active:bg-sun/12 sm:hidden"
                    style={{ animationDelay: `${80 + items.length * 60}ms` }}
                  >
                    {isDark ? (
                      <Sun aria-hidden size="1.125rem" weight="light" className="shrink-0 text-gold" />
                    ) : (
                      <Moon aria-hidden size="1.125rem" weight="light" className="shrink-0 text-gold" />
                    )}
                    {isDark ? controls.light : controls.dark}
                  </button>
                </div>
                {menuTab === "a11y" && (
                  <div
                    id="menu-a11y"
                    role="tabpanel"
                    aria-labelledby="menu-tab-a11y"
                    className="mt-3 animate-[menuItem_0.5s_var(--ease-out-expo)_both] px-1 sm:hidden"
                  >
                    {a11yOptions("menu")}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {(menuOpen || panelOpen || langOpen) && (
        /* Soft veil over the page, the floating buttons included (they sit at
           z 35-40, under the veil at 41 and the bar at 42); shown under the menu, the accessibility panel and the language menu;
           tapping it closes whichever is open. */
        <div
          aria-hidden
          data-veil
          onClick={() => {
            setMenuOpen(false);
            setPanelOpen(false);
            // The language menu closes on any other popover's signal.
            window.dispatchEvent(new CustomEvent("im:popover", { detail: "veil" }));
          }}
          className="fixed inset-0 z-[41] animate-[fadeIn_0.4s_ease-out_both] bg-block/30 backdrop-blur-[6px]"
        />
      )}
    </>
  );
}
