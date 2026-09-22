// Emergency admin recovery: with the main-admin console passphrase, set an account's
// password and grant it admin / main_admin. Used when nobody can sign in to /admin.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { serviceClient, json, makeMembershipId, verifyConsolePassphrase } from "../_shared/admin.ts";

const attempts = new Map<string, { count: number; until: number }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const gate = attempts.get(ip);
    if (gate && gate.until > Date.now()) {
      return json({ error: "Too many attempts. Please wait a few minutes." }, 429, H);
    }

    const body = await req.json().catch(() => ({}));
    const passphrase = String(body.passphrase ?? "").trim();
    const phoneDigits = String(body.phone ?? body.phone_number ?? "").replace(/\D/g, "");
    const newPassword = String(body.password ?? body.new_password ?? body.newPassword ?? "");
    const makeMain = body.make_main_admin !== false;

    const svcCheck = serviceClient();
    if (!(await verifyConsolePassphrase(svcCheck, passphrase))) {
      const next = { count: (gate?.count ?? 0) + 1, until: 0 };
      if (next.count >= 5) { next.until = Date.now() + 5 * 60_000; next.count = 0; }
      attempts.set(ip, next);
      return json({ error: "Wrong passphrase." }, 403, H);
    }
    attempts.delete(ip);

    if (phoneDigits.length < 10) return json({ error: "Enter the full phone number." }, 400, H);
    if (newPassword.length < 8) return json({ error: "Password must be at least 8 characters." }, 400, H);

    const svc = svcCheck;
    const last10 = phoneDigits.slice(-10);

    const { data: profiles, error: pErr } = await svc
      .from("profiles")
      .select("user_id, full_name, phone_e164, membership_id, status")
      .not("phone_e164", "is", null);
    if (pErr) return json({ error: pErr.message }, 500, H);

    const profile = (profiles ?? []).find(
      (p) => (p.phone_e164 ?? "").replace(/\D/g, "").slice(-10) === last10,
    );
    if (!profile) return json({ error: "No account found with that phone number." }, 404, H);

    // Set the password on the auth account.
    const { error: upErr } = await svc.auth.admin.updateUserById(profile.user_id, {
      password: newPassword,
    });
    if (upErr) return json({ error: upErr.message }, 500, H);

    // Make sure the account is approved and has a membership ID to sign in with.
    let membershipId = profile.membership_id;
    if (!membershipId) {
      membershipId = makeMembershipId(profile.full_name ?? "USER", last10);
      const { data: clash } = await svc
        .from("profiles").select("user_id").eq("membership_id", membershipId).maybeSingle();
      if (clash && clash.user_id !== profile.user_id) {
        membershipId = `${membershipId.slice(0, 3)}X${membershipId.slice(4)}`;
      }
    }
    await svc.from("profiles").update({
      membership_id: membershipId,
      status: "approved",
      must_change_password: false,
    }).eq("user_id", profile.user_id);

    const roles = makeMain ? ["admin", "main_admin"] : ["admin"];
    for (const role of roles) {
      await svc.from("user_roles").insert({ user_id: profile.user_id, role }).select();
    }

    await svc.from("membership_audit_log").insert({
      actor_id: profile.user_id,
      actor_name: profile.full_name,
      action: "admin_bootstrap",
      entity: "profiles",
      entity_id: profile.user_id,
      details: { membership_id: membershipId, roles, via: "passphrase" },
      ip,
    });

    return json({
      ok: true,
      full_name: profile.full_name,
      membership_id: membershipId,
      roles,
    }, 200, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
