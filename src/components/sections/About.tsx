"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, Images } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { links, photos } from "@/lib/site";
import Art from "../Art";
import Geo from "../Geo";
import { H2, container, section } from "../ui";

const albumLinks = [links.albums.dinner, links.albums.cocktail, links.albums.day1, links.albums.day2];

export default function About({ t, g }: { t: Dict["about"]; g: Dict["gallery"] }) {
  const [index, setIndex] = useState(0);
  const total = photos.gallery.length;
  const go = (step: number) => setIndex((i) => (i + step + total) % total);
  const arrow =
    "grid size-11 place-items-center rounded-full bg-surface/85 text-ink ring-1 ring-line backdrop-blur-md transition-transform duration-500 ease-[var(--ease-spring)] hover:scale-105 active:scale-95";

  return (
    <section id="sobre" className={`${section} bg-bg-2`} aria-labelledby="sobre-title">
      <Art name="balcony" className="absolute -right-8 bottom-16 hidden w-64 lg:block" />
      <Geo set="strip" className="absolute right-0 top-0 w-40 md:w-56" />
      <div className={`${container} grid gap-14 lg:grid-cols-12 lg:gap-10`}>
        <div className="lg:col-span-5 lg:pt-6" data-reveal>
          <H2 id="sobre-title">{t.title}</H2>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink-2">
            <p>{t.p1}</p>
            <p>{t.p2}</p>
          </div>
        </div>

        <div id="fotos" className="scroll-mt-28 lg:col-span-7" data-reveal>
          <div className="rounded-[2rem] bg-ink/[0.04] p-1.5 ring-1 ring-line">
            <div className="relative aspect-[16/11] overflow-hidden rounded-[calc(2rem-6px)] bg-block">
              {photos.gallery.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt={g.alt[i]}
                  fill
                  sizes="(min-width:1024px) 58vw, 100vw"
                  className={`object-cover transition-[opacity,transform] duration-1000 ease-[var(--ease-out-expo)] ${
                    i === index ? "scale-100 opacity-100" : "scale-105 opacity-0"
                  }`}
                  aria-hidden={i !== index}
                />
              ))}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button type="button" className={arrow} onClick={() => go(-1)} aria-label={g.prev}>
                  <ArrowLeft size={18} />
                </button>
                <button type="button" className={arrow} onClick={() => go(1)} aria-label={g.next}>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            {photos.gallery.slice(1).map((src, j) => {
              const i = j + 1;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={g.alt[i]}
                  aria-current={i === index}
                  className={`group relative aspect-[4/3] overflow-hidden rounded-[1.25rem] ring-1 transition-[box-shadow] duration-500 ${
                    i === index ? "ring-2 ring-brand" : "ring-line"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="20vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-10">
            <h3 className="font-display text-2xl text-ink">{g.title}</h3>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {g.albums.map((album, i) => (
                <li key={album}>
                  <a
                    href={albumLinks[i]}
                    className="group flex items-center justify-between gap-3 rounded-full bg-surface px-5 py-3.5 text-[15px] text-ink ring-1 ring-line transition-colors duration-300 hover:bg-brand-soft"
                  >
                    <span className="flex items-center gap-3">
                      <Images size={18} weight="light" className="text-brand" />
                      {album}
                    </span>
                    <ArrowUpRight size={16} className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-px group-hover:translate-x-0.5" />
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={links.allPhotos}
              className="group mt-5 inline-flex h-12 items-center gap-3 rounded-full bg-brand pl-6 pr-1.5 text-[15px] font-medium text-brand-ink transition-transform duration-500 ease-[var(--ease-spring)] active:scale-[0.98]"
            >
              {g.all}
              <span className="grid size-9 place-items-center rounded-full bg-brand-ink/15 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-105">
                <ArrowUpRight size={16} />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
