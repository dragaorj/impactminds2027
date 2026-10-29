import { notFound } from "next/navigation";
import { getDictionary, hasLocale, htmlLang } from "@/lib/i18n";
import { localVideo } from "@/lib/media";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Preloader from "@/components/Preloader";
import MusicPlayer from "@/components/MusicPlayer";
import DockToggle from "@/components/DockToggle";
import ScrollFx from "@/components/ScrollFx";
import MotionGate from "@/components/MotionGate";
import BackToTop from "@/components/BackToTop";
import CountdownRing from "@/components/CountdownRing";
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

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const locale = htmlLang[lang];

  return (
    <>
      <Preloader />
      <Nav lang={lang} nav={t.nav} controls={t.controls} />
      <main id="conteudo" tabIndex={-1} className="w-full max-w-full overflow-x-clip outline-none">
        <Hero t={t.hero} videoSrc={localVideo("header-2.mp4")} agendaLink={t.hero.agendaCta} speakerLabel={t.speakers.open} />
        <Numbers t={t.numbers} locale={locale} />
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
      <Footer t={t.footer} hero={t.hero} nav={t.nav} />
      <CountdownRing labels={{ ...t.hero, agendaLink: t.hero.agendaCta }} />
      <MusicPlayer labels={t.music} />
      <BackToTop label={t.footer.backToTop} />
      <DockToggle label={t.music.showControls} />
      <ScrollFx />
      <OffscreenPause />
      <MotionGate />
    </>
  );
}
