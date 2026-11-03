import Image from "next/image";
import { CalendarBlank, MapPin } from "@phosphor-icons/react/dist/ssr";
import type { Dict } from "@/lib/dictionaries/pt";
import { H2, container, section } from "../ui";

const PHOTOS = ["/photos/cartagena-catedral.jpg", "/photos/cartagena-getsemani.jpg", "/photos/cartagena-sacadas.jpg"];

// The next edition's city: the text on the left (where, when, why Cartagena,
// and the launch date), three photos of the old city on the right, one large
// with two beside it.
export default function Cartagena({ t }: { t: Dict["cartagena"] }) {
  return (
    <section id="cartagena" className={section} aria-labelledby="cartagena-title">
      <div className={`${container} grid gap-10 md:gap-14 xl:grid-cols-12 xl:gap-x-12`}>
        <div className="xl:col-span-5 xl:self-center" data-reveal>
          <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-gold md:text-sm" data-nosplit>
            <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 fill-current md:size-[1.125rem]">
              <path d="M12 0c.9 6.4 5 10.6 12 12-7 1.4-11.1 5.6-12 12-.9-6.4-5-10.6-12-12C7 10.6 11.1 6.4 12 0Z" />
            </svg>
            {t.kicker}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2" data-nosplit>
            <li className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-1.5 text-sm text-ink ring-1 ring-line">
              <MapPin size="1rem" weight="light" className="text-gold" />
              {t.place}
            </li>
            <li className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-1.5 text-sm text-ink ring-1 ring-line">
              <CalendarBlank size="1rem" weight="light" className="text-gold" />
              {t.dates}
            </li>
          </ul>
          <H2 id="cartagena-title" className="mt-6 text-balance">
            {t.title}
          </H2>
          <div className="mt-8 max-w-[62ch] space-y-5 text-lg leading-relaxed text-ink-2">
            {t.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p
            className="mt-9 inline-flex items-center gap-3 rounded-[1.75rem] bg-sun/10 py-2.5 pl-3 pr-5 font-display text-base leading-snug text-ink ring-1 ring-sun/40 sm:rounded-full sm:text-lg md:text-xl"
            data-nosplit
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sun text-sun-ink">
              <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 fill-current">
                <path d="M12 0c.9 6.4 5 10.6 12 12-7 1.4-11.1 5.6-12 12-.9-6.4-5-10.6-12-12C7 10.6 11.1 6.4 12 0Z" />
              </svg>
            </span>
            {t.launch}
          </p>
        </div>

        {/* One tall photo and two stacked beside it; on phones the large one
            on top and the other two side by side under it. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:col-span-7 xl:self-center" data-stagger>
          {PHOTOS.map((src, i) => (
            <figure
              key={src}
              data-stagger-item
              className={`relative overflow-hidden rounded-[1.5rem] bg-ink/5 ring-1 ring-line ${
                i === 0 ? "col-span-2 aspect-[3/2] sm:col-span-1 sm:row-span-2 sm:aspect-auto sm:min-h-[26rem]" : "aspect-[4/3]"
              }`}
            >
              <Image
                src={src}
                alt={t.photos[i]}
                fill
                sizes={i === 0 ? "(min-width:1280px) 30vw, (min-width:640px) 50vw, 100vw" : "(min-width:1280px) 30vw, 50vw"}
                className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] hover:scale-[1.04]"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
