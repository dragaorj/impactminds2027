import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, locales, type Locale } from "@/lib/i18n";
import { SPEAKER_SLUGS, agendaSpeakersPath, agendaViewFromSlug, agendaViewPath, speakersViewFromSlug, speakersViewPath } from "@/lib/nav";

// The same page in another language, with that language's own words in the
// address for the agenda platform (/pt/agenda/palestrantes/fotos ->
// /es/agenda/ponentes/fotos, /en/agenda/speakers/photos).
function localized(rest: string, to: Locale): string {
  const [, root, a, b] = rest.split("/");
  if (root !== "agenda" || !a) return `/${to}${rest}`;
  if (SPEAKER_SLUGS.includes(a)) {
    const v = b ? speakersViewFromSlug(b) : null;
    return v ? speakersViewPath(to, v) : agendaSpeakersPath(to);
  }
  const v = agendaViewFromSlug(a);
  return v ? agendaViewPath(to, v) : `/${to}${rest}`;
}

// A language picked in the site's switcher (cookie) wins; otherwise the first
// supported language in the browser's Accept-Language list, by priority
// (pt-BR -> pt, es-MX -> es, en-GB -> en). Anything else falls back to English.
function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get("im-lang")?.value;
  if (saved && hasLocale(saved)) return saved;

  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { base: tag.trim().toLowerCase().split("-")[0], q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  const match = ranked.find((entry) => hasLocale(entry.base));
  return match ? (match.base as Locale) : defaultLocale;
}

// Crawlers and link previews keep the language of the address they asked for.
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|linkedin|twitter|discord|slack/i;

// A visitor arriving from outside (a shared link, a search result) on a page
// in another language than their browser's is taken to their own, unless
// they already picked one in the switcher (cookie). Moves inside the site, the
// switcher's own prefetch/prerender requests and crawlers are left alone.
function arrivingElsewhere(request: NextRequest, current: Locale): Locale | null {
  if (request.cookies.get("im-lang")) return null;
  if (!request.headers.get("accept-language")) return null;
  if (request.headers.get("sec-purpose")?.includes("prefetch")) return null;
  if (BOT.test(request.headers.get("user-agent") ?? "")) return null;
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      if (new URL(referer).host === request.nextUrl.host) return null;
    } catch {}
  }
  const wanted = preferredLocale(request);
  return wanted === current ? null : wanted;
}

function redirect(request: NextRequest, pathname: string) {
  request.nextUrl.pathname = pathname;
  const response = NextResponse.redirect(request.nextUrl);
  // The target depends on each visitor's language: never cache the redirect.
  response.headers.set("Vary", "Accept-Language, Cookie");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const current = locales.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (!current) return redirect(request, `/${preferredLocale(request)}${pathname}`);

  const wanted = arrivingElsewhere(request, current);
  if (wanted) return redirect(request, localized(pathname.slice(current.length + 1), wanted));
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
