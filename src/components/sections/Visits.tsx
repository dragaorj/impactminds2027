"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowsOut } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { photos } from "@/lib/site";
import Lightbox from "../Lightbox";
import { container, section } from "../ui";

// The index on the left stays pinned (CSS sticky, so it never hijacks the
// scroll) while the field photos scroll past; any photo or name opens the
// lightbox, which steps through all twelve with captions.
export default function Visits({ t }: { t: Dict["visits"] }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = (i: number) => setIndex(i);

  return (
    <section id="visitas" className={section} aria-labelledby="visitas-title">
      <div className={`${container} grid gap-14 xl:grid-cols-12 xl:gap-14`}>
        <div className="xl:col-span-5">
          <div className="xl:sticky xl:top-28">
            <h2 id="visitas-title" className="font-display text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] text-ink">
              {t.title}
            </h2>
            <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-ink-2">{t.lead}</p>
            <ol className="-mx-3 mt-8 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
              {t.list.map((v, i) => (
                <li key={v.name}>
                  <button
                    type="button"
                    onClick={() => open(i)}
                    className="group flex w-full items-baseline gap-3 rounded-2xl px-3 py-2.5 text-left ring-1 ring-transparent transition-[background-color,box-shadow] duration-300 hover:bg-surface hover:ring-brand/35 focus-visible:bg-surface focus-visible:ring-brand/35"
                  >
                    <span className="w-5 shrink-0 font-display text-sm text-sun tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <span className="block font-display text-base leading-tight text-ink transition-colors group-hover:text-brand">
                        {v.name}
                      </span>
                      <span className="block text-xs leading-snug text-muted">{v.theme}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <ul className="columns-1 gap-4 sm:columns-2 xl:col-span-7">
          {photos.visits.map((src, i) => (
            <li key={src} data-reveal className="mb-4 break-inside-avoid">
              <figure>
                <button
                  type="button"
                  onClick={() => open(i)}
                  aria-label={t.list[i].name}
                  className="group relative block w-full overflow-hidden rounded-[1.5rem] ring-1 ring-line"
                >
                  <Image
                    src={src}
                    alt={`${t.list[i].name}: ${t.list[i].theme}`}
                    width={900}
                    height={1200}
                    sizes="(min-width:1024px) 28vw, (min-width:640px) 45vw, 100vw"
                    className="h-auto w-full transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <span className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/85 text-[#2A1240] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <ArrowsOut size="1rem" />
                  </span>
                </button>
                <figcaption className="mt-3 px-1">
                  <span className="block font-display text-lg leading-tight text-ink">{t.list[i].name}</span>
                  <span className="mt-0.5 block text-sm text-muted">{t.list[i].theme}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>

      <Lightbox
        items={photos.visits.map((src, i) => ({ src, title: t.list[i].name, subtitle: t.list[i].theme }))}
        index={index}
        onIndex={setIndex}
        labels={{ label: t.title, close: t.close, prev: t.prev, next: t.next }}
      />
    </section>
  );
}
