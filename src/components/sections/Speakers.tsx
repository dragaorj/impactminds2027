"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, X } from "@phosphor-icons/react";
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

// Fisher-Yates on a copy.
function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The platform photos are oval cut-outs, so they are scaled up to fill the circle.
function Portrait({ s, i, sizes }: { s: Speaker; i: number; sizes: string }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-full bg-block">
      {s.photo ? (
        <Image src={s.photo} alt="" fill sizes={sizes} className="portrait-img scale-[1.24] object-cover object-[50%_35%]" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Art name={placeholderArt[i % 4]} className="absolute bottom-0 h-[80%] !opacity-25 [color:var(--block-muted)]" />
          <span className="relative font-display text-7xl text-block-ink">{initials(s.name)}</span>
        </div>
      )}
    </div>
  );
}

// At rest every photo is a muted purple duotone (grayscale under a purple
// colour wash); hover or focus brings the colour back with a slow zoom.
// Clicking opens the speaker in the lightbox.
function Card({ s, i, lang, label, onOpen }: { s: Speaker; i: number; lang: Locale; label: string; onOpen?: () => void }) {
  return (
    <button type="button" onClick={onOpen} aria-label={`${label} ${s.name}`} className="speaker-card group block w-full">
      <span className="block rounded-full bg-ink/[0.04] p-1.5 ring-1 ring-line transition-[box-shadow] duration-500 group-hover:ring-sun/60 group-focus-visible:ring-sun/60">
        <span className="relative block">
          <Portrait s={s} i={i} sizes="18rem" />
          <span aria-hidden className="speaker-wash pointer-events-none absolute inset-0 rounded-full" />
        </span>
      </span>
      <span className="mt-5 block text-center font-display text-2xl leading-tight text-ink transition-colors duration-500 group-hover:text-gold">
        {s.name}
      </span>
      <span className="mx-auto mt-2 block max-w-[26ch] text-center text-[0.9375rem] leading-snug text-muted">
        {s.role[lang]}, {s.org}
      </span>
    </button>
  );
}

type BoxLabels = { title: string; close: string; prev: string; next: string; edition: string };

const navBtn =
  "grid size-12 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-md transition-[transform,background-color] duration-500 ease-[var(--ease-spring)] hover:bg-sun hover:text-sun-ink active:scale-95";

// Speaker lightbox: the portrait in full colour beside name, role and
// organisation; arrows and the keyboard step through the whole line-up.
function SpeakerBox({
  list,
  index,
  onIndex,
  lang,
  labels,
}: {
  list: Speaker[];
  index: number | null;
  onIndex: (i: number | null) => void;
  lang: Locale;
  labels: BoxLabels;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const total = list.length;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % total);
      if (e.key === "ArrowLeft") onIndex((index - 1 + total) % total);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total, onIndex]);

  const s = index === null ? null : list[index];
  const close = () => onIndex(null);

  return (
    <dialog
      ref={dialog}
      onClose={close}
      onClick={(e) => e.target === e.currentTarget && close()}
      aria-label={labels.title}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-[rgb(34_14_52/0.94)] p-0 backdrop:bg-transparent"
    >
      {index !== null && s && (
        <div className="flex h-full flex-col px-4 pb-6 pt-4 sm:px-8" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="flex items-center justify-between text-white">
            <p className="text-sm tabular-nums text-white/70">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </p>
            <button type="button" onClick={close} aria-label={labels.close} className={navBtn}>
              <X size="1.125rem" />
            </button>
          </div>

          <div className="grid min-h-0 flex-1 place-items-center py-6" onClick={(e) => e.target === e.currentTarget && close()}>
            <div
              key={s.name}
              className="flex w-full max-w-5xl animate-[menuIn_0.6s_var(--ease-out-expo)_both] flex-col items-center gap-8 text-center text-white md:flex-row md:gap-14 md:text-left"
            >
              <div className="w-[min(70vw,24rem,44dvh)] shrink-0 rounded-full p-2 ring-1 ring-white/20 md:w-[min(38vw,26rem,62dvh)]">
                <Portrait s={s} i={index} sizes="(min-width:768px) 26rem, 70vw" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[#E2C985]">{labels.edition}</p>
                <h3 className="mt-3 font-display text-[clamp(2.25rem,5vw,4rem)] leading-[1.02]">{s.name}</h3>
                <p className="mt-5 text-lg text-white/85 sm:text-xl">{s.role[lang]}</p>
                <p className="mt-1 text-lg font-medium sm:text-xl">{s.org}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => onIndex((index - 1 + total) % total)} aria-label={labels.prev} className={navBtn}>
              <ArrowLeft size="1.125rem" />
            </button>
            <button type="button" onClick={() => onIndex((index + 1) % total)} aria-label={labels.next} className={navBtn}>
              <ArrowRight size="1.125rem" />
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

// Endless, slow conveyor of speakers. Pauses on hover, keyboard focus, the
// pause button (WCAG 2.2.2) or while a speaker is open; with reduced motion it
// becomes a plain scroll rail.
export default function Speakers({ t, lang }: { t: Dict["speakers"]; lang: Locale }) {
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  // A fresh random order on every visit. The server renders the default order;
  // the shuffle happens right after mount, long before the section scrolls in.
  const [list, setList] = useState(speakers);
  useEffect(() => {
    const id = requestAnimationFrame(() => setList(shuffle(speakers)));
    return () => cancelAnimationFrame(id);
  }, []);
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
            className="speaker-toggle flex h-12 w-max items-center gap-2.5 rounded-full p-1.5 pr-5 text-sm btn-outline"
          >
            <span className="grid size-9 place-items-center rounded-full bg-brand text-brand-ink">
              {paused ? <Play size="0.875rem" weight="fill" /> : <Pause size="0.875rem" weight="fill" />}
            </span>
            {paused ? t.play : t.pause}
          </button>
        </div>
      </div>

      <div
        className="speaker-loop no-scrollbar mt-14 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
        data-paused={paused || open !== null || undefined}
        data-reveal
      >
        <div className="speaker-track flex w-max">
          <ul className="flex gap-6 pr-6 md:gap-10 md:pr-10" aria-label={t.title}>
            {list.map((s, i) => (
              <li key={s.name} className={item}>
                <Card s={s} i={i} lang={lang} label={t.open} onOpen={() => setOpen(i)} />
              </li>
            ))}
          </ul>
          <ul className="speaker-copy flex gap-6 pr-6 md:gap-10 md:pr-10" aria-hidden>
            {list.map((s, i) => (
              <li key={s.name} className={item} inert>
                <Card s={s} i={i} lang={lang} label={t.open} />
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
          className="group inline-flex h-12 items-center gap-3 rounded-full pl-6 pr-1.5 text-[0.9375rem] font-medium btn-outline transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] active:scale-[0.98]"
        >
          {t.cta}
          <span className="grid size-9 place-items-center rounded-full bg-brand text-brand-ink transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-105">
            <ArrowUpRight size="1rem" />
          </span>
        </a>
      </div>

      {/* Same warm-up as the photo lightbox: the large portraits load (lazily,
          at the lightbox's own sizes) once this section nears the screen. */}
      <div aria-hidden className="pointer-events-none absolute left-0 top-0 size-px overflow-hidden opacity-0">
        {speakers.map((s) =>
          s.photo ? (
            <div key={s.name} className="relative size-px">
              <Image src={s.photo} alt="" fill sizes="(min-width:768px) 26rem, 70vw" loading="lazy" />
            </div>
          ) : null,
        )}
      </div>

      <SpeakerBox
        list={list}
        index={open}
        onIndex={setOpen}
        lang={lang}
        labels={{ title: t.title, close: t.close, prev: t.prev, next: t.next, edition: t.edition }}
      />
    </section>
  );
}
