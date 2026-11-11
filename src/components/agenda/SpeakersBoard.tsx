"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CaretRight, GridFour, MagnifyingGlass, Rows, SquaresFour, Star } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import type { AgendaSpeaker } from "@/lib/agendaShape";
import { useAgenda, useAsked } from "./store";
import { speakersViewPath, type SpeakersView } from "@/lib/nav";
import type { Locale } from "@/lib/i18n";
import { Avatar, PageTitle, SearchCount, Segmented, Sheet, card, norm } from "./ui";
import SpeakerDetail, { preloadPhoto } from "./SpeakerDetail";
import { useReveal } from "./motion";
import Tour, { HelpButton } from "./Tour";
import { FeaturedOrder, SpeakerForm } from "./Editor";
import { wrap } from "./width";

type T = Dict["agendaApp"];

// Everyone speaking. The featured speakers (the site's carousel) come first,
// larger, in their own order; then everyone else as a calm grid. A search
// filters both. A card opens the speaker in the middle of the screen (photo
// zoom, bio, LinkedIn, sessions); ?s=<id> opens one directly. Signed in:
// "New speaker", "Order featured" and "Edit" on every speaker.
export default function SpeakersBoard({ lang, t, agendaHref, fixedView }: { lang: string; t: T; agendaHref: string; fixedView?: SpeakersView }) {
  const { data, editing, signedIn } = useAgenda();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null | undefined>(undefined);
  const [ordering, setOrdering] = useState(false);
  // Three ways to browse: cards, a list (name, role, organisation) and a
  // compact wall of photos. Remembered in this browser.
  // The view comes from the address (/palestrantes/fotos …) or the last one
  // used here; the address always shows the view's own link. ?filtro=destaques
  // shows only the featured speakers.
  const [mode, setMode] = useState<SpeakersView>(fixedView ?? "cards");
  const [group, setGroup] = useState<"all" | "featured">("all");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const m = localStorage.getItem("im-speakers-view");
      if (!fixedView && (m === "cards" || m === "list" || m === "photos")) setMode(m);
    } catch {}
    if (new URLSearchParams(location.search).get("filtro") === "destaques") setGroup("featured");
    setReady(true);
  }, [fixedView]);
  const pickMode = (m: SpeakersView) => {
    setMode(m);
    try {
      localStorage.setItem("im-speakers-view", m);
    } catch {}
  };
  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams(location.search);
    if (group === "featured") p.set("filtro", "destaques");
    else p.delete("filtro");
    const qs = p.toString();
    history.replaceState(history.state, "", `${speakersViewPath(lang as Locale, mode)}${qs ? `?${qs}` : ""}`);
  }, [mode, group, ready, lang]);

  useEffect(() => {
    const s = new URLSearchParams(location.search).get("s");
    if (s && data.speakers.some((x) => x.id === s)) setOpenId(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (openId) p.set("s", openId);
    else p.delete("s");
    const qs = p.toString();
    history.replaceState(history.state, "", `${location.pathname}${qs ? `?${qs}` : ""}`);
  }, [openId]);
  const shown = group === "featured" ? data.speakers.filter((s) => s.featured) : data.speakers;

  const query = norm(q.trim());
  const list = useMemo(() => (query ? shown.filter((s) => norm(`${s.name} ${s.role} ${s.company}`).includes(query)) : shown), [shown, query]);
  const featured = list.filter((s) => s.featured);
  const others = list.filter((s) => !s.featured);
  const open = data.speakers.find((s) => s.id === openId) ?? null;
  // The speakers glide in when the view or the group changes.
  const reveal = useReveal<HTMLDivElement>(`${mode}|${group}`);
  useAsked("newSpeaker", () => setEditId(null));
  useAsked("order", () => setOrdering(true));
  const warm = (e: React.SyntheticEvent) => preloadPhoto((e.target as HTMLElement).closest<HTMLElement>("[data-photo]")?.dataset.photo);

  return (
    <div
      ref={reveal}
      className={`${wrap} pb-16 pt-6 sm:pt-10`}
      // A speaker under the pointer (or the finger, or the keyboard): their
      // large photos start loading, so opening and zooming are instant.
      onPointerOver={warm}
      onPointerDown={warm}
      onFocus={warm}
    >
      <PageTitle title={t.speakers} subtitle={t.subtitle} />


      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
      <div className="flex gap-2 sm:contents">
      <label className="relative block min-w-0 flex-1 sm:max-w-xl" data-tour="search">
        <span className="sr-only">{t.searchSpeakers}</span>
        <MagnifyingGlass size={17} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.searchSpeakers}
          className="h-11 w-full rounded-full bg-[rgb(118_118_128/0.12)] pl-11 pr-32 text-[15px] text-ink outline-none transition-[box-shadow,background-color] placeholder:text-muted focus:bg-surface focus:ring-2 focus:ring-brand/35"
        />
        <SearchCount shown={list.length} total={shown.length} one={t.speakerOne} many={t.speakers.toLowerCase()} of={t.ofTotal} filtered={!!query} />
      </label>
      {/* "How to use": the guided tour again. */}
      <HelpButton label={t.tour.howTo} />
      </div>
        {/* Phones: all filters on one compact row (as on the agenda). */}
        <div className="flex items-center gap-2 sm:contents">
        <Segmented
          label={t.featured}
          tour="group"
          value={group}
          onChange={setGroup}
          className="min-w-0 flex-1 sm:ml-auto sm:flex-none sm:shrink-0"
          options={[
            { value: "all", label: t.all },
            { value: "featured", label: <><Star size={15} weight="fill" className="shrink-0 text-[#c9a24d]" aria-hidden />{t.featured}</> },
          ]}
        />
        <Segmented
          label={t.view}
          tour="view"
          value={mode}
          onChange={pickMode}
          className="shrink-0"
          options={[
            { value: "cards", title: t.cards, label: <><SquaresFour size={17} aria-hidden /><span className="max-md:sr-only">{t.cards}</span></> },
            { value: "list", title: t.list, label: <><Rows size={17} aria-hidden /><span className="max-md:sr-only">{t.list}</span></> },
            { value: "photos", title: t.photos, label: <><GridFour size={17} aria-hidden /><span className="max-md:sr-only">{t.photos}</span></> },
          ]}
        />
        </div>
      </div>

      <Tour
        page="speakers"
        enabled={!signedIn}
        t={t.tour}
        steps={[
          t.tour.spkWelcome,
          { target: "search", ...t.tour.spkSearch },
          { target: "group", ...t.tour.group },
          { target: "view", ...t.tour.spkView },
          { target: "content", ...t.tour.spkContent },
          { target: "tabs", ...t.tour.spkTabs },
          { target: "lang", ...t.tour.lang },
          { target: "howto", ...t.tour.end },
        ]}
      />

      {!data.speakers.length ? (
        <div className={`${card} mt-8 px-6 py-14 text-center`}>
          <p className="text-[15px] text-ink-2">{t.emptySpeakers}</p>
        </div>
      ) : list.length === 0 ? (
        <div className={`${card} mt-8 px-6 py-14 text-center`}>
          <p className="text-[15px] text-ink-2">{t.noResults}</p>
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="mt-8" aria-labelledby="featured-title" data-tour="content">
              <h2 id="featured-title" className="flex items-center gap-2 text-[13px] font-semibold text-muted">
                <Star size={14} weight="fill" className="text-[#c9a24d]" aria-hidden /> {t.featured}
              </h2>
              {mode === "cards" ? (
                <ul className="mt-3 grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 portrait:lg:grid-cols-3 min-[112.5rem]:grid-cols-[repeat(auto-fill,minmax(17rem,1fr))]">
                  {featured.map((s) => (
                    <li key={s.id} data-glide>
                      <FeaturedCard s={s} onOpen={() => setOpenId(s.id)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <People list={featured} mode={mode} featured onOpen={setOpenId} />
              )}
            </section>
          )}

          {/* Everyone else, below a plain line (no heading), smaller. */}
          {others.length > 0 && (
            <section className={featured.length > 0 ? "mt-10 border-t border-line pt-8" : "mt-8"} aria-label={t.others} data-tour="content">
              {mode !== "cards" ? (
                <People list={others} mode={mode} onOpen={setOpenId} />
              ) : (
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6 min-[112.5rem]:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))]">
                {others.map((s) => (
                  <li key={s.id} data-glide>
                    <button
                      type="button"
                      onClick={() => setOpenId(s.id)}
                      data-photo={s.photo || undefined}
                      className={`${card} group flex h-full w-full flex-col items-center px-2 pb-3.5 pt-4 text-center sm:px-3 sm:pb-5 sm:pt-6 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow)] active:scale-[0.985]`}
                    >
                      <Avatar name={s.name} photo={s.photo} size={80} />
                      <span className="mt-2.5 line-clamp-2 text-[13px] font-semibold leading-snug tracking-[-0.01em] text-ink group-hover:text-brand sm:mt-4 sm:text-[15px]">{s.name}</span>
                      {s.role && <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted sm:mt-1 sm:text-[13px]">{s.role}</span>}
                      {s.company && <span className="mt-1 line-clamp-1 text-[11px] font-medium text-ink-2 sm:mt-1.5 sm:text-[13px]">{s.company}</span>}
                    </button>
                  </li>
                ))}
              </ul>
              )}
            </section>
          )}
        </>
      )}

      <Sheet centered open={!!open} onClose={() => setOpenId(null)} label={open?.name ?? ""} closeLabel={t.close}>
        {open && <SpeakerDetail s={open} data={data} lang={lang} t={t} agendaHref={agendaHref} onEdit={editing ? () => (setOpenId(null), setEditId(open.id)) : undefined} />}
      </Sheet>
      {editing && (
        <>
          <SpeakerForm id={editId} open={editId !== undefined} onClose={() => setEditId(undefined)} t={t} />
          <FeaturedOrder open={ordering} onClose={() => setOrdering(false)} t={t} />
        </>
      )}
    </div>
  );
}

// A headline speaker: a tall portrait card, the photo filling the top.
function FeaturedCard({ s, onOpen }: { s: AgendaSpeaker; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-photo={s.photo || undefined}
      className={`${card} group flex h-full w-full flex-col overflow-hidden text-left transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow)] active:scale-[0.985]`}
    >
      <span className="relative block aspect-[4/5] w-full overflow-hidden bg-brand-soft">
        {s.photo ? (
          <Image src={s.photo} alt="" fill sizes="(min-width: 1024px) 300px, 34vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <span className="grid size-full place-items-center">
            <Avatar name={s.name} size={96} />
          </span>
        )}
        <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white/90 text-[#c9a24d] shadow-sm backdrop-blur sm:left-3 sm:top-3 sm:size-8">
          <Star size={13} weight="fill" aria-hidden className="sm:size-[15px]" />
        </span>
      </span>
      <span className="flex flex-1 flex-col p-2.5 sm:p-5">
        <span className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-[-0.01em] text-ink group-hover:text-brand sm:text-[17px] sm:tracking-[-0.015em]">{s.name}</span>
        {s.role && <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted sm:mt-1 sm:text-[13px]">{s.role}</span>}
        {s.company && <span className="mt-1 line-clamp-1 text-[11px] font-medium text-ink-2 sm:mt-1.5 sm:text-[13px]">{s.company}</span>}
      </span>
    </button>
  );
}

// List and photo-wall views of a group of speakers.
function People({ list, mode, featured = false, onOpen }: { list: AgendaSpeaker[]; mode: "list" | "photos"; featured?: boolean; onOpen: (id: string) => void }) {
  if (mode === "photos")
    return (
      <ul className={`mt-3 grid gap-3 sm:gap-4 ${featured ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 min-[112.5rem]:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]" : "grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 min-[112.5rem]:grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]"}`}>
        {list.map((s) => (
          <li key={s.id} data-glide className="relative">
            <button
              type="button"
              onClick={() => onOpen(s.id)} data-photo={s.photo || undefined}
              aria-label={s.name}
              className="group relative block aspect-square w-full overflow-hidden rounded-full bg-brand-soft shadow-[var(--shadow-card)] ring-1 ring-line transition-transform duration-300 hover:scale-[1.04] focus-visible:scale-[1.04] active:scale-[0.97]"
            >
              {s.photo ? (
                <Image src={s.photo} alt="" fill sizes="(min-width: 1024px) 140px, 25vw" className="object-cover" />
              ) : (
                <span className="grid size-full place-items-center">
                  <Avatar name={s.name} size={48} />
                </span>
              )}
              {/* On hover / focus: the photo darkens and the first two names show. */}
              <span className="absolute inset-0 grid place-items-center bg-[rgb(29_20_38/0.62)] p-2 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className={`line-clamp-2 font-semibold leading-tight text-white ${featured ? "text-[13px] sm:text-sm" : "text-[10px] sm:text-[11px]"}`}>{s.name.split(/\s+/).slice(0, 2).join(" ")}</span>
              </span>
            </button>
            {/* Featured: a star on the circle's edge, top right (45°). */}
            {featured && (
              <span className="pointer-events-none absolute left-[85.36%] top-[14.64%] z-10 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface text-[#c9a24d] shadow-[0_2px_8px_rgb(29_20_38/0.18)] ring-1 ring-line">
                <Star size={14} weight="fill" aria-hidden />
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  return (
    <ul className={`${card} mt-3 overflow-hidden min-[112.5rem]:grid-cols-[repeat(auto-fill,minmax(28rem,1fr))] min-[112.5rem]:grid`}>
      {list.map((s) => (
        <li key={s.id} data-glide className="-mt-px border-t border-line">
          <button type="button" onClick={() => onOpen(s.id)} data-photo={s.photo || undefined} className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-[rgb(118_118_128/0.06)]">
            <Avatar name={s.name} photo={s.photo} size={48} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">{s.name}</span>
                {featured && <Star size={13} weight="fill" className="shrink-0 text-[#c9a24d]" aria-hidden />}
              </span>
              <span className="mt-0.5 block truncate text-[13px] text-muted">{[s.role, s.company].filter(Boolean).join(" · ")}</span>
            </span>
            <CaretRight size={15} aria-hidden className="shrink-0 text-muted" />
          </button>
        </li>
      ))}
    </ul>
  );
}
