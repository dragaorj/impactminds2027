import { Archivo, Instrument_Serif } from "next/font/google";
import { getDictionary, htmlLang, type Locale } from "@/lib/i18n";
import { localVideo } from "@/lib/media";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Preloader from "@/components/Preloader";
import { CountdownRing, MusicPlayer } from "@/components/LazyWidgets";
import DockToggle from "@/components/DockToggle";
import ScrollFx from "@/components/ScrollFx";
import MotionGate from "@/components/MotionGate";
import BackToTop from "@/components/BackToTop";
import Numbers from "@/components/sections/Numbers";
import About from "@/components/sections/About";
import Survey from "@/components/sections/Survey";
import Speakers from "@/components/sections/Speakers";
import Testimonials from "@/components/sections/Testimonials";
import Launches from "@/components/sections/Launches";
import Events from "@/components/sections/Events";
import Visits from "@/components/sections/Visits";
import Digital from "@/components/sections/Digital";
import Connections from "@/components/sections/Connections";
import Agenda from "@/components/sections/Agenda";
import Sponsor from "@/components/sections/Sponsor";
import Carbon from "@/components/sections/Carbon";
import Editions from "@/components/sections/Editions";
import OffscreenPause from "@/components/OffscreenPause";
import Footer from "@/components/sections/Footer";
import { privacyCopy, privacyPath } from "@/lib/privacy";

// The editorial hero's headline: a wide black sans played against an italic serif.
const edSans = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-ed-sans",
  display: "swap",
});

const edSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: "italic",
  variable: "--font-ed-serif",
  display: "swap",
});

// The home page itself. hero: "editorial" (the farewell to Manaus and the
// invitation to Cartagena) or the earlier "classic" title with the typed line.
export default function Home({ lang, hero = "editorial" }: { lang: Locale; hero?: "classic" | "editorial" }) {
  const t = getDictionary(lang);
  const locale = htmlLang[lang];
  const p = privacyCopy[lang];

  return (
    <div className={`contents ${edSans.variable} ${edSerif.variable}`}>
      <Preloader />
      <Nav lang={lang} nav={t.nav} controls={t.controls} privacyLabel={p.navLabel} />
      <main id="conteudo" tabIndex={-1} className="w-full max-w-full overflow-x-clip outline-none">
        <Hero variant={hero} t={t.hero} videoSrc={localVideo("header-3.mp4")} agendaLink={t.hero.agendaCta} speakerLabel={t.speakers.open} />
        <Numbers
          t={t.numbers}
          locale={locale}
          show={{ survey: t.survey, connections: t.connections }}
        />
        <About t={t.about} videoSrc={localVideo("about.mp4")} />
        <Survey t={t.survey} locale={locale} />
        <Testimonials t={t.testimonials} lang={lang} />
        <Speakers t={t.speakers} lang={lang} />
        <Connections t={t.connections} />
        <Launches t={t.launches} locale={locale} />
        <Events t={t.events} />
        <Visits t={t.visits} />
        <Agenda t={t.agenda} place={t.hero.eyebrow} dates={t.hero.dates} locale={locale} />
        <Sponsor t={t.sponsor} locale={locale} />
        <Carbon t={t.carbon} locale={locale} />
        <Digital t={t.digital} locale={locale} />
        <Editions t={t.editions} />
      </main>
      <Footer t={t.footer} hero={t.hero} nav={t.nav} privacy={{ href: privacyPath(lang), label: p.navLabel }} />
      <CountdownRing labels={{ ...t.hero, agendaLink: t.hero.agendaCta }} />
      <MusicPlayer labels={t.music} />
      <BackToTop label={t.footer.backToTop} />
      <DockToggle label={t.music.showControls} />
      <ScrollFx />
      <OffscreenPause />
      <MotionGate />
    </div>
  );
}
