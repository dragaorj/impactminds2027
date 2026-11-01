// The visitor's cookie choice (LGPD). Necessary storage is always on; anything
// optional (analytics) must check analyticsAllowed() and listen for
// "im:consent" before it loads.

const KEY = "im-consent";
const VERSION = 1;

export type Consent = { analytics: boolean; at: string; v: number };

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Consent;
    return c.v === VERSION ? c : null;
  } catch {
    return null;
  }
}

export function saveConsent(analytics: boolean) {
  const c: Consent = { analytics, at: new Date().toISOString(), v: VERSION };
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {}
  window.dispatchEvent(new CustomEvent("im:consent", { detail: c }));
}

export const analyticsAllowed = () => readConsent()?.analytics === true;

// Opens the banner again (footer and privacy page "Cookie preferences").
export const openConsent = () => window.dispatchEvent(new Event("im:consent-open"));
