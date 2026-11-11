import Link from "next/link";
import { CalendarBlank, UsersThree } from "@phosphor-icons/react/dist/ssr";
import type { Dict } from "@/lib/dictionaries/pt";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";
import { LOGO_PATHS, LOGO_VIEWBOX } from "@/components/latimpactoLogo";
import { agendaLoginPath, agendaPath, agendaSpeakersPath } from "@/lib/nav";
import Account from "./Account";
import EditMenu from "./Tools";
import { wrap } from "./width";

type Tab = "agenda" | "speakers";

// The frosted bars: the blur also with Safari's own prefix (iPhone, iPad).
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
      <header style={glass} className="platform-chrome sticky top-0 z-40 border-b border-line bg-[rgb(243_242_246/0.78)] backdrop-blur-xl backdrop-saturate-[1.8]">
        <div className={`${wrap} flex h-14 items-center gap-3 sm:h-16`}>
          <a href={`/${lang}`} aria-label={t.backToSite} className="flex min-w-0 shrink items-center gap-2.5 text-ink sm:gap-3">
            <svg viewBox={LOGO_VIEWBOX} className="h-[17px] w-auto shrink-0 text-brand sm:h-[18px]" aria-hidden>
              {LOGO_PATHS.map((d, i) => (
                <path key={i} d={d} fill="currentColor" />
              ))}
            </svg>
            <span aria-hidden className="h-4 w-px shrink-0 bg-[rgb(29_20_38/0.14)]" />
            <span className="truncate text-[15px] font-semibold tracking-[-0.01em]">
              Impact Minds <span className="text-gold">2027</span>
            </span>
          </a>

          <nav aria-label={t.title} className="mx-auto hidden rounded-full bg-[rgb(118_118_128/0.12)] p-[3px] md:flex">
            {tabs.map((x) => (
              <Link
                key={x.id}
                href={x.href}
                aria-current={x.id === tab ? "page" : undefined}
                className={`flex h-9 items-center rounded-full px-5 text-sm font-medium transition-[background-color,box-shadow,color] ${
                  x.id === tab ? "bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06),0_3px_8px_-2px_rgb(0_0_0/0.12)]" : "text-ink-2 hover:text-ink"
                }`}
              >
                {x.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
            {/* The editors' menu (only when signed in). */}
            <EditMenu t={t} lang={lang} tab={tab} />
            <div className="flex items-center rounded-full bg-[rgb(118_118_128/0.12)] p-[3px]" role="group" aria-label={t.languages}>
              {locales.map((l) => (
                <a
                  key={l}
                  href={href(l)}
                  hrefLang={l}
                  lang={l}
                  aria-current={l === lang ? "true" : undefined}
                  title={t.langNames[l]}
                  className={`grid h-8 min-w-9 place-items-center rounded-full px-2 text-xs font-semibold uppercase transition-[background-color,color] ${
                    l === lang ? "bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06),0_2px_6px_-2px_rgb(0_0_0/0.12)]" : "text-muted hover:text-ink"
                  }`}
                >
                  {l}
                </a>
              ))}
            </div>
            <div className="hidden md:block">
              <Account t={t} loginHref={agendaLoginPath(lang)} />
            </div>
          </div>
        </div>
      </header>

      <div className="platform-body pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
        <footer className="platform-chrome border-t border-line px-4 py-6 text-center text-[13px] text-muted">
          {t.platformBy}{" "}
          <a href="https://fyw.com.br/" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-2 transition-colors hover:text-brand">
            Fyw
          </a>
        </footer>
      </div>

      {/* Phones: tab bar at the bottom */}
      <nav
        aria-label={t.title}
        style={glass}
        className="platform-chrome fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-[rgb(250_250_252/0.86)] px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl backdrop-saturate-[1.8] md:hidden"
      >
        {tabs.map(({ id, label, href: h, Icon }) => (
          <Link
            key={id}
            href={h}
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
