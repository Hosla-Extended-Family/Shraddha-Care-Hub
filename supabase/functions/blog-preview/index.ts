import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const APP_URL = "https://shraddha.hosla.in";
const DEFAULT_OG_IMAGE =
  `${APP_URL}/__l5e/assets-v1/2600e51f-3a67-43d1-8063-1fbad70f6ab4/default-blog-cover.jpg`;

interface BlogRow {
  id: string;
  slug: string | null;
  title: string | null;
  body: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  author_id: string | null;
}

/** Cheap deterministic string hash → short ETag body. */
function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strip markdown-lite / HTML and collapse to a plain-text excerpt. */
function excerpt(body: string, max = 180): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  return plain.slice(0, max - 1).trimEnd() + "…";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug")?.trim() || "";
  const version = url.searchParams.get("v")?.trim() || "";
  const target = slug ? `${APP_URL}/blog/${slug}` : `${APP_URL}/blog`;
  const debug = url.searchParams.get("format") === "json";

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

  let title = "Stories — Shraddha Welfare Association";
  let description =
    "Read stories, reflections and updates from our community — elder care, volunteers and welfare work.";
  let ogImage = DEFAULT_OG_IMAGE;
  let lastModified: string | null = null;
  let etagBasis = `default:${version}`;

  if (slug) {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    // Try slug first, then id (BlogRead accepts either).
    const cols = "id, slug, title, body, cover_image_url, published_at, updated_at, author_id";
    let { data } = await supabase
      .from("blogs")
      .select(cols)
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) {
      const byId = await supabase
        .from("blogs")
        .select(cols)
        .eq("status", "published")
        .eq("id", slug)
        .maybeSingle();
      data = byId.data;
    }

    const blog = data as BlogRow | null;
    if (blog) {
      let authorName = "";
      if (blog.author_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", blog.author_id)
          .maybeSingle();
        if (profile?.full_name) authorName = profile.full_name;
      }
      const baseTitle = blog.title || "Story";
      title = authorName
        ? `${baseTitle} — ${authorName} — Shraddha Welfare Association`
        : `${baseTitle} — Shraddha Welfare Association`;
      if (blog.body) description = excerpt(blog.body) || description;
      if (blog.cover_image_url) ogImage = blog.cover_image_url;
      const stamp = blog.updated_at || blog.published_at;
      if (stamp) {
        const d = new Date(stamp);
        if (!isNaN(d.getTime())) lastModified = d.toUTCString();
      }
      etagBasis = `${blog.id}:${stamp || ""}:${ogImage}:${authorName}`;
    } else {
      etagBasis = `missing:${slug}`;
    }
  }

  const canonical = target;

  // Content is fully addressed by (slug, v, resolved fields) → strong ETag.
  const etag = `"${shortHash(`${slug}|${version}|${debug ? "j" : "h"}|${etagBasis}`)}"`;

  // Versioned URLs (?v=...) point at an immutable snapshot — cache aggressively.
  // Un-versioned URLs may drift as the blog is edited — keep them short-lived
  // with stale-while-revalidate so crawlers still get a fast response while
  // shared cards refresh in the background.
  const cacheControl = version
    ? "public, max-age=86400, s-maxage=604800, immutable"
    : "public, max-age=300, s-maxage=600, stale-while-revalidate=86400";

  const revalidationHeaders: Record<string, string> = {
    ETag: etag,
    "Cache-Control": cacheControl,
    Vary: "User-Agent, Accept",
  };
  if (lastModified) revalidationHeaders["Last-Modified"] = lastModified;

  // Honour conditional GETs from crawlers / CDNs.
  const ifNoneMatch = req.headers.get("if-none-match");
  const ifModifiedSince = req.headers.get("if-modified-since");
  const etagMatches = ifNoneMatch
    ? ifNoneMatch.split(",").some((t) => t.trim() === etag || t.trim() === "*")
    : false;
  const notModifiedByDate =
    lastModified && ifModifiedSince
      ? new Date(ifModifiedSince).getTime() >= new Date(lastModified).getTime()
      : false;
  if (etagMatches || notModifiedByDate) {
    return new Response(null, {
      status: 304,
      headers: { ...corsHeaders, ...revalidationHeaders },
    });
  }

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
          ...revalidationHeaders,
          "Content-Type": "application/json; charset=utf-8",
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
<meta property="og:type" content="article" />
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
      ...revalidationHeaders,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
});
