import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://shraddha.hosla.in";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email } = await req.json().catch(() => ({}));
    const e = (email ?? "").toString().trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 255) {
      return new Response(JSON.stringify({ error: "Please enter a valid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert: if already exists, reuse existing tokens; if verified, we still send a
    // reminder with the unsubscribe link so they know they're subscribed.
    const { data: existing } = await service
      .from("blog_subscribers")
      .select("id, email, verified, verify_token, unsubscribe_token")
      .eq("email", e)
      .maybeSingle();

    let row = existing;
    if (!row) {
      const { data, error } = await service
        .from("blog_subscribers")
        .insert({ email: e })
        .select("id, email, verified, verify_token, unsubscribe_token")
        .single();
      if (error) throw error;
      row = data;
    }

    const projectRef = (Deno.env.get("SUPABASE_URL") || "").match(/https:\/\/([^.]+)\./)?.[1];
    const fnBase = `https://${projectRef}.supabase.co/functions/v1`;
    const verifyUrl = `${fnBase}/blog-verify-subscription?token=${row!.verify_token}`;
    const unsubUrl = `${fnBase}/blog-unsubscribe?token=${row!.unsubscribe_token}`;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const subject = row!.verified
        ? "You're already subscribed to Shraddha Blogs"
        : "Confirm your subscription to Shraddha Blogs";
      const html = row!.verified
        ? `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
             <h2 style="color:#0a7e5f">You're already subscribed 💚</h2>
             <p>Thanks for staying with us. You'll receive an email whenever we publish a new blog.</p>
             <p>Not you, or want to stop? <a href="${unsubUrl}" style="color:#0a7e5f">Unsubscribe here</a>.</p>
             <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
             <p style="font-size:12px;color:#888">Shraddha Welfare Association</p>
           </div>`
        : `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
             <h2 style="color:#0a7e5f">One click to confirm 💚</h2>
             <p>Thanks for subscribing to <strong>Shraddha Blogs</strong>! Please confirm your email so we can send you new blogs as they drop.</p>
             <p style="text-align:center;margin:32px 0">
               <a href="${verifyUrl}" style="background:#0a7e5f;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">Confirm my subscription</a>
             </p>
             <p style="font-size:13px;color:#555">Or paste this link into your browser:<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
             <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
             <p style="font-size:12px;color:#888">Didn't ask for this? Ignore this email or <a href="${unsubUrl}">unsubscribe</a>.</p>
           </div>`;

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
        body: JSON.stringify({
          from: "Shraddha Blogs <notifications@hosla.in>",
          to: [e],
          subject,
          html,
        }),
      });
      if (!emailRes.ok) {
        const t = await emailRes.text();
        console.warn("Resend send failed:", emailRes.status, t);
      }
    } else {
      console.warn("RESEND_API_KEY not set — verification email skipped");
    }

    return new Response(
      JSON.stringify({ success: true, alreadyVerified: !!row!.verified }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("blog-subscribe error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
