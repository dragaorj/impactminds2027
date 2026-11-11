"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowDown, ArrowUp, DownloadSimple, FloppyDisk, GearSix, Info, PencilSimple, Plus, ShareNetwork, Star, Trash, UploadSimple, UsersThree, Warning, Wrench } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { mlObject, toMin, type ConfigRow, type ML, type RawAgenda, type SpeakerRow, type TalkRow } from "@/lib/agendaShape";
import { useAgenda } from "./store";
import { Button, Segmented, Sheet, Switch, TriField, card, dayLabel, fieldBox } from "./ui";
import { DaysPanel } from "./Editor";
import TeamSheet from "./Team";
import ShareSheet from "./Share";

type T = Dict["agendaApp"];
type Tab = "days" | "slots" | "rooms" | "formats" | "hubs" | "notice";

// The editors' menu, behind a gear in the top bar (phones too): new
// session / new speaker and the speakers' order (on their page), Manage
// (days, times, rooms, formats, hubs, notice), CSV export, backup, the team
// and logs and delete everything (master only). Shown only when signed in.
export default function EditMenu({ t, lang, tab }: { t: T; lang: string; tab: "agenda" | "speakers" }) {
  const { profile, raw, data, signedIn, editing, busy, ask } = useAgenda();
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState<"manage" | "backup" | "wipe" | "team" | "share" | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    // A click outside closes it, except on the guided tour (which opens it to
    // show each option).
    const close = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!box.current?.contains(t) && !t.closest?.("[data-tour-open]")) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    // A soft drop: the panel and its rows settle in.
    if (list.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(list.current, { autoAlpha: 0, y: -6, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: "power3.out", clearProps: "opacity,visibility,transform" });
      gsap.fromTo(list.current.querySelectorAll("[role=menuitem]"), { autoAlpha: 0, x: -4 }, { autoAlpha: 1, x: 0, duration: 0.22, ease: "power2.out", stagger: 0.018, delay: 0.04, clearProps: "opacity,visibility,transform" });
    }
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [menu]);
  // The guided tour opens it (and closes it after) to show each option.
  useEffect(() => {
    const set = (e: Event) => setMenu(!!(e as CustomEvent<boolean>).detail);
    window.addEventListener("im:editmenu", set);
    return () => window.removeEventListener("im:editmenu", set);
  }, []);
  if (!signedIn || !profile) return null;
  const master = profile.role === "master";
  const name = `${profile.first ?? ""} ${profile.last ?? ""}`.trim();
  const go = (fn: () => void) => () => {
    setMenu(false);
    fn();
  };

  const exportCsv = () => {
    if (!raw) return;
    const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rooms = new Map(data.rooms.map((r) => [r.id, r.name]));
    const formats = new Map(data.formats.map((f) => [f.id, f.name]));
    const spk = new Map(raw.speakers.map((s) => [s.id, s]));
    const rows = [["Dia", "Data", "Início", "Fim", "Sala", "Formato", "Título (PT)", "Title (EN)", "Título (ES)", "Palestrantes", "Organizações", "Moderação", "Idiomas", "Descrição (PT)"]];
    for (const x of [...raw.talks].sort((a, b) => a.day - b.day || toMin(a.time) - toMin(b.time))) {
      const ti = mlObject(x.title);
      const people = (x.speaker_ids ?? []).map((id) => spk.get(id)).filter(Boolean) as SpeakerRow[];
      const end = toMin(x.time) + (x.duration || 30);
      rows.push([
        String(x.day + 1),
        data.days[x.day]?.date ?? "",
        x.time,
        `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`,
        rooms.get(x.room) ?? x.room,
        formats.get(x.format) ?? x.format,
        ti.pt ?? "",
        ti.en ?? "",
        ti.es ?? "",
        people.map((p) => p.name).join("; "),
        people.map((p) => mlObject(p.company).pt ?? "").join("; "),
        x.moderator_id ? (spk.get(x.moderator_id)?.name ?? "") : "",
        (x.langs ?? []).join(" "),
        mlObject(x.descr).pt ?? "",
      ]);
    }
    const csv = "﻿" + rows.map((r) => r.map(q).join(",")).join("\n");
    download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `agenda-impact-minds-2027-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setMenu((v) => !v)}
        aria-expanded={menu}
        aria-haspopup="menu"
        data-tour="gear"
        aria-label={t.tools}
        title={t.tools}
        className={`relative grid size-9 place-items-center rounded-full transition-[background-color,color,transform] duration-200 active:scale-95 sm:size-10 ${menu ? "bg-brand text-brand-ink" : "bg-[rgb(118_118_128/0.12)] text-ink hover:bg-[rgb(118_118_128/0.18)]"}`}
      >
        <GearSix size={20} weight={menu ? "fill" : "regular"} className={`transition-transform duration-500 ease-out ${menu ? "rotate-90" : ""} ${busy ? "animate-spin" : ""}`} />
        {/* Editing: a small green light on the gear. */}
        <span aria-hidden className="absolute right-0.5 top-0.5 size-2.5 rounded-full bg-[#34c759] ring-2 ring-[var(--bg)]" />
      </button>
      {menu && (
        <div
          ref={list}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[17rem] origin-top-right max-sm:fixed max-sm:inset-x-3 max-sm:top-[3.75rem] max-sm:mt-0 max-sm:w-auto overflow-hidden rounded-[20px] bg-surface p-1.5 shadow-[0_24px_60px_-20px_rgb(29_20_38/0.4)] ring-1 ring-line"
        >
          <div className="flex items-center gap-2.5 px-3 pb-2.5 pt-2">
            <span className="relative grid size-2 place-items-center">
              <span className="absolute size-2 animate-ping rounded-full bg-[#34c759]/60" />
              <span className="size-2 rounded-full bg-[#34c759]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] text-muted">{busy ? t.saving : t.editMode}</span>
              <span className="block truncate text-[14px] font-medium">{name}</span>
            </span>
          </div>
          <div className={`border-t border-line pt-1.5 ${editing ? "" : "pointer-events-none opacity-50"}`} aria-busy={!editing}>
            {tab === "agenda" ? (
              <MenuItem tour="menu-new" strong icon={<Plus size={18} weight="bold" />} onClick={go(() => ask("newTalk"))}>
                {t.newSession}
              </MenuItem>
            ) : (
              <>
                <MenuItem tour="menu-new-speaker" strong icon={<Plus size={18} weight="bold" />} onClick={go(() => ask("newSpeaker"))}>
                  {t.newSpeaker}
                </MenuItem>
                <MenuItem tour="menu-order" icon={<Star size={18} weight="fill" className="text-[#c9a24d]" />} onClick={go(() => ask("order"))}>
                  {t.orderFeatured}
                </MenuItem>
              </>
            )}
            <MenuItem tour="menu-manage" icon={<Wrench size={18} />} onClick={go(() => setSheet("manage"))}>
              {t.manage}
            </MenuItem>
            <MenuItem tour="menu-share" icon={<ShareNetwork size={18} />} onClick={go(() => setSheet("share"))}>
              {t.share}
            </MenuItem>
            <MenuItem tour="menu-csv" icon={<DownloadSimple size={18} />} onClick={go(exportCsv)}>
              {t.exportCsv}
            </MenuItem>
            <MenuItem tour="menu-backup" icon={<FloppyDisk size={18} />} onClick={go(() => setSheet("backup"))}>
              {t.backup}
            </MenuItem>
            {master && (
              <>
                <MenuItem tour="menu-team" icon={<UsersThree size={18} />} onClick={go(() => setSheet("team"))}>
                  {t.advanced}
                </MenuItem>
                <div className="my-1.5 border-t border-line" />
                <MenuItem tour="menu-wipe" danger icon={<Trash size={18} />} onClick={go(() => setSheet("wipe"))}>
                  {t.wipe}
                </MenuItem>
              </>
            )}
          </div>
        </div>
      )}
      <ManageSheet open={sheet === "manage"} onClose={() => setSheet(null)} t={t} lang={lang} />
      <ShareSheet open={sheet === "share"} onClose={() => setSheet(null)} t={t} lang={lang} />
      <BackupSheet open={sheet === "backup"} onClose={() => setSheet(null)} t={t} />
      {master && <WipeSheet open={sheet === "wipe"} onClose={() => setSheet(null)} t={t} />}
      {master && <TeamSheet open={sheet === "team"} onClose={() => setSheet(null)} t={t} lang={lang} />}
    </div>
  );
}

function MenuItem({ icon, danger = false, strong = false, tour, onClick, children }: { icon: React.ReactNode; danger?: boolean; strong?: boolean; tour?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      data-tour={tour}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[15px] transition-colors ${danger ? "text-[#b42318] hover:bg-[#fdecec]" : strong ? "font-semibold text-brand hover:bg-brand-soft" : "text-ink hover:bg-[rgb(118_118_128/0.1)]"}`}
    >
      <span className={danger || strong ? "" : "text-ink-2"}>{icon}</span>
      {children}
    </button>
  );
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// --------------------------------------------------------------- manage

function ManageSheet({ open, onClose, t, lang }: { open: boolean; onClose: () => void; t: T; lang: string }) {
  const [tab, setTab] = useState<Tab>("days");
  const { raw } = useAgenda();
  const c = raw?.config ?? {};
  const label = (x: string, n?: number) => (n === undefined ? x : `${x} (${n})`);
  return (
    <Sheet centered wide open={open} onClose={onClose} label={t.manage} closeLabel={t.close}>
      <h2 className="text-2xl font-semibold tracking-tight">{t.manage}</h2>
      <div className="no-scrollbar -mx-1 mt-4 overflow-x-auto px-1 pb-1">
        <Segmented
          label={t.manage}
          value={tab}
          onChange={setTab}
          className="w-max min-w-full"
          size="sm"
          options={[
            { value: "days", label: label(t.tabDays, c.days?.length ?? 0) },
            { value: "slots", label: label(t.tabSlots, c.slots?.length ?? 0) },
            { value: "rooms", label: label(t.tabRooms, c.rooms?.length ?? 0) },
            { value: "formats", label: label(t.tabFormats, c.formats?.length ?? 0) },
            { value: "hubs", label: label(t.tabHubs, c.hubs?.length ?? 0) },
            { value: "notice", label: t.tabNotice },
          ]}
        />
      </div>
      <div className="mt-5">
        {tab === "days" && <DaysPanel t={t} lang={lang} onDone={onClose} />}
        {tab === "slots" && <SlotsPanel t={t} />}
        {tab === "rooms" && <RoomsPanel t={t} />}
        {tab === "formats" && <FormatsPanel t={t} />}
        {tab === "hubs" && <HubsPanel t={t} />}
        {tab === "notice" && <NoticePanel t={t} />}
      </div>
    </Sheet>
  );
}

function SaveRow({ t, onSave, msg }: { t: T; onSave: () => unknown; msg?: string }) {
  const { busy } = useAgenda();
  return (
    <div className="mt-5 flex items-center justify-end gap-3">
      {msg && <span className="flex-1 text-sm text-[#b42318]">{msg}</span>}
      <Button kind="primary" onClick={onSave} disabled={busy}>
        {busy ? t.saving : t.save}
      </Button>
    </div>
  );
}

function Mover({ i, n, onMove, t }: { i: number; n: number; onMove: (from: number, to: number) => void; t: T }) {
  return (
    <span className="flex shrink-0">
      <button type="button" onClick={() => onMove(i, i - 1)} disabled={i === 0} aria-label={t.moveUp} className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-[rgb(118_118_128/0.1)] disabled:opacity-30">
        <ArrowUp size={15} />
      </button>
      <button type="button" onClick={() => onMove(i, i + 1)} disabled={i === n - 1} aria-label={t.moveDown} className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-[rgb(118_118_128/0.1)] disabled:opacity-30">
        <ArrowDown size={15} />
      </button>
    </span>
  );
}
const moved = <X,>(list: X[], from: number, to: number) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
};
const DelBtn = ({ onClick, t }: { onClick: () => void; t: T }) => (
  <button type="button" onClick={onClick} aria-label={t.del} className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-[#fdecec] hover:text-[#b42318]">
    <Trash size={16} />
  </button>
);

// Time slots (the old admin's grid rows; a break is a shared row).
function SlotsPanel({ t }: { t: T }) {
  const { raw, saveConfig } = useAgenda();
  const [slots, setSlots] = useState(raw?.config.slots ?? []);
  const [time, setTime] = useState("09:00");
  const add = () => {
    if (!time || slots.some((s) => s.label === time)) return;
    setSlots([...slots, { label: time, isBreak: false }].sort((a, b) => toMin(a.label) - toMin(b.label)));
  };
  return (
    <div>
      <div className="flex gap-2">
        <input type="time" step={300} value={time} onChange={(e) => setTime(e.target.value)} className={`${fieldBox} h-11 flex-1 tabular-nums`} />
        <Button onClick={add}>
          <Plus size={16} weight="bold" /> {t.addSlot}
        </Button>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((s, i) => (
          <li key={s.label} className={`${card} flex items-center gap-2 py-1.5 pl-3.5 pr-1.5`}>
            <span className="flex-1 text-[15px] font-semibold tabular-nums">{s.label}</span>
            <button
              type="button"
              onClick={() => setSlots(slots.map((x, j) => (j === i ? { ...x, isBreak: !x.isBreak } : x)))}
              className={`h-8 rounded-full px-2.5 text-xs font-medium ${s.isBreak ? "bg-[rgb(201_162_77/0.18)] text-[#7a5a12]" : "text-muted hover:bg-[rgb(118_118_128/0.1)]"}`}
            >
              {t.isBreak}
            </button>
            <DelBtn onClick={() => setSlots(slots.filter((_, j) => j !== i))} t={t} />
          </li>
        ))}
      </ul>
      <SaveRow t={t} onSave={() => saveConfig({ slots }, "Editou os horários")} />
    </div>
  );
}

type Room = NonNullable<ConfigRow["rooms"]>[number];
function RoomsPanel({ t }: { t: T }) {
  const { raw, saveConfig } = useAgenda();
  const [rooms, setRooms] = useState<Room[]>(raw?.config.rooms ?? []);
  const [msg, setMsg] = useState("");
  const used = (id: string) => (raw?.talks ?? []).some((x) => x.room === id);
  return (
    <div>
      <ul className="space-y-2">
        {rooms.map((r, i) => (
          <li key={r.id} className={`${card} p-3`}>
            <div className="flex items-center gap-2">
              <input type="color" value={r.color || "#5b2a86"} onChange={(e) => setRooms(rooms.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} aria-label={t.color} className="size-9 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0" />
              <div className="min-w-0 flex-1">
                <TriField label={`${t.room} ${i + 1}`} value={mlObject(r.name)} onChange={(v) => setRooms(rooms.map((x, j) => (j === i ? { ...x, name: v } : x)))} langsLabel={t.languages} />
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <Mover i={i} n={rooms.length} onMove={(a, b) => setRooms(moved(rooms, a, b))} t={t} />
              <DelBtn onClick={() => (used(r.id) ? setMsg(t.inUse) : setRooms(rooms.filter((_, j) => j !== i)))} t={t} />
            </div>
          </li>
        ))}
      </ul>
      <Button
        className="mt-3 w-full"
        onClick={() => setRooms([...rooms, { id: `r_${Date.now()}`, cls: `c${(rooms.length % 9) + 1}`, bg: "#f3edf9", color: "#8e63c6", name: { pt: "", en: "", es: "" } }])}
      >
        <Plus size={16} weight="bold" /> {t.addRoom}
      </Button>
      <SaveRow t={t} msg={msg} onSave={() => saveConfig({ rooms }, "Editou as salas")} />
    </div>
  );
}

type Format = NonNullable<ConfigRow["formats"]>[number];
function FormatsPanel({ t }: { t: T }) {
  const { raw, saveConfig } = useAgenda();
  const [formats, setFormats] = useState<Format[]>(raw?.config.formats ?? []);
  const [msg, setMsg] = useState("");
  const used = (val: string) => (raw?.talks ?? []).some((x) => x.format === val);
  return (
    <div>
      <ul className="space-y-2">
        {formats.map((f, i) => (
          <li key={f.val} className={`${card} p-3`}>
            <div className="flex items-center gap-2">
              <input type="color" value={f.color || "#5b2a86"} onChange={(e) => setFormats(formats.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} aria-label={t.color} className="size-9 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0" />
              <div className="min-w-0 flex-1">
                <TriField label={`${t.format} ${i + 1}`} value={{ pt: f.pt, en: f.en, es: f.es }} onChange={(v) => setFormats(formats.map((x, j) => (j === i ? { ...x, ...v } : x)))} langsLabel={t.languages} />
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <Mover i={i} n={formats.length} onMove={(a, b) => setFormats(moved(formats, a, b))} t={t} />
              <DelBtn onClick={() => (used(f.val) ? setMsg(t.inUse) : setFormats(formats.filter((_, j) => j !== i)))} t={t} />
            </div>
          </li>
        ))}
      </ul>
      <Button
        className="mt-3 w-full"
        onClick={() => {
          const val = `F${Date.now().toString(36).toUpperCase()}`;
          setFormats([...formats, { val, cls: `fmt-${val}`, color: "#8e63c6", pt: "", en: "", es: "" }]);
        }}
      >
        <Plus size={16} weight="bold" /> {t.addFormat}
      </Button>
      <SaveRow t={t} msg={msg} onSave={() => saveConfig({ formats }, "Editou os formatos")} />
    </div>
  );
}

function HubsPanel({ t }: { t: T }) {
  const { raw, saveConfig } = useAgenda();
  const [hubs, setHubs] = useState<ML[]>((raw?.config.hubs ?? []).map((h) => mlObject(h)));
  const [colors, setColors] = useState<string[]>(raw?.config.hub_colors ?? []);
  const [show, setShow] = useState(raw?.config.show_all_hubs_btn !== false);
  return (
    <div>
      <ul className="space-y-2">
        {hubs.map((h, i) => (
          <li key={i} className={`${card} flex items-center gap-2 p-3`}>
            <input type="color" value={colors[i] || "#8e63c6"} onChange={(e) => setColors(Object.assign([...colors], { [i]: e.target.value }))} aria-label={t.color} className="size-9 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0" />
            <div className="min-w-0 flex-1">
              <TriField label={`Hub ${i + 1}`} value={h} onChange={(v) => setHubs(hubs.map((x, j) => (j === i ? v : x)))} langsLabel={t.languages} />
            </div>
            <DelBtn
              onClick={() => {
                setHubs(hubs.filter((_, j) => j !== i));
                setColors(colors.filter((_, j) => j !== i));
              }}
              t={t}
            />
          </li>
        ))}
      </ul>
      <Button className="mt-3 w-full" onClick={() => setHubs([...hubs, { pt: "", en: "", es: "" }])}>
        <Plus size={16} weight="bold" /> {t.addHub}
      </Button>
      <div className={`${card} mt-3 p-4`}>
        <Switch checked={show} onChange={setShow} label={t.allHubsBtn} />
      </div>
      <SaveRow t={t} onSave={() => saveConfig({ hubs, hubColors: colors, showAllHubsBtn: show }, "Editou os hubs")} />
    </div>
  );
}

export function NoticePanel({ t, onDone }: { t: T; onDone?: () => void }) {
  const { raw, saveConfig } = useAgenda();
  const d = raw?.config.disclaimer ?? {};
  const [on, setOn] = useState(!!d.enabled);
  const [text, setText] = useState<ML>({ pt: d.pt ?? "", es: d.es ?? "", en: d.en ?? "" });
  return (
    <div className="space-y-4">
      <div className={`${card} p-4`}>
        <Switch checked={on} onChange={setOn} label={t.noticeOn} />
      </div>
      <TriField label={t.noticeText} value={text} onChange={setText} multiline langsLabel={t.languages} />
      <SaveRow
        t={t}
        onSave={async () => {
          await saveConfig({ disclaimer: { enabled: on, ...text } }, "Editou o aviso");
          onDone?.();
        }}
      />
    </div>
  );
}

// --------------------------------------------------------------- backup

// The old admin's backup ({ speakers, schedules: [{ time: { room: talk } }],
// rooms, … }) is turned into this platform's shape.
function fromLegacy(b: Record<string, unknown>): RawAgenda | null {
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  if (!Array.isArray(b.schedules) || !Array.isArray(b.speakers)) return null;
  const txt = (v: unknown) => (v && typeof v === "object" ? JSON.stringify(v) : String(v ?? ""));
  const talks: TalkRow[] = [];
  (b.schedules as Record<string, Record<string, Record<string, unknown>>>[]).forEach((day, di) => {
    for (const [time, slot] of Object.entries(day ?? {}))
      for (const [room, x] of Object.entries(slot ?? {}))
        talks.push({
          id: String(x.id), day: di, time, room, hub: String(x.hub ?? ""), format: String(x.format ?? ""), duration: Number(x.duration) || 30,
          speaker_ids: list(x.speakerIds) as string[], speaker_name: String(x.speakerName ?? ""), moderator_id: (x.moderatorId as string) ?? null,
          speakers_pending: !!x.speakersPending, langs: list(x.langs) as string[], title: x.title as ML, descr: x.desc as ML, loc_img: String(x.locImg ?? ""),
        });
  });
  const speakers: SpeakerRow[] = (b.speakers as Record<string, unknown>[]).map((s) => ({
    id: String(s.id), name: String(s.name ?? ""), role: txt(s.role), company: txt(s.company), bio: txt(s.bio), photo: String(s.photo ?? ""),
    linkedin: String(s.linkedin ?? ""), sort: Number(s.sort) || 0, category: String(s.category ?? "speaker"),
  }));
  return {
    config: { days: b.days as ConfigRow["days"], rooms: b.rooms as ConfigRow["rooms"], formats: b.formats as ConfigRow["formats"], slots: b.slots as ConfigRow["slots"], categories: b.categories as ConfigRow["categories"], hubs: b.hubs as ConfigRow["hubs"], hub_colors: b.hubColors as string[] },
    talks,
    speakers,
  };
}

function BackupSheet({ open, onClose, t }: { open: boolean; onClose: () => void; t: T }) {
  const { raw, restore, busy } = useAgenda();
  const [msg, setMsg] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) setMsg("");
  }, [open]);
  const save = () => raw && download(new Blob([JSON.stringify({ format: "impact-minds-2027", savedAt: new Date().toISOString(), ...raw }, null, 2)], { type: "application/json" }), `backup-agenda-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`);
  const load = async (file: File) => {
    try {
      const b = JSON.parse(await file.text());
      const data: RawAgenda | null = b.config && Array.isArray(b.talks) && Array.isArray(b.speakers) ? { config: b.config, talks: b.talks, speakers: b.speakers } : fromLegacy(b);
      if (!data) return setMsg(t.badFile);
      if (!confirm(t.restoreConfirm)) return;
      await restore(data);
      setMsg(t.restored);
    } catch {
      setMsg(t.badFile);
    }
  };
  return (
    <Sheet centered open={open} onClose={onClose} label={t.backupTitle} closeLabel={t.close}>
      <span className="grid size-14 place-items-center rounded-[18px] bg-brand-soft text-brand">
        <FloppyDisk size={26} />
      </span>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">{t.backupTitle}</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{t.backupLead}</p>
      <div className="mt-6 grid gap-2.5">
        <Button kind="primary" onClick={save} disabled={!raw}>
          <DownloadSimple size={18} /> {t.download}
        </Button>
        <Button onClick={() => input.current?.click()} disabled={busy}>
          <UploadSimple size={18} /> {busy ? t.saving : t.restoreBtn}
        </Button>
        <input ref={input} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
      </div>
      {msg && <p className="mt-4 text-center text-sm text-ink-2">{msg}</p>}
    </Sheet>
  );
}

// --------------------------------------------------------------- wipe

function WipeSheet({ open, onClose, t }: { open: boolean; onClose: () => void; t: T }) {
  const { wipe, busy, profile } = useAgenda();
  const [word, setWord] = useState("");
  useEffect(() => {
    if (open) setWord("");
  }, [open]);
  const key = t.wipeWord;
  return (
    <Sheet centered open={open} onClose={onClose} label={t.wipe} closeLabel={t.close}>
      <span className="grid size-14 place-items-center rounded-[18px] bg-[#fdecec] text-[#b42318]">
        <Warning size={26} />
      </span>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">{t.wipe}</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{profile?.role === "master" ? t.wipeLead : t.masterOnly}</p>
      {profile?.role === "master" && (
        <>
          <label className="mt-5 block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{t.wipeConfirmLabel.replace("{word}", key)}</span>
            <input value={word} onChange={(e) => setWord(e.target.value)} className={`${fieldBox} h-12`} />
          </label>
          <Button
            kind="danger"
            className="mt-5 w-full"
            disabled={busy || word.trim().toUpperCase() !== key}
            onClick={async () => {
              await wipe();
              onClose();
            }}
          >
            <Trash size={18} /> {busy ? t.saving : t.wipe}
          </Button>
        </>
      )}
    </Sheet>
  );
}

export { dayLabel };

// The notice for everyone, as on the old admin: shown to visitors where the
// edit bar sits for editors; editors see it on top with a pencil (or an
// empty line inviting them to write one), and write it in PT, ES and EN.
export function NoticeBox({ t }: { t: T }) {
  const { data, signedIn: editing } = useAgenda();
  const [open, setOpen] = useState(false);
  if (!editing && !data.notice) return null;
  const has = !!data.notice;
  return (
    <>
      <div
        data-tour="notice"
        className={`mt-5 flex gap-3 rounded-[16px] px-4 text-[14px] leading-relaxed sm:rounded-[18px] sm:text-[15px] ${has ? "items-start py-3" : "items-center py-2 sm:py-2.5"} ${
          has ? "bg-[rgb(201_162_77/0.12)] text-[#5f4610] ring-1 ring-[rgb(201_162_77/0.25)]" : "bg-surface text-muted ring-1 ring-dashed ring-[rgb(118_118_128/0.35)]"
        }`}
      >
        <Info size={20} className={`${has ? "mt-0.5" : ""} shrink-0 ${has ? "text-[#a07c26]" : "text-muted"}`} aria-hidden />
        {has ? (
          <span className="flex-1 whitespace-pre-line">{data.notice}</span>
        ) : (
          // Empty: one short line (the full sentence from tablets up).
          <span className="min-w-0 flex-1 truncate italic">
            <span className="sm:hidden">{t.noNoticeShort}</span>
            <span className="max-sm:hidden">{t.noNotice}</span>
          </span>
        )}
        {editing && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t.editNotice}
            title={t.editNotice}
            className="-my-1 -mr-1 grid size-9 shrink-0 place-items-center rounded-full text-[#a07c26] transition-colors hover:bg-[rgb(201_162_77/0.18)]"
          >
            <PencilSimple size={17} />
          </button>
        )}
      </div>
      {editing && (
        <Sheet centered open={open} onClose={() => setOpen(false)} label={t.editNotice} closeLabel={t.close}>
          <h2 className="text-2xl font-semibold tracking-tight">{t.editNotice}</h2>
          <div className="mt-5">{open && <NoticePanel t={t} onDone={() => setOpen(false)} />}</div>
        </Sheet>
      )}
    </>
  );
}
