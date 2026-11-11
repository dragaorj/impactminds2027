"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Key, SignOut } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { useAgenda } from "./store";
import { ProfileSheet } from "./Team";

// The person signed in: their photo (initials when there is none).
function Face({ size }: { size: number }) {
  const { profile } = useAgenda();
  if (!profile) return null;
  const initials = `${profile.first?.[0] ?? ""}${profile.last?.[0] ?? ""}`.toUpperCase() || "·";
  return (
    <span className="relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand font-semibold text-brand-ink" style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>
      {profile.photo ? <Image src={profile.photo} alt="" fill sizes={`${size * 2}px`} className="object-cover" /> : initials}
    </span>
  );
}

// The team's door: "Sign in" leads to the sign-in page (/{lang}/agenda/entrar);
// once signed in, the person's photo and "Edit mode" (opens "My profile":
// photo, Sign out) and Sign out. compact: the icon-and-label form of the
// phone tab bar.
export default function Account({ t, compact = false, loginHref }: { t: Dict["agendaApp"]; compact?: boolean; loginHref: string }) {
  const { profile, logout } = useAgenda();
  const [open, setOpen] = useState(false);
  // Older links (?entrar=1) go to the sign-in page.
  useEffect(() => {
    if (!compact && new URLSearchParams(location.search).get("entrar") === "1") location.replace(loginHref);
  }, [compact, loginHref]);

  if (compact) {
    return profile ? (
      <>
        <button type="button" onClick={() => setOpen(true)} title={t.myProfile} className="flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium text-muted">
          <Face size={28} />
          {t.editMode}
        </button>
        <ProfileSheet open={open} onClose={() => setOpen(false)} t={t} />
      </>
    ) : (
      <a href={loginHref} rel="nofollow" className="flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium text-muted">
        <Key size={24} />
        {t.login}
      </a>
    );
  }

  return profile ? (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t.myProfile}
        className="flex h-10 items-center gap-2 rounded-full bg-surface pl-1 pr-3.5 text-sm font-medium shadow-[var(--shadow-card)] ring-1 ring-line transition-colors hover:bg-[#fbfafc]"
      >
        <Face size={32} />
        {t.editMode}
      </button>
      <button
        type="button"
        onClick={logout}
        aria-label={t.signOut}
        title={t.signOut}
        className="flex h-10 items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm font-medium text-ink-2 shadow-[var(--shadow-card)] ring-1 ring-line transition-colors hover:bg-[#fdecec] hover:text-[#b42318]"
      >
        <SignOut size={16} />
        {t.signOut}
      </button>
      <ProfileSheet open={open} onClose={() => setOpen(false)} t={t} />
    </span>
  ) : (
    <a
      href={loginHref}
      rel="nofollow"
      className="flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm font-medium text-ink shadow-[var(--shadow-card)] ring-1 ring-line transition-colors hover:bg-[#fbfafc]"
    >
      <Key size={16} />
      {t.login}
    </a>
  );
}
