// One-time setup for the very first main-admin console account.
// Self-disabling: once any main admin exists, this endpoint refuses to run.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { serviceClient, json } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const { count } = await svc
      .from("user_roles").select("id", { count: "exact", head: true }).eq("role", "main_admin");
    const alreadySetUp = (count ?? 0) > 0;

    const body = await req.json().catch(() => ({}));
    if (String(body.action ?? "") === "status") return json({ available: !alreadySetUp }, 200, H);
    if (alreadySetUp) return json({ error: "Setup is already complete. Sign in instead." }, 403, H);

    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.full_name ?? "").trim() || "Main Admin";
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      return json({ error: "Username: 3-32 characters, letters/numbers/._- only." }, 400, H);
    }
    if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400, H);

    const email = `admin.${username}@shraddha.local`;
    const { data: created, error } = await svc.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: fullName },
    });
    if (error || !created.user) return json({ error: error?.message ?? "Could not create the account." }, 400, H);

    const uid = created.user.id;
    await svc.from("profiles").update({
      admin_username: username,
      full_name: fullName,
      status: "approved",
      approved_at: new Date().toISOString(),
      is_console_admin: true,
      must_change_password: false,
    }).eq("user_id", uid);
    await svc.from("user_roles").delete().eq("user_id", uid);
    await svc.from("user_roles").insert({ user_id: uid, role: "main_admin" });
    await svc.from("membership_audit_log").insert({
      actor_id: uid, actor_name: fullName, action: "main_admin_seeded", entity: "admin", entity_id: uid,
      details: { username },
    });

    return json({ ok: true, username }, 200, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
