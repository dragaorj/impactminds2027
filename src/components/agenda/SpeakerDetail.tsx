"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Clock, LinkedinLogo, MagnifyingGlassPlus, MapPin, PencilSimple, Star, X } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import type { AgendaData, AgendaSpeaker } from "@/lib/agendaShape";
import { Avatar, ReadMore, dayLabel } from "./ui";

type T = Dict["agendaApp"];

// A speaker, in the centred pop-up: the photo (tap to see it large), name,
// role and organisation, LinkedIn, bio and the sessions they speak at.
export default function SpeakerDetail({
  s,
  data,
  lang,
  t,
  agendaHref,
  onEdit,
}: {
  onEdit?: () => void;
  s: AgendaSpeaker;
  data: AgendaData;
  lang: string;
  t: T;
  agendaHref: string;
}) {
  const [zoom, setZoom] = useState(false);
  const talks = data.talks.filter((x) => x.speakerIds.includes(s.id) || x.moderatorId === s.id);
  return (
    <article>
      <div className="flex flex-col items-center text-center">
        {s.photo ? (
          <button
            type="button"
            onClick={() => setZoom(true)}
            aria-label={s.name}
            className="group relative rounded-full outline-offset-4 transition-transform duration-300 hover:scale-[1.03]"
          >
            <Avatar name={s.name} photo={s.photo} size={112} />
            <span className="absolute bottom-0.5 right-0.5 grid size-8 place-items-center rounded-full bg-surface text-ink-2 shadow-[var(--shadow)] ring-1 ring-line transition-colors group-hover:text-brand">
              <MagnifyingGlassPlus size={15} aria-hidden />
            </span>
          </button>
        ) : (
          <Avatar name={s.name} photo="" size={112} />
        )}
        {s.featured && (
          <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-[rgb(201_162_77/0.16)] px-2.5 py-1 text-xs font-semibold text-[#7a5a12]">
            <Star size={12} weight="fill" className="text-[#c9a24d]" aria-hidden /> {t.fFeatured}
          </span>
        )}
        <h2 className={`${s.featured ? "mt-2" : "mt-4"} text-[1.5rem] font-semibold leading-tight tracking-[-0.02em]`}>{s.name}</h2>
        {s.role && <p className="mt-1.5 max-w-[36ch] text-[15px] text-ink-2">{s.role}</p>}
        {s.company && <p className="mt-0.5 text-[15px] font-medium text-brand">{s.company}</p>}
        <span className="mt-4 flex flex-wrap justify-center gap-2">
          {s.linkedin && (
            <a href={s.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-full bg-[rgb(118_118_128/0.12)] px-4 text-sm font-medium text-ink transition-colors hover:bg-[rgb(118_118_128/0.18)]">
              <LinkedinLogo size={16} weight="fill" aria-hidden className="text-[#0a66c2]" /> {t.linkedin}
            </a>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[rgb(118_118_128/0.12)] px-4 text-sm font-medium text-ink transition-colors hover:bg-[rgb(118_118_128/0.18)]"
            >
              <PencilSimple size={16} aria-hidden /> {t.edit}
            </button>
          )}
        </span>
      </div>

      {s.bio && <ReadMore key={s.id} text={s.bio} more={t.more} less={t.less} className="mt-6" />}

      {talks.length > 0 && (
        <section className="mt-7">
          <h3 className="text-[13px] font-semibold text-muted">{t.inSessions}</h3>
          <ul className="mt-3 space-y-2">
            {talks.map((x) => {
              const d = data.days.find((y) => y.index === x.day);
              return (
                <li key={x.id}>
                  <a href={`${agendaHref}?dia=${x.day}&s=${encodeURIComponent(x.id)}`} className="block rounded-[18px] bg-[rgb(118_118_128/0.07)] p-4 transition-colors hover:bg-[rgb(118_118_128/0.12)]">
                    <span className="block text-[15px] font-medium leading-snug text-ink">{x.title}</span>
                    <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={13} aria-hidden /> {d?.date ? `${dayLabel(d.date, lang).day} · ` : ""}
                        <span className="tabular-nums">
                          {x.start}–{x.end}
                        </span>
                      </span>
                      {x.room && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} aria-hidden /> {x.room}
                        </span>
                      )}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {zoom && s.photo && <PhotoZoom src={s.photo} name={s.name} closeLabel={t.close} onClose={() => setZoom(false)} />}
    </article>
  );
}

// The photo, large, over everything; Esc, the button or a click closes it
// (only this layer: the speaker stays open underneath).
function PhotoZoom({ src, name, closeLabel, onClose }: { src: string; name: string; closeLabel: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    // Only the circle: the speaker card underneath steps out while zoomed.
    const under = d?.parentElement?.closest("dialog") as HTMLElement | null;
    if (under) under.style.opacity = "0";
    return () => {
      if (under) under.style.opacity = "";
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={name}
      onClose={onClose}
      onClick={onClose}
      className="platform-zoom m-auto h-[100dvh] max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-[rgb(20_8_30/0.82)] backdrop:backdrop-blur-md"
    >
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <div className="relative aspect-square w-[min(34rem,86vw,72dvh)] overflow-hidden rounded-full shadow-[0_40px_100px_-30px_rgb(0_0_0/0.7)]">
          <Image src={src} alt={name} fill sizes="(min-width: 640px) 544px, 86vw" className="object-cover" />
        </div>
        <p className="text-base font-medium text-white">{name}</p>
        <button type="button" onClick={onClose} aria-label={closeLabel} className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-white/20">
          <X size={18} />
        </button>
      </div>
    </dialog>
  );
}
