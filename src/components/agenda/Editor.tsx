"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Camera, ImageSquare, DotsSixVertical, Key, MagnifyingGlass, Plus, Star, Trash, X } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { useAgenda, type SpeakerDraft, type TalkDraft } from "./store";
import { MAX_PLACE_IMAGES, localPhoto } from "@/lib/agendaShape";
import { LOGO_PATHS, LOGO_VIEWBOX } from "@/components/latimpactoLogo";
import { Avatar, Button, Field, Segmented, Sheet, Switch, TriField, card, dayLabel, fieldBox, norm } from "./ui";

type T = Dict["agendaApp"];

// ------------------------------------------------------------------ login

// The team's sign-in page: only the token field, nothing of the agenda
// behind it. Signed in (or already signed in), it goes to the agenda.
export function LoginPage({ t, lang }: { t: T; lang: string }) {
  const { login, profile } = useAgenda();
  const [token, setToken] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const home = `/${lang}/agenda`;
  useEffect(() => {
    if (profile) location.replace(home);
  }, [profile, home]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(false);
    const ok = await login(token);
    setBusy(false);
    if (!ok) setErr(true);
  };
  return (
    <main id="conteudo" className="grid min-h-[100dvh] place-items-center px-4 py-10">
      <form onSubmit={submit} className={`${card} w-full max-w-[26rem] p-7 sm:p-8`}>
        <a href={`/${lang}`} aria-label={t.backToSite} className="flex items-center gap-2.5 text-ink">
          <svg viewBox={LOGO_VIEWBOX} className="h-[17px] w-auto text-brand" aria-hidden>
            {LOGO_PATHS.map((d, i) => (
              <path key={i} d={d} fill="currentColor" />
            ))}
          </svg>
          <span aria-hidden className="h-4 w-px bg-[rgb(29_20_38/0.14)]" />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">
            Impact Minds <span className="text-gold">2027</span>
          </span>
        </a>
        <span className="mt-8 grid size-14 place-items-center rounded-[18px] bg-brand-soft text-brand">
          <Key size={26} />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{t.loginTitle}</h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{t.loginLead}</p>
        <div className="mt-6">
          <Field label={t.token}>
            <input
              type="password"
              autoComplete="current-password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={`${fieldBox} h-12`}
              aria-invalid={err}
              autoFocus
            />
          </Field>
          {err && <p className="mt-2 text-sm text-[#b42318]">{t.loginError}</p>}
        </div>
        <Button kind="primary" type="submit" disabled={busy || !token.trim()} className="mt-6 w-full">
          {busy ? t.saving : t.login}
        </Button>
        <a href={`/${lang}`} className="mt-4 block text-center text-sm text-muted hover:text-ink">
          {t.backToSite}
        </a>
      </form>
    </main>
  );
}

// ------------------------------------------------------------ session form

export function TalkForm({ id, open, onClose, t, lang }: { id: string | null | undefined; open: boolean; onClose: () => void; t: T; lang: string }) {
  const { talkDraft, saveTalk, deleteTalk, data, raw, busy, uploadImage } = useAgenda();
  const [uploading, setUploading] = useState(false);
  const imgInput = useRef<HTMLInputElement>(null);
  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setErr("");
    try {
      const room = MAX_PLACE_IMAGES - d.images.length;
      const urls: string[] = [];
      for (const file of [...files].slice(0, room)) urls.push(await uploadImage(file));
      setD((x) => ({ ...x, images: [...x.images, ...urls].slice(0, MAX_PLACE_IMAGES) }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };
  const [d, setD] = useState<TalkDraft>(() => talkDraft(id ?? undefined));
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  // A fresh draft each time the form opens.
  useEffect(() => {
    if (open) {
      setD(talkDraft(id ?? undefined));
      setErr("");
      setQ("");
      setMq("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  const set = <K extends keyof TalkDraft>(k: K, v: TalkDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const speakers = data.speakers;
  // The moderator is picked on its own; the old admin also keeps them in the
  // session's speaker list, so they are added there too (and shown apart).
  const chosen = d.speakerIds.filter((sid) => sid !== d.moderatorId).map((sid) => speakers.find((s) => s.id === sid)).filter(Boolean) as typeof speakers;
  const moderator = d.moderatorId ? speakers.find((s) => s.id === d.moderatorId) : undefined;
  const [mq, setMq] = useState("");
  const modFound = mq.trim() ? speakers.filter((s) => s.id !== d.moderatorId && norm(`${s.name} ${s.company}`).includes(norm(mq.trim()))).slice(0, 6) : [];
  const pickModerator = (id: string) => {
    setD((x) => ({ ...x, moderatorId: id, speakerIds: x.speakerIds.includes(id) ? x.speakerIds : [...x.speakerIds, id] }));
    setMq("");
  };
  const dropModerator = () => setD((x) => ({ ...x, speakerIds: x.speakerIds.filter((sid) => sid !== x.moderatorId), moderatorId: null }));
  const found = q.trim() ? speakers.filter((s) => !d.speakerIds.includes(s.id) && norm(`${s.name} ${s.company}`).includes(norm(q.trim()))).slice(0, 6) : [];

  const save = async () => {
    if (!(d.title.pt ?? "").trim()) return setErr(t.required);
    try {
      await saveTalk(d);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };
  const remove = async () => {
    if (!d.id || !confirm(t.confirmDelTalk)) return;
    await deleteTalk(d.id);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={id ? t.edit : t.newSession}
      closeLabel={t.close}
      footer={
        <div className="flex items-center gap-2">
          {d.id && (
            <Button kind="danger" onClick={remove} disabled={busy} aria-label={t.del} className="px-4">
              <Trash size={18} />
            </Button>
          )}
          <span className="flex-1 text-sm text-[#b42318]">{err}</span>
          <Button kind="quiet" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button kind="primary" onClick={save} disabled={busy || uploading}>
            {busy ? t.saving : t.save}
          </Button>
        </div>
      }
    >
      <h2 className="text-2xl font-semibold tracking-tight">{id ? t.edit : t.newSession}</h2>
      <div className="mt-6 space-y-5">
        <TriField label={t.fTitle} value={d.title} onChange={(v) => set("title", v)} langsLabel={t.languages} />

        <div className="grid grid-cols-2 gap-3">
          <Field label={t.day}>
            <select value={d.day} onChange={(e) => set("day", Number(e.target.value))} className={`${fieldBox} h-12`}>
              {data.days.map((x) => (
                <option key={x.index} value={x.index}>
                  {x.date ? `${dayLabel(x.date, lang).weekday}, ${dayLabel(x.date, lang).day}` : `${t.day} ${x.index + 1}`}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.room}>
            <select value={d.room} onChange={(e) => set("room", e.target.value)} className={`${fieldBox} h-12`}>
              {data.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.fStart}>
            <input type="time" step={300} value={d.time} onChange={(e) => set("time", e.target.value)} className={`${fieldBox} h-12 tabular-nums`} />
          </Field>
          <Field label={`${t.fDuration} (${t.minutes})`}>
            <input type="number" min={5} step={5} value={d.duration} onChange={(e) => set("duration", Math.max(5, Number(e.target.value) || 30))} className={`${fieldBox} h-12 tabular-nums`} />
          </Field>
        </div>

        <Field label={t.format}>
          <div className="flex flex-wrap gap-2">
            {data.formats.map((f) => {
              const on = d.format === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => set("format", f.id)}
                  aria-pressed={on}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium ring-1 transition-colors"
                  style={on ? { background: `color-mix(in srgb, ${f.color} 14%, white)`, color: `color-mix(in srgb, ${f.color} 80%, black)`, boxShadow: `inset 0 0 0 1.5px ${f.color}` } : { boxShadow: "inset 0 0 0 1px rgb(29 20 38 / 0.1)" }}
                >
                  <span className="size-2 rounded-full" style={{ background: f.color }} />
                  {f.name}
                </button>
              );
            })}
          </div>
        </Field>

        <TriField label={t.fDesc} value={d.desc} onChange={(v) => set("desc", v)} multiline langsLabel={t.languages} />

        {/* Moderation: one speaker, picked on its own */}
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{t.fModerator}</span>
          {moderator ? (
            <div className="flex items-center gap-3 rounded-[16px] bg-surface px-3 py-2.5 ring-1 ring-line">
              <Avatar name={moderator.name} photo={moderator.photo} size={36} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-medium">{moderator.name}</span>
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">{t.moderator}</span>
                </span>
                <span className="block truncate text-[13px] text-muted">{moderator.company}</span>
              </span>
              <button type="button" onClick={dropModerator} aria-label={t.del} className="grid size-8 place-items-center rounded-full text-muted hover:bg-[rgb(118_118_128/0.1)] hover:text-ink">
                <X size={14} weight="bold" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <MagnifyingGlass size={16} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input value={mq} onChange={(e) => setMq(e.target.value)} placeholder={t.addModerator} className={`${fieldBox} h-12 pl-11`} />
              </div>
              {modFound.length > 0 && (
                <ul className="mt-2 overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow)] ring-1 ring-line">
                  {modFound.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => pickModerator(s.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[rgb(118_118_128/0.06)]">
                        <Avatar name={s.name} photo={s.photo} size={32} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px]">{s.name}</span>
                          <span className="block truncate text-[13px] text-muted">{s.company}</span>
                        </span>
                        <Plus size={16} className="text-brand" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Speakers: chosen list, search to add */}
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{t.fSpeakers}</span>
          {chosen.length > 0 && (
            <ul className="mb-2 divide-y divide-line overflow-hidden rounded-[16px] ring-1 ring-line">
              {chosen.map((s) => (
                <li key={s.id} className="flex items-center gap-3 bg-surface px-3 py-2.5">
                  <Avatar name={s.name} photo={s.photo} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{s.name}</span>
                    <span className="block truncate text-[13px] text-muted">{s.company}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => set("speakerIds", d.speakerIds.filter((x) => x !== s.id))}
                    aria-label={t.del}
                    className="grid size-8 place-items-center rounded-full text-muted hover:bg-[rgb(118_118_128/0.1)] hover:text-ink"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="relative">
            <MagnifyingGlass size={16} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.addSpeaker} className={`${fieldBox} h-12 pl-11`} />
          </div>
          {found.length > 0 && (
            <ul className="mt-2 overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow)] ring-1 ring-line">
              {found.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => (set("speakerIds", [...d.speakerIds, s.id]), setQ(""))}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[rgb(118_118_128/0.06)]"
                  >
                    <Avatar name={s.name} photo={s.photo} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px]">{s.name}</span>
                      <span className="block truncate text-[13px] text-muted">{s.company}</span>
                    </span>
                    <Plus size={16} className="text-brand" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <Switch checked={d.speakersPending} onChange={(v) => set("speakersPending", v)} label={t.fPending} />
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{t.fImages}</span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {d.images.map((src, i) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-[14px] bg-[rgb(118_118_128/0.08)] ring-1 ring-line">
                <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => set("images", d.images.filter((_, j) => j !== i))}
                  aria-label={t.del}
                  className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70"
                >
                  <X size={13} weight="bold" />
                </button>
              </div>
            ))}
            {d.images.length < MAX_PLACE_IMAGES && (
              <button
                type="button"
                onClick={() => imgInput.current?.click()}
                disabled={uploading}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-dashed border-[rgb(118_118_128/0.3)] text-[13px] font-medium text-ink-2 transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-50"
              >
                <ImageSquare size={22} />
                {uploading ? t.saving : t.addImage}
              </button>
            )}
          </div>
          <span className="mt-1 block text-xs text-muted">{t.fImagesHint}</span>
          <input ref={imgInput} type="file" accept="image/*" multiple hidden onChange={(e) => (addImages(e.target.files), (e.target.value = ""))} />
        </div>

        <Field label={t.fLangs}>
          <div className="flex gap-2">
            {(["pt", "es", "en"] as const).map((l) => {
              const on = d.langs.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("langs", on ? d.langs.filter((x) => x !== l) : [...d.langs, l])}
                  className={`h-9 rounded-full px-4 text-sm font-medium transition-colors ${on ? "bg-brand text-brand-ink" : "bg-[rgb(118_118_128/0.1)] text-ink-2"}`}
                >
                  {t.langNames[l]}
                </button>
              );
            })}
          </div>
        </Field>
        {!raw && <p className="text-sm text-muted">…</p>}
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------ speaker form

export function SpeakerForm({ id, open, onClose, t }: { id: string | null | undefined; open: boolean; onClose: () => void; t: T }) {
  const { speakerDraft, saveSpeaker, deleteSpeaker, busy } = useAgenda();
  const [d, setD] = useState<SpeakerDraft>(() => speakerDraft(id ?? undefined));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setD(speakerDraft(id ?? undefined));
      setFile(null);
      setPreview("");
      setErr("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const set = <K extends keyof SpeakerDraft>(k: K, v: SpeakerDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  // Photos the site serves itself are shown from the site (/photos/…).
  const photo = preview || localPhoto(d.photo);

  const save = async () => {
    if (!d.name.trim()) return setErr(t.requiredName);
    try {
      await saveSpeaker(d, file);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };
  const remove = async () => {
    if (!d.id || !confirm(t.confirmDelSpeaker)) return;
    await deleteSpeaker(d.id);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={id ? t.edit : t.newSpeaker}
      closeLabel={t.close}
      footer={
        <div className="flex items-center gap-2">
          {d.id && (
            <Button kind="danger" onClick={remove} disabled={busy} aria-label={t.del} className="px-4">
              <Trash size={18} />
            </Button>
          )}
          <span className="flex-1 text-sm text-[#b42318]">{err}</span>
          <Button kind="quiet" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button kind="primary" onClick={save} disabled={busy}>
            {busy ? t.saving : t.save}
          </Button>
        </div>
      }
    >
      <h2 className="text-2xl font-semibold tracking-tight">{id ? t.edit : t.newSpeaker}</h2>
      <div className="mt-6 space-y-5">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => input.current?.click()} className="group relative shrink-0 rounded-full" aria-label={photo ? t.changePhoto : t.addPhoto}>
            <span className="relative block size-24 overflow-hidden rounded-full bg-brand-soft">
              {photo ? <Image src={photo} alt="" fill sizes="192px" className="object-cover" unoptimized={!!preview} /> : <span className="grid size-full place-items-center text-brand"><Camera size={28} /></span>}
            </span>
            <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-surface text-ink shadow-[var(--shadow)] ring-1 ring-line">
              <Camera size={15} />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <Button onClick={() => input.current?.click()}>{photo ? t.changePhoto : t.addPhoto}</Button>
          </div>
          <input
            ref={input}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFile(f);
              setPreview(URL.createObjectURL(f));
            }}
          />
        </div>

        <Field label={t.fName}>
          <input value={d.name} onChange={(e) => set("name", e.target.value)} className={`${fieldBox} h-12`} />
        </Field>
        <TriField label={t.fRole} value={d.role} onChange={(v) => set("role", v)} langsLabel={t.languages} />
        <TriField label={t.fCompany} value={d.company} onChange={(v) => set("company", v)} langsLabel={t.languages} />
        <Field label={t.fLinkedin}>
          <input value={d.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/…" className={`${fieldBox} h-12`} />
        </Field>
        <div className={`${card} p-4`}>
          <Switch checked={d.featured} onChange={(v) => set("featured", v)} label={t.fFeatured} />
          <p className="mt-1 text-[13px] text-muted">{t.fFeaturedHint}</p>
        </div>
        <TriField label={t.fBio} value={d.bio} onChange={(v) => set("bio", v)} multiline langsLabel={t.languages} />
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------ featured ordering

export function FeaturedOrder({ open, onClose, t }: { open: boolean; onClose: () => void; t: T }) {
  const { data, orderFeatured, busy } = useAgenda();
  const [group, setGroup] = useState<"featured" | "others">("featured");
  const featured = useMemo(() => data.speakers.filter((s) => (group === "featured" ? s.featured : !s.featured)), [data.speakers, group]);
  const [ids, setIds] = useState<string[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  useEffect(() => {
    if (open) setIds(featured.map((s) => s.id));
  }, [open, featured]);
  const move = (from: number, to: number) =>
    setIds((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      return next;
    });
  const save = async () => {
    await orderFeatured(ids);
    onClose();
  };
  return (
    <Sheet
      centered
      open={open}
      onClose={onClose}
      label={t.orderFeatured}
      closeLabel={t.close}
      footer={
        <div className="flex justify-end gap-2">
          <Button kind="quiet" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button kind="primary" onClick={save} disabled={busy}>
            {busy ? t.saving : t.save}
          </Button>
        </div>
      }
    >
      <h2 className="text-2xl font-semibold tracking-tight">{t.orderFeatured}</h2>
      <p className="mt-1.5 text-[15px] text-ink-2">{group === "featured" ? t.orderHint : t.orderHintOthers}</p>
      <Segmented
        label={t.orderFeatured}
        value={group}
        onChange={setGroup}
        className="mt-4"
        options={[
          { value: "featured", label: <><Star size={15} weight="fill" className="text-[#c9a24d]" aria-hidden />{t.featured}</> },
          { value: "others", label: t.others },
        ]}
      />
      <ol className="mt-5 space-y-2">
        {ids.map((id, i) => {
          const s = featured.find((x) => x.id === id);
          if (!s) return null;
          return (
            <li
              key={id}
              draggable
              onDragStart={() => setDragging(id)}
              onDragEnd={() => setDragging(null)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragging && dragging !== id) move(ids.indexOf(dragging), i);
              }}
              className={`${card} flex items-center gap-3 p-2.5 pr-2 ${dragging === id ? "opacity-60" : ""}`}
            >
              <DotsSixVertical size={18} className="shrink-0 cursor-grab text-muted" aria-hidden />
              <span className="w-5 text-center text-[13px] font-semibold tabular-nums text-muted">{i + 1}</span>
              <Avatar name={s.name} photo={s.photo} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{s.name}</span>
                <span className="block truncate text-[13px] text-muted">{s.company}</span>
              </span>
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={t.moveUp} className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-[rgb(118_118_128/0.1)] disabled:opacity-30">
                <ArrowUp size={16} />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === ids.length - 1} aria-label={t.moveDown} className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-[rgb(118_118_128/0.1)] disabled:opacity-30">
                <ArrowDown size={16} />
              </button>
            </li>
          );
        })}
      </ol>
    </Sheet>
  );
}

// ------------------------------------------------------------- event days

// The event's days: change a date, add a day (the day after the last), remove
// a day that has no sessions (sessions point to their day by position).
export function DaysPanel({ t, lang, onDone }: { t: T; lang: string; onDone: () => void }) {
  const { data, saveDays, busy } = useAgenda();
  const [dates, setDates] = useState<string[]>(() => data.days.map((d) => d.date));
  const [msg, setMsg] = useState("");
  const count = (i: number) => data.talks.filter((x) => x.day === i).length;
  const add = () => {
    const last = dates[dates.length - 1];
    const next = last ? new Date(`${last}T12:00:00Z`) : new Date();
    if (last) next.setUTCDate(next.getUTCDate() + 1);
    setDates([...dates, next.toISOString().slice(0, 10)]);
  };
  const remove = (i: number) => {
    if (i < data.days.length && count(i) > 0) return setMsg(t.dayHasSessions);
    if (i < dates.length - 1 && i < data.days.length) return setMsg(t.dayOnlyLast);
    setDates(dates.filter((_, j) => j !== i));
  };
  const save = async () => {
    if (dates.some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d))) return;
    await saveDays(dates);
    onDone();
  };
  return (
    <div>
      <p className="text-[15px] text-ink-2">{t.daysHint}</p>
      <ol className="mt-4 space-y-2">
        {dates.map((d, i) => (
          <li key={i} className={`${card} flex items-center gap-3 p-2.5 pl-4`}>
            <span className="w-14 shrink-0 text-[13px] font-semibold text-muted">
              {t.day} {i + 1}
            </span>
            <input type="date" value={d} onChange={(e) => setDates(dates.map((x, j) => (j === i ? e.target.value : x)))} className={`${fieldBox} h-11 flex-1 tabular-nums`} />
            <span className="hidden w-24 shrink-0 truncate text-[13px] text-muted sm:block">{/^\d{4}-\d{2}-\d{2}$/.test(d) ? dayLabel(d, lang).weekday : ""}</span>
            <span className="w-10 shrink-0 text-right text-[13px] tabular-nums text-muted">{i < data.days.length ? count(i) : 0}</span>
            <button type="button" onClick={() => remove(i)} aria-label={t.del} className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-[#fdecec] hover:text-[#b42318]">
              <Trash size={16} />
            </button>
          </li>
        ))}
      </ol>
      <Button onClick={add} className="mt-3 w-full">
        <Plus size={17} weight="bold" /> {t.addDay}
      </Button>
      <div className="mt-5 flex items-center justify-end gap-3">
        {msg && <span className="flex-1 text-sm text-[#b42318]">{msg}</span>}
        <Button kind="primary" onClick={save} disabled={busy || !dates.length}>
          {busy ? t.saving : t.save}
        </Button>
      </div>
    </div>
  );
}

export { Segmented };
