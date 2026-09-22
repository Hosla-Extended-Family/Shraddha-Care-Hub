/**
 * Helpers for building link-preview edge-function URLs.
 *
 * Each URL carries a versioned `v` cache-busting parameter so WhatsApp /
 * Facebook / X treat the link as new whenever the underlying content changes,
 * forcing them to re-scrape fresh OpenGraph data instead of showing a stale
 * cached preview.
 */

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/** Version token derived from a resource's `updated_at` timestamp. */
export function versionFromTimestamp(updatedAt?: string | null): string {
  const t = updatedAt ? new Date(updatedAt).getTime() : NaN;
  return Number.isFinite(t) ? String(t) : String(Date.now());
}

/** IST date token (YYYYMMDD) — routine content changes day to day. */
export function routineVersion(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts.replace(/-/g, "");
}

/** Shareable event preview URL (crawlers get OG tags, humans get redirected). */
export function eventPreviewUrl(slug: string, updatedAt?: string | null): string {
  return `${FUNCTIONS_BASE}/event-preview?slug=${encodeURIComponent(slug)}&v=${versionFromTimestamp(updatedAt)}`;
}

/** Shareable blog preview URL — crawlers get OG tags (including cover image). */
export function blogPreviewUrl(slugOrId: string, updatedAt?: string | null): string {
  return `${FUNCTIONS_BASE}/blog-preview?slug=${encodeURIComponent(slugOrId)}&v=${versionFromTimestamp(updatedAt)}`;
}

/** Shareable routine preview URL. */
export function routinePreviewUrl(): string {
  return `${FUNCTIONS_BASE}/routine-preview?v=${routineVersion()}`;
}

/** JSON debug endpoints used by the internal preview inspector. */
export function eventPreviewJsonUrl(slug: string): string {
  return `${FUNCTIONS_BASE}/event-preview?slug=${encodeURIComponent(slug)}&format=json`;
}

export function routinePreviewJsonUrl(): string {
  return `${FUNCTIONS_BASE}/routine-preview?format=json`;
}
