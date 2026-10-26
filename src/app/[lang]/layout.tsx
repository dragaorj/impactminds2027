import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Google_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale, htmlLang, locales } from "@/lib/i18n";
import InlineScript from "@/components/InlineScript";
import PrefsSync from "@/components/PrefsSync";
import "./globals.css";

const gloock = localFont({
  src: "../fonts/Gloock-Regular.ttf",
  variable: "--font-gloock",
  display: "swap",
});

const googleSans = Google_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-gsans",
  display: "swap",
});

// Runs before first paint so theme and accessibility choices never flash.
const prefsScript = `(function(){try{var d=document.documentElement;d.classList.add('js');var m=window.matchMedia;var t=localStorage.getItem('im-theme');if(t!=='light'&&t!=='dark')t=m('(prefers-color-scheme: dark)').matches?'dark':'light';d.dataset.theme=t;var a={};try{a=JSON.parse(localStorage.getItem('im-a11y')||'{}')}catch(e){}if(a.text)d.dataset.text=String(a.text);if(a.contrast)d.dataset.contrast='high';if(a.links)d.dataset.links='on';if(a.motion||m('(prefers-reduced-motion: reduce)').matches)d.dataset.motion='reduce';}catch(e){}})();`;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      languages: { ...Object.fromEntries(locales.map((l) => [htmlLang[l], `/${l}`])), "x-default": "/en" },
    },
    openGraph: { title: dict.meta.title, description: dict.meta.description, type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1ee" },
    { media: "(prefers-color-scheme: dark)", color: "#150b20" },
  ],
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html
      lang={htmlLang[lang]}
      className={`${gloock.variable} ${googleSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={prefsScript} />
      </head>
      <body className="min-h-[100dvh] overflow-x-clip">
        <PrefsSync lang={lang} />
        {children}
      </body>
    </html>
  );
}
