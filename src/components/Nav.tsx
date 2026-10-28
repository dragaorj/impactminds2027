"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Minus, Moon, PersonArmsSpread, Plus, Sun } from "@phosphor-icons/react";
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

// Language switch. It is a real page load on purpose: client-side switching
// kept hidden copies of every visited language in the DOM (same ids, stale
// animations), which made things vanish. To keep it instant, the other
// languages are prefetched, the pill moves on click, and the scroll position
// is handed over (sessionStorage "im-switch"): the new page restores it and
// skips the intro and all entrance animations (html[data-switch]).
function LangSwitch({ lang, label, onVideo = false }: { lang: Locale; label: string; onVideo?: boolean }) {
  const [picked, setPicked] = useState<Locale | null>(null);
  const current = picked ?? lang;
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
          aria-current={l === current ? "true" : undefined}
          onClick={(e) => {
            if (l === lang) {
              e.preventDefault();
              return;
            }
            setPicked(l);
            try {
              sessionStorage.setItem("im-switch", String(Math.round(window.scrollY)));
            } catch {}
            document.cookie = `im-lang=${l};path=/;max-age=31536000;samesite=lax`;
          }}
          className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide transition-colors duration-300 ${
            l === current
              ? onVideo
                ? "bg-white text-block"
                : "bg-brand text-brand-ink"
              : onVideo
                ? "text-white/80 hover:bg-sun/25 hover:text-white"
                : "text-ink-2 hover:bg-sun/15 hover:text-gold"
          }`}
        >
          {l}
        </a>
      ))}
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
      <div role="radiogroup" aria-label={label} className="flex rounded-full bg-ink/6 p-1">
        {options.map((o) => {
          const on = o.value === value;
          const cls = `rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-300 ${
            on ? "bg-brand text-brand-ink" : "text-ink-2 hover:bg-sun/15 hover:text-gold"
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
      className="flex w-full items-center justify-between gap-4 rounded-2xl px-3 py-2.5 text-left text-sm text-ink hover:bg-sun/10"
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
        className={`fixed inset-x-0 z-40 mx-auto max-w-[132rem] px-3 transition-[top] duration-700 ease-[var(--ease-out-expo)] sm:px-8 lg:px-[5vw] ${
          scrolled ? "top-3 sm:top-4" : "top-3 sm:top-6"
        }`}
        data-hero
      >
        <div
          className={`mx-auto flex h-16 items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2 transition-[max-width,background-color,box-shadow,backdrop-filter] duration-700 ease-[var(--ease-out-expo)] ${
            scrolled || menuOpen
              ? "max-w-[30rem] xl:max-w-[66rem] bg-surface/60 shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150"
              : "max-w-full bg-transparent shadow-none ring-1 ring-transparent backdrop-blur-0"
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

          <nav aria-label={nav.primary} className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {items.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={`nav-link group relative block whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors duration-300 ${
                      onVideo ? "text-white/85 hover:text-sun" : "text-ink-2 hover:text-gold focus-visible:text-gold"
                    }`}
                  >
                    {item.label}
                    {/* A gold pill border draws itself around the label on hover / focus. */}
                    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
                      <rect x="0.75" y="0.75" rx="17" pathLength={100} className="nav-link-border" />
                    </svg>
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
              {isDark ? <Sun size="1.25rem" weight="light" className="icon-sun" /> : <Moon size="1.25rem" weight="light" className="icon-moon" />}
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
                <PersonArmsSpread size="1.3125rem" weight="light" className="icon-person" />
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
                      className="mt-2 w-full rounded-full px-4 py-2.5 text-sm font-medium text-brand ring-1 ring-line transition-colors hover:bg-sun hover:text-sun-ink"
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

      {menuOpen && (
        <>
          {/* Soft veil over the page; tapping it closes the menu. */}
          <div
            aria-hidden
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-30 animate-[fadeIn_0.4s_ease-out_both] bg-block/30 backdrop-blur-[6px] xl:hidden"
          />
          {/* Glass card that drops from the pill, same material as the bar. */}
          <div
            id="mobile-menu"
            className="fixed inset-x-3 top-[5.25rem] z-40 mx-auto max-w-[30rem] origin-top animate-[menuDrop_0.55s_var(--ease-out-expo)_both] rounded-[2rem] bg-surface/70 p-2 shadow-[var(--shadow)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150 sm:inset-x-8 sm:top-[5.75rem] xl:hidden"
          >
            <nav aria-label={nav.primary}>
              <ul className="flex flex-col">
                {items.map((item, i) => (
                  <li
                    key={item.label}
                    className="animate-[menuItem_0.6s_var(--ease-out-expo)_both] [&+li]:border-t [&+li]:border-line"
                    style={{ animationDelay: `${60 + i * 50}ms` }}
                  >
                    <a
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center gap-4 rounded-[1.5rem] px-4 py-4 text-ink transition-colors duration-300 hover:bg-sun/12 hover:text-gold focus-visible:bg-sun/12 focus-visible:text-gold active:bg-sun/12"
                    >
                      <span className="w-6 text-xs font-medium tabular-nums text-sun">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex-1 font-display text-[1.375rem] leading-tight">{item.label}</span>
                      <ArrowRight
                        aria-hidden
                        size="1.125rem"
                        className="shrink-0 text-ink-2 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-x-1 group-hover:text-gold"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div
              className="mt-1 flex animate-[menuItem_0.6s_var(--ease-out-expo)_both] items-center justify-between gap-3 rounded-[1.5rem] bg-ink/5 py-2 pl-4 pr-2"
              style={{ animationDelay: `${60 + items.length * 50}ms` }}
            >
              <span className="text-xs text-ink-2">{controls.language}</span>
              <LangSwitch lang={lang} label={controls.language} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
