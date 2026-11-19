"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CalendarPlus, CaretRight, Clock, Info, MagnifyingGlass, MapPin, PencilSimple, Rows, SlidersHorizontal, SquaresFour, Star, Translate, X } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import type { AgendaSpeaker, AgendaTalk } from "@/lib/agendaShape";
import { hhmm, toMin } from "@/lib/agendaShape";
import { useAgenda, useAsked } from "./store";
import { agendaViewPath, type AgendaView } from "@/lib/nav";
import type { Locale } from "@/lib/i18n";
import { NewButton, NoticeBox } from "./Tools";
import { Avatar, PageTitle, Button, ReadMore, SearchCount, Segmented, Sheet, Tag, card, dayLabel, fieldBox, norm, useBackCloses } from "./ui";
import SpeakerDetail from "./SpeakerDetail";
import { TalkForm } from "./Editor";
import { settle, useReveal } from "./motion";
import Tour, { HelpButton } from "./Tour";
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
  const { data, editing, signedIn, profile, moveTalk } = useAgenda();
  const days = data.days.length ? data.days : [...new Set(data.talks.map((x) => x.day))].map((i) => ({ index: i, date: "", weekday: "" }));
  const [day, setDay] = useState(days[0]?.index ?? 0);
  const [favMode, setFavMode] = useState(false);
  const [q, setQ] = useState("");
  const [room, setRoom] = useState("");
  const [format, setFormat] = useState("");
  // More ways to narrow the day: time of day, language, a speaker; and, in
  // the list, the order (by time, by room, or by title).
  const [period, setPeriod] = useState<"" | "morning" | "afternoon" | "evening">("");
  const [langF, setLangF] = useState("");
  const [speakerF, setSpeakerF] = useState("");
  const [sort, setSort] = useState<"time" | "room" | "title">("time");
  const clearFilters = () => (setRoom(""), setFormat(""), setPeriod(""), setLangF(""), setSpeakerF(""));
  const active = [room, format, period, langF, speakerF].filter(Boolean).length;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  useBackCloses(!!openId, () => setOpenId(null));
  // The note after moving a session (with Undo), gone after a few seconds.
  const [notice, setNotice] = useState<{ text: string; undo?: () => void; error?: boolean } | null>(null);
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), notice.error ? 9000 : 7000);
    return () => window.clearTimeout(id);
  }, [notice]);
  const [speakerId, setSpeakerId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null | undefined>(undefined); // undefined: closed; null: new
  // The view in the address (/agenda/grade, /agenda/lista) is drawn from the
  // first paint, on the server too: nothing switches after it loads.
  const [view, setView] = useState<"list" | "grid">(fixedView ?? "list");
  // The sessions glide in when the day, the view or a filter changes.
  // A later day slides in from the right, an earlier one from the left.
  const prevDay = useRef(day);
  const dir = favMode ? 0 : day > prevDay.current ? 1 : day < prevDay.current ? -1 : 0;
  useEffect(() => {
    prevDay.current = day;
  }, [day]);
  const reveal = useReveal<HTMLDivElement>(`${favMode ? "fav" : day}|${view}|${room}|${format}|${period}|${langF}|${speakerF}|${sort}`, dir);
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
    // last one used here, else the list.
    let v: string | null = fixedView ?? p.get("v");
    try {
      if (!v) v = localStorage.getItem("im-agenda-view");
      setFavs(new Set(JSON.parse(localStorage.getItem(FAVS_KEY) || "[]")));
    } catch {}
    if (v === "grid" || v === "list") setView(v);
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
    if (period) {
      const h = Number(x.start.slice(0, 2));
      const p = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
      if (p !== period) return false;
    }
    if (langF && !x.langs.includes(langF)) return false;
    if (speakerF && !x.speakerIds.includes(speakerF)) return false;
    if (!query) return true;
    const names = x.speakerIds.map((id) => spk.get(id)?.name ?? "").join(" ");
    return norm(`${x.title} ${x.room} ${x.format} ${names}`).includes(query);
  });
  const groups = useMemo(() => {
    const m = new Map<string, AgendaTalk[]>();
    const list =
      sort === "time"
        ? shown
        : [...shown].sort((a, b) =>
            sort === "room"
              ? a.room.localeCompare(b.room, lang, { numeric: true }) || a.start.localeCompare(b.start)
              : a.title.localeCompare(b.title, lang),
          );
    for (const x of list) {
      const key =
        sort === "room" ? `room|${x.room}` : sort === "title" ? `title|${(x.title.trim()[0] ?? "#").toLocaleUpperCase(lang)}` : favMode ? `${x.day}|${x.start}` : x.start;
      m.set(key, [...(m.get(key) ?? []), x]);
    }
    return [...m.entries()];
  }, [shown, favMode, sort, lang]);

  // Every room, empty ones too, for everyone: the grid always has its full
  // shape (and editors can drop a session anywhere).
  const roomsToday = data.rooms;
  const formatsToday = [...new Set(dayTalks.map((x) => x.format).filter(Boolean))];
  const langsToday = [...new Set(dayTalks.flatMap((x) => x.langs))];
  const speakersToday = [...new Set(dayTalks.flatMap((x) => x.speakerIds))]
    .map((id) => spk.get(id))
    .filter(Boolean)
    .sort((a, b) => a!.name.localeCompare(b!.name, lang)) as AgendaSpeaker[];
  const filtered = !!(q || active);
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
      <PageTitle
        title={t.title}
        subtitle={t.subtitle}
        aside={<HelpButton label={t.tour.howTo} hint={t.tour.hint} />}
        side={<NoticeBox t={t} className="lg:mt-0 lg:min-w-0 lg:flex-1" />}
      />

      {/* The toolbar, mobile first. The days (and the favourites) as a row
          of chips that scrolls sideways when it does not fit; then the
          search, one "Filters" button (rooms and formats, in a panel), the
          list / grid switch and, for editors, "New session". Wide screens:
          everything on one row. */}
      <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div role="tablist" aria-label={t.day} data-tour="days" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6 xl:mx-0 xl:shrink-0 xl:overflow-visible xl:px-0">
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
                aria-label={`${d.date ? l.long : `${t.day} ${d.index + 1}`} (${count})`}
                title={d.date ? l.long : undefined}
                onClick={(e) => (settle(e.currentTarget), pickDay(d.index))}
                className={`flex h-[3.75rem] min-w-[3.75rem] flex-1 shrink-0 flex-col items-center justify-center rounded-[20px] px-3 leading-none transition-[background-color,color,box-shadow,transform] duration-200 active:scale-95 xl:h-12 xl:flex-none xl:flex-row xl:gap-1.5 xl:rounded-full xl:px-4 ${
                  on ? "bg-[var(--on)] text-[var(--on-ink)] shadow-[0_10px_22px_-12px_rgb(42_18_64/0.8)]" : "chip text-ink"
                }`}
              >
                <span className={`text-[11px] font-medium uppercase tracking-[0.06em] xl:text-[13px] xl:normal-case xl:tracking-normal ${on ? "text-white/70" : "text-muted"}`}>{d.date ? l.weekday : t.day}</span>
                <span className="mt-1 text-[19px] font-semibold tabular-nums tracking-[-0.02em] xl:mt-0 xl:text-[15px]">{d.date ? l.num : d.index + 1}</span>
              </button>
            );
          })}
          {/* The favourites, as one more chip. */}
          <button
            type="button"
            data-tour="favs"
            onClick={(e) => (settle(e.currentTarget), favMode ? pickDay(day) : setFavMode(true))}
            aria-pressed={favMode}
            aria-label={`${t.favorites} (${favs.size})`}
            title={t.favorites}
            className={`flex h-[3.75rem] min-w-[3.75rem] flex-1 shrink-0 flex-col items-center justify-center rounded-[20px] px-3 leading-none transition-[background-color,color,transform] duration-200 active:scale-95 xl:h-12 xl:flex-none xl:flex-row xl:gap-2 xl:rounded-full xl:px-4 ${
              favMode ? "bg-[#c9a24d] text-[#241800] shadow-[0_10px_22px_-12px_rgb(160_120_40/0.9)]" : "chip text-ink"
            }`}
          >
            <Star size={17} weight="fill" aria-hidden className={favMode ? "" : "text-[#a8832f]"} />
            <span className="mt-1 text-[15px] font-semibold tabular-nums xl:mt-0">{favs.size}</span>
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <label className="chip relative min-w-0 flex-1 rounded-full" data-tour="search">
            <span className="sr-only">{t.search}</span>
            <MagnifyingGlass size={18} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search}
              className="h-12 w-full rounded-full bg-transparent pl-11 pr-28 text-base text-ink outline-none transition-shadow placeholder:text-muted focus:ring-2 focus:ring-brand/70 max-sm:pr-12"
            />
            {/* How many sessions are shown (of how many, when filtering). */}
            <SearchCount shown={shown.length} total={dayTalks.length} one={t.sessionOne} many={t.sessions} of={t.ofTotal} filtered={filtered} />
          </label>
          {/* Rooms and formats, in one panel. A badge: how many are on. */}
          {(

            <button
              type="button"
              data-tour="rooms"
              onClick={() => setFiltersOpen(true)}
              aria-label={t.filters}
              title={t.filters}
              className={`relative grid size-12 shrink-0 place-items-center rounded-full transition-[background-color,color,transform] duration-200 active:scale-95 ${active ? "bg-[var(--on)] text-[var(--on-ink)]" : "chip text-ink"}`}
            >
              <SlidersHorizontal size={19} aria-hidden />
              {active > 0 && <span aria-hidden className="absolute -right-0.5 -top-0.5 grid size-[18px] place-items-center rounded-full bg-[#c9a24d] text-[10px] font-bold text-[#241800] ring-2 ring-[var(--bg)]">{active}</span>}
            </button>
          )}
          {!favMode && (
            <button
              type="button"
              data-tour="view"
              onClick={() => setView(view === "grid" ? "list" : "grid")}
              title={view === "grid" ? t.list : t.grid}
              aria-label={view === "grid" ? t.list : t.grid}
              className="chip grid size-12 shrink-0 place-items-center rounded-full text-ink transition-transform duration-200 active:scale-95"
            >
              {view === "grid" ? <Rows size={19} aria-hidden /> : <SquaresFour size={19} aria-hidden />}
            </button>
          )}
          {/* New session (editors), right beside the search. */}
          <NewButton t={t} tab="agenda" className="sm:h-12 max-sm:size-12" />
        </div>
      </div>

      {/* Filters: rooms and formats as chips, in a panel. */}
      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        label={t.filters}
        closeLabel={t.close}
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button kind="quiet" onClick={clearFilters} disabled={!active}>
              {t.clear}
            </Button>
            <Button kind="primary" onClick={() => setFiltersOpen(false)}>
              {shown.length} {shown.length === 1 ? t.sessionOne : t.sessions}
            </Button>
          </div>
        }
      >
        <h2 className="font-display text-[1.75rem] leading-tight text-[var(--on)]">{t.filters}</h2>
        <ChipGroup label={t.room} all={t.allRooms} value={room} onChange={setRoom} options={roomsToday.map((r) => ({ value: r.id, label: r.name }))} />
        <ChipGroup tour="format" label={t.format} all={t.allFormats} value={format} onChange={setFormat} options={formatsToday.map((f) => ({ value: f, label: f }))} />
        <ChipGroup
          label={t.period}
          all={t.allDay}
          value={period}
          onChange={(v) => setPeriod(v as typeof period)}
          options={[
            { value: "morning", label: t.morning },
            { value: "afternoon", label: t.afternoon },
            { value: "evening", label: t.evening },
          ]}
        />
        <ChipGroup label={t.language} all={t.allLangs} value={langF} onChange={setLangF} options={langsToday.map((l) => ({ value: l, label: t.langNames[l as keyof T["langNames"]] ?? l }))} min={1} />
        {speakersToday.length > 1 && (
          <label className="mt-6 block">
            <span className="mb-2.5 block text-[13px] font-medium text-muted">{t.speaker}</span>
            <select value={speakerF} onChange={(e) => setSpeakerF(e.target.value)} className={`${fieldBox} h-12 appearance-none pr-10`}>
              <option value="">{t.allSpeakers}</option>
              {speakersToday.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {view === "list" && (
          <ChipGroup
            label={t.sortBy}
            all={t.byTime}
            value={sort === "time" ? "" : sort}
            onChange={(v) => setSort((v || "time") as typeof sort)}
            options={[
              { value: "room", label: t.byRoom },
              { value: "title", label: t.byTitle },
            ]}
          />
        )}
      </Sheet>
      <Tour
        enabled
        t={t.tour}
        steps={[
          t.tour.welcome,
          ...(signedIn
            ? [
                { target: "gear", ...t.tour.gear },
                { target: "new", ...t.tour.menuNew },
                { target: "menu-manage", ...t.tour.menuManage },
                { target: "menu-share", ...t.tour.menuShare },
                { target: "menu-csv", ...t.tour.menuCsv },
                { target: "menu-backup", ...t.tour.menuBackup },
                ...(profile?.role === "master"
                  ? [
                      { target: "menu-team", ...t.tour.menuTeam },
                      { target: "menu-wipe", ...t.tour.menuWipe },
                    ]
                  : []),
              ]
            : []),
          { target: "notice", ...t.tour.notice },
          { target: "days", ...t.tour.days },
          { target: "favs", ...t.tour.favs },
          { target: "search", ...t.tour.search },
          { target: "rooms", ...t.tour.rooms },
          { target: "format", ...t.tour.format },
          { target: "view", ...t.tour.view },
          { target: "session", ...t.tour.content },
          { target: "favstar", ...t.tour.favStar },
          { target: "tab-speakers", ...t.tour.tabs },
          { target: "lang", ...t.tour.lang },
          { target: "howto", ...t.tour.help },
          t.tour.bye,
        ]}
      />
      {signedIn && gridOn && <p className="mt-3 text-[13px] text-muted">{t.dragHint}</p>}
      {/* After a move: where it went, with Undo (or, if it failed, where it stayed). */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-8">
        {notice && (
          <div
            role={notice.error ? "alert" : "status"}
            className={`pointer-events-auto flex max-w-[34rem] items-center gap-3 rounded-full py-2 pl-5 pr-2 text-[14px] text-white shadow-[var(--shadow)] ${notice.error ? "bg-[#8c1d18]" : "bg-[#1d1426]"}`}
          >
            <span className="min-w-0">{notice.text}</span>
            {notice.undo && (
              <button
                type="button"
                onClick={() => {
                  notice.undo?.();
                  setNotice(null);
                }}
                className="h-10 shrink-0 rounded-full bg-white/15 px-4 font-semibold hover:bg-white/25"
              >
                {t.undo}
              </button>
            )}
            {!notice.undo && <span className="w-3" />}
          </div>
        )}
      </div>

      <div className="mt-6" ref={reveal} data-tour="content">
        {groups.length === 0 && (!gridOn || (filtered && !editing)) ? (
          <div className={`${card} px-6 py-14 text-center`}>
            <p className="mx-auto max-w-md text-[15px] text-ink-2">{favMode && !filtered ? t.noFavs : filtered ? t.noResults : data.talks.length ? t.emptyDay : t.empty}</p>
            {filtered && (
              <Button onClick={() => (setQ(""), clearFilters())} className="mt-4">
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
            onMove={(id, time, roomId) => {
              const was = data.talks.find((x) => x.id === id);
              const roomName = (rid: string) => data.rooms.find((r) => r.id === rid)?.name ?? "";
              const fill = (s: string, tm: string, rid: string) => s.replace("{time}", tm).replace("{room}", roomName(rid));
              moveTalk(id, { time, room: roomId })
                .then(() =>
                  setNotice({
                    text: fill(t.moved, time, roomId),
                    undo: was ? () => void moveTalk(id, { time: was.start, room: was.roomId }).catch(() => {}) : undefined,
                  }),
                )
                .catch(() => was && setNotice({ text: fill(t.moveFailed, was.start, was.roomId), error: true }));
            }}
          />
        ) : (
          <ol className="space-y-8">
            {groups.map(([key, talks]) => {
              const x0 = talks[0];
              const d = favMode ? days.find((y) => y.index === x0.day) : undefined;
              return (
                <li key={key} data-glide>
                  {sort !== "time" ? (
                  <h3 className="mb-3 flex items-baseline gap-2 px-1">
                    <span className="text-[15px] font-semibold text-[var(--on)]">{key.slice(key.indexOf("|") + 1)}</span>
                    {talks.length > 1 && <span className="ml-auto text-[12px] tabular-nums text-muted">{talks.length}</span>}
                  </h3>
                  ) : (
                  <h3 className="mb-3 flex items-baseline gap-2 px-1">
                    {d?.date && <span className="text-[13px] font-medium text-gold">{dayLabel(d.date, lang).weekday} {dayLabel(d.date, lang).day} ·</span>}
                    <span className="text-[15px] font-semibold tabular-nums text-[var(--on)]">{x0.start}</span>
                    <span className="text-[13px] tabular-nums text-muted">– {x0.end}</span>
                    {talks.length > 1 && <span className="ml-auto text-[12px] tabular-nums text-muted">{talks.length}</span>}
                  </h3>
                  )}
                  <div className={`grid gap-3 ${talks.length > 1 ? "lg:grid-cols-2" : ""} min-[112.5rem]:grid-cols-[repeat(auto-fill,minmax(28rem,1fr))]`}>
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

function FavButton({ on, onClick, t, className = "" }: { on: boolean; onClick: () => void; t: T; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      data-tour="favstar"
      aria-pressed={on}
      aria-label={on ? t.removeFav : t.addFav}
      title={on ? t.removeFav : t.addFav}
      className={`grid size-9 shrink-0 place-items-center rounded-full transition-[color,background-color,transform] duration-200 active:scale-90 ${
        on ? "text-[#a8832f]" : "text-ink-2 hover:bg-[rgb(118_118_128/0.1)] hover:text-[#a8832f]"
      } ${className}`}
    >
      <Star size={19} weight={on ? "fill" : "regular"} aria-hidden />
    </button>
  );
}

// A session, as in a calm calendar app: the format (with its colour), time
// and room in small type, the title large, then who speaks (in a pill) and
// the languages.
function SessionCard({ talk, speakers, fav, onFav, onOpen, t }: { talk: AgendaTalk; speakers: AgendaSpeaker[]; fav: boolean; onFav: () => void; onOpen: () => void; t: T }) {
  const names = speakers.map((s) => s.name);
  const shownNames = names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2}` : "");
  const c = talk.formatColor || "#5b2a86";
  return (
    <div
      data-tour="session"
      // The format's colour, as in the grid: a soft tint and a bar on the left.
      style={{ background: `color-mix(in srgb, ${c} 11%, white)`, boxShadow: `inset 4px 0 0 color-mix(in srgb, ${c} 75%, white), var(--shadow-card)` }}
      className="group relative flex w-full flex-col gap-5 rounded-[24px] p-5 pl-6 transition-[box-shadow,transform,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[3px] hover:brightness-[1.015] active:translate-y-0 active:scale-[0.99] active:duration-150 sm:p-6 sm:pl-7"
    >
      <button type="button" onClick={onOpen} className="absolute inset-0 z-0 rounded-[24px]" aria-label={talk.title} />
      <span className="pointer-events-none flex items-start gap-4">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted">
            {talk.format && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: `color-mix(in srgb, ${c} 80%, black)` }}>
                {talk.format}
              </span>
            )}
            <span className="tabular-nums">{talk.start}–{talk.end}</span>
            {talk.room && <span>· {talk.room}</span>}
          </span>
          <span className="mt-1.5 block text-[18px] font-semibold leading-snug tracking-[-0.015em] text-ink transition-colors group-hover:text-brand">{talk.title}</span>
        </span>
        <FavButton on={fav} onClick={onFav} t={t} className="pointer-events-auto relative z-10 -mr-2 -mt-1.5" />
      </span>
      {(speakers.length > 0 || talk.pending || talk.langs.length > 0) && (
        <span className="pointer-events-none flex items-center justify-between gap-3">
          {speakers.length > 0 ? (
            <span className="flex min-w-0 items-center gap-2 rounded-full bg-white/75 py-1 pl-1 pr-3.5">
              <span className="flex -space-x-2">
                {speakers.slice(0, 3).map((s) => (
                  <Avatar key={s.id} name={s.name} photo={s.photo} size={28} ring />
                ))}
              </span>
              <span className="truncate text-[13px] font-medium text-ink-2">{shownNames}</span>
            </span>
          ) : talk.pending ? (
            <span className="rounded-full bg-white/75 px-3.5 py-1.5 text-[13px] italic text-muted">{t.pending}</span>
          ) : (
            <span />
          )}
          {talk.langs.length > 0 && (
            <span className="flex shrink-0 gap-1">
              {talk.langs.map((l) => (
                <span key={l} className="grid h-7 min-w-8 place-items-center rounded-full px-2 text-[11px] font-semibold uppercase text-ink-2 bg-white/60 ring-1 ring-[var(--chip-line)]">
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

// A set of chips to pick one of (or "all").
function ChipGroup({
  label,
  all,
  value,
  onChange,
  options,
  tour,
  min = 2,
}: {
  label: string;
  all: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  tour?: string;
  min?: number;
}) {
  if (options.length < min) return null;
  const item = (v: string, text: string) => {
    const on = value === v;
    return (
      <button
        key={v || "all"}
        type="button"
        aria-pressed={on}
        onClick={() => onChange(v)}
        className={`h-10 rounded-full px-4 text-[14px] font-medium transition-[background-color,color,transform] duration-200 active:scale-95 ${on ? "bg-[var(--on)] text-[var(--on-ink)]" : "chip text-ink-2 hover:text-ink"}`}
      >
        {text}
      </button>
    );
  };
  return (
    <div className="mt-6" data-tour={tour}>
      <p className="mb-2.5 text-[13px] font-medium text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {item("", all)}
        {options.map((o) => item(o.value, o.label))}
      </div>
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
          <Star size={16} weight={fav ? "fill" : "regular"} aria-hidden className="text-[#a8832f]" />
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
  // A room's name folds its column, but at least one room always stays
  // open: the last open one does not fold.
  const fold = (id: string) =>
    setFolded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (cols.some((c) => c.room.id !== id && !next.has(c.room.id))) next.add(id);
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
  // Should every room shown end up folded (a filter left only folded ones),
  // they all open again.
  const shut = cols.length && cols.every((c) => folded.has(c.room.id)) ? new Set<string>() : folded;
  const template = cols.map(({ room, lanes }) => (shut.has(room.id) ? "3rem" : `minmax(${Math.max(15.5, lanes * 10.5)}rem, 1fr)`)).join(" ");

  // Drag: the card follows the pointer; the room under it and the time at its
  // top edge (snapped) are where it lands. A press without movement opens it.
  // On touch the card only lifts after a short press (about 0.4 s) without
  // moving: a swipe before that scrolls the grid as usual.
  const startDrag = (e: React.PointerEvent, x: AgendaTalk) => {
    if (!editable || e.button !== 0) return;
    const touch = e.pointerType === "touch";
    // No text selection or native drag while moving a card (mouse/pen).
    if (!touch) e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const startTop = (toMin(x.start) - from) * PPM;
    let moved = false;
    let armed = !touch;
    let scrolled = false;
    let last = { room: x.roomId, time: x.start };
    const hold = touch
      ? window.setTimeout(() => {
          armed = true;
          navigator.vibrate?.(10);
          setDrag({ id: x.id, dx: 0, dy: 0, ...last });
        }, 400)
      : 0;
    // Once lifted, the finger moves the card, not the page.
    const blockScroll = (ev: TouchEvent) => armed && ev.preventDefault();
    if (touch) window.addEventListener("touchmove", blockScroll, { passive: false });
    const cleanup = () => {
      window.clearTimeout(hold);
      window.removeEventListener("pointermove", onMoveEv);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("touchmove", blockScroll);
    };
    const onCancel = () => {
      cleanup();
      setDrag(null);
    };
    const onMoveEv = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!armed) {
        // Moved before the press was long enough: it is a scroll.
        if (Math.hypot(dx, dy) > 8) {
          scrolled = true;
          cleanup();
        }
        return;
      }
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      let roomId = x.roomId;
      for (const [id, col] of colRefs.current) {
        const r = col.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right && !shut.has(id)) roomId = id;
      }
      const mins = Math.round((from + (startTop + dy) / PPM) / SNAP) * SNAP;
      last = { room: roomId, time: hhmm(Math.max(from, Math.min(to - 15, mins))) };
      setDrag({ id: x.id, dx, dy, ...last });
    };
    const onUp = () => {
      cleanup();
      setDrag(null);
      if (scrolled) return;
      if (!moved) return onOpen(x.id);
      if (last.room !== x.roomId || last.time !== x.start) onMove(x.id, last.time, last.room);
    };
    window.addEventListener("pointermove", onMoveEv);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  };

  return (
    <div
      className={`${card} relative max-h-[calc(100dvh-10rem)] min-h-[28rem] overflow-auto overscroll-contain`}
    >
      <div className="grid min-w-full" style={{ gridTemplateColumns: `4.75rem ${template}`, width: "max-content" }}>
        <div className="sticky left-0 top-0 z-30 border-b border-line bg-surface" />
        {cols.map(({ room }) => {
          const isFolded = shut.has(room.id);
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => fold(room.id)}
              aria-expanded={!isFolded}
              aria-label={`${isFolded ? t.expand : t.collapse}: ${room.name}`}
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
          const isFolded = shut.has(room.id);
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
                      data-tour="session"
                      onPointerDown={editable ? (e) => startDrag(e, x) : undefined}
                      onClick={editable ? (ev) => ev.detail === 0 && onOpen(x.id) : () => onOpen(x.id)}
                      title={x.title}
                      className={`group absolute flex overflow-hidden rounded-[14px] px-3 text-left transition-[box-shadow,transform] duration-150 ${
                        editable ? "cursor-grab select-none [-webkit-touch-callout:none] active:cursor-grabbing" : ""
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
                          {favs.has(x.id) && <Star size={12} weight="fill" aria-label={t.favorites} className="text-[#a8832f]" />}
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
