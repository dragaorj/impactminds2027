"use client";

import { useEffect } from "react";
import { Key, SignOut, UserCircle } from "@phosphor-icons/react";
import type { Dict } from "@/lib/dictionaries/pt";
import { useAgenda } from "./store";

// The team's door: "Sign in" leads to the sign-in page (/{lang}/agenda/entrar);
// once signed in, "Edit mode" and "Sign out". compact: the icon-and-label
// form of the phone tab bar.
export default function Account({ t, compact = false, loginHref }: { t: Dict["agendaApp"]; compact?: boolean; loginHref: string }) {
  const { profile, logout } = useAgenda();
  // Older links (?entrar=1) go to the sign-in page.
  useEffect(() => {
    if (!compact && new URLSearchParams(location.search).get("entrar") === "1") location.replace(loginHref);
  }, [compact, loginHref]);

  const initials = profile ? `${profile.first?.[0] ?? ""}${profile.last?.[0] ?? ""}`.toUpperCase() : "";

  if (compact) {
    return profile ? (
      <button type="button" onClick={() => confirm(`${t.signOut}?`) && logout()} className="flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium text-muted">
        <span className="grid size-7 place-items-center rounded-full bg-brand text-[11px] font-semibold text-brand-ink">{initials || <UserCircle size={18} />}</span>
        {t.editMode}
      </button>
    ) : (
      <a href={loginHref} rel="nofollow" className="flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium text-muted">
        <Key size={24} />
        {t.login}
      </a>
    );
  }

  return profile ? (
    <span className="flex items-center gap-1.5">
      <span className="flex h-10 items-center gap-2 rounded-full bg-surface pl-1 pr-3.5 text-sm font-medium shadow-[var(--shadow-card)] ring-1 ring-line" title={t.editMode}>
        <span className="grid size-8 place-items-center rounded-full bg-brand text-xs font-semibold text-brand-ink">{initials}</span>
        {t.editMode}
      </span>
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
