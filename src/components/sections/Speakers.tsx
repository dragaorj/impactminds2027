"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, X } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import type { Locale } from "@/lib/i18n";
import { links, speakers, type Speaker } from "@/lib/site";
import { speakerBios } from "@/lib/speakerBios";
import Art from "../Art";
import { H2, container, section } from "../ui";
import { useDialogDismiss } from "../useDialogDismiss";
import { scrollToTarget } from "../scrollTarget";

// Wide screens (md and up) show the cards marquee, phones the rows of faces.
// The server (and the first paint) renders both and CSS picks one; once in
// the browser only the layout in use stays in the page, so the hidden one's
// portraits and nodes cost nothing (it comes back if the window crosses md).
const WIDE = "(min-width: 768px)";
const watchWide = (onChange: () => void) => {
  const m = window.matchMedia(WIDE);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
};

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

// Our own photos are already small square WebPs: served as they are and loaded
// up front, so the moving rows never wait on the image optimiser.
function Portrait({ s, i, sizes }: { s: Speaker; i: number; sizes: string }) {
  const local = s.photo?.startsWith("/");
  return (
    <div className="relative aspect-square overflow-hidden rounded-full bg-block">
      {s.photo ? (
        <Image
          src={s.photo}
          alt=""
          fill
          sizes={sizes}
          unoptimized={local}
          loading={local ? "eager" : undefined}
          className="portrait-img object-cover"
        />
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
        {s.role[lang]}, {s.org[lang]}
      </span>
    </button>
  );
}

type BoxLabels = { title: string; close: string; prev: string; next: string; edition: string };

const navBtn =
  "grid size-12 shrink-0 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-md transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] hover:bg-sun hover:text-sun-ink active:scale-95";

// A bio paragraph with its web addresses as links.
function Linked({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/[^\s]+[^\s.,;)])/).map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-white underline decoration-[#E2C985]/70 underline-offset-[3px] hover:text-[#E2C985]">
            {part.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

// Speaker profile, laid straight over the blurred, darkened page (no card):
// the portrait in full colour beside the name, role, organisation and bio (on
// phones stacked, the bio scrolling on its own). Arrows (and the keyboard) step
// through the whole line-up.
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
  const bioRef = useRef<HTMLDivElement>(null);
  const total = list.length;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    bioRef.current?.scrollTo({ top: 0 });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % total);
      if (e.key === "ArrowLeft") onIndex((index - 1 + total) % total);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total, onIndex]);

  const s = index === null ? null : list[index];
  const close = () => onIndex(null);
  // Closes on a click outside the card, or on a scroll gesture outside it.
  useDialogDismiss(dialog, index !== null, close);
  const bio = s ? speakerBios[s.name]?.[lang] : undefined;

  return (
    <dialog
      ref={dialog}
      onClose={close}
      aria-label={labels.title}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-[rgb(14_7_22/0.88)] backdrop:backdrop-blur-2xl"
    >
      {index !== null && s && (
        <div className="flex h-full flex-col px-4 pb-5 pt-4 text-white sm:px-8 sm:pb-6">
          <div className="flex items-center justify-between">
            <p className="text-xs tabular-nums tracking-[0.18em] text-white/60">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </p>
            <button type="button" onClick={close} aria-label={labels.close} className={navBtn}>
              <X size="1.125rem" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center py-4 md:py-6">
            <div
              key={s.name}
              className="flex max-h-full w-full max-w-6xl animate-[menuIn_0.6s_var(--ease-out-expo)_both] flex-col items-center gap-6 md:flex-row md:items-center md:gap-16"
            >
              {/* The portrait, in full colour inside a fine gold ring with a soft glow. */}
              <div data-keep className="relative w-[min(42vw,11rem,24dvh)] shrink-0 md:w-[min(30vw,25rem,60dvh)]">
                <span aria-hidden className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgb(226_183_90/0.22),transparent_65%)]" />
                <div className="relative rounded-full p-1.5 ring-1 ring-[#E2C985]/45 md:p-2">
                  <Portrait s={s} i={index} sizes="(min-width:768px) 25rem, 11rem" />
                </div>
              </div>

              {/* Who, then the bio, which scrolls on its own when it is long. */}
              <div data-keep data-scroll className="flex min-h-0 w-full max-w-2xl flex-1 flex-col text-center md:text-left">
                <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[#E2C985]">{labels.edition}</p>
                <h3 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.75rem)] leading-[1.02] text-balance">{s.name}</h3>
                <p className="mt-3 text-base text-white/80 md:text-lg">{s.role[lang]}</p>
                <p className="mt-0.5 text-base font-medium text-[#E2C985] md:text-lg">{s.org[lang]}</p>
                {bio && (
                  <>
                    <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-[#E2C985]/50 md:mx-0 md:mt-8" />
                    <div
                      ref={bioRef}
                      className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6 text-left [mask-image:linear-gradient(180deg,#000_calc(100%-2.5rem),transparent)] [scrollbar-width:thin] md:mt-8 md:max-h-[42dvh]"
                    >
                      <div className="space-y-4 text-[0.9375rem] leading-relaxed text-white/75 md:text-base">
                        {bio.split(/\n\s*\n/).map((p, i) => (
                          <p key={i}>
                            <Linked text={p} />
                          </p>
                        ))}
                      </div>
                    </div>
                  </>
                )}
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
  const wide = useSyncExternalStore(watchWide, () => window.matchMedia(WIDE).matches, () => null);
  // A fresh random order on every visit. The server renders the default order;
  // the shuffle happens right after mount, long before the section scrolls in.
  const [list, setList] = useState(speakers);
  useEffect(() => {
    const id = requestAnimationFrame(() => setList(shuffle(speakers)));
    return () => cancelAnimationFrame(id);
  }, []);
  // A speaker picked in the hero's pill: scroll here, then open their profile
  // once the scroll has settled.
  useEffect(() => {
    const onPick = (e: Event) => {
      const i = list.findIndex((s) => s.name === (e as CustomEvent<string>).detail);
      if (i < 0) return;
      const section = document.getElementById("palestrantes");
      if (!section) return;
      scrollToTarget(section, { onComplete: () => setOpen(i) });
    };
    window.addEventListener("im:open-speaker", onPick);
    return () => window.removeEventListener("im:open-speaker", onPick);
  }, [list]);
  const item = "w-[64vw] max-w-[17rem] shrink-0 sm:w-[16rem]";

  return (
    <section id="palestrantes" className={`${section} scroll-mt-20 overflow-hidden`} aria-labelledby="palestrantes-title">
      <div className={container}>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between" data-reveal>
          <div>
            <H2 id="palestrantes-title" className="max-w-[16ch]">
              {t.title}
            </H2>
            <p className="mt-5 font-display text-2xl text-gold md:text-[1.75rem]">{t.count}</p>
            <p className="mt-2 max-w-[52ch] text-lg leading-relaxed text-ink-2">{t.lead}</p>
          </div>
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

      {/* Phones: two rows of small faces (no names), drifting right then left;
          a tap on any face opens the speaker. Larger screens keep the cards below. */}
      {wide !== true && (
      <div
        className="speaker-loop mt-10 space-y-3 md:hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
        data-paused={paused || open !== null || undefined}
        data-reveal
      >
        {[0, 1].map((row) => {
          const faces = list.map((s, i) => ({ s, i })).filter(({ i }) => i % 2 === row);
          return (
            <div key={row} className={`speaker-track flex w-max ${row === 0 ? "speaker-track-rev" : ""}`} style={{ animationDuration: `${faces.length * 6}s` }}>
              {[0, 1].map((copy) => (
                <ul key={copy} className={`flex gap-3 pr-3 ${copy ? "speaker-copy" : ""}`} aria-hidden={copy ? true : undefined}>
                  {faces.map(({ s, i }) => (
                    <li key={s.name} className="size-20 shrink-0">
                      {/* The copy keeps the loop seamless and is tappable too (half the
                          time it is the one on screen); only the first is in the tab order. */}
                      <button
                        type="button"
                        tabIndex={copy ? -1 : undefined}
                        onClick={() => setOpen(i)}
                        aria-label={`${t.open} ${s.name}`}
                        className="speaker-card group block size-full rounded-full bg-ink/[0.04] p-1 ring-1 ring-line"
                      >
                        <span className="relative block">
                          <Portrait s={s} i={i} sizes="5rem" />
                          <span aria-hidden className="speaker-wash pointer-events-none absolute inset-0 rounded-full" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          );
        })}
      </div>
      )}

      {wide !== false && (
      <div
        className="speaker-loop no-scrollbar mt-14 hidden md:block [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
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
      )}

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

      {/* Same warm-up as the photo lightbox: while a profile is open, the
          portraits on either side load at its own sizes, so stepping through is
          instant; nothing large loads before a profile is opened. */}
      <div aria-hidden className="pointer-events-none absolute left-0 top-0 size-px overflow-hidden opacity-0">
        {(open === null ? [] : [list[(open - 1 + list.length) % list.length], list[(open + 1) % list.length]]).map((s) =>
          s?.photo ? (
            <div key={s.name} className="relative size-px">
              <Image src={s.photo} alt="" fill sizes="(min-width:768px) 26rem, 70vw" unoptimized={s.photo.startsWith("/")} loading="lazy" />
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
