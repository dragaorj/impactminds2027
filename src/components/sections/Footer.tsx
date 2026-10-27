import { ArrowUpRight, InstagramLogo, LinkedinLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import type { Dict } from "@/lib/dictionaries/pt";
import { links } from "@/lib/site";
import Image from "next/image";
import TypeOnView from "../TypeOnView";
import { Bezel, Button, container } from "../ui";

// Closing statement beside the Cartagena banner, then a glass card with the
// Latimpacto signature: about, the page's own navigation and social links.
export default function Footer({ t, hero, nav }: { t: Dict["footer"]; hero: Dict["hero"]; nav: Dict["nav"] }) {
  const words = t.closing.split(" ");
  const closingTail = words.pop();
  const closingHead = words.join(" ");
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
      <div className={container}>
        {/* Closing line beside the official Cartagena banner, framed like the site's cards. */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          <div data-reveal className="flex w-full flex-col items-start gap-5 [container-type:inline-size] lg:col-span-5">
            <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-ink/5 px-4 py-1.5 text-sm text-ink-2 ring-1 ring-line" data-nosplit>
              <span>{hero.eyebrow}</span>
              <span aria-hidden className="h-3 w-px bg-line" />
              <span className="font-medium text-gold">{hero.dates}</span>
            </p>
            {/* Always two lines, "Nos vemos em" / "Cartagena": the type is sized to
                this column's own width (cqi), so the first line fits on any screen.
                In gold like the hero's typed line, typing itself in on arrival. */}
            <p className="w-full font-display text-[clamp(2.5rem,15.5cqi,6rem)] leading-[0.98] text-gold" data-nosplit>
              <TypeOnView lines={[closingHead, closingTail ?? ""]} className="block" />
            </p>
          </div>
          <Bezel className="lg:col-span-7" inner="bg-[#f3f1ee]">
            <div data-reveal className="relative aspect-[1356/550]">
              <Image
                src="/brand/banner-2027.webp"
                alt={`Impact Minds 2027 · ${hero.eyebrow}`}
                fill
                sizes="(min-width:1024px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
          </Bezel>
        </div>

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

        {/* Credits, centred at the very end of the page. */}
        {/* data-nosplit: at the very bottom of the page a scroll-triggered line
            reveal may never fire, so the credits are always shown as is. */}
        <div data-nosplit className="mt-10 flex flex-col items-center gap-2 border-t border-line pt-8 text-center text-sm text-muted">
          <p>© 2026 Impact&nbsp;Minds: Standing Together. Latimpacto. All rights reserved.</p>
          <p>
            {t.madeBy}{" "}
            <a
              href="https://www.linkedin.com/in/marlonwebdesigner/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink transition-colors hover:text-gold"
            >
              Marlon Dias
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
