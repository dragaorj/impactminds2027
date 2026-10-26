"use client";

import { useState } from "react";
import Image from "next/image";
import type { Dict } from "@/lib/dictionaries/pt";
import { editionGalleries } from "@/lib/site";
import Art from "../Art";
import Lightbox from "../Lightbox";
import { H2, container, section } from "../ui";

// Twelve tiles, gapless at every breakpoint (grid-flow-dense):
//   lg (12 cols): rows 1-2  6x2 | 3x1 | 3x2 / 3x1
//                 rows 3-4  4x1 | 4x2 | 4x1 / 4x1 | 4x1
//                 rows 5-6  3x2 | 6x2 | 3x2
//   md (4 cols): first tile 2x2, last 2x1, ten singles = 4 full rows
//   phones (2 cols): first and last span both columns, ten singles
const spans = [
  "col-span-2 md:row-span-2 lg:col-span-6",
  "lg:col-span-3",
  "lg:col-span-3 lg:row-span-2",
  "lg:col-span-3",
  "lg:col-span-4",
  "lg:col-span-4 lg:row-span-2",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-3 lg:row-span-2",
  "lg:col-span-6 lg:row-span-2",
  "col-span-2 lg:col-span-3 lg:row-span-2",
];

export default function Editions({ t }: { t: Dict["editions"] }) {
  const [active, setActive] = useState(0);
  const [viewing, setViewing] = useState<number | null>(null);
  const photos = editionGalleries[active] ?? [];
  const current = t.list[active];

  return (
    <section id="edicoes" className={`${section} scroll-mt-20`} aria-labelledby="edicoes-title">
      <div className={container}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <H2 id="edicoes-title">{t.title}</H2>
          <p className="font-display text-2xl text-brand md:text-3xl" aria-live="polite" data-nosplit>
            {current.city} <span className="text-terra">{current.year}</span>
          </p>
        </div>

        {photos.length ? (
          <ul
            key={active}
            className="mt-12 grid grid-flow-dense auto-rows-[9rem] grid-cols-2 gap-2 sm:auto-rows-[11rem] md:mt-16 md:grid-cols-4 md:gap-3 lg:auto-rows-[12rem] lg:grid-cols-12"
          >
            {photos.slice(0, 12).map((src, i) => (
              <li
                key={src}
                className={`group relative overflow-hidden rounded-[1.5rem] bg-block ring-1 ring-line ${spans[i]} animate-[menuIn_0.9s_var(--ease-out-expo)_both] motion-reduce:animate-none`}
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setViewing(i)}
                  aria-label={`${t.open}: ${current.city} ${current.year}, ${t.photos} ${i + 1}`}
                  className="absolute inset-0 block size-full cursor-zoom-in"
                >
                  <Image
                    src={src}
                    alt={`${current.city} ${current.year}, ${t.photos} ${i + 1}`}
                    fill
                    sizes={i === 0 || i === 10 ? "(min-width:1024px) 50vw, 100vw" : "(min-width:1024px) 33vw, 50vw"}
                    className="object-cover transition-transform duration-1000 ease-[var(--ease-out-expo)] group-hover:scale-105"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div
            key={active}
            className="mt-12 grid min-h-[22rem] place-items-center rounded-[2rem] bg-bg-2 px-6 text-center ring-1 ring-line md:mt-16"
          >
            <div className="flex flex-col items-center gap-5">
              <Art name="mosaic" className="w-16 !visible" />
              <p className="max-w-[32ch] font-display text-2xl leading-snug text-ink">{t.soon}</p>
            </div>
          </div>
        )}

        <div className="mt-10">
          <p className="text-sm text-muted">{t.choose}</p>
          <div role="tablist" aria-label={t.choose} className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {t.list.map((e, i) => {
              const on = i === active;
              return (
                <button
                  key={e.year}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setActive(i);
                    setViewing(null);
                  }}
                  className={`shrink-0 rounded-full px-5 py-3 text-left transition-[background-color,color,box-shadow] duration-300 ${
                    on ? "bg-brand text-brand-ink" : "btn-outline"
                  }`}
                >
                  <span className="block font-display text-lg leading-none">{e.year}</span>
                  <span className={`mt-1 block text-xs ${on ? "text-brand-ink/80" : "text-muted"}`}>{e.city}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Lightbox
        items={photos.map((src) => ({ src, title: current.city, subtitle: current.year }))}
        index={viewing}
        onIndex={setViewing}
        labels={{ label: t.title, close: t.close, prev: t.prev, next: t.next }}
      />
    </section>
  );
}
