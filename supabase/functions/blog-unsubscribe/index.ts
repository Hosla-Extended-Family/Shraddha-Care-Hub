import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://shraddha.hosla.in";

function page(heading: string, body: string, accent = "#0a7e5f") {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${heading}</title>
  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;background:#f6f7f5;color:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;max-width:520px;width:100%;padding:40px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.04)}
    h1{color:${accent};margin:0 0 12px;font-size:26px}
    p{color:#444;line-height:1.6;margin:8px 0}
    a.btn{display:inline-block;margin-top:20px;background:${accent};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600}
  </style></head><body><div class="card"><h1>${heading}</h1>${body}<a class="btn" href="${SITE_URL}/blog">Back to Blogs</a></div></body></html>`;
}

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const html = (s: string) => new Response(s, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  if (!token) return html(page("Invalid link", "<p>The unsubscribe link is missing a token.</p>", "#b91c1c"));

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: sub } = await service
    .from("blog_subscribers")
    .select("id, email")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!sub) return html(page("Already unsubscribed", "<p>This link is not recognized. You are likely already unsubscribed.</p>"));

  await service.from("blog_subscribers").delete().eq("id", sub.id);
  return html(page("You've been unsubscribed", `<p>We've removed <strong>${sub.email}</strong> from the blog notification list.</p><p>You can resubscribe anytime from our Blogs page.</p>`));
});
