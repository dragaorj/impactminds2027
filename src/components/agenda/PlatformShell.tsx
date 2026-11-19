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
import TabMotion from "./TabMotion";

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
// The platform's theme lives here too, for the same reason: the soft ground
// with its ambient light, white pill controls (.chip) and the deep plum of
// the selected state.
const THEME = `
html{font-size:calc(100% * var(--text-scale,1))!important}
.platform{--bg:#f1eff4;--bg-2:#e9e6ee;--chip:#fff;--chip-line:rgb(42 18 64/.07);--chip-hover:#faf9fc;--on:#2a1240;--on-ink:#fff;
--shadow-card:0 1px 2px rgb(42 18 64/.04),0 12px 32px -20px rgb(42 18 64/.18);--shadow:0 2px 4px rgb(42 18 64/.05),0 24px 48px -24px rgb(42 18 64/.28);
--ambient:radial-gradient(70rem 36rem at 0% -8%,rgb(236 226 247/.9),transparent 62%),radial-gradient(56rem 30rem at 100% -4%,rgb(248 238 222/.85),transparent 58%),#f1eff4;
background:var(--ambient);background-attachment:fixed}
/* The open tab wears the page's very ground (pinned to the screen, as the
   page's is), so the two meet with no seam; its lower corners flare out
   into the page, cut by a mask. */
.platform .pf-tab-on{background:var(--ambient);background-attachment:fixed}
.platform .pf-tab-on::before,.platform .pf-tab-on::after{content:"";position:absolute;bottom:0;width:12px;height:12px;pointer-events:none;background:var(--ambient);background-attachment:fixed}
.platform .pf-tab-on::before{left:-12px;-webkit-mask:radial-gradient(circle at 0 0,transparent 11.5px,#000 12px);mask:radial-gradient(circle at 0 0,transparent 11.5px,#000 12px)}
.platform .pf-tab-on::after{right:-12px;-webkit-mask:radial-gradient(circle at 100% 0,transparent 11.5px,#000 12px);mask:radial-gradient(circle at 100% 0,transparent 11.5px,#000 12px)}
.platform .chip{background:var(--chip);box-shadow:inset 0 0 0 1px var(--chip-line),0 1px 2px rgb(42 18 64/.03)}
.platform :is(button,a,label).chip:hover{background:var(--chip-hover)}
.platform :is(button,a,label).chip{transition:background-color .3s,box-shadow .3s,color .3s,transform .5s cubic-bezier(.16,1,.3,1)}
.platform-sheet[open]{animation:pf-sheet-in .5s cubic-bezier(.16,1,.3,1)}
.platform-sheet[open][data-centered]{animation:pf-sheet-pop .45s cubic-bezier(.16,1,.3,1)}
.platform-sheet[open]::backdrop{animation:pf-veil-in .35s ease-out}
.platform-sheet[data-closing]::backdrop{opacity:0;transition:opacity .28s ease-in}
@keyframes pf-sheet-in{from{transform:translateY(48px);opacity:0}}
@media (min-width:640px){@keyframes pf-sheet-in{from{transform:translateX(36px);opacity:0}}}
@keyframes pf-sheet-pop{from{transform:scale(.96) translateY(8px);opacity:0}}
@keyframes pf-veil-in{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.platform-sheet[open],.platform-sheet[open]::backdrop{animation:none}}
`;
export function PlatformRootSize() {
  return <style dangerouslySetInnerHTML={{ __html: THEME }} />;
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
      <header style={glass} className="platform-chrome sticky top-0 z-40 border-b border-line bg-[rgb(241_239_244/0.82)] backdrop-blur-xl md:border-b-0 md:bg-[rgb(232_230_238/0.97)] backdrop-saturate-[1.8]">
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
                className="chip grid h-9 min-w-11 cursor-pointer list-none place-items-center rounded-full px-3 text-xs font-semibold uppercase text-ink group-open:bg-surface group-open:shadow-[0_1px_2px_rgb(0_0_0/0.06),0_2px_6px_-2px_rgb(0_0_0/0.12)] [&::-webkit-details-marker]:hidden"
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
            <div className="chip flex items-center rounded-full p-[3px] max-[20rem]:hidden" role="group" aria-label={t.languages} data-tour="lang">
              {locales.map((l) => (
                <LangLink
                  key={l}
                  href={href(l)}
                  lang={l}
                  aria-current={l === lang ? "true" : undefined}
                  title={t.langNames[l]}
                  className={`grid h-8 min-w-9 place-items-center rounded-full px-2 text-xs font-semibold uppercase transition-[background-color,color] ${
                    l === lang ? "bg-[var(--on)] text-[var(--on-ink)]" : "text-muted hover:text-ink"
                  }`}
                >
                  {l}
                </LangLink>
              ))}
            </div>
            <div className="platform-account hidden md:block">
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
                data-tab-link={id}
                aria-current={on ? "page" : undefined}
                className={`group relative flex h-10 w-[13rem] min-w-0 items-center gap-2 rounded-t-[12px] px-3.5 text-[14px] transition-[background-color,color,opacity] duration-300 ${
                  on
                    ? // The open tab: the page's own ground, its lower corners
                      // flaring out into the page (as a browser tab).
                      "pf-tab-on z-10 font-semibold text-ink shadow-[0_-1px_0_rgb(29_20_38/0.06),0_-6px_14px_-8px_rgb(29_20_38/0.22)]"
                    : "font-medium text-ink-2 hover:bg-[rgb(255_255_255/0.4)] hover:text-ink"
                }`}
              >
                <span
                  aria-hidden
                  data-tab-icon
                  className={`grid size-6 shrink-0 place-items-center rounded-[7px] ${on ? "bg-brand text-brand-ink" : "text-ink-2 group-hover:text-ink"}`}
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
        <TabMotion tab={tab} />
        <div className="platform-page">{children}</div>
        <footer className="platform-chrome platform-foot border-t border-line px-4 py-6 text-center text-[13px] text-muted">
          {t.platformBy}{" "}
          <a href="https://fyw.com.br/" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-2 transition-colors hover:text-brand">
            Fyw
          </a>
        </footer>
      </div>

      {/* Phones: a floating dark pill at the bottom, within thumb's reach:
          the open page in a purple capsule with its name, the other page
          and the account as round icons. */}
      <nav
        aria-label={t.title}
        data-tour="tabs"
        data-pill
        style={glass}
        className="platform-chrome fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[rgb(29_20_38/0.9)] p-1.5 shadow-[0_22px_44px_-14px_rgb(29_20_38/0.6)] ring-1 ring-white/10 backdrop-blur-xl md:hidden"
      >
        {tabs.map(({ id, label, href: h, Icon }) => {
          const on = id === tab;
          return (
            <Link
              key={id}
              href={h}
              data-tour={`tab-${id}`}
              data-tab-link={id}
              aria-current={on ? "page" : undefined}
              aria-label={label}
              className={`flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-medium transition-[background-color,color,padding] duration-300 ${
                on ? "bg-[radial-gradient(circle_at_25%_20%,#8b52c2,#5b2a86)] px-5 text-white shadow-[0_8px_20px_-8px_rgb(91_42_134/0.9)] max-[20rem]:w-12 max-[20rem]:px-0" : "w-12 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon data-tab-icon size={21} weight={on ? "fill" : "regular"} aria-hidden />
              {on && <span className="max-[20rem]:sr-only">{label}</span>}
            </Link>
          );
        })}
        <Account t={t} compact loginHref={agendaLoginPath(lang)} />
      </nav>
    </div>
  );
}
