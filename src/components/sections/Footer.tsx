import { InstagramLogo, LinkedinLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import type { Dict } from "@/lib/dictionaries/pt";
import { EVENT_END, EVENT_START, links } from "@/lib/site";
import Art from "../Art";
import Geo from "../Geo";
import Countdown from "../Countdown";
import { Button, container } from "../ui";

export default function Footer({ t, hero }: { t: Dict["footer"]; hero: Dict["hero"] }) {
  const social = [
    { href: links.social.instagram, label: "Instagram", Icon: InstagramLogo },
    { href: links.social.linkedin, label: "LinkedIn", Icon: LinkedinLogo },
    { href: links.social.youtube, label: "YouTube", Icon: YoutubeLogo },
  ];
  return (
    <footer className="relative overflow-hidden border-t border-line pb-10 pt-24 md:pt-36">
      <Geo set="stack" className="absolute left-4 top-16 hidden w-20 md:block lg:left-[3%] lg:w-24" />
      <div className={container}>
        <div data-reveal>
          <p className="text-lg text-ink-2">{hero.dates}</p>
          <p className="mt-4 max-w-4xl font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.98] text-ink">{t.closing}</p>
        </div>
        <Art name="skyline" className="mt-14 w-full max-w-4xl" />
        <div className="mt-4 flex justify-between">
          <Art name="laurel" className="w-24 md:w-32" />
          <Art name="laurel" className="w-24 -scale-x-100 md:w-32" />
        </div>

        <div className="mt-16 grid gap-12 border-t border-line pt-12 md:grid-cols-12">
          <div className="md:col-span-5" data-reveal>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-sm text-muted">{hero.countdown}</p>
              <p className="text-sm font-medium text-brand">{hero.dates}</p>
            </div>
            <div className="mt-5 text-ink">
              <Countdown start={EVENT_START} end={EVENT_END} labels={hero} size="lg" />
            </div>
          </div>
          <div className="md:col-span-7" data-reveal>
            <p className="max-w-[56ch] text-lg leading-relaxed text-ink-2">{t.about}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button href={links.latimpacto} external>
                {t.visit}
              </Button>
              <ul className="flex gap-2" aria-label={t.follow}>
                {social.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="grid size-12 place-items-center rounded-full text-ink ring-1 ring-line transition-[transform,background-color] duration-500 ease-[var(--ease-spring)] hover:scale-105 hover:bg-ink/5"
                    >
                      <Icon size={20} weight="light" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-20 text-sm text-muted">
          © {new Date(EVENT_START).getFullYear() - 1} Latimpacto. {t.rights}
        </p>
      </div>
    </footer>
  );
}
