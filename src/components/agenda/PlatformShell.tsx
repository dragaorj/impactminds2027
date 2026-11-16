import Link from "next/link";
import { CalendarBlank, UsersThree } from "@phosphor-icons/react/dist/ssr";
import type { Dict } from "@/lib/dictionaries/pt";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";
import { LOGO_PATHS, LOGO_VIEWBOX } from "@/components/latimpactoLogo";
import { agendaLoginPath, agendaPath, agendaSpeakersPath } from "@/lib/nav";
import Account from "./Account";
import EditMenu from "./Tools";
import LangLink from "./LangLink";
import { wrap } from "./width";

type Tab = "agenda" | "speakers";

// The frosted bars: the blur also with Safari's own prefix (iPhone, iPad).
// Their ground is nearly opaque too: where a phone does not draw the blur
// (some browsers, graphics acceleration off), the text behind still never
// shows through and mixes with the bar.
const glass = { WebkitBackdropFilter: "blur(24px) saturate(1.8)", backdropFilter: "blur(24px) saturate(1.8)" } as const;

// The agenda keeps its real size on every screen: the site's root size grows
// with wide screens (for its own sections), the platform doesn't. A wide
// screen gets more columns and wider areas, never bigger things. (A style of
// the page itself: the shared stylesheet loses this rule.)
export function PlatformRootSize() {
  return <style dangerouslySetInnerHTML={{ __html: "html{font-size:calc(100% * var(--text-scale,1))!important}" }} />;
}

// The platform's frame. Wide screens: one quiet frosted bar (the Latimpacto
// mark back to the site, the event's name, the two pages as an iOS segmented
// control, the language, the team's sign-in). Phones: a slim top bar (mark,
// name, language) and an iOS-style tab bar at the bottom (Agenda, Speakers,
// sign-in), within thumb's reach.
export default function PlatformShell({ lang, tab, t, children }: { lang: Locale; tab: Tab; t: Dict["agendaApp"]; children: React.ReactNode }) {
  const href = (l: Locale) => (tab === "agenda" ? agendaPath(l) : agendaSpeakersPath(l));
  const tabs = [
    { id: "agenda" as const, label: t.title, href: agendaPath(lang), Icon: CalendarBlank },
    { id: "speakers" as const, label: t.speakers, href: agendaSpeakersPath(lang), Icon: UsersThree },
  ];

  return (
    <div className="platform min-h-[100dvh] font-sans">
      <header style={glass} className="platform-chrome sticky top-0 z-40 border-b border-line bg-[rgb(232_230_238/0.97)] backdrop-blur-xl backdrop-saturate-[1.8]">
        <div className={`${wrap} platform-top flex h-14 items-center gap-3 sm:h-16`}>
          <a href={`/${lang}`} aria-label={t.backToSite} className="flex min-w-0 shrink items-center gap-2.5 text-ink sm:gap-3">
            <svg viewBox={LOGO_VIEWBOX} className="h-[17px] w-auto shrink-0 text-brand sm:h-[18px]" aria-hidden>
              {LOGO_PATHS.map((d, i) => (
                <path key={i} d={d} fill="currentColor" />
              ))}
            </svg>
            <span aria-hidden className="h-4 w-px shrink-0 bg-[rgb(29_20_38/0.14)] max-[20rem]:hidden" />
            <span className="truncate text-[15px] font-semibold tracking-[-0.01em] max-[20rem]:hidden">
              Impact Minds <span className="text-gold">2027</span>
            </span>
          </a>


          <div className="ml-auto flex shrink-0 items-center gap-2">
            {/* The editors' menu (only when signed in). */}
            <EditMenu t={t} lang={lang} tab={tab} />
            {/* Very narrow screens: the language as one small button that
                opens the three (no room for all of them side by side). */}
            <details className="group relative min-[20rem]:hidden" data-tour="lang">
              <summary
                aria-label={t.languages}
                className="grid h-9 min-w-11 cursor-pointer list-none place-items-center rounded-full bg-[rgb(118_118_128/0.12)] px-3 text-xs font-semibold uppercase text-ink group-open:bg-surface group-open:shadow-[0_1px_2px_rgb(0_0_0/0.06),0_2px_6px_-2px_rgb(0_0_0/0.12)] [&::-webkit-details-marker]:hidden"
              >
                {lang}
              </summary>
              <div className="absolute right-0 top-full z-50 mt-2 flex flex-col rounded-[16px] bg-surface p-1 shadow-[0_18px_40px_-16px_rgb(29_20_38/0.4)] ring-1 ring-line">
                {locales.map((l) => (
                  <LangLink
                    key={l}
                    href={href(l)}
                    lang={l}
                    aria-current={l === lang ? "true" : undefined}
                    className={`whitespace-nowrap rounded-[12px] px-3 py-2 text-[14px] ${l === lang ? "bg-brand-soft font-semibold text-brand" : "text-ink hover:bg-[rgb(118_118_128/0.1)]"}`}
                  >
                    {t.langNames[l]}
                  </LangLink>
                ))}
              </div>
            </details>
            <div className="flex items-center rounded-full bg-[rgb(118_118_128/0.12)] p-[3px] max-[20rem]:hidden" role="group" aria-label={t.languages} data-tour="lang">
              {locales.map((l) => (
                <LangLink
                  key={l}
                  href={href(l)}
                  lang={l}
                  aria-current={l === lang ? "true" : undefined}
                  title={t.langNames[l]}
                  className={`grid h-8 min-w-9 place-items-center rounded-full px-2 text-xs font-semibold uppercase transition-[background-color,color] ${
                    l === lang ? "bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06),0_2px_6px_-2px_rgb(0_0_0/0.12)]" : "text-muted hover:text-ink"
                  }`}
                >
                  {l}
                </LangLink>
              ))}
            </div>
            <div className="hidden md:block">
              <Account t={t} loginHref={agendaLoginPath(lang)} />
            </div>
          </div>
        </div>
        {/* Tablets and wider: the two pages as browser-style tabs along the
            bar's lower edge; the open one takes the page's own ground and
            joins the page below. (Phones: the tab bar at the bottom.) */}
        <nav aria-label={t.title} data-tour="tabs" className={`${wrap} -mb-px hidden items-end gap-1.5 md:flex`}>
          {tabs.map(({ id, label, href: h, Icon }) => {
            const on = id === tab;
            return (
              <Link
                key={id}
                href={h}
                data-tour={`tab-${id}`}
                aria-current={on ? "page" : undefined}
                className={`group relative flex h-10 w-[13rem] min-w-0 items-center gap-2 rounded-t-[12px] px-3.5 text-[14px] transition-[background-color,color] duration-200 ${
                  on
                    ? // The open tab: the page's own ground, its lower corners
                      // flaring out into the page (as a browser tab).
                      "z-10 bg-[rgb(243_242_246)] font-semibold text-ink shadow-[0_-1px_0_rgb(29_20_38/0.06),0_-6px_14px_-8px_rgb(29_20_38/0.22)] before:pointer-events-none before:absolute before:-left-3 before:bottom-0 before:size-3 before:bg-[radial-gradient(circle_at_0_0,transparent_11.5px,rgb(243_242_246)_12px)] after:pointer-events-none after:absolute after:-right-3 after:bottom-0 after:size-3 after:bg-[radial-gradient(circle_at_100%_0,transparent_11.5px,rgb(243_242_246)_12px)]"
                    : "mb-1 h-9 rounded-[10px] bg-[rgb(255_255_255/0.45)] font-medium text-ink-2 ring-1 ring-[rgb(29_20_38/0.05)] hover:bg-[rgb(255_255_255/0.75)] hover:text-ink"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid size-6 shrink-0 place-items-center rounded-[7px] ${on ? "bg-brand text-brand-ink" : "bg-[rgb(118_118_128/0.14)] text-ink-2 group-hover:text-ink"}`}
                >
                  <Icon size={14} weight={on ? "fill" : "bold"} />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="platform-body pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
        <footer className="platform-chrome platform-foot border-t border-line px-4 py-6 text-center text-[13px] text-muted">
          {t.platformBy}{" "}
          <a href="https://fyw.com.br/" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-2 transition-colors hover:text-brand">
            Fyw
          </a>
        </footer>
      </div>

      {/* Phones: tab bar at the bottom */}
      <nav
        aria-label={t.title}
        data-tour="tabs"
        style={glass}
        className="platform-chrome fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-[rgb(250_250_252/0.97)] px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl backdrop-saturate-[1.8] md:hidden"
      >
        {tabs.map(({ id, label, href: h, Icon }) => (
          <Link
            key={id}
            href={h}
            data-tour={`tab-${id}`}
            aria-current={id === tab ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium ${id === tab ? "text-brand" : "text-muted"}`}
          >
            <Icon size={24} weight={id === tab ? "fill" : "regular"} aria-hidden />
            {label}
          </Link>
        ))}
        <Account t={t} compact loginHref={agendaLoginPath(lang)} />
      </nav>
    </div>
  );
}
