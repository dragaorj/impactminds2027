import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Google_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale, htmlLang, locales } from "@/lib/i18n";
import InlineScript from "@/components/InlineScript";
import PrefsSync from "@/components/PrefsSync";
import CookieConsent from "@/components/CookieConsent";
import { privacyCopy, privacyPath } from "@/lib/privacy";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const gloock = localFont({
  src: "../fonts/Gloock-Regular.woff2",
  variable: "--font-gloock",
  display: "swap",
});

const googleSans = Google_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-gsans",
  display: "swap",
});

// Runs before first paint so theme and accessibility choices never flash.
const prefsScript = `(function(){try{var d=document.documentElement;d.classList.add('js');try{if(sessionStorage.getItem('im-switch')!==null||document.prerendering)d.dataset.switch='1'}catch(e){}var m=window.matchMedia;var t=localStorage.getItem('im-theme');if(t!=='light')t='dark';d.dataset.theme=t;var a={};try{a=JSON.parse(localStorage.getItem('im-a11y')||'{}')}catch(e){}if(a.text)d.dataset.text=String(a.text);if(a.contrast)d.dataset.contrast='high';if(a.links)d.dataset.links='on';if(a.scrollbar)d.dataset.scrollbar='on';if(a.facts)d.dataset.facts='on';var n=navigator;if((n.hardwareConcurrency||8)<=4||(n.deviceMemory&&n.deviceMemory<=4))d.dataset.lite='1';if(a.motion||m('(prefers-reduced-motion: reduce)').matches)d.dataset.motion='reduce';}catch(e){}})();`;

// A reload always starts at the hero: the browser's own scroll restoration is
// off (and a #hash is dropped on reload), so only a language switch, which
// hands its position over explicitly, keeps the scroll.
const topScript = `(function(){try{if('scrollRestoration' in history)history.scrollRestoration='manual';if(document.documentElement.dataset.switch)return;var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='reload'){if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);window.scrollTo(0,0);addEventListener('load',function(){window.scrollTo({top:0,behavior:'instant'})},{once:true})}}catch(e){}})();`;
// A page prerendered for the language switch (Nav) only learns the scroll
// position when it is shown (prerenderingchange).
const restoreScript = `(function(){try{var y=sessionStorage.getItem('im-switch');if(y!==null)window.scrollTo({top:+y,behavior:'instant'});if(document.prerendering)document.addEventListener('prerenderingchange',function(){try{var v=sessionStorage.getItem('im-switch');sessionStorage.removeItem('im-switch');window.scrollTo({top:+v||0,behavior:'instant'})}catch(e){}},{once:true})}catch(e){}})();`;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    metadataBase: siteUrl,
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      languages: { ...Object.fromEntries(locales.map((l) => [htmlLang[l], `/${l}`])), "x-default": "/en" },
    },
    openGraph: { title: dict.meta.title, description: dict.meta.description, type: "website" },
    other: { google: "notranslate" },
  };
}

export const viewport: Viewport = {
  themeColor: "#150b20",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html
      lang={htmlLang[lang]}
      // The site has its own languages: no browser translation prompt.
      translate="no"
      className={`${gloock.variable} ${googleSans.variable}`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={prefsScript} />
        <InlineScript html={topScript} />
      </head>
      <body className="min-h-[100dvh] overflow-x-clip">
        <PrefsSync lang={lang} />
        {children}
        <CookieConsent t={privacyCopy[lang].banner} privacyHref={privacyPath(lang)} />
        {/* After a language switch, jump back to where the visitor was as soon
            as the content exists (before hydration), so the top never flashes. */}
        <InlineScript html={restoreScript} />
      </body>
    </html>
  );
}
