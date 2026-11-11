"use server";

import { updateTag } from "next/cache";
import { AGENDA_DB, dbHeaders } from "@/lib/agendaShape";

// After every change saved in the agenda (a session, a speaker, the order,
// the notice…), the copy of the agenda the public pages keep is thrown away
// at once: the next visit, a reload, the home carousel all read the database
// again, so what was deleted is gone and what was added is there, everywhere.
// Only a signed-in member of the team can do it (the token is checked).
export async function agendaChanged(token: string): Promise<void> {
  if (!token) return;
  try {
    const res = await fetch(`${AGENDA_DB.url}/rest/v1/rpc/sb_login`, {
      method: "POST",
      headers: { ...dbHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ p_token: token }),
      cache: "no-store",
    });
    const profile = res.ok ? await res.json() : null;
    if (!profile) return;
  } catch {
    return;
  }
  updateTag("agenda");
}
