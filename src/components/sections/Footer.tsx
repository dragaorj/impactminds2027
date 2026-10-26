import { InstagramLogo, LinkedinLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import type { Dict } from "@/lib/dictionaries/pt";
import { EVENT_END, EVENT_START, links } from "@/lib/site";
import Art from "../Art";
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
      <Art name="mosaic" className="pointer-events-none absolute right-[calc(4vw_-_13rem)] top-16 hidden w-52 lg:block" />
      <div className={container}>
        <div data-reveal>
          <p className="text-lg text-ink-2">{hero.dates}</p>
          <p className="mt-4 max-w-4xl font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.98] text-ink">{t.closing}</p>
        </div>
        <Art name="skyline" className="mt-14 w-full max-w-4xl" />

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
                      className="grid size-12 place-items-center rounded-full btn-outline transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:scale-105 hover:bg-ink/5"
                    >
                      <Icon size="1.25rem" weight="light" />
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
