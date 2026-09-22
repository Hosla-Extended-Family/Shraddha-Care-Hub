import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const APP_URL = "https://shraddha.hosla.in";
const DEFAULT_OG_IMAGE =
  "https://xnpnkltajezokttrofeh.supabase.co/storage/v1/object/public/project-posters/og%2Froutine-preview.jpg";

const DAY_MONTH = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

interface EventRow {
  slug: string;
  title: string | null;
  description: string | null;
  event_date: string | null;
  venue_name: string | null;
  location: string | null;
  banner_url: string | null;
  status: string | null;
  gallery: unknown;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Pull the first usable image URL out of the jsonb gallery column. */
function firstGalleryImage(gallery: unknown): string | null {
  if (!Array.isArray(gallery)) return null;
  for (const item of gallery) {
    if (
      item &&
      typeof item === "object" &&
      (item as { type?: string }).type === "image" &&
      typeof (item as { url?: string }).url === "string" &&
      ((item as { url: string }).url).startsWith("http")
    ) {
      return (item as { url: string }).url;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug")?.trim() || "";
  const target = slug ? `${APP_URL}/register/${slug}` : `${APP_URL}/events`;

  // `format=json` returns the resolved meta tags as JSON (used by the internal
  // preview inspector). It bypasses the human 302 so the tags can be verified.
  const debug = url.searchParams.get("format") === "json";

  // Link-preview crawlers get OG HTML; real humans get a server-side 302 to the
  // clean app page (works even in webviews that don't run JS).
  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  const isBot =
    /bot|crawler|spider|facebookexternalhit|whatsapp|telegram|slackbot|discordbot|twitterbot|linkedinbot|embedly|pinterest|vkshare|redditbot|skypeuripreview|googlebot|bingbot|preview|scraper|curl|wget|metainspector|quora|nuzzel|okhttp/i.test(
      ua,
    );

  if (!isBot && !debug) {
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: target, "Cache-Control": "no-store" },
    });
  }


  let title = "Events — Shraddha Welfare Association";
  let description =
    "Explore our initiatives for elder care and community welfare — health camps, wellness events and more.";
  let ogImage = DEFAULT_OG_IMAGE;

  if (slug) {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data } = await supabase
      .from("registration_events")
      .select("slug, title, description, event_date, venue_name, location, banner_url, status, gallery")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    const event = data as EventRow | null;
    if (event) {
      const t = event.title || "Event";
      const isCompleted = event.status === "completed";
      title = isCompleted ? `${t} — Highlights` : t;

      const parts: string[] = [];
      if (event.event_date) {
        try {
          parts.push(DAY_MONTH.format(new Date(`${event.event_date}T00:00:00Z`)));
        } catch {
          /* ignore bad date */
        }
      }
      const where = event.venue_name || event.location;
      if (where) parts.push(where);

      if (event.description) {
        description = event.description;
      } else if (isCompleted) {
        description = `Relive the moments from ${t}${parts.length ? ` · ${parts.join(" · ")}` : ""}.`;
      } else {
        description = `${parts.length ? `${parts.join(" · ")}. ` : ""}Tap to view details and register.`;
      }

      ogImage = event.banner_url || firstGalleryImage(event.gallery) || DEFAULT_OG_IMAGE;
    }
  }

  const canonical = target;

  if (debug) {
    return new Response(
      JSON.stringify({
        canonical,
        ogTitle: title,
        ogDescription: description,
        ogImage,
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: ogImage,
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
  const safeImage = escapeHtml(ogImage);

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
<meta property="og:image" content="${safeImage}" />
<meta property="og:image:alt" content="${safeTitle}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${safeImage}" />
<meta http-equiv="refresh" content="0; url=${canonical}" />
<script>window.location.replace(${JSON.stringify(canonical)});</script>
</head>
<body>
<p>Redirecting… <a href="${canonical}">Continue</a></p>
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
