import type { Locale } from "@/lib/i18n";

// Every PDF in public/docs opens in the site's own reader, at
// /<lang>/documento/<file name without .pdf> (PdfReader), never as a bare
// download. Links to anything else (Drive, Dropbox) are left as they are.
export const readerHref = (lang: Locale, href: string) => {
  const m = href.match(/^\/docs\/([\w-]+)\.pdf$/);
  return m ? `/${lang}/documento/${m[1]}` : href;
};
