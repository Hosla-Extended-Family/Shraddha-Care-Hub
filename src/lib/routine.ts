import type { Database } from "@/integrations/supabase/types";

export type RoutineSession = Database["public"]["Tables"]["routine_sessions"]["Row"];

/** Display order: Monday-first week. Each entry maps to JS day index (0=Sun..6=Sat). */
export const WEEK_DAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 0, label: "Sunday", short: "Sun" },
];

export const DAY_LABEL: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

/** Current day + minutes-since-midnight in India Standard Time (Asia/Kolkata). */
export function getISTNow(): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  const weekdayIndex: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const day = weekdayIndex[map.weekday] ?? new Date().getDay();
  let hour = parseInt(map.hour ?? "0", 10);
  if (hour === 24) hour = 0; // some engines emit 24 for midnight
  const minute = parseInt(map.minute ?? "0", 10);
  return { day, minutes: hour * 60 + minute };
}

/** "HH:MM:SS" or "HH:MM" -> minutes since midnight */
export function timeToMinutes(t: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(":");
  const hh = parseInt(h, 10);
  const mm = parseInt(m ?? "0", 10);
  if (isNaN(hh)) return null;
  return hh * 60 + (isNaN(mm) ? 0 : mm);
}

/** "HH:MM:SS" -> "5:15 PM" */
export function formatTime12(t: string | null): string {
  const mins = timeToMinutes(t);
  if (mins == null) return "";
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Default window (minutes) for a session without an explicit end time. */
const DEFAULT_DURATION = 60;

/**
 * Determine which session (if any) is live right now, given the sessions for
 * the current IST day (must be sorted ascending by start_time).
 * A session is live from its start until its end_time, or until the next
 * session begins (capped at DEFAULT_DURATION).
 */
export function getLiveSessionId(
  sessions: RoutineSession[],
  nowMinutes: number,
): string | null {
  const sorted = [...sessions].sort(
    (a, b) => (timeToMinutes(a.start_time) ?? 0) - (timeToMinutes(b.start_time) ?? 0),
  );
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const start = timeToMinutes(s.start_time);
    if (start == null) continue;
    let end = timeToMinutes(s.end_time);
    if (end == null) {
      const nextStart = i + 1 < sorted.length ? timeToMinutes(sorted[i + 1].start_time) : null;
      end = nextStart != null ? Math.min(nextStart, start + DEFAULT_DURATION) : start + DEFAULT_DURATION;
    }
    if (nowMinutes >= start && nowMinutes < end) return s.id;
  }
  return null;
}

export function hasJoinLink(s: RoutineSession): boolean {
  return Boolean(s.facebook_url || s.youtube_url || s.meet_url);
}
