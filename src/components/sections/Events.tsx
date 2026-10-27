"use client";

import { useState } from "react";
import Image from "next/image";
import type { Dict } from "@/lib/dictionaries/pt";
import { photos } from "@/lib/site";
import Lightbox from "../Lightbox";
import { H2, container, section } from "../ui";

// Horizontal accordion: on desktop the active night widens and reveals its
// story; on phones the three panels simply stack, all open. Clicking a panel
// opens its photo in the lightbox.
export default function Events({ t }: { t: Dict["events"] }) {
  const [active, setActive] = useState(0);
  const [viewing, setViewing] = useState<number | null>(null);
  return (
    <section id="eventos" className={`${section} bg-bg-2 wave-y`} aria-labelledby="eventos-title">
      <div className={container}>
        <H2 id="eventos-title">{t.title}</H2>

        <ul className="mt-14 flex flex-col gap-3 md:mt-20 lg:h-[34rem] lg:flex-row lg:gap-4" data-reveal>
          {t.items.map((item, i) => {
            const open = i === active;
            return (
              <li
                key={item.title}
                className={`relative overflow-hidden rounded-[2rem] ring-1 ring-line transition-[flex-grow] duration-700 ease-[var(--ease-spring)] max-lg:aspect-[4/3] lg:min-w-0 ${
                  open ? "lg:grow-[3]" : "lg:grow"
                } lg:basis-0`}
                onMouseEnter={() => setActive(i)}
              >
                <button
                  type="button"
                  onFocus={() => setActive(i)}
                  onClick={() => {
                    setActive(i);
                    setViewing(i);
                  }}
                  aria-label={`${t.enlarge}: ${item.title}`}
                  aria-haspopup="dialog"
                  className="group absolute inset-0 text-left"
                >
                  <Image
                    src={photos.events[i]}
                    alt=""
                    fill
                    sizes="(min-width:1024px) 60vw, 100vw"
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(34_14_52/0.05)_30%,rgb(34_14_52/0.9))]" />
                  <span className="absolute inset-x-0 bottom-0 block p-6 text-white md:p-8">
                    <span className="block text-sm text-[#E2C985]">{item.place}</span>
                    <span className="mt-1 block font-display text-2xl leading-tight md:text-3xl">{item.title}</span>
                    {/* Closed panels collapse the story to zero height, so place and
                        title rest on the bottom edge instead of floating mid-card. */}
                    <span
                      className={`grid transition-[grid-template-rows] duration-700 ease-[var(--ease-out-expo)] ${
                        open ? "grid-rows-[1fr]" : "grid-rows-[1fr] lg:grid-rows-[0fr]"
                      }`}
                    >
                      <span className="overflow-hidden">
                        <span
                          className={`block max-w-[46ch] pt-3 text-[0.9375rem] leading-relaxed text-white/85 transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] ${
                            open ? "translate-y-0 opacity-100" : "lg:translate-y-4 lg:opacity-0"
                          }`}
                        >
                          {item.text}
                        </span>
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <Lightbox
        items={t.items.map((item, i) => ({ src: photos.events[i], title: item.title, subtitle: item.place }))}
        index={viewing}
        onIndex={(i) => {
          setViewing(i);
          if (i !== null) setActive(i);
        }}
        labels={{ label: t.title, close: t.close, prev: t.prev, next: t.next }}
      />
    </section>
  );
}
