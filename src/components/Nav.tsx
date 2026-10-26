"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Minus, Moon, PersonArmsSpread, Plus, Sun } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { locales, type Locale } from "@/lib/i18n";
import { usePrefs } from "./prefs";

type Props = { lang: Locale; nav: Dict["nav"]; controls: Dict["controls"] };

const iconBtn =
  "grid size-10 place-items-center rounded-full text-ink transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:bg-brand hover:text-brand-ink active:scale-[0.96]";

// Same buttons while the bar sits transparent over the hero video.
const iconBtnOnVideo =
  "grid size-10 place-items-center rounded-full text-white transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:bg-white hover:text-block active:scale-[0.96]";

function LangSwitch({ lang, label, onVideo = false }: { lang: Locale; label: string; onVideo?: boolean }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex w-max rounded-full p-1 transition-colors duration-500 ${onVideo ? "bg-white/12" : "bg-ink/6"}`}
    >
      {locales.map((l) => (
        <a
          key={l}
          href={`/${l}`}
          hrefLang={l}
          lang={l}
          aria-current={l === lang ? "true" : undefined}
          onClick={() => {
            document.cookie = `im-lang=${l};path=/;max-age=31536000;samesite=lax`;
          }}
          className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide transition-colors duration-300 ${
            l === lang
              ? onVideo
                ? "bg-white text-block"
                : "bg-brand text-brand-ink"
              : onVideo
                ? "text-white/80 hover:bg-white/15 hover:text-white"
                : "text-ink-2 hover:bg-brand-soft hover:text-brand"
          }`}
        >
          {l}
        </a>
      ))}
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
      className="flex w-full items-center justify-between gap-4 rounded-2xl px-3 py-2.5 text-left text-sm text-ink hover:bg-ink/5"
    >
      {label}
      <span
        aria-hidden
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-brand" : "bg-ink/20"}`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-surface transition-transform duration-500 ease-[var(--ease-spring)] ${
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
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelBtnRef = useRef<HTMLButtonElement>(null);

  const items = [
    { href: "#top", label: nav.home },
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

  // The bar only materialises once the page leaves the top of the hero.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isDark = prefs.theme === "dark";
  const onVideo = !scrolled && !menuOpen;
  const btn = onVideo ? iconBtnOnVideo : iconBtn;

  return (
    <>
      <a
        href="#conteudo"
        className="fixed left-4 top-4 z-[80] -translate-y-24 rounded-full bg-brand px-5 py-3 text-sm font-medium text-brand-ink focus:translate-y-0"
      >
        {nav.skip}
      </a>

      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute left-0 top-0 h-24 w-px" />

      <header
        className={`fixed inset-x-0 z-40 px-3 transition-[top] duration-700 ease-[var(--ease-out-expo)] sm:px-8 lg:px-[5vw] ${
          scrolled ? "top-3 sm:top-4" : "top-3 sm:top-6"
        }`}
        data-hero
      >
        <div
          className={`mx-auto flex h-16 items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2 transition-[max-width,background-color,box-shadow,backdrop-filter] duration-700 ease-[var(--ease-out-expo)] ${
            scrolled
              ? "max-w-[30rem] xl:max-w-[66rem] bg-surface/60 shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150"
              : "max-w-full bg-transparent shadow-none ring-1 ring-transparent backdrop-blur-0"
          }`}
        >
          <a href="#top" className="relative block h-7 w-[7.6rem] shrink-0 sm:h-8 sm:w-[8.7rem]" aria-label="Latimpacto">
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

          <nav aria-label={nav.primary} className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {items.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={`group relative block whitespace-nowrap px-3.5 py-2 text-sm transition-colors duration-300 ${
                      onVideo ? "text-white/85 hover:text-white" : "text-ink-2 hover:text-brand focus-visible:text-brand"
                    }`}
                  >
                    {item.label}
                    {/* Gold rule grows from the left on hover / keyboard focus. */}
                    <span
                      aria-hidden
                      className="absolute inset-x-3.5 bottom-1 h-[2px] origin-left scale-x-0 rounded-full bg-sun transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <div className="hidden sm:block">
              <LangSwitch lang={lang} label={controls.language} onVideo={onVideo} />
            </div>
            <button
              type="button"
              className={btn}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? controls.themeToLight : controls.themeToDark}
            >
              {isDark ? <Sun size="1.25rem" weight="light" /> : <Moon size="1.25rem" weight="light" />}
            </button>

            <div className="relative">
              <button
                ref={panelBtnRef}
                type="button"
                className={btn}
                aria-label={controls.a11yOpen}
                aria-expanded={panelOpen}
                aria-controls="a11y-panel"
                onClick={() => setPanelOpen((v) => !v)}
              >
                <PersonArmsSpread size="1.3125rem" weight="light" />
              </button>
              {panelOpen && (
                <div
                  ref={panelRef}
                  id="a11y-panel"
                  role="dialog"
                  aria-label={controls.a11yTitle}
                  className="fixed inset-x-3 top-[5.25rem] rounded-[2rem] sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-80 bg-ink/5 p-1.5 ring-1 ring-line backdrop-blur-2xl"
                >
                  <div className="rounded-[calc(2rem-6px)] bg-surface p-3 shadow-[var(--shadow)]">
                    <p className="px-3 pb-2 pt-1 font-display text-lg text-ink">{controls.a11yTitle}</p>
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-ink">
                      <span id="text-size-label">{controls.textSize}</span>
                      <div className="flex items-center gap-1" role="group" aria-labelledby="text-size-label">
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
                    <button
                      type="button"
                      onClick={resetA11y}
                      className="mt-2 w-full rounded-full px-4 py-2.5 text-sm font-medium text-brand ring-1 ring-line transition-colors hover:bg-brand hover:text-brand-ink"
                    >
                      {controls.reset}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className={btn + " relative xl:hidden"}
              aria-label={menuOpen ? nav.closeMenu : nav.openMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span
                className={`absolute h-[1.5px] w-5 bg-current transition-transform duration-500 ease-[var(--ease-spring)] ${
                  menuOpen ? "rotate-45" : "-translate-y-[4px]"
                }`}
              />
              <span
                className={`absolute h-[1.5px] w-5 bg-current transition-transform duration-500 ease-[var(--ease-spring)] ${
                  menuOpen ? "-rotate-45" : "translate-y-[4px]"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="fixed inset-0 z-30 flex flex-col justify-between bg-bg/92 px-6 pb-10 pt-32 backdrop-blur-2xl xl:hidden"
      >
        <nav aria-label={nav.primary}>
          <ul className="flex flex-col gap-2">
            {items.map((item, i) => (
              <li
                key={item.label}
                className="animate-[menuIn_0.7s_var(--ease-out-expo)_both]"
                style={{ animationDelay: `${80 + i * 60}ms` }}
              >
                <a
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="group relative flex items-center py-2 font-display text-4xl text-ink transition-colors duration-300 hover:text-brand focus-visible:text-brand active:text-brand sm:text-5xl"
                >
                  <ArrowRight
                    aria-hidden
                    size="1.75rem"
                    className="-ml-9 mr-0 w-7 shrink-0 text-sun opacity-0 transition-[margin,opacity] duration-500 ease-[var(--ease-out-expo)] group-hover:ml-0 group-hover:mr-3 group-hover:opacity-100 group-focus-visible:ml-0 group-focus-visible:mr-3 group-focus-visible:opacity-100 group-active:ml-0 group-active:mr-3 group-active:opacity-100"
                  />
                  <span className="relative">
                    {item.label}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 -bottom-1 h-[2px] origin-left scale-x-0 rounded-full bg-sun transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100"
                    />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <LangSwitch lang={lang} label={controls.language} />
      </div>
    </>
  );
}
