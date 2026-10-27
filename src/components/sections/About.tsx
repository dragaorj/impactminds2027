"use client";

import { Coins, Handshake, Lightbulb } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { ABOUT_VIDEO_ID } from "@/lib/site";
import Art from "../Art";
import VideoPanel from "../VideoPanel";
import { H2, container, section } from "../ui";

// Text on the left with a gold kicker and the three pillars the conference
// connects; the video (with its controls below it) on the right.
export default function About({ t, videoSrc }: { t: Dict["about"]; videoSrc?: string }) {
  return (
    <section id="sobre" className={`${section} bg-bg-2`} aria-labelledby="sobre-title">
      <Art name="mosaic" className="pointer-events-none absolute bottom-6 right-[calc(4vw_-_13rem)] hidden w-52 lg:block" />
      <div className={`${container} grid gap-14 xl:grid-cols-12 xl:gap-10`}>
        <div className="xl:col-span-5 xl:self-center">
          <div data-reveal>
            <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-gold md:text-sm" data-nosplit>
              <span aria-hidden className="h-px w-10 bg-gold/60" />
              {t.kicker}
            </p>
            <H2 id="sobre-title" className="mt-5">
              {t.title}
            </H2>
            <div className="mt-8 max-w-[62ch] space-y-5 text-lg leading-relaxed text-ink-2">
              <p>{t.p1}</p>
              <p>{t.p2}</p>
            </div>
          </div>

          {/* The three things the conference connects, each with a gold mark. */}
          <ul className="mt-10 grid gap-3 sm:grid-cols-3" data-stagger>
            {t.pillars.map((p, i) => {
              const Icon = [Coins, Lightbulb, Handshake][i] ?? Coins;
              return (
                <li
                  key={p.title}
                  data-stagger-item
                  data-nosplit
                  className="group rounded-[1.5rem] bg-surface/70 p-5 ring-1 ring-line transition-[transform,box-shadow] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 hover:ring-sun/50"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-sun/15 text-gold ring-1 ring-gold/25">
                    <Icon size="1.125rem" weight="light" />
                  </span>
                  <span className="mt-4 block font-display text-xl text-ink">{p.title}</span>
                  <span className="mt-1.5 block text-sm leading-snug text-ink-2">{p.text}</span>
                </li>
              );
            })}
          </ul>

        </div>

        <div className="xl:col-span-7" data-reveal>
          <VideoPanel
            videoId={ABOUT_VIDEO_ID}
            src={videoSrc}
            labels={{
              soundOn: t.soundOn,
              soundOff: t.soundOff,
              watch: t.watch,
              close: t.close,
              videoLabel: t.videoLabel,
              play: t.play,
              pause: t.pause,
            }}
          />
        </div>
      </div>
    </section>
  );
}
