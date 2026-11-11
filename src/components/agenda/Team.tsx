"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowClockwise, Camera, Copy, Eye, EyeSlash, Plus, ShieldCheck, SignOut, Sparkle, Trash, UsersThree } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { useAgenda, type LogRow, type Member, type MemberDraft, type Online } from "./store";
import { Avatar, Button, Field, Segmented, Sheet, card, fieldBox } from "./ui";

type T = Dict["agendaApp"];

// The team (who can sign in and edit) and the log of every change: in the
// platform itself, master only (the database checks it again).
export default function TeamSheet({ open, onClose, t, lang }: { open: boolean; onClose: () => void; t: T; lang: string }) {
  const [tab, setTab] = useState<"team" | "logs">("team");
  return (
    <Sheet open={open} onClose={onClose} label={t.advanced} closeLabel={t.close}>
      <div className="px-5 pb-8 sm:px-7">
        <h2 className="text-[22px] font-semibold tracking-tight">{t.advanced}</h2>
        <Segmented
          className="mt-4 w-full"
          label={t.advanced}
          value={tab}
          onChange={setTab}
          options={[
            { value: "team", label: t.team },
            { value: "logs", label: t.logs },
          ]}
        />
        {open && (tab === "team" ? <TeamPanel t={t} lang={lang} /> : <LogsPanel t={t} lang={lang} />)}
      </div>
    </Sheet>
  );
}

const fullName = (m: { first?: string; last?: string }) => `${m.first ?? ""} ${m.last ?? ""}`.trim();

function when(iso: string, lang: string) {
  const d = new Date(iso);
  const loc = lang === "en" ? "en-GB" : lang === "es" ? "es-CO" : "pt-BR";
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString(loc, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ------------------------------------------------------------------- team

function TeamPanel({ t, lang }: { t: T; lang: string }) {
  const { team, profile } = useAgenda();
  const [list, setList] = useState<Member[] | null>(null);
  const [online, setOnline] = useState<Online[]>([]);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState<Member | "new" | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [l, o] = await Promise.all([team.list(), team.online().catch(() => [])]);
      setList(l);
      setOnline(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [team]);
  useEffect(() => {
    void load();
    const id = setInterval(() => void team.online().then(setOnline).catch(() => {}), 30000);
    return () => clearInterval(id);
  }, [load, team]);

  const isOnline = (id: string) => online.some((o) => o.id === id);

  return (
    <div className="mt-6">
      <p className="text-[15px] leading-relaxed text-ink-2">{t.teamLead}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button kind="primary" onClick={() => setEdit("new")}>
          <Plus size={17} weight="bold" /> {t.addMember}
        </Button>
        <Button kind="quiet" onClick={() => void load()} aria-label={t.refresh}>
          <ArrowClockwise size={17} /> {t.refresh}
        </Button>
      </div>

      {online.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
          <span className="relative mr-1 inline-flex size-2">
            <span className="absolute size-2 animate-ping rounded-full bg-[#34c759]/60" />
            <span className="size-2 rounded-full bg-[#34c759]" />
          </span>
          {t.onlineNow}:
          {online.map((o) => (
            <span key={o.id} className="inline-flex items-center gap-1.5 rounded-full bg-surface py-1 pl-1 pr-2.5 ring-1 ring-line">
              <Avatar name={fullName(o)} photo={o.photo || undefined} size={20} />
              {fullName(o)}
            </span>
          ))}
        </div>
      )}

      {error && <p className="mt-4 rounded-[14px] bg-[#fdecec] px-4 py-3 text-sm text-[#b42318]">{error}</p>}

      <ul className={`${card} mt-5 overflow-hidden ${error && !list?.length ? "hidden" : ""}`}>
        {list === null && <li className="px-4 py-6 text-center text-[15px] text-muted">…</li>}
        {list?.map((m, i) => (
          <li key={m.id} className={i ? "border-t border-line" : ""}>
            <button type="button" onClick={() => setEdit(m)} className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-[rgb(118_118_128/0.06)]">
              <span className="relative shrink-0">
                <Avatar name={fullName(m) || "?"} photo={m.photo || undefined} size={44} />
                {isOnline(m.id) && <span className="absolute bottom-0 right-0 size-3 rounded-full bg-[#34c759] ring-2 ring-surface" aria-label={t.onlineNow} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-semibold">{fullName(m) || "—"}</span>
                  {m.id === profile?.id && <span className="shrink-0 text-[13px] text-muted">({t.you})</span>}
                </span>
                <span className="block truncate text-[13px] text-muted">
                  {m.email || m.phone || (m.last_seen ? `${t.lastSeen} ${when(m.last_seen, lang)}` : t.never)}
                </span>
              </span>
              <span
                className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold ${m.role === "master" ? "bg-brand-soft text-brand" : "bg-[rgb(118_118_128/0.1)] text-ink-2"}`}
              >
                {m.role === "master" && <ShieldCheck size={13} weight="fill" />}
                {m.role === "master" ? t.roleMaster : t.roleEditor}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <MemberForm
        member={edit}
        others={(list ?? []).filter((m) => edit === "new" || m.id !== (edit as Member | null)?.id)}
        onClose={() => setEdit(null)}
        onSaved={() => (setEdit(null), void load())}
        t={t}
      />
    </div>
  );
}

const newPassword = () => {
  const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const a = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(a, (n) => abc[n % abc.length]).join("");
};

function MemberForm({ member, others, onClose, onSaved, t }: { member: Member | "new" | null; others: Member[]; onClose: () => void; onSaved: () => void; t: T }) {
  const { team, profile } = useAgenda();
  const blank: MemberDraft = { first: "", last: "", email: "", phone: "", photo: "", token: "", role: "editor" };
  const [d, setD] = useState<MemberDraft>(blank);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);

  // A fresh form each time it opens (a new person gets a password ready).
  const key = member === "new" ? "new" : (member?.id ?? "");
  useEffect(() => {
    if (!member) return;
    const m = member === "new" ? { ...blank, token: newPassword() } : { id: member.id, first: member.first, last: member.last, email: member.email, phone: member.phone, photo: member.photo, token: member.token, role: member.role };
    setD(m);
    setFile(null);
    setPreview("");
    setShow(member === "new");
    setErr("");
    setCopied(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const locked = d.id === "master"; // The main master stays master.
  const set = <K extends keyof MemberDraft>(k: K, v: MemberDraft[K]) => setD((x) => ({ ...x, [k]: v }));

  const save = async () => {
    const pw = d.token.trim();
    if (!d.first.trim()) return setErr(t.requiredName);
    if (pw.length < 6) return setErr(t.passwordShort);
    if (others.some((m) => m.token === pw)) return setErr(t.passwordTaken);
    setBusy(true);
    setErr("");
    try {
      await team.save({ ...d, role: locked ? "master" : d.role }, file);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!d.id || locked || d.id === profile?.id || !confirm(t.confirmDelMember)) return;
    setBusy(true);
    try {
      await team.remove(d.id);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(d.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const photo = preview || d.photo;
  const name = `${d.first} ${d.last}`.trim();
  return (
    <Sheet
      open={!!member}
      onClose={onClose}
      label={member === "new" ? t.addMember : t.editMember}
      closeLabel={t.close}
      centered
      footer={
        <div className="flex items-center gap-2">
          {d.id && !locked && d.id !== profile?.id && (
            <Button kind="danger" onClick={remove} disabled={busy} aria-label={t.del}>
              <Trash size={17} />
            </Button>
          )}
          <span className="flex-1" />
          <Button onClick={onClose}>{t.cancel}</Button>
          <Button kind="primary" onClick={save} disabled={busy}>
            {busy ? t.saving : t.save}
          </Button>
        </div>
      }
    >
      <div className="px-5 pb-6 sm:px-7">
        <h2 className="text-[22px] font-semibold tracking-tight">{member === "new" ? t.addMember : t.editMember}</h2>

        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="relative size-20 shrink-0 overflow-hidden rounded-full bg-brand-soft ring-1 ring-line transition-transform active:scale-[0.97]"
            aria-label={photo ? t.changePhoto : t.addPhoto}
          >
            {photo ? (
              <Image src={photo} alt="" fill sizes="80px" className="object-cover" unoptimized={!!preview} />
            ) : name ? (
              <span className="grid size-full place-items-center">
                <Avatar name={name} size={80} />
              </span>
            ) : (
              <span className="grid size-full place-items-center text-brand">
                <Camera size={26} />
              </span>
            )}
          </button>
          <Button kind="quiet" onClick={() => input.current?.click()}>
            <Camera size={17} /> {photo ? t.changePhoto : t.addPhoto}
          </Button>
          <input
            ref={input}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f);
                setPreview(URL.createObjectURL(f));
              }
              e.target.value = "";
            }}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label={t.fFirst}>
            <input value={d.first} onChange={(e) => set("first", e.target.value)} className={`${fieldBox} h-12`} autoComplete="off" />
          </Field>
          <Field label={t.fLast}>
            <input value={d.last} onChange={(e) => set("last", e.target.value)} className={`${fieldBox} h-12`} autoComplete="off" />
          </Field>
          <Field label={t.fEmail}>
            <input type="email" value={d.email} onChange={(e) => set("email", e.target.value)} className={`${fieldBox} h-12`} autoComplete="off" />
          </Field>
          <Field label={t.fPhone}>
            <input type="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} className={`${fieldBox} h-12`} autoComplete="off" />
          </Field>
        </div>

        <div className="mt-4">
          <Field label={t.fPassword} hint={t.fPasswordHint}>
            <span className="relative block">
              <input
                type={show ? "text" : "password"}
                value={d.token}
                onChange={(e) => set("token", e.target.value)}
                className={`${fieldBox} h-12 pr-32 font-mono tracking-wide`}
                autoComplete="new-password"
                spellCheck={false}
              />
              <span className="absolute inset-y-0 right-1.5 flex items-center gap-0.5">
                <IconBtn label={show ? t.hidePassword : t.showPassword} onClick={() => setShow((v) => !v)}>
                  {show ? <EyeSlash size={18} /> : <Eye size={18} />}
                </IconBtn>
                <IconBtn label={copied ? t.copied : t.copyPassword} onClick={copy}>
                  <Copy size={18} weight={copied ? "fill" : "regular"} />
                </IconBtn>
                <IconBtn label={t.genPassword} onClick={() => (set("token", newPassword()), setShow(true))}>
                  <Sparkle size={18} />
                </IconBtn>
              </span>
            </span>
          </Field>
        </div>

        <div className="mt-5">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{t.roleLabel}</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["editor", "master"] as const).map((r) => (
              <button
                key={r}
                type="button"
                disabled={locked}
                onClick={() => set("role", r)}
                aria-pressed={d.role === r}
                className={`rounded-[16px] p-3.5 text-left ring-1 transition-[box-shadow,background-color] disabled:cursor-not-allowed ${d.role === r ? "bg-brand-soft ring-2 ring-brand/40" : "bg-surface ring-line hover:bg-[#fbfafc]"}`}
              >
                <span className="flex items-center gap-1.5 text-[15px] font-semibold">
                  {r === "master" ? <ShieldCheck size={16} weight="fill" className="text-brand" /> : <UsersThree size={16} className="text-ink-2" />}
                  {r === "master" ? t.roleMaster : t.roleEditor}
                </span>
                <span className="mt-1 block text-[13px] leading-snug text-muted">{r === "master" ? t.roleMasterHint : t.roleEditorHint}</span>
              </button>
            ))}
          </div>
          {locked && <p className="mt-2 text-[13px] text-muted">{t.masterLocked}</p>}
        </div>

        {err && <p className="mt-4 rounded-[14px] bg-[#fdecec] px-4 py-3 text-sm text-[#b42318]">{err}</p>}
      </div>
    </Sheet>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-[rgb(118_118_128/0.12)] hover:text-ink">
      {children}
    </button>
  );
}

// ------------------------------------------------------------------- logs

function LogsPanel({ t, lang }: { t: T; lang: string }) {
  const { team } = useAgenda();
  const [rows, setRows] = useState<LogRow[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setRows(await team.logs());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [team]);
  useEffect(() => void load(), [load]);

  const clear = async () => {
    if (!confirm(t.confirmClearLogs)) return;
    try {
      await team.clearLogs();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const s = q.trim().toLowerCase();
  const shown = (rows ?? []).filter((r) => !s || `${r.who} ${r.action} ${r.detail}`.toLowerCase().includes(s));

  return (
    <div className="mt-6">
      <p className="text-[15px] leading-relaxed text-ink-2">{t.logsLead}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className={`${fieldBox} h-11 min-w-0 flex-1 rounded-full`} />
        <Button kind="quiet" onClick={() => void load()} aria-label={t.refresh}>
          <ArrowClockwise size={17} />
        </Button>
        {!!rows?.length && (
          <Button kind="danger" onClick={clear}>
            <Trash size={17} /> {t.clearLogs}
          </Button>
        )}
      </div>
      {error && <p className="mt-4 rounded-[14px] bg-[#fdecec] px-4 py-3 text-sm text-[#b42318]">{error}</p>}
      {rows && !shown.length ? (
        <p className="mt-8 text-center text-[15px] text-muted">{rows.length ? t.noResults : t.noLogs}</p>
      ) : (
        <ol className={`${card} mt-4 overflow-hidden ${error && !rows ? "hidden" : ""}`}>
          {rows === null && <li className="px-4 py-6 text-center text-[15px] text-muted">…</li>}
          {shown.map((r, i) => (
            <li key={r.id} className={`flex gap-3 px-4 py-3 ${i ? "border-t border-line" : ""}`}>
              <Avatar name={r.who || "?"} size={32} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[14px] font-semibold">{r.who || "—"}</span>
                  <time dateTime={r.ts} className="shrink-0 text-[12px] tabular-nums text-muted">
                    {when(r.ts, lang)}
                  </time>
                </span>
                <span className="block text-[14px] text-ink-2">
                  {r.action}
                  {r.detail && <span className="text-muted"> · {r.detail}</span>}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// "My profile": who is signed in (photo, name, role) and Sign out. The master
// changes their own photo here too (made light before it is uploaded); the
// team's photos are the master's to change.
export function ProfileSheet({ open, onClose, t }: { open: boolean; onClose: () => void; t: T }) {
  const { profile, team, logout, editing } = useAgenda();
  const [me, setMe] = useState<Member | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const master = profile?.role === "master";
  const online = useOnline(open);

  // The master's own record (with the password the save keeps unchanged).
  useEffect(() => {
    if (!open || !master || !editing) return;
    setErr("");
    team
      .list()
      .then((l) => setMe(l.find((m) => m.id === profile?.id) ?? null))
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, [open, master, editing, team, profile?.id]);
  useEffect(() => {
    if (open) return;
    setFile(null);
    setPreview("");
  }, [open]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  if (!profile) return null;
  const name = `${profile.first ?? ""} ${profile.last ?? ""}`.trim();
  const photo = preview || profile.photo || "";

  const save = async () => {
    if (!me || !file) return;
    setBusy(true);
    setErr("");
    try {
      await team.save({ id: me.id, first: me.first, last: me.last, email: me.email, phone: me.phone, photo: me.photo, token: me.token, role: me.role }, file);
      setFile(null);
      setPreview("");
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={t.myProfile}
      closeLabel={t.close}
      centered
      footer={
        <div className="flex items-center gap-2">
          <Button
            kind="quiet"
            onClick={() => {
              onClose();
              logout();
            }}
          >
            <SignOut size={17} /> {t.signOut}
          </Button>
          <span className="flex-1" />
          {file ? (
            <Button kind="primary" onClick={save} disabled={busy || !me}>
              {busy ? t.saving : t.save}
            </Button>
          ) : (
            <Button onClick={onClose}>{t.close}</Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col items-center px-5 pb-6 pt-2 text-center sm:px-7">
        <h2 className="sr-only">{t.myProfile}</h2>
        <button
          type="button"
          onClick={() => master && input.current?.click()}
          disabled={!master}
          aria-label={photo ? t.changePhoto : t.addPhoto}
          className="group relative size-28 overflow-hidden rounded-full bg-brand-soft ring-1 ring-line transition-transform enabled:active:scale-[0.97]"
        >
          {photo ? (
            <Image src={photo} alt="" fill sizes="112px" className="object-cover" unoptimized={!!preview} />
          ) : (
            <span className="grid size-full place-items-center">
              <Avatar name={name || "?"} size={112} />
            </span>
          )}
          {master && (
            <span className="absolute inset-x-0 bottom-0 grid h-9 place-items-center bg-[rgb(29_20_38/0.55)] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera size={18} />
            </span>
          )}
        </button>
        <p className="mt-4 text-[20px] font-semibold tracking-tight">{name || "—"}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-brand">
          {master && <ShieldCheck size={14} weight="fill" />}
          {master ? t.roleMaster : t.roleEditor}
        </p>
        {master ? (
          <Button kind="quiet" className="mt-3" onClick={() => input.current?.click()}>
            <Camera size={17} /> {photo ? t.changePhoto : t.addPhoto}
          </Button>
        ) : (
          <p className="mt-3 text-[13px] text-muted">{t.photoMasterOnly}</p>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setPreview(URL.createObjectURL(f));
            }
            e.target.value = "";
          }}
        />
        {/* The team signed in right now (phones have no room for it in the top bar). */}
        {online.length > 0 && (
          <div className="mt-6 w-full border-t border-line pt-4 text-left">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink-2">
              <span className="relative inline-flex size-2">
                <span className="absolute size-2 animate-ping rounded-full bg-[#34c759]/60" />
                <span className="size-2 rounded-full bg-[#34c759]" />
              </span>
              {t.onlineNow}
            </p>
            <ul className="mt-2.5 space-y-2">
              {online.map((o) => (
                <li key={o.id} className="flex items-center gap-2.5 text-[15px]">
                  <Avatar name={fullName(o) || "?"} photo={o.photo || undefined} size={28} />
                  <span className="truncate">{fullName(o)}</span>
                  {o.id === profile.id && <span className="text-[13px] text-muted">({t.you})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {err && <p className="mt-4 w-full rounded-[14px] bg-[#fdecec] px-4 py-3 text-sm text-[#b42318]">{err}</p>}
      </div>
    </Sheet>
  );
}

// Who of the team is signed in right now (a beat every 30 s while the
// platform is open; seen in the last 45 s), refreshed every 30 s.
export function useOnline(active = true): Online[] {
  const { team, signedIn } = useAgenda();
  const [list, setList] = useState<Online[]>([]);
  useEffect(() => {
    if (!signedIn || !active) return;
    let alive = true;
    const load = () =>
      team
        .online()
        .then((l) => alive && setList(l))
        .catch(() => {});
    load();
    const id = window.setInterval(load, 30000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [team, signedIn, active]);
  return signedIn ? list : [];
}

// The team online, as small overlapping photos (a green light on each);
// names on hover; "+n" beyond four.
export function OnlineFaces({ people, label }: { people: Online[]; label: string }) {
  if (!people.length) return null;
  const shown = people.slice(0, 4);
  const names = people.map((p) => `${p.first ?? ""} ${p.last ?? ""}`.trim()).join(", ");
  return (
    <span className="flex items-center" title={`${label}: ${names}`} aria-label={`${label}: ${names}`} role="img">
      {shown.map((p, k) => (
        <span key={p.id} className="relative -ml-2 first:ml-0" style={{ zIndex: shown.length - k }}>
          <span className="block rounded-full ring-2 ring-[var(--bg)]">
            <Avatar name={`${p.first ?? ""} ${p.last ?? ""}`.trim() || "?"} photo={p.photo || undefined} size={30} />
          </span>
          <span aria-hidden className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#34c759] ring-2 ring-[var(--bg)]" />
        </span>
      ))}
      {people.length > shown.length && (
        <span className="-ml-2 grid size-[34px] place-items-center rounded-full bg-[rgb(118_118_128/0.16)] text-[11px] font-semibold text-ink-2 ring-2 ring-[var(--bg)]">
          +{people.length - shown.length}
        </span>
      )}
    </span>
  );
}
