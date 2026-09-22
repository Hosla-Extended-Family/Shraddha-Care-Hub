import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://shraddha.hosla.in";

function esc(s: string) {
  return (s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const all = body?.all === true;

    // Resolve which writers to send digests for
    let userIds: string[] | null = null;
    if (!all) {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await admin.auth.getUser(token);
      if (!userData?.user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userIds = [userData.user.id];
    }

    let q = admin
      .from("profiles")
      .select("user_id, full_name, digest_email, email_digest_enabled, digest_last_sent_at")
      .eq("email_digest_enabled", true);
    if (userIds) q = q.in("user_id", userIds);
    const { data: profiles, error: pErr } = await q;
    if (pErr) throw pErr;

    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    const skipped: string[] = [];

    for (const p of profiles ?? []) {
      const to = (p as any).digest_email?.trim();
      if (!to) {
        skipped.push("no-email");
        continue;
      }
      const since = (p as any).digest_last_sent_at || new Date(Date.now() - 7 * 864e5).toISOString();
      const { data: notifs } = await admin
        .from("author_notifications")
        .select("type, blog_title, blog_slug, actor_name, comment_body, comment_id, created_at")
        .eq("user_id", (p as any).user_id)
        .is("read_at", null)
        .gt("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!notifs || notifs.length === 0) {
        skipped.push("nothing-new");
        continue;
      }

      const likes = notifs.filter((n: any) => n.type === "like").length;
      const comments = notifs.filter((n: any) => n.type === "comment");

      const rows = notifs
        .map((n: any) => {
          const link = n.blog_slug
            ? `${SITE_URL}/blog/${n.blog_slug}${
                n.type === "comment" && n.comment_id ? `?c=${n.comment_id}#comment-${n.comment_id}` : "?highlight=likes#reader-actions"
              }`
            : `${SITE_URL}/blog`;
          const text =
            n.type === "like"
              ? "Your post got a new like"
              : `&lsquo;${esc((n.comment_body || "").slice(0, 200))}&rsquo; — new comment by ${esc(n.actor_name || "Someone")}`;
          return `<tr><td style="padding:12px 0;border-bottom:1px solid #e5e7eb">
            <div style="font-size:15px;color:#111827">${text}</div>
            <div style="font-size:13px;color:#6b7280;margin-top:4px">on “${esc(n.blog_title || "your blog")}”</div>
            <a href="${link}" style="display:inline-block;margin-top:8px;font-size:13px;color:#0a7a52;font-weight:600">View →</a>
          </td></tr>`;
        })
        .join("");

      const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h1 style="font-size:20px;color:#0a7a52;margin:0 0 4px">Your Shraddha Blogs digest</h1>
        <p style="color:#374151;font-size:15px;margin:0 0 20px">
          Hello ${esc((p as any).full_name || "writer")}, you have ${likes} new like${likes === 1 ? "" : "s"}
          and ${comments.length} new comment${comments.length === 1 ? "" : "s"} on your writing.
        </p>
        <table style="width:100%;border-collapse:collapse">${rows}</table>
        <p style="font-size:12px;color:#6b7280;margin-top:24px">
          You are receiving this because email digests are on in your writer profile.
          <a href="${SITE_URL}/profile" style="color:#0a7a52">Manage notification settings</a>.
        </p>
      </div>`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Shraddha Blogs <onboarding@resend.dev>",
          to: [to],
          subject: `Your blog digest — ${likes} like${likes === 1 ? "" : "s"}, ${comments.length} comment${comments.length === 1 ? "" : "s"}`,
          html,
        }),
      });
      if (!res.ok) {
        console.error("resend error", await res.text());
        continue;
      }
      sent++;
      await admin
        .from("profiles")
        .update({ digest_last_sent_at: new Date().toISOString() })
        .eq("user_id", (p as any).user_id);
    }

    return new Response(JSON.stringify({ sent, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-blog-digest error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
