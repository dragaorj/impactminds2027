"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { AGENDA_DB, FEATURED, dbHeaders, placeImages, placeImagesValue, fetchRaw, mlObject, normalize, toMin, type AgendaData, type ML, type RawAgenda, type SpeakerRow, type TalkRow } from "@/lib/agendaShape";
import { compressImage } from "./compress";
import { agendaChanged } from "@/lib/agendaActions";

// The platform's shared state: what the pages show (the server's copy for
// visitors; a live copy straight from the database for signed-in editors)
// and the editing actions. Sign-in is the agenda system's own: a personal
// token, checked by the database (sb_login), remembered in this browser
// under the same key as the old admin, so one sign-in serves both.

const SESSION_KEY = "latimpacto_session_v1";

export type Profile = { id: string; first: string; last: string; email?: string; photo?: string; role: "master" | "editor" };

export type TalkDraft = {
  id?: string;
  day: number;
  time: string;
  duration: number;
  room: string;
  format: string;
  title: ML;
  desc: ML;
  speakerIds: string[];
  moderatorId: string | null;
  langs: string[];
  speakersPending: boolean;
  images: string[];
};
export type SpeakerDraft = {
  id?: string;
  name: string;
  role: ML;
  company: ML;
  bio: ML;
  photo: string;
  linkedin: string;
  featured: boolean;
  sort?: number;
};

type Store = {
  data: AgendaData;
  raw: RawAgenda | null;
  lang: Locale;
  profile: Profile | null;
  editing: boolean;
  busy: boolean;
  error: string;
  login: (token: string) => Promise<boolean>;
  logout: () => void;
  saveTalk: (d: TalkDraft) => Promise<void>;
  moveTalk: (id: string, patch: { day?: number; time?: string; room?: string }) => Promise<void>;
  deleteTalk: (id: string) => Promise<void>;
  saveSpeaker: (d: SpeakerDraft, photo?: File | null) => Promise<string>;
  deleteSpeaker: (id: string) => Promise<void>;
  orderFeatured: (ids: string[]) => Promise<void>;
  saveDays: (dates: string[]) => Promise<void>;
  saveConfig: (patch: Record<string, unknown>, what: string) => Promise<void>;
  restore: (backup: RawAgenda) => Promise<void>;
  wipe: () => Promise<void>;
  talkDraft: (id?: string) => TalkDraft;
  uploadImage: (file: File) => Promise<string>;
  speakerDraft: (id?: string) => SpeakerDraft;
};

const Ctx = createContext<Store | null>(null);
export const useAgenda = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("useAgenda outside AgendaProvider");
  return s;
};

async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${AGENDA_DB.url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { ...dbHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      msg = JSON.parse(text).message || text;
    } catch {}
    throw new Error(msg || `Erro ${res.status}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

// Image upload to the agenda's public bucket, as the old admin does; made
// light first (cropped, resized, WebP).
async function uploadPhoto(original: File, folder = "speakers"): Promise<string> {
  const file = await compressImage(original, folder === "speakers" ? "speaker" : "place");
  const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const res = await fetch(`${AGENDA_DB.url}/storage/v1/object/agenda/${path}`, {
    method: "POST",
    headers: { ...dbHeaders(), "Content-Type": file.type || "image/jpeg", "x-upsert": "true" },
    body: file,
  });
  if (!res.ok) throw new Error(`Foto: ${res.status}`);
  return `${AGENDA_DB.url}/storage/v1/object/public/agenda/${path}`;
}

const makeId = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const clean = (o: ML): ML => ({ pt: (o.pt ?? "").trim(), en: (o.en ?? "").trim(), es: (o.es ?? "").trim() });

export function AgendaProvider({ initial, lang, children }: { initial: AgendaData; lang: Locale; children: React.ReactNode }) {
  const [raw, setRaw] = useState<RawAgenda | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => setRaw(await fetchRaw({ cache: "no-store" })), []);

  const login = useCallback(
    async (tok: string) => {
      const t = tok.trim();
      if (!t) return false;
      try {
        const p = await rpc<Profile | null>("sb_login", { p_token: t });
        if (!p) return false;
        setToken(t);
        setProfile(p);
        try {
          localStorage.setItem(SESSION_KEY, t);
        } catch {}
        await refresh();
        rpc("sb_log", { p_token: t, p_action: "Entrou no modo edição", p_detail: "agenda 2027" }).catch(() => {});
        return true;
      } catch {
        return false;
      }
    },
    [refresh],
  );

  // Local development only: ?editpreview=1 shows the editing screens with
  // the real data and saves nothing (never in a production build).
  const preview = useRef(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !location.search.includes("editpreview=1")) return;
    preview.current = true;
    setProfile({ id: "preview", first: "Preview", last: "", role: "editor" });
    setToken("preview");
    void refresh();
  }, [refresh]);

  // A saved sign-in comes back on its own.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(SESSION_KEY);
    } catch {}
    if (saved) void login(saved);
  }, [login]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
    setToken(null);
    setProfile(null);
    setRaw(null);
  }, []);

  // Every write: token-checked function, then a fresh read.
  const run = useCallback(
    async (what: string, detail: string, fn: () => Promise<unknown>) => {
      if (!token) throw new Error("Sem login");
      if (preview.current) return;
      setBusy(true);
      setError("");
      try {
        await fn();
        rpc("sb_log", { p_token: token, p_action: what, p_detail: detail }).catch(() => {});
        // This screen reads the database again, and the public pages drop
        // their kept copy, so a reload never brings back the old version.
        await Promise.all([refresh(), agendaChanged(token).catch(() => {})]);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [token, refresh],
  );

  // The old admin draws its grid from the configured time slots: a session
  // at a new time also adds that time to the list, so it shows there too.
  const ensureSlot = useCallback(
    async (time: string) => {
      const slots = raw?.config.slots ?? [];
      if (!token || slots.some((s) => s.label === time)) return;
      const next = [...slots, { label: time, isBreak: false }].sort((a, b) => toMin(a.label) - toMin(b.label));
      await rpc("sb_save_config", { p_token: token, p_config: { slots: next } });
    },
    [raw, token],
  );

  const speakerName = useCallback(
    (ids: string[]) => ids.map((id) => raw?.speakers.find((s) => s.id === id)?.name ?? "").filter(Boolean).join(", "),
    [raw],
  );

  const toPayload = useCallback(
    (d: TalkDraft, base?: TalkRow) => ({
      id: d.id ?? makeId("t"),
      day: d.day,
      time: d.time,
      room: d.room,
      hub: base?.hub ?? "",
      format: d.format,
      duration: d.duration,
      speakerIds: d.speakerIds,
      speakerName: speakerName(d.speakerIds),
      speakersPending: d.speakersPending,
      moderatorId: d.moderatorId && d.speakerIds.includes(d.moderatorId) ? d.moderatorId : null,
      langs: d.langs,
      title: clean(d.title),
      desc: clean(d.desc),
      locImg: placeImagesValue(d.images),
    }),
    [speakerName],
  );

  const saveTalk = useCallback(
    async (d: TalkDraft) => {
      const base = raw?.talks.find((t) => t.id === d.id);
      const p = toPayload(d, base);
      await run(d.id ? "Editou a sessão" : "Criou a sessão", p.title.pt || p.title.en || "", async () => {
        await ensureSlot(p.time);
        await rpc("sb_upsert_talk", { p_token: token, p_t: p });
      });
    },
    [raw, toPayload, run, ensureSlot, token],
  );

  const talkDraft = useCallback(
    (id?: string): TalkDraft => {
      const t = raw?.talks.find((x) => x.id === id);
      if (!t)
        return {
          day: 0,
          time: "09:00",
          duration: 60,
          room: raw?.config.rooms?.[0]?.id ?? "",
          format: raw?.config.formats?.[0]?.val ?? "",
          title: { pt: "", en: "", es: "" },
          desc: { pt: "", en: "", es: "" },
          speakerIds: [],
          moderatorId: null,
          langs: ["pt", "en", "es"],
          speakersPending: false,
          images: [],
        };
      return {
        id: t.id,
        day: t.day,
        time: t.time,
        duration: t.duration || 30,
        room: t.room,
        format: t.format,
        title: mlObject(t.title),
        desc: mlObject(t.descr),
        speakerIds: t.speaker_ids ?? [],
        moderatorId: t.moderator_id,
        langs: t.langs ?? [],
        speakersPending: !!t.speakers_pending,
        images: placeImages(t.loc_img),
      };
    },
    [raw],
  );

  const moveTalk = useCallback(
    async (id: string, patch: { day?: number; time?: string; room?: string }) => {
      const d = { ...talkDraft(id), ...patch };
      // Shown in place right away; the database confirms behind.
      setRaw((r) => (r ? { ...r, talks: r.talks.map((t) => (t.id === id ? { ...t, day: d.day, time: d.time, room: d.room } : t)) } : r));
      await saveTalk(d);
    },
    [talkDraft, saveTalk],
  );

  const deleteTalk = useCallback(
    async (id: string) => {
      const t = raw?.talks.find((x) => x.id === id);
      // Gone from the screen at once; back only if the delete fails.
      setRaw((r) => (r ? { ...r, talks: r.talks.filter((x) => x.id !== id) } : r));
      await run("Excluiu a sessão", mlObject(t?.title).pt ?? "", () => rpc("sb_delete_talk", { p_token: token, p_id: id })).catch((e) => {
        void refresh();
        throw e;
      });
    },
    [raw, run, token, refresh],
  );

  const speakerDraft = useCallback(
    (id?: string): SpeakerDraft => {
      const s = raw?.speakers.find((x) => x.id === id);
      if (!s) return { name: "", role: { pt: "", en: "", es: "" }, company: { pt: "", en: "", es: "" }, bio: { pt: "", en: "", es: "" }, photo: "", linkedin: "", featured: false };
      return { id: s.id, name: s.name, role: mlObject(s.role), company: mlObject(s.company), bio: mlObject(s.bio), photo: s.photo ?? "", linkedin: s.linkedin ?? "", featured: s.category === FEATURED, sort: s.sort ?? 0 };
    },
    [raw],
  );

  // The old admin lists speakers by category: "Destaque" joins its list once.
  const ensureFeaturedCategory = useCallback(async () => {
    const cats = raw?.config.categories ?? [];
    if (!token || cats.some((c) => c.id === FEATURED)) return;
    await rpc("sb_save_config", { p_token: token, p_config: { categories: [...cats, { id: FEATURED, name: "Destaque", color: "#c9a24d" }] } });
  }, [raw, token]);
  // The next place at the end of a group (featured or everyone else).
  const nextSort = useCallback(
    (featured: boolean) => Math.max(0, ...(raw?.speakers ?? []).filter((s) => (s.category === FEATURED) === featured).map((s) => s.sort ?? 0)) + 1,
    [raw],
  );

  const saveSpeaker = useCallback(
    async (d: SpeakerDraft, photo?: File | null) => {
      const id = d.id ?? makeId("spk");
      const base = raw?.speakers.find((s) => s.id === d.id);
      await run(d.id ? "Editou o palestrante" : "Criou o palestrante", d.name, async () => {
        const url = photo ? await uploadPhoto(photo) : d.photo;
        if (d.featured) await ensureFeaturedCategory();
        await rpc("sb_upsert_speaker", {
          p_token: token,
          p_s: {
            id,
            name: d.name.trim(),
            role: JSON.stringify(clean(d.role)),
            company: JSON.stringify(clean(d.company)),
            bio: JSON.stringify(clean(d.bio)),
            photo: url,
            linkedin: d.linkedin.trim(),
            category: d.featured ? FEATURED : base?.category && base.category !== FEATURED ? base.category : "speaker",
            // A new headliner goes to the end of the featured list.
            // New, or moved into / out of the featured: to the end of its group.
            sort: !base || d.featured !== (base.category === FEATURED) ? nextSort(d.featured) : (d.sort ?? base.sort ?? 0),
          },
        });
      });
      return id;
    },
    [raw, run, token, ensureFeaturedCategory, nextSort],
  );

  const deleteSpeaker = useCallback(
    async (id: string) => {
      const s = raw?.speakers.find((x) => x.id === id);
      setRaw((r) => (r ? { ...r, speakers: r.speakers.filter((x) => x.id !== id) } : r));
      await run("Excluiu o palestrante", s?.name ?? "", () => rpc("sb_delete_speaker", { p_token: token, p_id: id })).catch((e) => {
        void refresh();
        throw e;
      });
    },
    [raw, run, token, refresh],
  );

  // New order of the featured speakers: each one's position becomes its sort.
  const orderFeatured = useCallback(
    async (ids: string[]) => {
      setRaw((r) => (r ? { ...r, speakers: r.speakers.map((s) => (ids.includes(s.id) ? { ...s, sort: ids.indexOf(s.id) + 1 } : s)) } : r));
      await run("Reordenou os destaques", `${ids.length}`, async () => {
        // All at once, not one after the other.
        await Promise.all(
          ids.map((id, i) => {
            const s = raw?.speakers.find((x) => x.id === id);
            return !s || s.sort === i + 1 ? null : rpc("sb_upsert_speaker", { p_token: token, p_s: { ...s, sort: i + 1 } });
          }),
        );
      });
    },
    [raw, run, token],
  );

  // The event's days, as dates in order; each day's weekday in the three
  // languages and its calendar code come from the date.
  const saveDays = useCallback(
    async (dates: string[]) => {
      const wd = (date: string, loc: string) => {
        const w = new Intl.DateTimeFormat(loc, { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
        return (w.charAt(0).toUpperCase() + w.slice(1)).replace(/-feira$/, "");
      };
      const days = dates.map((date) => ({ date, gcal: date.replace(/-/g, ""), wd: { pt: wd(date, "pt-BR"), en: wd(date, "en"), es: wd(date, "es") } }));
      setRaw((r) => (r ? { ...r, config: { ...r.config, days } } : r));
      await run("Editou os dias", dates.join(", "), () => rpc("sb_save_config", { p_token: token, p_config: { days } }));
    },
    [run, token],
  );

  // Any part of the config (rooms, formats, slots, hubs, notice…), with the
  // keys the database function expects (hubColors, showAllHubsBtn…).
  const saveConfig = useCallback(
    async (patch: Record<string, unknown>, what: string) => {
      await run(what, Object.keys(patch).join(", "), () => rpc("sb_save_config", { p_token: token, p_config: patch }));
    },
    [run, token],
  );

  // A backup (this platform's or the old admin's file) replaces everything:
  // config, speakers, sessions. Removed sessions/speakers are deleted.
  const restore = useCallback(
    async (b: RawAgenda) => {
      await run("Restaurou um backup", `${b.speakers.length} palestrantes, ${b.talks.length} sessões`, async () => {
        const c = b.config;
        await rpc("sb_save_config", {
          p_token: token,
          p_config: { days: c.days, rooms: c.rooms, formats: c.formats, slots: c.slots, categories: c.categories, hubs: c.hubs, hubColors: c.hub_colors, disclaimer: c.disclaimer, showAllHubsBtn: c.show_all_hubs_btn },
        });
        const keepS = new Set(b.speakers.map((x) => x.id));
        const keepT = new Set(b.talks.map((x) => x.id));
        for (const x of raw?.talks ?? []) if (!keepT.has(x.id)) await rpc("sb_delete_talk", { p_token: token, p_id: x.id });
        for (const x of raw?.speakers ?? []) if (!keepS.has(x.id)) await rpc("sb_delete_speaker", { p_token: token, p_id: x.id });
        for (const x of b.speakers) await rpc("sb_upsert_speaker", { p_token: token, p_s: x });
        for (const x of b.talks)
          await rpc("sb_upsert_talk", {
            p_token: token,
            p_t: {
              id: x.id, day: x.day, time: x.time, room: x.room, hub: x.hub ?? "", format: x.format, duration: x.duration,
              speakerIds: x.speaker_ids ?? [], speakerName: x.speaker_name ?? "", speakersPending: !!x.speakers_pending,
              moderatorId: x.moderator_id, langs: x.langs ?? [], title: mlObject(x.title), desc: mlObject(x.descr), locImg: x.loc_img ?? "",
            },
          });
      });
    },
    [raw, run, token],
  );

  // Everything off (sessions, speakers, highlights): master only, checked
  // again by the database.
  const wipe = useCallback(async () => {
    await run("Apagou tudo", "", () => rpc("sb_wipe", { p_token: token }));
  }, [run, token]);

  const data = useMemo(() => (raw ? normalize(raw, lang) : initial), [raw, lang, initial]);
  const value: Store = {
    data,
    raw,
    lang,
    profile,
    editing: !!profile && !!raw,
    busy,
    error,
    login,
    logout,
    saveTalk,
    moveTalk,
    deleteTalk,
    saveSpeaker,
    deleteSpeaker,
    orderFeatured,
    saveDays,
    saveConfig,
    restore,
    wipe,
    talkDraft,
    speakerDraft,
    uploadImage: (file: File) => uploadPhoto(file, "talks"),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export type { SpeakerRow, TalkRow };
