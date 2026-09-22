import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const APP_URL = "https://shraddha.hosla.in";
const ROUTINE_PATH = "/daily-routine";
const OG_IMAGE =
  "https://xnpnkltajezokttrofeh.supabase.co/storage/v1/object/public/project-posters/og%2Froutine-preview.jpg";
const DEFAULT_DURATION = 60;

const DAY_LABEL: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

interface Session {
  id: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  title: string | null;
}

function getISTNow(): { day: number; minutes: number } {
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
  if (hour === 24) hour = 0;
  const minute = parseInt(map.minute ?? "0", 10);
  return { day, minutes: hour * 60 + minute };
}

function timeToMinutes(t: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(":");
  const hh = parseInt(h, 10);
  const mm = parseInt(m ?? "0", 10);
  if (isNaN(hh)) return null;
  return hh * 60 + (isNaN(mm) ? 0 : mm);
}

function formatTime12(t: string | null): string {
  const mins = timeToMinutes(t);
  if (mins == null) return "";
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function sessionWindow(
  s: Session,
  sorted: Session[],
  index: number,
): { start: number; end: number } | null {
  const start = timeToMinutes(s.start_time);
  if (start == null) return null;
  let end = timeToMinutes(s.end_time);
  if (end == null) {
    let nextStart: number | null = null;
    for (let j = index + 1; j < sorted.length; j++) {
      const ns = timeToMinutes(sorted[j].start_time);
      if (ns != null && ns > start) {
        nextStart = ns;
        break;
      }
    }
    end = nextStart != null ? Math.min(nextStart, start + DEFAULT_DURATION) : start + DEFAULT_DURATION;
  }
  return { start, end };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // `format=json` returns the resolved meta tags as JSON (used by the internal
  // preview inspector). It bypasses the human 302 so the tags can be verified.
  const debug = new URL(req.url).searchParams.get("format") === "json";

  // Detect link-preview crawlers/bots. Everyone else (real humans, including
  // in-app browsers like WhatsApp/Instagram that don't run JS) gets a real
  // server-side 302 redirect to the routine page.
  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  const isBot =
    /bot|crawler|spider|facebookexternalhit|whatsapp|telegram|slackbot|discordbot|twitterbot|linkedinbot|embedly|pinterest|vkshare|redditbot|skypeuripreview|googlebot|bingbot|preview|scraper|curl|wget|metainspector|quora|nuzzel|okhttp/i.test(
      ua,
    );

  // Real visitors: server-side 302 straight to the routine page (works even
  // in webviews that don't execute JS or meta-refresh).
  if (!isBot && !debug) {
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: `${APP_URL}${ROUTINE_PATH}`,
        "Cache-Control": "no-store",
      },
    });
  }



  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { day, minutes } = getISTNow();

  const { data } = await supabase
    .from("routine_sessions")
    .select("id, day_of_week, start_time, end_time, title")
    .eq("is_active", true)
    .eq("day_of_week", day);

  const sessions: Session[] = (data ?? []).sort(
    (a, b) => (timeToMinutes(a.start_time) ?? 0) - (timeToMinutes(b.start_time) ?? 0),
  );

  let title = "Daily Routine — Shraddha Welfare Association";
  let description =
    "Join our free daily wellness sessions for elders — yoga, meditation, music and more, streamed live every day.";

  // Find live session(s)
  let live: Session | null = null;
  for (let i = 0; i < sessions.length; i++) {
    const w = sessionWindow(sessions[i], sessions, i);
    if (w && minutes >= w.start && minutes < w.end) {
      live = sessions[i];
      break;
    }
  }

  if (live) {
    const t = live.title || "Session";
    title = `🔴 Live now: ${t}`;
    description = `${t} is happening now (${formatTime12(live.start_time)}${
      live.end_time ? ` – ${formatTime12(live.end_time)}` : ""
    } IST). Tap to join instantly.`;
  } else {
    // Next upcoming session today
    const next = sessions.find((s) => {
      const st = timeToMinutes(s.start_time);
      return st != null && st > minutes;
    });
    if (next) {
      const t = next.title || "Session";
      title = `Up next: ${t} · ${formatTime12(next.start_time)}`;
      description = `${t} starts at ${formatTime12(next.start_time)} IST today (${DAY_LABEL[day]}). Tap to view the full daily routine and join.`;
    } else {
      title = "Daily Routine — Shraddha Welfare Association";
      description = `No more sessions today (${DAY_LABEL[day]}). Tap to view the full weekly routine and upcoming activities.`;
    }
  }

  const canonical = `${APP_URL}${ROUTINE_PATH}`;

  if (debug) {
    return new Response(
      JSON.stringify({
        canonical,
        ogTitle: title,
        ogDescription: description,
        ogImage: OG_IMAGE,
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: OG_IMAGE,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);

  // Bots get the OG tags; humans are redirected to the app.
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDesc}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${OG_IMAGE}" />
<meta property="og:image:width" content="1216" />
<meta property="og:image:height" content="640" />
<meta property="og:image:alt" content="Shraddha Daily Routine — free live wellness sessions for elders" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${OG_IMAGE}" />
<meta http-equiv="refresh" content="0; url=${canonical}" />
<script>window.location.replace(${JSON.stringify(canonical)});</script>
</head>
<body>
<p>Redirecting to the daily routine… <a href="${canonical}">Continue</a></p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
});
