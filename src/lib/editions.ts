import "server-only";
import fs from "node:fs";
import path from "node:path";
import { editionGalleries, editionReports } from "@/lib/site";
import { readerHref } from "@/lib/docs";
import type { Locale } from "@/lib/i18n";

// Each past edition's photos and full report, found by file name at build time,
// so a new edition shows up by dropping its files in place:
//   photos: public/photos/editions/<year>/  (any .jpg/.jpeg/.webp/.png/.avif, in
//           file-name order, the first 12 fill the gallery)
//   report: public/docs/impact-minds-<year>-relatorio.pdf
// A list or link set in site.ts (editionGalleries / editionReports) wins: the
// 2026 photos keep their chosen order, and a report can live elsewhere (Drive).
const PUBLIC = path.join(process.cwd(), "public");
const IMAGE = /\.(jpe?g|webp|png|avif)$/i;

export function editionMedia(years: string[], lang: Locale) {
  return years.map((year, i) => {
    const dir = path.join(PUBLIC, "photos", "editions", year);
    const found = fs.existsSync(dir)
      ? fs
          .readdirSync(dir)
          .filter((f) => IMAGE.test(f))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .map((f) => `/photos/editions/${year}/${f}`)
      : [];
    const pdf = `/docs/impact-minds-${year}-relatorio.pdf`;
    const report = editionReports[i]?.[lang] ?? (fs.existsSync(path.join(PUBLIC, pdf)) ? pdf : null);
    return {
      photos: editionGalleries[i]?.length ? editionGalleries[i] : found,
      // Our own PDFs open in the site's reader (same tab); outside links as they are.
      report: report && readerHref(lang, report),
    };
  });
}
