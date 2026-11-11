import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";

// English is the site's language: the bare address opens in English on
// every device, whatever the browser's language or an earlier pick. Other
// languages are one click away in the switcher, and an address that names
// a language (/pt/…, /es/…) keeps it.
function redirect(request: NextRequest, pathname: string) {
  request.nextUrl.pathname = pathname;
  const response = NextResponse.redirect(request.nextUrl);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

// The pages the site has today (after the language): home, editions, privacy,
// the agenda platform and the document reader. Anything else is a page of the
// earlier site (Conference, FAQ, Conheça Manaus, Speakers…): it answers
// "410 Gone", so search engines drop it from their results for good.
const PAGE = /^(\/(edicoes|privacy|agenda(\/.*)?|documento\/.+))?\/?$/;
const gone = () =>
  new NextResponse("This page no longer exists. Impact Minds Conference: /en", {
    status: 410,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const current = locales.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  const rest = current ? pathname.slice(current.length + 1) : pathname;
  if (!PAGE.test(rest)) return gone();
  if (!current) return redirect(request, `/${defaultLocale}${pathname === "/" ? "" : pathname}`);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
