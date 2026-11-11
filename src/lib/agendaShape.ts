import type { Locale } from "@/lib/i18n";

// The agenda's data as the database keeps it (shared by the server pages and
// the editor in the browser), and how it turns into what the pages show.

// The agenda system's database (Supabase): reading is public (anon key);
// every write goes through its token-checked functions (sb_*).
export const AGENDA_DB = {
  url: "https://pzsoeatpbqddtkbamxao.supabase.co",
  anonKey: "sb_publishable_UjegYJ12aHlzvpiLwjVGGg_OH7ILNH3",
};

// The public key goes in the apikey header; an old-style key (a JWT) also as
// the bearer token, as Supabase expects for those.
export const dbHeaders = (): Record<string, string> =>
  AGENDA_DB.anonKey.startsWith("eyJ") ? { apikey: AGENDA_DB.anonKey, Authorization: `Bearer ${AGENDA_DB.anonKey}` } : { apikey: AGENDA_DB.anonKey };

// Photos the site serves itself are kept as site paths (/photos/…), so the
// pages load them like the rest of the site's images.
const SITE_ORIGIN = /^https:\/\/(www\.)?impactmindsconference\.com(?=\/)/;
export const localPhoto = (url: string | null | undefined) => (url ? url.replace(SITE_ORIGIN, "") : "");

export type ML = Partial<Record<Locale, string>>;

export type ConfigRow = {
  days?: { date: string; wd?: ML; gcal?: string }[];
  rooms?: { id: string; name?: ML | string; color?: string; bg?: string; cls?: string }[];
  formats?: { val: string; color?: string; cls?: string; pt?: string; en?: string; es?: string }[];
  slots?: { label: string; isBreak?: boolean }[];
  categories?: { id: string; name?: string; color?: string }[];
  hubs?: (ML | string)[];
  hub_colors?: string[];
  disclaimer?: { enabled?: boolean; pt?: string; en?: string; es?: string };
  show_all_hubs_btn?: boolean;
};
export type TalkRow = {
  id: string;
  day: number;
  time: string;
  room: string;
  hub?: string | null;
  format: string;
  duration: number;
  speaker_ids: string[] | null;
  speaker_name?: string | null;
  moderator_id: string | null;
  speakers_pending: boolean | null;
  langs: string[] | null;
  title: ML | string | null;
  descr: ML | string | null;
  loc_img?: string | null;
};
export type SpeakerRow = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  bio: string | null;
  photo: string | null;
  linkedin: string | null;
  sort: number | null;
  category?: string | null;
};
export type RawAgenda = { config: ConfigRow; talks: TalkRow[]; speakers: SpeakerRow[] };

// What the pages use: every text already in the visitor's language.
// featured: the headline speakers (category "featured"), shown larger and
// first everywhere and in the site's carousel, in their own order (sort).
export type AgendaSpeaker = { id: string; name: string; role: string; company: string; bio: string; photo: string; linkedin: string; featured: boolean; sort: number };
export const FEATURED = "featured";
export type AgendaTalk = {
  id: string;
  day: number;
  start: string;
  end: string;
  roomId: string;
  room: string;
  roomColor: string;
  formatId: string;
  format: string;
  formatColor: string;
  title: string;
  description: string;
  speakerIds: string[];
  moderatorId: string | null;
  pending: boolean;
  langs: string[];
  images: string[];
};
export type AgendaDay = { index: number; date: string; weekday: string };
export type AgendaData = {
  days: AgendaDay[];
  rooms: { id: string; name: string; color: string }[];
  formats: { id: string; name: string; color: string }[];
  talks: AgendaTalk[];
  speakers: AgendaSpeaker[];
  // The notice set in Manage > Notice (empty when off).
  notice?: string;
};

// Multilingual fields come as objects or as JSON text ({"pt":…}); plain
// text is the same in every language.
export function mlObject(value: unknown): ML {
  let v = value;
  if (typeof v === "string" && v.startsWith("{") && v.includes('"')) {
    try {
      v = JSON.parse(v);
    } catch {}
  }
  if (v && typeof v === "object") return v as ML;
  const s = typeof v === "string" ? v : "";
  return { pt: s, en: s, es: s };
}
export function ml(value: unknown, lang: Locale): string {
  const o = mlObject(value);
  return (o[lang] || o.pt || o.en || o.es || "").trim();
}

export const MAX_PLACE_IMAGES = 5;
export function placeImages(locImg: string | null | undefined): string[] {
  const v = (locImg ?? "").trim();
  if (!v) return [];
  if (v.startsWith("[")) {
    try {
      const list = JSON.parse(v);
      if (Array.isArray(list)) return list.filter((x) => typeof x === "string" && x).slice(0, MAX_PLACE_IMAGES);
    } catch {}
  }
  return v.startsWith("data:") ? [] : [v];
}
export const placeImagesValue = (list: string[]) => (list.length === 0 ? "" : list.length === 1 ? list[0] : JSON.stringify(list.slice(0, MAX_PLACE_IMAGES)));

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(((min % 60) + 60) % 60).padStart(2, "0")}`;
const addMinutes = (time: string, minutes: number) => hhmm(toMin(time) + (minutes || 0));

export function normalize(raw: RawAgenda, lang: Locale): AgendaData {
  const cfg = raw.config ?? {};
  const rooms = (cfg.rooms ?? []).map((r) => ({ id: r.id, name: ml(r.name, lang), color: r.color || "#5b2a86" }));
  const formats = (cfg.formats ?? []).map((f) => ({ id: f.val, name: (f[lang] || f.pt || f.val || "").trim(), color: f.color || "#5b2a86" }));
  const roomOf = new Map(rooms.map((r) => [r.id, r]));
  const formatOf = new Map(formats.map((f) => [f.id, f]));
  return {
    notice: cfg.disclaimer?.enabled ? ml(cfg.disclaimer, lang) : "",
    days: (cfg.days ?? []).map((d, index) => ({ index, date: d.date, weekday: ml(d.wd, lang) })),
    rooms,
    formats,
    talks: raw.talks
      .filter((t) => t.time && ml(t.title, lang))
      .map((t) => ({
        id: t.id,
        day: t.day,
        start: t.time,
        end: addMinutes(t.time, t.duration || 30),
        roomId: t.room,
        room: roomOf.get(t.room)?.name ?? "",
        roomColor: roomOf.get(t.room)?.color ?? "#5b2a86",
        formatId: t.format,
        format: formatOf.get(t.format)?.name ?? "",
        formatColor: formatOf.get(t.format)?.color ?? "#8e63c6",
        title: ml(t.title, lang),
        description: ml(t.descr, lang),
        speakerIds: t.speaker_ids ?? [],
        moderatorId: t.moderator_id,
        pending: !!t.speakers_pending,
        langs: t.langs ?? [],
        images: placeImages(t.loc_img).map(localPhoto),
      }))
      .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start) || a.room.localeCompare(b.room)),
    speakers: raw.speakers
      .filter((s) => s.name?.trim())
      .map((s) => ({
        id: s.id,
        name: s.name.trim(),
        role: ml(s.role, lang),
        company: ml(s.company, lang),
        bio: ml(s.bio, lang).replace(/^"+|"+$/g, ""),
        photo: localPhoto(s.photo),
        linkedin: s.linkedin ? (s.linkedin.includes("://") ? s.linkedin : `https://${s.linkedin}`) : "",
        featured: s.category === FEATURED,
        sort: s.sort ?? 0,
      }))
      // Featured first, each group in its own order (sort), then by name.
      .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort - b.sort || a.name.localeCompare(b.name)),
  };
}

const headers = dbHeaders;

export async function fetchRaw(init?: RequestInit): Promise<RawAgenda> {
  const get = async <T,>(table: string, query: string): Promise<T[]> => {
    const res = await fetch(`${AGENDA_DB.url}/rest/v1/${table}?${query}`, { ...init, headers: headers() });
    if (!res.ok) throw new Error(`agenda ${table}: ${res.status}`);
    return res.json();
  };
  const [config, talks, speakers] = await Promise.all([
    get<ConfigRow>("config", "id=eq.1&select=days,rooms,formats,slots,categories,hubs,hub_colors,disclaimer,show_all_hubs_btn"),
    get<TalkRow>("talks", "select=id,day,time,room,hub,format,duration,speaker_ids,speaker_name,moderator_id,speakers_pending,langs,title,descr,loc_img"),
    get<SpeakerRow>("speakers", "select=id,name,role,company,bio,photo,linkedin,sort,category&order=sort.asc,name.asc"),
  ]);
  return { config: config[0] ?? {}, talks, speakers };
}
