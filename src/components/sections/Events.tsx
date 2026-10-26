"use client";

import { useState } from "react";
import Image from "next/image";
import type { Dict } from "@/lib/dictionaries/pt";
import { photos } from "@/lib/site";
import { H2, container, section } from "../ui";

// Horizontal accordion: on desktop the active night widens and reveals its
// story; on phones the three panels simply stack, all open.
export default function Events({ t }: { t: Dict["events"] }) {
  const [active, setActive] = useState(0);
  return (
    <section id="eventos" className={`${section} bg-bg-2`} aria-labelledby="eventos-title">
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
                  onClick={() => setActive(i)}
                  aria-expanded={open}
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
                    <span
                      className={`mt-3 block max-w-[46ch] text-[0.9375rem] leading-relaxed text-white/85 transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] ${
                        open ? "translate-y-0 opacity-100" : "lg:translate-y-4 lg:opacity-0"
                      }`}
                    >
                      {item.text}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
