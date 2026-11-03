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
    <section id="latimpacto" className={`${section} overflow-hidden`} aria-labelledby="latimpacto-title">
      {/* One composition, capped in width so the text, map and list stay together
          on very wide screens; it is also the box the map fills from lg. */}
      <div className="relative mx-auto w-full max-w-[110rem] lg:flex lg:min-h-[max(52rem,min(62rem,92vh))] lg:items-center">
        <div className={`${container} lg:pointer-events-none`}>
          <div className="max-w-[34rem] lg:pointer-events-auto lg:max-w-[min(34rem,34vw)]" data-reveal>
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
        <div className={`${container} mt-12 lg:contents`}>
          <LatamNetwork
            lang={lang}
            labels={{
              title: t.mapAlt,
              places: t.places,
              host2027: t.host2027,
              host2026: t.host2026,
            }}
          />
        </div>
      </div>
    </section>
  );
}
