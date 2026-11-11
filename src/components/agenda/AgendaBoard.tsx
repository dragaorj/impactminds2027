"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CalendarPlus, CaretRight, Clock, Info, MagnifyingGlass, MapPin, PencilSimple, Rows, SquaresFour, Star, Translate, X } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import type { AgendaSpeaker, AgendaTalk } from "@/lib/agendaShape";
import { hhmm, toMin } from "@/lib/agendaShape";
import { useAgenda, useAsked } from "./store";
import { agendaViewPath, type AgendaView } from "@/lib/nav";
import type { Locale } from "@/lib/i18n";
import ShareButton from "./Share";
import { NoticeBox } from "./Tools";
import { Avatar, Button, ReadMore, SearchCount, Segmented, Sheet, Tag, card, dayLabel, norm } from "./ui";
import SpeakerDetail from "./SpeakerDetail";
import { TalkForm } from "./Editor";
import { useReveal } from "./motion";
import { wrap } from "./width";

type T = Dict["agendaApp"];
const FAVS_KEY = "im-agenda-favs";

// The agenda: the days as tabs (plus the visitor's favourites), a search and
// two filters, then the sessions as a list by start time or as the classic
// grid (a column per room, time running down, each session as tall as it
// lasts, softly tinted by format; a room's name folds its column). A session
// opens in a side panel; a speaker in it opens in the middle of the screen.
// Favourites stay in this browser. Signed in, the same screens edit: "New
// session", "Edit" on every session, and sessions drag to another time or
// room in the grid. Day, view and open session live in the address.
export default function AgendaBoard({ lang, t, fixedView }: { lang: string; t: T; fixedView?: AgendaView }) {
  const { data, editing, signedIn, moveTalk } = useAgenda();
  const days = data.days.length ? data.days : [...new Set(data.talks.map((x) => x.day))].map((i) => ({ index: i, date: "", weekday: "" }));
  const [day, setDay] = useState(days[0]?.index ?? 0);
  const [favMode, setFavMode] = useState(false);
  const [q, setQ] = useState("");
  const [room, setRoom] = useState("");
  const [format, setFormat] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [speakerId, setSpeakerId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null | undefined>(undefined); // undefined: closed; null: new
  // The view in the address (/agenda/grade, /agenda/lista) is drawn from the
  // first paint, on the server too: nothing switches after it loads.
  const [view, setView] = useState<"list" | "grid">(fixedView ?? "list");
  // The sessions glide in when the day, the view or a filter changes.
  const reveal = useReveal<HTMLDivElement>(`${favMode ? "fav" : day}|${view}|${room}|${format}`);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const spk = useMemo(() => new Map(data.speakers.map((s) => [s.id, s])), [data.speakers]);
  useAsked("newTalk", () => setEditId(null));

  useLayoutEffect(() => {
    const p = new URLSearchParams(location.search);
    const d = Number(p.get("dia"));
    if (p.has("dia") && days.some((x) => x.index === d)) setDay(d);
    if (p.get("fav") === "1") setFavMode(true);
    // The view: fixed by the address (/agenda/lista, /agenda/grade), else the
    // last one used here, else the grid on wide screens.
    let v: string | null = fixedView ?? p.get("v");
    try {
      if (!v) v = localStorage.getItem("im-agenda-view");
      setFavs(new Set(JSON.parse(localStorage.getItem(FAVS_KEY) || "[]")));
    } catch {}
    if (v === "grid" || v === "list") setView(v);
    else if (window.matchMedia("(min-width: 1024px) and (orientation: landscape)").matches) setView("grid");
    const s = p.get("s");
    if (s) {
      const talk = data.talks.find((x) => x.id === s);
      if (talk) {
        setDay(talk.day);
        setOpenId(s);
      }
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams(location.search);
    p.set("dia", String(day));
    p.delete("v");
    if (favMode) p.set("fav", "1");
    else p.delete("fav");
    if (openId) p.set("s", openId);
    else p.delete("s");
    try {
      localStorage.setItem("im-agenda-view", view);
    } catch {}
    // The address always shows the view's own link (shareable, embeddable).
    history.replaceState(history.state, "", `${agendaViewPath(lang as Locale, view)}?${p}`);
  }, [day, openId, view, favMode, ready, lang]);

  const toggleFav = (id: string) =>
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(FAVS_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });

  const dayTalks = favMode ? data.talks.filter((x) => favs.has(x.id)) : data.talks.filter((x) => x.day === day);
  const query = norm(q.trim());
  const shown = dayTalks.filter((x) => {
    if (room && x.roomId !== room) return false;
    if (format && x.format !== format) return false;
    if (!query) return true;
    const names = x.speakerIds.map((id) => spk.get(id)?.name ?? "").join(" ");
    return norm(`${x.title} ${x.room} ${x.format} ${names}`).includes(query);
  });
  const groups = useMemo(() => {
    const m = new Map<string, AgendaTalk[]>();
    for (const x of shown) {
      const key = favMode ? `${x.day}|${x.start}` : x.start;
      m.set(key, [...(m.get(key) ?? []), x]);
    }
    return [...m.entries()];
  }, [shown, favMode]);

  // Every room, empty ones too, for everyone: the grid always has its full
  // shape (and editors can drop a session anywhere).
  const roomsToday = data.rooms;
  const formatsToday = [...new Set(dayTalks.map((x) => x.format).filter(Boolean))];
  const filtered = !!(q || room || format);
  const open = data.talks.find((x) => x.id === openId) ?? null;
  const openSpeaker = speakerId ? spk.get(speakerId) : undefined;
  const gridOn = view === "grid" && !favMode;
  const speakersOf = (x: AgendaTalk) => x.speakerIds.map((id) => spk.get(id)).filter(Boolean) as AgendaSpeaker[];
  const pickDay = (i: number) => {
    setFavMode(false);
    setDay(i);
  };

  return (
    <div className={`${wrap} pb-16 pt-6 sm:pt-10`}>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] sm:text-[2.5rem]">{t.title}</h1>
      <p className="mt-1 text-[15px] text-muted">{t.subtitle}</p>

      <NoticeBox t={t} />

      {/* Phones: the days as one segmented control, full width, every day in
          sight (short weekday over the date number); the favourites are a
          star in the filters row below. */}
      <div role="tablist" aria-label={t.day} className="mt-5 grid gap-1 rounded-[16px] bg-[rgb(118_118_128/0.12)] p-1 sm:hidden" style={{ gridTemplateColumns: `repeat(${days.length || 1}, minmax(0, 1fr))` }}>
        {days.map((d) => {
          const l = dayLabel(d.date, lang);
          const on = !favMode && d.index === day;
          return (
            <button
              key={d.index}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={d.date ? l.long : `${t.day} ${d.index + 1}`}
              onClick={() => pickDay(d.index)}
              className={`flex flex-col items-center rounded-[12px] py-1.5 transition-[background-color,box-shadow,color,transform] duration-200 active:scale-[0.97] ${
                on ? "bg-brand text-brand-ink shadow-[0_6px_16px_-8px_rgb(91_42_134/0.7)]" : "text-ink"
              }`}
            >
              <span className={`text-[11px] font-semibold uppercase tracking-[0.04em] ${on ? "text-white/75" : "text-muted"}`}>{d.date ? l.weekday : t.day}</span>
              <span className="text-[19px] font-semibold leading-tight tabular-nums tracking-[-0.01em]">{d.date ? l.num : d.index + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Wider screens: day cards, then the visitor's favourites (kept in
          this browser). */}
      <div role="tablist" aria-label={t.day} className="no-scrollbar -mx-6 -mb-5 mt-3 hidden gap-2.5 overflow-x-auto px-6 pb-6 pt-3 sm:flex">
        {days.map((d) => {
          const l = dayLabel(d.date, lang);
          const on = !favMode && d.index === day;
          const count = data.talks.filter((x) => x.day === d.index).length;
          return (
            <button
              key={d.index}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => pickDay(d.index)}
              className={`flex min-w-[8rem] shrink-0 flex-col items-start rounded-[18px] px-4 py-3 text-left transition-[background-color,box-shadow,color,transform] duration-200 active:scale-[0.98] ${
                on ? "bg-brand text-brand-ink shadow-[0_12px_28px_-14px_rgb(91_42_134/0.75)]" : "bg-surface text-ink shadow-[var(--shadow-card)] ring-1 ring-line hover:bg-[#fbfafc]"
              }`}
            >
              <span className={`text-[13px] font-medium ${on ? "text-white/75" : "text-muted"}`}>{d.weekday || l.weekday}</span>
              <span className="mt-0.5 flex w-full items-baseline justify-between gap-3">
                <span className="whitespace-nowrap text-[17px] font-semibold tracking-[-0.01em]">{d.date ? l.day : `${t.day} ${d.index + 1}`}</span>
                <span className={`text-[13px] tabular-nums ${on ? "text-white/70" : "text-muted"}`}>{count}</span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          role="tab"
          aria-selected={favMode}
          onClick={() => setFavMode(true)}
          className={`flex min-w-[8rem] shrink-0 flex-col items-start rounded-[18px] px-4 py-3 text-left transition-[background-color,box-shadow,color,transform] duration-200 active:scale-[0.98] ${
            favMode ? "bg-[#c9a24d] text-[#241800] shadow-[0_12px_28px_-14px_rgb(201_162_77/0.8)]" : "bg-surface text-ink shadow-[var(--shadow-card)] ring-1 ring-line hover:bg-[#fbfafc]"
          }`}
        >
          <Star size={16} weight="fill" aria-hidden className={favMode ? "" : "text-[#c9a24d]"} />
          <span className="mt-0.5 flex w-full items-baseline justify-between gap-3">
            <span className="text-[17px] font-semibold tracking-[-0.01em]">{t.favorites}</span>
            <span className={`text-[13px] tabular-nums ${favMode ? "text-[#241800]/70" : "text-muted"}`}>{favs.size}</span>
          </span>
        </button>
      </div>

      {/* Search, filters, view */}
      <div className="mt-4 flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">{t.search}</span>
          <MagnifyingGlass size={17} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.search}
            className="h-11 w-full rounded-full bg-[rgb(118_118_128/0.12)] pl-11 pr-28 text-[15px] text-ink outline-none transition-[box-shadow,background-color] placeholder:text-muted focus:bg-surface focus:ring-2 focus:ring-brand/35"
          />
          {/* How many sessions are shown (of how many, when filtering). */}
          <SearchCount shown={shown.length} total={dayTalks.length} one={t.sessionOne} many={t.sessions} of={t.ofTotal} filtered={filtered} />
        </label>
        <div className="flex gap-2.5">
          <Select label={t.room} value={room} onChange={setRoom} all={t.allRooms} options={roomsToday.map((r) => ({ value: r.id, label: r.name }))} />
          <Select label={t.format} value={format} onChange={setFormat} all={t.allFormats} options={formatsToday.map((f) => ({ value: f, label: f }))} />
          {/* Phones: the favourites, a star beside the filters. */}
          <button
            type="button"
            onClick={() => (favMode ? pickDay(day) : setFavMode(true))}
            aria-pressed={favMode}
            aria-label={`${t.favorites} (${favs.size})`}
            title={t.favorites}
            className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-medium transition-[background-color,color,transform] duration-200 active:scale-95 sm:hidden ${
              favMode ? "bg-[#c9a24d] text-[#241800]" : "bg-[rgb(118_118_128/0.12)] text-ink"
            }`}
          >
            <Star size={17} weight="fill" aria-hidden className={favMode ? "" : "text-[#c9a24d]"} />
            <span className="tabular-nums">{favs.size}</span>
          </button>
          <ShareButton t={t} />
          {!favMode && (
            <Segmented
              label={t.view}
              value={view}
              onChange={setView}
              className="shrink-0"
              options={[
                { value: "list", title: t.list, label: <><Rows size={17} aria-hidden /><span className="max-xl:sr-only">{t.list}</span></> },
                { value: "grid", title: t.grid, label: <><SquaresFour size={17} aria-hidden /><span className="max-xl:sr-only">{t.grid}</span></> },
              ]}
            />
          )}
        </div>
      </div>
      {signedIn && gridOn && <p className="mt-3 text-[13px] text-muted">{t.dragHint}</p>}

      <div className="mt-6" ref={reveal}>
        {groups.length === 0 && (!gridOn || (filtered && !editing)) ? (
          <div className={`${card} px-6 py-14 text-center`}>
            <p className="mx-auto max-w-md text-[15px] text-ink-2">{favMode && !filtered ? t.noFavs : filtered ? t.noResults : data.talks.length ? t.emptyDay : t.empty}</p>
            {filtered && (
              <Button onClick={() => (setQ(""), setRoom(""), setFormat(""))} className="mt-4">
                <X size={14} aria-hidden /> {t.clear}
              </Button>
            )}
          </div>
        ) : gridOn ? (
          <GridView
            talks={shown}
            rooms={room ? data.rooms.filter((r) => r.id === room) : roomsToday}
            speakers={spk}
            favs={favs}
            onOpen={setOpenId}
            t={t}
            editable={editing}
            onMove={(id, time, roomId) => moveTalk(id, { time, room: roomId })}
          />
        ) : (
          <ol className="space-y-7">
            {groups.map(([key, talks]) => {
              const x0 = talks[0];
              const d = favMode ? days.find((y) => y.index === x0.day) : undefined;
              return (
                <li key={key} data-glide className="grid gap-3 md:grid-cols-[6rem_1fr] md:gap-6">
                  <div className="flex items-baseline gap-2 md:sticky md:top-24 md:block md:self-start md:pt-4">
                    {d?.date && <p className="text-[13px] font-medium text-gold md:mb-1">{dayLabel(d.date, lang).weekday} · {dayLabel(d.date, lang).day}</p>}
                    <p className="text-[19px] font-semibold tabular-nums tracking-[-0.01em]">{x0.start}</p>
                    <p className="text-[13px] tabular-nums text-muted md:mt-0.5">{x0.end}</p>
                  </div>
                  <div className={`grid gap-3 ${talks.length > 1 ? "lg:grid-cols-2" : ""} min-[112.5rem]:grid-cols-[repeat(auto-fill,minmax(26rem,1fr))]`}>
                    {talks.map((x) => (
                      <SessionCard key={x.id} talk={x} speakers={speakersOf(x)} fav={favs.has(x.id)} onFav={() => toggleFav(x.id)} onOpen={() => setOpenId(x.id)} t={t} />
                    ))}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <Sheet open={!!open} onClose={() => setOpenId(null)} label={open?.title ?? ""} closeLabel={t.close}>
        {open && (
          <SessionDetail
            talk={open}
            speakers={spk}
            lang={lang}
            days={days}
            t={t}
            fav={favs.has(open.id)}
            onFav={() => toggleFav(open.id)}
            onSpeaker={setSpeakerId}
            onEdit={editing ? () => (setOpenId(null), setEditId(open.id)) : undefined}
          />
        )}
      </Sheet>
      <Sheet centered open={!!openSpeaker} onClose={() => setSpeakerId(null)} label={openSpeaker?.name ?? ""} closeLabel={t.close}>
        {openSpeaker && <SpeakerDetail s={openSpeaker} data={data} lang={lang} t={t} agendaHref="" />}
      </Sheet>
      {editing && <TalkForm id={editId} open={editId !== undefined} onClose={() => setEditId(undefined)} t={t} lang={lang} />}
    </div>
  );
}

function Select({ label, value, onChange, all, options }: { label: string; value: string; onChange: (v: string) => void; all: string; options: { value: string; label: string }[] }) {
  if (options.length < 2) return null;
  return (
    <label className="relative min-w-0 flex-1 lg:flex-none">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 w-full appearance-none truncate rounded-full pl-4 pr-10 text-[15px] outline-none transition-[box-shadow,background-color] focus:ring-2 focus:ring-brand/35 lg:w-auto lg:max-w-[15rem] ${
          value ? "bg-brand-soft font-medium text-brand" : "bg-[rgb(118_118_128/0.12)] text-ink"
        }`}
      >
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 12 12" className="pointer-events-none absolute right-4 top-1/2 size-3 -translate-y-1/2 text-muted">
        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}

function FavButton({ on, onClick, t, className = "" }: { on: boolean; onClick: () => void; t: T; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-pressed={on}
      aria-label={on ? t.removeFav : t.addFav}
      title={on ? t.removeFav : t.addFav}
      className={`grid size-9 shrink-0 place-items-center rounded-full transition-[color,background-color,transform] duration-200 active:scale-90 ${
        on ? "text-[#c9a24d]" : "text-[rgb(29_20_38/0.25)] hover:bg-[rgb(118_118_128/0.1)] hover:text-[#c9a24d]"
      } ${className}`}
    >
      <Star size={19} weight={on ? "fill" : "regular"} aria-hidden />
    </button>
  );
}

function SessionCard({ talk, speakers, fav, onFav, onOpen, t }: { talk: AgendaTalk; speakers: AgendaSpeaker[]; fav: boolean; onFav: () => void; onOpen: () => void; t: T }) {
  const names = speakers.map((s) => s.name);
  const shownNames = names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2}` : "");
  return (
    <div className={`${card} group relative flex w-full flex-col gap-3 overflow-hidden p-5 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow)]`}>
      <button type="button" onClick={onOpen} className="absolute inset-0 z-0 rounded-[22px]" aria-label={talk.title} />
      <span className="pointer-events-none flex items-start justify-between gap-2">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted">
          {talk.format && <Tag color={talk.formatColor}>{talk.format}</Tag>}
          {talk.room && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} aria-hidden /> {talk.room}
            </span>
          )}
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock size={14} aria-hidden /> {talk.start}–{talk.end}
          </span>
        </span>
        <FavButton on={fav} onClick={onFav} t={t} className="pointer-events-auto relative z-10 -mr-2 -mt-2" />
      </span>
      <span className="pointer-events-none text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink transition-colors group-hover:text-brand">{talk.title}</span>
      {(speakers.length > 0 || talk.pending || talk.langs.length > 0) && (
        <span className="pointer-events-none flex items-center justify-between gap-3">
          {speakers.length > 0 ? (
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex -space-x-2">
                {speakers.slice(0, 4).map((s) => (
                  <Avatar key={s.id} name={s.name} photo={s.photo} size={30} ring />
                ))}
              </span>
              <span className="truncate text-[13px] text-ink-2">{shownNames}</span>
            </span>
          ) : talk.pending ? (
            <span className="text-[13px] italic text-muted">{t.pending}</span>
          ) : (
            <span />
          )}
          {talk.langs.length > 0 && (
            <span className="flex shrink-0 gap-1">
              {talk.langs.map((l) => (
                <span key={l} className="rounded-md bg-[rgb(118_118_128/0.1)] px-1.5 py-0.5 text-[11px] font-semibold uppercase text-ink-2">
                  {l}
                </span>
              ))}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

// "Add to Google Calendar": the session with its date and time in Cartagena
// (Google shows it in each person's own time zone), room and description.
function calendarLink(talk: AgendaTalk, date: string) {
  const day = date.replace(/-/g, "");
  const time = (hm: string) => hm.replace(":", "") + "00";
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${talk.title} · Impact Minds 2027`,
    dates: `${day}T${time(talk.start)}/${day}T${time(talk.end)}`,
    ctz: "America/Bogota",
    details: talk.description,
    location: [talk.room, "Cartagena, Colombia"].filter(Boolean).join(" · "),
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

// A place image, large, over everything (click or Esc closes it).
function ImageZoom({ src, onClose, label }: { src: string; onClose: () => void; label: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    const under = d?.parentElement?.closest("dialog") as HTMLElement | null;
    if (under) under.style.opacity = "0";
    return () => {
      if (under) under.style.opacity = "";
    };
  }, []);
  return (
    <dialog ref={ref} aria-label={label} onClose={onClose} onClick={onClose} className="m-auto h-[100dvh] max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-[rgb(20_8_30/0.86)] backdrop:backdrop-blur-md">
      <div className="flex h-full items-center justify-center p-4 sm:p-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="max-h-full max-w-full rounded-[20px] object-contain shadow-[0_40px_100px_-30px_rgb(0_0_0/0.7)]" />
        <button type="button" onClick={onClose} aria-label={label} className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-white/20">
          <X size={18} />
        </button>
      </div>
    </dialog>
  );
}

function SessionDetail({
  talk,
  speakers,
  lang,
  days,
  t,
  fav,
  onFav,
  onSpeaker,
  onEdit,
}: {
  talk: AgendaTalk;
  speakers: Map<string, AgendaSpeaker>;
  lang: string;
  days: { index: number; date: string }[];
  t: T;
  fav: boolean;
  onFav: () => void;
  onSpeaker: (id: string) => void;
  onEdit?: () => void;
}) {
  const d = days.find((x) => x.index === talk.day);
  const when = d?.date ? dayLabel(d.date, lang).long : "";
  const people = talk.speakerIds.map((id) => speakers.get(id)).filter(Boolean) as AgendaSpeaker[];
  const mod = talk.moderatorId ? speakers.get(talk.moderatorId) : undefined;
  const list = mod ? people.filter((p) => p.id !== mod.id) : people;
  const [zoom, setZoom] = useState<string | null>(null);
  return (
    <article>
      <div className="flex flex-wrap items-center gap-2">
        {talk.format && <Tag color={talk.formatColor} size="md">{talk.format}</Tag>}
        <span className="flex-1" />
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[rgb(118_118_128/0.12)] px-4 text-sm font-medium text-ink transition-colors hover:bg-[rgb(118_118_128/0.18)]"
          >
            <PencilSimple size={16} aria-hidden /> {t.edit}
          </button>
        )}
        <button
          type="button"
          onClick={onFav}
          aria-pressed={fav}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ${
            fav ? "bg-[rgb(201_162_77/0.16)] text-[#7a5a12]" : "bg-[rgb(118_118_128/0.12)] text-ink hover:bg-[rgb(118_118_128/0.18)]"
          }`}
        >
          <Star size={16} weight={fav ? "fill" : "regular"} aria-hidden className="text-[#c9a24d]" />
          {fav ? t.removeFav : t.addFav}
        </button>
      </div>
      <h2 className="mt-4 text-[1.5rem] font-semibold leading-tight tracking-[-0.02em]">{talk.title}</h2>
      <dl className="mt-4 grid gap-2.5 text-[15px] text-ink-2">
        <div className="flex items-center gap-2.5">
          <dt className="sr-only">{t.day}</dt>
          <Clock size={18} aria-hidden className="text-muted" />
          <dd>
            {when && `${when} · `}
            <span className="tabular-nums">
              {talk.start}–{talk.end}
            </span>
          </dd>
        </div>
        {talk.room && (
          <div className="flex items-center gap-2.5">
            <dt className="sr-only">{t.room}</dt>
            <MapPin size={18} aria-hidden className="text-muted" />
            <dd>{talk.room}</dd>
          </div>
        )}
        {talk.langs.length > 0 && (
          <div className="flex items-center gap-2.5">
            <dt className="sr-only">{t.languages}</dt>
            <Translate size={18} aria-hidden className="text-muted" />
            <dd>{talk.langs.map((l) => t.langNames[l as keyof T["langNames"]] ?? l).join(" · ")}</dd>
          </div>
        )}
      </dl>
      {d?.date && (
        <a
          href={calendarLink(talk, d.date)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm font-medium text-ink shadow-[var(--shadow-card)] ring-1 ring-line transition-colors hover:bg-[#fbfafc]"
        >
          <CalendarPlus size={18} className="text-brand" aria-hidden />
          {t.addToCalendar}
        </a>
      )}
      {talk.description && <ReadMore key={talk.id} text={talk.description} more={t.more} less={t.less} className="mt-5" />}

      {talk.images.length > 0 && (
        <section className="mt-6">
          <h3 className="text-[13px] font-semibold text-muted">{t.place}</h3>
          <div className={`mt-2 grid gap-2 ${talk.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {talk.images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setZoom(src)}
                className={`relative overflow-hidden rounded-[16px] bg-[rgb(118_118_128/0.08)] ring-1 ring-line transition-transform active:scale-[0.98] ${
                  talk.images.length === 1 || (talk.images.length % 2 === 1 && i === 0) ? "col-span-full aspect-[16/9]" : "aspect-[4/3]"
                }`}
              >
                <Image src={src} alt="" fill sizes="(min-width: 640px) 460px, 92vw" className="object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}
      {zoom && <ImageZoom src={zoom} onClose={() => setZoom(null)} label={t.close} />}

      {mod && (
        <section className="mt-7">
          <h3 className="text-[13px] font-semibold text-muted">{t.fModerator}</h3>
          <button type="button" onClick={() => onSpeaker(mod.id)} className="mt-2 flex w-full items-center gap-3 rounded-[18px] bg-brand-soft/70 px-3.5 py-3 text-left ring-1 ring-[rgb(91_42_134/0.12)] transition-colors hover:bg-brand-soft">
            <Avatar name={mod.name} photo={mod.photo} size={44} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-[15px] font-medium text-ink">{mod.name}</span>
                <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-brand-ink">{t.moderator}</span>
              </span>
              <span className="mt-0.5 block truncate text-[13px] text-muted">{[mod.role, mod.company].filter(Boolean).join(" · ")}</span>
            </span>
            <CaretRight size={15} aria-hidden className="shrink-0 text-muted" />
          </button>
        </section>
      )}

      {(list.length > 0 || talk.pending) && (
        <section className="mt-7">
          <h3 className="text-[13px] font-semibold text-muted">{t.speakers}</h3>
          <ul className="mt-2 overflow-hidden rounded-[18px] bg-[rgb(118_118_128/0.06)]">
            {list.map((s, i) => (
              <li key={s.id} className={i ? "border-t border-line" : ""}>
                <button type="button" onClick={() => onSpeaker(s.id)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[rgb(118_118_128/0.08)]">
                  <Avatar name={s.name} photo={s.photo} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-medium text-ink">{s.name}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-muted">{[s.role, s.company].filter(Boolean).join(" · ")}</span>
                  </span>
                  <CaretRight size={15} aria-hidden className="shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ul>
          {talk.pending && <p className="mt-2 text-[13px] italic text-muted">{t.pending}</p>}
        </section>
      )}
    </article>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className={`${wrap} py-24`}>
      <div className={`${card} mx-auto max-w-md px-8 py-14 text-center`}>
        <p className="text-[17px] text-ink-2">{text}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- grid view

const PPM = 2.4; // pixels per minute: 15 min = 36 px, 1 h = 144 px
const SNAP = 5; // dragged sessions land on 5-minute steps

// The classic conference grid, like a calendar's day view: one column per
// room, time running down on the left, every session at its start and as tall
// as it lasts, softly tinted in its format's colour. Overlapping sessions in
// one room share the column. A room's name folds its column into a slim strip.
// Room names and hours stay pinned while the grid scrolls both ways. For
// editors, a session drags to another time (5-minute steps) or room.
function GridView({
  talks,
  rooms,
  speakers,
  favs,
  onOpen,
  t,
  editable,
  onMove,
}: {
  talks: AgendaTalk[];
  rooms: { id: string; name: string; color: string }[];
  speakers: Map<string, AgendaSpeaker>;
  favs: Set<string>;
  onOpen: (id: string) => void;
  t: T;
  editable: boolean;
  onMove: (id: string, time: string, room: string) => void;
}) {
  const [folded, setFolded] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number; room: string; time: string } | null>(null);
  const colRefs = useRef(new Map<string, HTMLDivElement>());
  const fold = (id: string) =>
    setFolded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const cols = useMemo(() => {
    const known = new Set(rooms.map((r) => r.id));
    const extra = [...new Set(talks.filter((x) => !known.has(x.roomId)).map((x) => x.roomId))].map((id) => {
      const x = talks.find((y) => y.roomId === id)!;
      return { id, name: x.room || "—", color: x.roomColor };
    });
    return [...rooms, ...extra].map((r) => {
      const list = talks.filter((x) => x.roomId === r.id).sort((a, b) => toMin(a.start) - toMin(b.start));
      const laneEnds: number[] = [];
      const placed = list.map((x) => {
        const s = toMin(x.start);
        let lane = laneEnds.findIndex((end) => end <= s);
        if (lane < 0) lane = laneEnds.length;
        laneEnds[lane] = toMin(x.end) <= s ? s + 15 : toMin(x.end);
        return { talk: x, lane };
      });
      return { room: r, placed, lanes: Math.max(1, laneEnds.length) };
    });
  }, [talks, rooms]);

  const starts = talks.map((x) => toMin(x.start));
  const ends = talks.map((x) => Math.max(toMin(x.end), toMin(x.start) + 15));
  const from = Math.floor(Math.min(8 * 60, ...(starts.length ? starts : [8 * 60])) / 30) * 30;
  const to = Math.ceil(Math.max(19 * 60, ...(ends.length ? ends : [18 * 60])) / 30) * 30;
  const height = (to - from) * PPM;
  const marks = Array.from({ length: (to - from) / 30 + 1 }, (_, i) => from + i * 30);
  // A room with sessions side by side gets room for each of them.
  const template = cols.map(({ room, lanes }) => (folded.has(room.id) ? "3rem" : `minmax(${Math.max(15.5, lanes * 10.5)}rem, 1fr)`)).join(" ");

  // Drag: the card follows the pointer; the room under it and the time at its
  // top edge (snapped) are where it lands. A press without movement opens it.
  const startDrag = (e: React.PointerEvent, x: AgendaTalk) => {
    if (!editable || e.button !== 0) return;
    // No text selection or native drag while moving a card.
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const startTop = (toMin(x.start) - from) * PPM;
    let moved = false;
    let last = { room: x.roomId, time: x.start };
    const onMoveEv = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      let roomId = x.roomId;
      for (const [id, col] of colRefs.current) {
        const r = col.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right && !folded.has(id)) roomId = id;
      }
      const mins = Math.round((from + (startTop + dy) / PPM) / SNAP) * SNAP;
      last = { room: roomId, time: hhmm(Math.max(from, Math.min(to - 15, mins))) };
      setDrag({ id: x.id, dx, dy, ...last });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMoveEv);
      window.removeEventListener("pointerup", onUp);
      setDrag(null);
      if (!moved) return onOpen(x.id);
      if (last.room !== x.roomId || last.time !== x.start) onMove(x.id, last.time, last.room);
    };
    window.addEventListener("pointermove", onMoveEv);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      className={`${card} relative max-h-[calc(100dvh-10rem)] min-h-[28rem] overflow-auto overscroll-contain`}
    >
      <div className="grid min-w-full" style={{ gridTemplateColumns: `4.75rem ${template}`, width: "max-content" }}>
        <div className="sticky left-0 top-0 z-30 border-b border-line bg-surface" />
        {cols.map(({ room }) => {
          const isFolded = folded.has(room.id);
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => fold(room.id)}
              aria-expanded={!isFolded}
              title={`${isFolded ? t.expand : t.collapse}: ${room.name}`}
              className={`sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-l border-line bg-[rgb(255_255_255/0.97)] backdrop-blur transition-colors hover:bg-[#f8f7fa] ${
                isFolded ? "justify-center px-0" : "px-4 text-left"
              }`}
            >
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: room.color }} />
              {!isFolded && <span className="truncate text-[13px] font-semibold text-ink">{room.name}</span>}
            </button>
          );
        })}

        <div className="sticky left-0 z-10 bg-surface" style={{ height }}>
          {marks.map((m) => (
            <span
              key={m}
              className={`absolute right-3 -translate-y-1/2 text-xs tabular-nums ${m % 60 === 0 ? "font-semibold text-ink-2" : "text-muted"}`}
              style={{ top: (m - from) * PPM }}
            >
              {m === from ? "" : hhmm(m)}
            </span>
          ))}
        </div>

        {cols.map(({ room, placed, lanes }) => {
          const isFolded = folded.has(room.id);
          const target = drag && drag.room === room.id;
          return (
            <div
              key={room.id}
              ref={(el) => {
                if (el) colRefs.current.set(room.id, el);
                else colRefs.current.delete(room.id);
              }}
              className={`relative border-l border-line transition-colors ${target ? "bg-brand-soft/60" : ""}`}
              style={{
                height,
                backgroundImage: `repeating-linear-gradient(to bottom, rgb(29 20 38 / 0.07) 0 1px, transparent 1px ${60 * PPM}px), repeating-linear-gradient(to bottom, rgb(29 20 38 / 0.035) 0 1px, transparent 1px ${30 * PPM}px)`,
              }}
            >
              {target && (
                <span className="pointer-events-none absolute inset-x-1.5 z-20 rounded-xl border-2 border-dashed border-brand/50" style={{ top: (toMin(drag.time) - from) * PPM, height: 30 * PPM }}>
                  <span className="absolute -top-6 left-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">{drag.time}</span>
                </span>
              )}
              {isFolded ? (
                <button type="button" onClick={() => fold(room.id)} className="absolute inset-0 flex justify-center pt-4 hover:bg-[#f8f7fa]" aria-label={`${t.expand}: ${room.name}`}>
                  <span className="text-xs font-semibold text-muted [writing-mode:vertical-rl]">{room.name}</span>
                </button>
              ) : (
                placed.map(({ talk: x, lane }) => {
                  const top = (toMin(x.start) - from) * PPM;
                  const h = Math.max(15, toMin(x.end) - toMin(x.start)) * PPM;
                  const people = x.speakerIds.map((id) => speakers.get(id)).filter(Boolean) as AgendaSpeaker[];
                  const short = h < 60;
                  const dragging = drag?.id === x.id;
                  // Sharing the room's column with another session: only the
                  // start time and the title, so the title has the room.
                  const narrow = lanes > 1;
                  const withPeople = people.length > 0 && h >= 130 && !narrow;
                  // Title lines that really fit (card height minus padding,
                  // time line and faces); the last one ends in "…".
                  const lh = narrow ? 16 : 18;
                  const lines = Math.min(narrow ? 3 : 99, Math.max(1, Math.floor((h - 6 - 20 - 22 - (withPeople ? 32 : 0)) / lh)));
                  return (
                    <button
                      key={x.id}
                      type="button"
                      onPointerDown={editable ? (e) => startDrag(e, x) : undefined}
                      onClick={editable ? undefined : () => onOpen(x.id)}
                      title={x.title}
                      className={`group absolute flex overflow-hidden rounded-[14px] px-3 text-left transition-[box-shadow,transform] duration-150 ${
                        editable ? "cursor-grab touch-none select-none active:cursor-grabbing" : ""
                      } ${dragging ? "z-30 opacity-90 shadow-[0_20px_40px_-12px_rgb(29_20_38/0.45)]" : "hover:z-10 hover:-translate-y-px hover:shadow-[var(--shadow)]"} ${
                        short ? "flex-row items-center gap-2" : "flex-col gap-1 py-2.5"
                      }`}
                      style={{
                        top: top + 3,
                        height: h - 6,
                        left: `calc(${(lane / lanes) * 100}% + 6px)`,
                        width: `calc(${100 / lanes}% - 12px)`,
                        background: `color-mix(in srgb, ${x.formatColor} 11%, white)`,
                        boxShadow: dragging ? undefined : `inset 3px 0 0 color-mix(in srgb, ${x.formatColor} 75%, white), inset 0 0 0 1px rgb(29 20 38 / 0.05)`,
                        transform: dragging ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined,
                      }}
                    >
                      <span className={`flex items-center justify-between gap-2 text-xs tabular-nums text-muted ${short ? "shrink-0" : ""}`}>
                        <span className="inline-flex items-center gap-1">
                          {favs.has(x.id) && <Star size={12} weight="fill" aria-label={t.favorites} className="text-[#c9a24d]" />}
                          {short || narrow ? x.start : `${x.start}–${x.end}`}
                        </span>
                        {h >= 90 && !narrow && x.format && (
                          <span className="truncate text-[11px] font-semibold" style={{ color: `color-mix(in srgb, ${x.formatColor} 80%, black)` }}>
                            {x.format}
                          </span>
                        )}
                      </span>
                      <span
                        className={`font-semibold text-ink group-hover:text-brand ${narrow ? "text-[12.5px] leading-[16px]" : "text-[14px] leading-[18px]"}`}
                        style={
                          short
                            ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }
                            : { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden", maxHeight: lines * lh }
                        }
                      >
                        {x.title}
                      </span>
                      {withPeople && (
                        <span className="mt-auto flex items-center gap-2">
                          <span className="flex -space-x-1.5">
                            {people.slice(0, 4).map((s) => (
                              <Avatar key={s.id} name={s.name} photo={s.photo} size={24} ring />
                            ))}
                          </span>
                          {people.length > 4 && <span className="text-xs text-muted">+{people.length - 4}</span>}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
