import { ArrowUpRight, InstagramLogo, LinkedinLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import type { Dict } from "@/lib/dictionaries/pt";
import { EVENT_START, links } from "@/lib/site";
import Art from "../Art";
import { Button, container } from "../ui";

// Closing statement over the Cartagena skyline, then a glass card with the
// Latimpacto signature: about, the page's own navigation and social links.
export default function Footer({ t, hero, nav }: { t: Dict["footer"]; hero: Dict["hero"]; nav: Dict["nav"] }) {
  const social = [
    { href: links.social.instagram, label: "Instagram", Icon: InstagramLogo },
    { href: links.social.linkedin, label: "LinkedIn", Icon: LinkedinLogo },
    { href: links.social.youtube, label: "YouTube", Icon: YoutubeLogo },
  ];
  const items = [
    { href: "#conexoes", label: nav.agenda2026 },
    { href: "#palestrantes", label: nav.speakers2026 },
    { href: "#edicoes", label: nav.editions },
  ];
  return (
    <footer className="relative overflow-hidden border-t border-line pb-8 pt-24 md:pt-32">
      <Art name="mosaic" className="pointer-events-none absolute right-[calc(4vw_-_13rem)] top-16 hidden w-52 lg:block" />
      <div className={container}>
        <div data-reveal className="flex flex-col items-start gap-5">
          <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-ink/5 px-4 py-1.5 text-sm text-ink-2 ring-1 ring-line" data-nosplit>
            <span>{hero.eyebrow}</span>
            <span aria-hidden className="h-3 w-px bg-line" />
            <span className="font-medium text-gold">{hero.dates}</span>
          </p>
          <p className="max-w-4xl font-display text-[clamp(3rem,8vw,6.5rem)] leading-[0.98] text-ink">{t.closing}</p>
        </div>
        <Art name="skyline" className="mt-12 w-full max-w-4xl" />

        <div
          data-reveal
          className="mt-14 grid gap-10 rounded-[2rem] bg-surface/60 p-7 ring-1 ring-line backdrop-blur-xl md:p-10 lg:grid-cols-12 lg:gap-8"
        >
          <div className="lg:col-span-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/latimpacto.svg" alt="Latimpacto" className="h-9 w-auto dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/latimpacto-white.svg" alt="Latimpacto" className="hidden h-9 w-auto dark:block" />
            <p className="mt-6 max-w-[56ch] text-base leading-relaxed text-ink-2">{t.about}</p>
            <div className="mt-8">
              <Button href={links.latimpacto} external>
                {t.visit}
              </Button>
            </div>
          </div>

          <nav aria-label={nav.primary} className="lg:col-span-3">
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.href} className="border-b border-line last:border-b-0">
                  <a
                    href={item.href}
                    className="group flex items-center justify-between gap-4 py-3.5 text-ink transition-colors duration-300 hover:text-gold"
                  >
                    {item.label}
                    <ArrowUpRight
                      size="1rem"
                      className="shrink-0 text-muted transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <p className="text-sm text-muted">{t.follow}</p>
            <ul className="mt-4 flex gap-2">
              {social.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid size-12 place-items-center rounded-full btn-outline transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:scale-105 hover:bg-sun hover:text-sun-ink"
                  >
                    <Icon size="1.25rem" weight="light" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date(EVENT_START).getFullYear() - 1} Latimpacto. {t.rights}
          </p>
          <p>Impact&nbsp;Minds 2027 · Connecting Us</p>
        </div>
      </div>
    </footer>
  );
}
