import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/lib/i18n";
import { FEATURED, fetchRaw, localPhoto, mlObject, normalize, type AgendaData } from "@/lib/agendaShape";
import type { Speaker } from "@/lib/site";

export type { AgendaData, AgendaDay, AgendaSpeaker, AgendaTalk } from "@/lib/agendaShape";
export { AGENDA_DB } from "@/lib/agendaShape";

// The public pages' data, read on the server. Kept a minute, then refreshed
// in the background: an edit shows on the public pages within about a minute,
// and pages stay instant. (Signed-in editors read the database directly.)
export async function getAgenda(lang: Locale): Promise<AgendaData | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("agenda");
  try {
    return normalize(await fetchRaw(), lang);
  } catch (e) {
    console.error(e);
    return null;
  }
}

// The featured speakers for the home page's carousel, in the order set in
// the agenda (empty when none is featured: the carousel keeps its own list).
export async function getFeaturedSpeakers(): Promise<Speaker[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("agenda");
  try {
    const raw = await fetchRaw();
    const tri = (v: unknown) => {
      const o = mlObject(v);
      const any = o.pt || o.en || o.es || "";
      return { pt: (o.pt || any).trim(), es: (o.es || any).trim(), en: (o.en || any).trim() };
    };
    return raw.speakers
      .filter((s) => s.category === FEATURED && s.name?.trim())
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((s) => ({ name: s.name.trim(), role: tri(s.role), org: tri(s.company), photo: localPhoto(s.photo) || undefined, bio: tri(s.bio) }));
  } catch (e) {
    console.error(e);
    return [];
  }
}
