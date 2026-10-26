"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Pause, Play } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import type { Locale } from "@/lib/i18n";
import { links, speakers, type Speaker } from "@/lib/site";
import Art from "../Art";
import { H2, container, section } from "../ui";

const initials = (name: string) =>
  name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

const placeholderArt = ["door", "window", "balcony", "tower"] as const;

function Card({ s, i, lang }: { s: Speaker; i: number; lang: Locale }) {
  return (
    <>
      {/* Oval frame: the platform's speaker photos are already cut as ovals. */}
      <div className="rounded-[50%] bg-ink/[0.04] p-1.5 ring-1 ring-line">
        <div className="group relative aspect-[3/4] overflow-hidden rounded-[50%] bg-block">
          {s.photo ? (
            <Image
              src={s.photo}
              alt={s.name}
              fill
              sizes="18rem"
              className="scale-[1.06] object-cover grayscale-[35%] transition-[transform,filter] duration-700 ease-out group-hover:scale-110 group-hover:grayscale-0"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Art name={placeholderArt[i % 4]} className="absolute bottom-0 h-[80%] !opacity-25 [color:var(--block-muted)]" />
              <span className="relative font-display text-7xl text-block-ink">{initials(s.name)}</span>
            </div>
          )}
        </div>
      </div>
      <p className="mt-5 text-center font-display text-2xl leading-tight text-ink">{s.name}</p>
      <p className="mx-auto mt-2 max-w-[26ch] text-center text-[15px] leading-snug text-muted">
        {s.role[lang]}, {s.org}
      </p>
    </>
  );
}

// Endless, slow conveyor of speakers. Pauses on hover, keyboard focus or the
// pause button (WCAG 2.2.2); with reduced motion it becomes a plain scroll rail.
export default function Speakers({ t, lang }: { t: Dict["speakers"]; lang: Locale }) {
  const [paused, setPaused] = useState(false);
  const item = "w-[64vw] max-w-[17rem] shrink-0 sm:w-[16rem]";

  return (
    <section id="palestrantes" className={`${section} scroll-mt-20 overflow-hidden`} aria-labelledby="palestrantes-title">
      <div className={container}>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between" data-reveal>
          <H2 id="palestrantes-title" className="max-w-[16ch]">
            {t.title}
          </H2>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="speaker-toggle flex h-12 w-max items-center gap-2.5 rounded-full p-1.5 pr-5 text-sm text-ink ring-1 ring-line transition-colors hover:bg-ink/5"
          >
            <span className="grid size-9 place-items-center rounded-full bg-brand text-brand-ink">
              {paused ? <Play size={14} weight="fill" /> : <Pause size={14} weight="fill" />}
            </span>
            {paused ? t.play : t.pause}
          </button>
        </div>
      </div>

      <div
        className="speaker-loop no-scrollbar mt-14 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
        data-paused={paused || undefined}
        data-reveal
      >
        <div className="speaker-track flex w-max">
          <ul className="flex gap-6 pr-6 md:gap-10 md:pr-10" aria-label={t.title}>
            {speakers.map((s, i) => (
              <li key={s.name} className={item}>
                <Card s={s} i={i} lang={lang} />
              </li>
            ))}
          </ul>
          <ul className="speaker-copy flex gap-6 pr-6 md:gap-10 md:pr-10" aria-hidden>
            {speakers.map((s, i) => (
              <li key={s.name} className={item} inert>
                <Card s={s} i={i} lang={lang} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`${container} mt-14`} data-reveal>
        <a
          href={links.speakers2026Page}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex h-12 items-center gap-3 rounded-full pl-6 pr-1.5 text-[15px] font-medium text-ink ring-1 ring-line transition-transform duration-500 ease-[var(--ease-spring)] hover:bg-ink/5 active:scale-[0.98]"
        >
          {t.cta}
          <span className="grid size-9 place-items-center rounded-full bg-brand text-brand-ink transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-105">
            <ArrowUpRight size={16} />
          </span>
        </a>
      </div>
    </section>
  );
}
