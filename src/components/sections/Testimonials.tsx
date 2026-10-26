"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import type { Locale } from "@/lib/i18n";
import { testimonials } from "@/lib/site";
import Art from "../Art";
import { H2, container, section } from "../ui";

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

// One quote at a time, large; people are the tabs that switch it.
export default function Testimonials({ t, lang }: { t: Dict["testimonials"]; lang: Locale }) {
  const [index, setIndex] = useState(0);
  const total = testimonials.length;
  const go = (step: number) => setIndex((i) => (i + step + total) % total);
  const arrow =
    "grid size-12 place-items-center rounded-full btn-outline transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] active:scale-95";

  return (
    <section id="depoimentos" className={`${section} overflow-hidden bg-bg-2`} aria-labelledby="depoimentos-title">
      <Art name="arcs" className="pointer-events-none absolute bottom-0 right-0 hidden w-36 min-[1440px]:block" />
      <Art name="mosaic" className="pointer-events-none absolute bottom-6 right-[calc(4vw_-_13rem)] hidden w-52 lg:block" />
      <div className={container}>
        <H2 id="depoimentos-title" className="max-w-xl">
          <span data-reveal className="block">{t.title}</span>
        </H2>

        <div className="mt-14 grid gap-10 md:mt-20 lg:grid-cols-12 lg:gap-12" data-reveal>
          <div className="relative lg:col-span-9">
            <span aria-hidden className="absolute -left-2 -top-16 font-display text-[10rem] leading-none text-brand/25 md:-top-20 md:text-[13rem]">
              “
            </span>
            <div className="relative grid" aria-live="polite">
              {testimonials.map((item, i) => (
                <figure
                  key={item.name}
                  aria-hidden={i !== index}
                  className={`col-start-1 row-start-1 transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] ${
                    i === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
                  }`}
                >
                  <blockquote className="max-w-[34ch] font-display text-[clamp(1.4rem,2.5vw,2.15rem)] leading-[1.25] text-ink">
                    {item.quote[lang]}
                  </blockquote>
                  <figcaption className="mt-8 text-base text-ink-2">
                    <span className="font-medium text-ink">{item.name}</span>
                    <span className="text-muted"> - {item.role[lang]}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-end gap-6 lg:col-span-3">
            <ul className="flex flex-wrap gap-3 lg:flex-col" aria-label={t.choose}>
              {testimonials.map((item, i) => (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-pressed={i === index}
                    className={`flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-5 text-left text-sm transition-colors duration-500 ${
                      i === index ? "bg-surface text-ink ring-1 ring-brand" : "text-ink-2 ring-1 ring-line hover:bg-surface/60"
                    }`}
                  >
                    <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-block font-display text-sm text-block-ink">
                      {item.photo ? <Image src={item.photo} alt="" fill sizes="40px" className="object-cover" /> : initials(item.name)}
                    </span>
                    <span>
                      <span className="block font-medium">{item.name}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button type="button" className={arrow} onClick={() => go(-1)} aria-label={t.prev}>
                <ArrowLeft size="1.125rem" />
              </button>
              <button type="button" className={arrow} onClick={() => go(1)} aria-label={t.next}>
                <ArrowRight size="1.125rem" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
