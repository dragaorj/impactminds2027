"use client";

import { ArrowUpRight, Images } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { ABOUT_VIDEO_ID, links } from "@/lib/site";
import Art from "../Art";
import VideoPanel from "../VideoPanel";
import { H2, container, section } from "../ui";

const albumLinks = [links.albums.dinner, links.albums.cocktail, links.albums.day1, links.albums.day2];

// Text and the photo albums on the left, the video (with its controls below
// it) on the right.
export default function About({ t, g }: { t: Dict["about"]; g: Dict["gallery"] }) {
  return (
    <section id="sobre" className={`${section} bg-bg-2`} aria-labelledby="sobre-title">
      <Art name="mosaic" className="pointer-events-none absolute bottom-6 right-[calc(4vw_-_13rem)] hidden w-52 lg:block" />
      <div className={`${container} grid gap-14 xl:grid-cols-12 xl:gap-10`}>
        <div className="xl:col-span-5 xl:pt-6">
          <div data-reveal>
            <H2 id="sobre-title">{t.title}</H2>
            <div className="mt-8 max-w-[62ch] space-y-5 text-lg leading-relaxed text-ink-2">
              <p>{t.p1}</p>
              <p>{t.p2}</p>
            </div>
          </div>

          <div id="fotos" className="mt-12 scroll-mt-28" data-reveal>
            <h3 className="font-display text-2xl text-ink">{g.title}</h3>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {g.albums.map((album, i) => (
                <li key={album}>
                  <a
                    href={albumLinks[i]}
                    className="group flex items-center justify-between gap-3 rounded-full bg-surface px-5 py-3.5 text-[0.9375rem] text-ink ring-1 ring-line transition-colors duration-300 hover:bg-brand hover:text-brand-ink"
                  >
                    <span className="flex items-center gap-3">
                      <Images size="1.125rem" weight="light" className="text-brand transition-colors group-hover:text-brand-ink" />
                      {album}
                    </span>
                    <ArrowUpRight size="1rem" className="shrink-0 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-px group-hover:translate-x-0.5" />
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={links.allPhotos}
              className="group mt-5 inline-flex h-12 items-center gap-3 rounded-full btn-solid pl-6 pr-1.5 text-[0.9375rem] font-medium transition-[transform,background-color,color] duration-500 ease-[var(--ease-spring)] active:scale-[0.98]"
            >
              {g.all}
              <span className="grid size-9 place-items-center rounded-full bg-brand-ink/15 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-105">
                <ArrowUpRight size="1rem" />
              </span>
            </a>
          </div>
        </div>

        <div className="xl:col-span-7" data-reveal>
          <VideoPanel
            videoId={ABOUT_VIDEO_ID}
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
