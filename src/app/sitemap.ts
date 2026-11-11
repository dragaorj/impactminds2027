import type { MetadataRoute } from "next";
import { htmlLang, locales, type Locale } from "@/lib/i18n";
import { agendaPath, agendaSpeakersPath, editionsPath } from "@/lib/nav";
import { siteUrl } from "@/lib/site";

// The pages the site has today, in its three languages, for search engines
// (Google reads it from robots.txt). Pages of the earlier site are not here:
// they answer "gone" (proxy.ts), so they drop out of the results.
const pages: ((l: Locale) => string)[] = [
  (l) => `/${l}`,
  (l) => editionsPath(l),
  (l) => agendaPath(l),
  (l) => agendaSpeakersPath(l),
  (l) => `/${l}/privacy`,
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap((page, i) =>
    locales.map((l) => ({
      url: new URL(page(l), siteUrl).toString(),
      changeFrequency: i < 2 ? ("weekly" as const) : ("daily" as const),
      priority: i === 0 ? 1 : 0.7,
      alternates: { languages: Object.fromEntries(locales.map((x) => [htmlLang[x], new URL(page(x), siteUrl).toString()])) },
    })),
  );
}
