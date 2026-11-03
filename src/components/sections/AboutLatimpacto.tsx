import type { Dict } from "@/lib/dictionaries/pt";
import type { Locale } from "@/lib/i18n";
import { links } from "@/lib/site";
import { Button, H2, container, section } from "../ui";
import LatamNetwork from "../LatamNetwork";

// Who organises the conference: the network in two paragraphs and a link to
// its site, over Latin America finely drawn and large, with the places on the
// network linked to Cartagena (hover a place, a name in the list or a country).
// On phones the map follows the text.
export default function AboutLatimpacto({ t, lang }: { t: Dict["latimpacto"]; lang: Locale }) {
  return (
    <section id="latimpacto" className={`${section} overflow-hidden lg:py-16`} aria-labelledby="latimpacto-title">
      {/* Same container as every section, so the text lines up on the left and
          the readout and list on the right; its content box is also the box the
          map fills from lg. */}
      <div className={container}>
        <div className="relative lg:flex lg:min-h-[max(48rem,min(66rem,86vh))] lg:items-center">
          <div className="relative z-[1] max-w-[34rem] lg:pointer-events-none lg:max-w-[min(34rem,36%)]">
            <div className="lg:pointer-events-auto" data-reveal>
              <H2 id="latimpacto-title">{t.title}</H2>
              <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink-2">
                {t.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <div className="mt-9">
                <Button href={links.latimpacto} external>
                  {t.cta}
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-12 lg:contents">
            <LatamNetwork lang={lang} labels={{ title: t.mapAlt, places: t.places, host2027: t.host2027, host2026: t.host2026 }} />
          </div>
        </div>
      </div>
    </section>
  );
}
