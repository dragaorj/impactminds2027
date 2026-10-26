"use client";

import type { Dict } from "@/lib/dictionaries/pt";
import { ABOUT_VIDEO_ID } from "@/lib/site";
import Art from "../Art";
import VideoPanel from "../VideoPanel";
import { H2, container, section } from "../ui";

// Text on the left, the video (with its controls below it) on the right.
export default function About({ t, videoSrc }: { t: Dict["about"]; videoSrc?: string }) {
  return (
    <section id="sobre" className={`${section} bg-bg-2`} aria-labelledby="sobre-title">
      <Art name="mosaic" className="pointer-events-none absolute bottom-6 right-[calc(4vw_-_13rem)] hidden w-52 lg:block" />
      <div className={`${container} grid gap-14 xl:grid-cols-12 xl:gap-10`}>
        <div className="xl:col-span-5 xl:self-center">
          <div data-reveal>
            <H2 id="sobre-title">{t.title}</H2>
            <div className="mt-8 max-w-[62ch] space-y-5 text-lg leading-relaxed text-ink-2">
              <p>{t.p1}</p>
              <p>{t.p2}</p>
            </div>
          </div>

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
