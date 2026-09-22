// Sends membership fee reminders by email + in-app notification, and logs them.
// Actions:
//   (none)   -> send now to body.user_ids with optional body.message
//   schedule -> queue a reminder for later (scheduled_for)
//   run_due  -> process any queued reminders whose time has passed
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { serviceClient, getCaller, json, audit, clientIp } from "../_shared/admin.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Hosla <noreply@hosla.in>";
const SITE_URL = "https://shraddha.hosla.in";

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return { ok: false, reason: "no_key" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  return { ok: res.ok, reason: res.ok ? "" : await res.text() };
}

function fillTemplate(tpl: string, m: Record<string, unknown>) {
  const until = m.paid_up_until
    ? new Date(String(m.paid_up_until)).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  return tpl
    .replaceAll("{name}", String(m.full_name ?? "friend"))
    .replaceAll("{membership_id}", String(m.membership_id ?? "—"))
    .replaceAll("{amount}", String(m.monthly_fee_amount ?? 0))
    .replaceAll("{paid_up_until}", until);
}

// deno-lint-ignore no-explicit-any
async function sendBatch(svc: any, userIds: string[], message: string | null, sentBy: string | null) {
  const { data: members } = await svc.from("profiles")
    .select("user_id, full_name, membership_id, email, monthly_fee_amount, paid_up_until")
    .in("user_id", userIds);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await svc.from("fee_reminders")
    .select("member_user_id").in("member_user_id", userIds).gte("sent_at", since);
  const already = new Set((recent ?? []).map((r: { member_user_id: string }) => r.member_user_id));

  let sent = 0, skipped = 0;
  for (const m of members ?? []) {
    if (already.has(m.user_id)) { skipped++; continue; }

    const until = m.paid_up_until
      ? new Date(m.paid_up_until).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : null;
    const text = message
      ? fillTemplate(message, m)
      : `Namaste ${m.full_name ?? "friend"}, your Hosla membership ${until ? `was paid up to ${until}` : "fee is due"}. `
        + `Monthly fee: \u20b9${m.monthly_fee_amount ?? 0}. You can pay online from your profile, or hand cash to any Hosla team member.`;

    if (m.email) {
      await sendEmail(m.email, "Your Hosla membership fee", `
        <div style="font-family:system-ui,sans-serif;font-size:17px;line-height:1.6;color:#111">
          <p>${text}</p>
          <p><a href="${SITE_URL}/profile" style="background:#0a7c53;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;display:inline-block">Open my profile</a></p>
          <p style="color:#555;font-size:15px">Membership ID: <strong>${m.membership_id ?? "\u2014"}</strong><br/>\u2014 Team Hosla</p>
        </div>`);
    }

    await svc.from("author_notifications").insert({
      user_id: m.user_id,
      type: "fee_reminder",
      blog_title: "Membership fee reminder",
      comment_body: text,
    });

    await svc.from("fee_reminders").insert({
      member_user_id: m.user_id,
      membership_id: m.membership_id,
      channel: m.email ? "email+app" : "app",
      message: text,
      sent_by: sentBy,
    });
    sent++;
  }
  return { sent, skipped };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller || !caller.isAnyAdmin) return json({ error: "Not authorised" }, 403, H);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "send");
    const message = body.message ? String(body.message) : null;

    // ---- Process queued reminders that are due -----------------------------
    if (action === "run_due") {
      const { data: due } = await svc.from("scheduled_reminders")
        .select("*").eq("status", "pending").lte("scheduled_for", new Date().toISOString())
        .order("scheduled_for");
      let batches = 0, sent = 0;
      for (const row of due ?? []) {
        const res = await sendBatch(svc, row.user_ids ?? [], row.message ?? null, row.created_by ?? caller.userId);
        await svc.from("scheduled_reminders").update({
          status: "sent",
          sent_count: res.sent,
          skipped_count: res.skipped,
          processed_at: new Date().toISOString(),
        }).eq("id", row.id);
        batches++; sent += res.sent;
      }
      if (batches) await audit(svc, caller, "run_scheduled_reminders", "scheduled_reminders", null, { batches, sent }, clientIp(req));
      return json({ batches, sent }, 200, H);
    }

    const userIds: string[] = Array.isArray(body.user_ids) ? body.user_ids.map(String) : [];
    if (!userIds.length) return json({ error: "Pick at least one member" }, 400, H);

    // ---- Queue for later ---------------------------------------------------
    if (action === "schedule") {
      const when = String(body.scheduled_for ?? "");
      if (!when || Number.isNaN(Date.parse(when))) return json({ error: "Pick a valid date and time" }, 400, H);
      const { data: row, error } = await svc.from("scheduled_reminders").insert({
        user_ids: userIds,
        message,
        scheduled_for: new Date(when).toISOString(),
        created_by: caller.userId,
      }).select("id").maybeSingle();
      if (error) return json({ error: error.message }, 400, H);
      await audit(svc, caller, "schedule_fee_reminders", "scheduled_reminders", row?.id ?? null,
        { count: userIds.length, scheduled_for: when }, clientIp(req));
      return json({ scheduled: userIds.length, id: row?.id }, 200, H);
    }

    // ---- Send now ----------------------------------------------------------
    const res = await sendBatch(svc, userIds, message, caller.userId);
    await audit(svc, caller, "send_fee_reminders", "fee_reminders", null, res, clientIp(req));
    return json(res, 200, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
