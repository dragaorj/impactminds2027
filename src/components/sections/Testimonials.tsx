import Image from "next/image";
import type { Dict } from "@/lib/dictionaries/pt";
import type { Locale } from "@/lib/i18n";
import { testimonials, type Testimonial } from "@/lib/site";
import Art from "../Art";
import { H2, container, section } from "../ui";

const initials = (name: string) =>
  name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

function Avatar({ item, size = "size-12", ring = "ring-surface" }: { item: Testimonial; size?: string; ring?: string }) {
  return (
    <span
      className={`relative grid ${size} shrink-0 place-items-center overflow-hidden rounded-full bg-brand font-display text-base text-brand-ink ring-4 ${ring}`}
    >
      {item.photo ? <Image src={item.photo} alt="" fill sizes="5rem" className="object-cover" /> : initials(item.name)}
    </span>
  );
}

const Quote = ({ className = "" }: { className?: string }) => (
  <span aria-hidden className={`block font-display leading-none ${className}`}>
    “
  </span>
);

type CardProps = { item: Testimonial; lang: Locale };

// Six card shapes after the reference wall, in the 2027 palette. Every card is
// fully rounded; the quote text always stays in ink tokens for contrast.
const cards: ((p: CardProps) => React.ReactNode)[] = [
  // white card, person on a purple band at the foot (avatar overlapping it)
  ({ item, lang }) => (
    <figure className="overflow-hidden rounded-[1.75rem] bg-surface ring-1 ring-line">
      <blockquote className="px-7 pb-12 pt-8 text-lg leading-relaxed text-ink">{item.quote[lang]}</blockquote>
      <figcaption className="relative rounded-t-[1.75rem] bg-block px-7 pb-7 pt-10 text-center text-block-ink">
        <span className="absolute -top-7 left-1/2 -translate-x-1/2">
          <Avatar item={item} size="size-14" ring="ring-block" />
        </span>
        <span className="block font-display text-xl">{item.name}</span>
        <span className="mt-1 block text-sm text-block-muted">{item.role[lang]}</span>
      </figcaption>
    </figure>
  ),
  // speech bubble with a tail, person beneath it
  ({ item, lang }) => (
    <figure>
      <div className="relative rounded-[1.75rem] bg-surface p-7 ring-1 ring-line">
        <Quote className="text-5xl text-sun" />
        <blockquote className="mt-2 text-lg leading-relaxed text-ink">{item.quote[lang]}</blockquote>
        <span aria-hidden className="absolute -bottom-2.5 left-10 size-5 rotate-45 rounded-[4px] bg-surface ring-1 ring-line [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
      </div>
      <figcaption className="mt-5 flex items-center gap-3 pl-4">
        <Avatar item={item} size="size-11" />
        <span>
          <span className="block font-display text-lg leading-tight text-ink">{item.name}</span>
          <span className="block text-sm text-muted">{item.role[lang]}</span>
        </span>
      </figcaption>
    </figure>
  ),
  // big gold quote mark, name in a purple pill
  ({ item, lang }) => (
    <figure className="rounded-[1.75rem] bg-surface p-7 ring-1 ring-line">
      <Quote className="text-7xl text-sun" />
      <blockquote className="-mt-4 font-display text-[1.45rem] leading-snug text-ink">{item.quote[lang]}</blockquote>
      <figcaption className="mt-6 inline-flex max-w-full items-center gap-3 rounded-full bg-brand py-1.5 pl-1.5 pr-5 text-brand-ink">
        <Avatar item={item} size="size-10" ring="ring-brand" />
        <span className="min-w-0">
          <span className="block truncate font-medium">{item.name}</span>
          <span className="block truncate text-xs opacity-80">{item.role[lang]}</span>
        </span>
      </figcaption>
    </figure>
  ),
  // deep purple card
  ({ item, lang }) => (
    <figure className="rounded-[1.75rem] bg-block p-7 text-block-ink">
      <Quote className="text-6xl text-sun" />
      <blockquote className="mt-1 text-lg leading-relaxed">{item.quote[lang]}</blockquote>
      <figcaption className="mt-7 flex items-center gap-3 border-t border-white/15 pt-5">
        <Avatar item={item} size="size-11" ring="ring-block" />
        <span>
          <span className="block font-display text-lg leading-tight">{item.name}</span>
          <span className="block text-sm text-block-muted">{item.role[lang]}</span>
        </span>
      </figcaption>
    </figure>
  ),
  // name chip on top
  ({ item, lang }) => (
    <figure className="rounded-[1.75rem] bg-surface p-7 ring-1 ring-line">
      <figcaption className="flex items-center gap-3">
        <Avatar item={item} size="size-10" />
        <span className="rounded-full bg-brand-soft px-4 py-1.5 font-display text-lg leading-none text-ink">{item.name}</span>
      </figcaption>
      <blockquote className="mt-5 text-lg leading-relaxed text-ink">{item.quote[lang]}</blockquote>
      <p className="mt-6 border-t border-line pt-4 text-sm text-muted">{item.role[lang]}</p>
    </figure>
  ),
  // soft lilac card, avatar centred on top
  ({ item, lang }) => (
    <figure className="rounded-[1.75rem] bg-brand-soft px-7 pb-8 pt-7 text-center">
      <span className="mx-auto block w-max">
        <Avatar item={item} size="size-20" ring="ring-brand-soft" />
      </span>
      <blockquote className="mt-5 text-lg leading-relaxed text-ink">“{item.quote[lang]}”</blockquote>
      <figcaption className="mt-5">
        <span className="block font-display text-xl text-ink">{item.name}</span>
        <span className="mt-1 block text-sm text-muted">{item.role[lang]}</span>
      </figcaption>
    </figure>
  ),
];

// A wall of differently shaped cards in balanced columns (CSS columns), so
// every testimonial is visible at once and the layout breathes at any width.
export default function Testimonials({ t, lang }: { t: Dict["testimonials"]; lang: Locale }) {
  return (
    <section id="depoimentos" className={`${section} overflow-hidden bg-bg-2`} aria-labelledby="depoimentos-title">
      <Art name="mosaic" className="pointer-events-none absolute bottom-6 right-[calc(4vw_-_13rem)] hidden w-52 lg:block" />
      <div className={container}>
        <H2 id="depoimentos-title" className="max-w-2xl">
          {t.title}
        </H2>
        <ul className="mt-14 columns-1 gap-5 md:mt-20 md:columns-2 xl:columns-3">
          {testimonials.map((item, i) => {
            const Card = cards[i % cards.length];
            return (
              <li key={item.name} data-reveal className="mb-5 break-inside-avoid">
                <Card item={item} lang={lang} />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
