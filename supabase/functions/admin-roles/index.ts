// Main-admin only: list admins, search accounts, grant/revoke admin roles.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { serviceClient, getCaller, json, audit, clientIp } from "../_shared/admin.ts";

const MANAGEABLE = ["admin", "team_admin", "main_admin"] as const;
type Manageable = typeof MANAGEABLE[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller) return json({ error: "Not signed in." }, 401, H);
    if (!caller.isMainAdmin) return json({ error: "Only a main admin can manage roles." }, 403, H);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");

    const listAdmins = async () => {
      const { data: roleRows } = await svc
        .from("user_roles").select("user_id, role")
        .in("role", MANAGEABLE as unknown as string[]);
      const ids = [...new Set((roleRows ?? []).map((r) => r.user_id))];
      if (!ids.length) return [];
      const { data: profiles } = await svc
        .from("profiles").select("user_id, full_name, phone_e164, membership_id, status, email")
        .in("user_id", ids);
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roleRows ?? []).filter((r) => r.user_id === p.user_id).map((r) => r.role),
      })).sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
    };

    if (action === "list") {
      return json({ ok: true, admins: await listAdmins() }, 200, H);
    }

    if (action === "search") {
      const q = String(body.q ?? "").trim();
      if (q.length < 2) return json({ ok: true, results: [] }, 200, H);
      const digits = q.replace(/\D/g, "");
      const or = [
        `full_name.ilike.%${q}%`,
        `membership_id.ilike.%${q}%`,
        ...(digits.length >= 4 ? [`phone_e164.ilike.%${digits}%`] : []),
      ].join(",");
      const { data: profiles, error } = await svc
        .from("profiles").select("user_id, full_name, phone_e164, membership_id, status, email")
        .or(or).limit(20);
      if (error) return json({ error: error.message }, 500, H);
      const ids = (profiles ?? []).map((p) => p.user_id);
      const { data: roleRows } = ids.length
        ? await svc.from("user_roles").select("user_id, role").in("user_id", ids)
        : { data: [] as { user_id: string; role: string }[] };
      return json({
        ok: true,
        results: (profiles ?? []).map((p) => ({
          ...p,
          roles: (roleRows ?? []).filter((r) => r.user_id === p.user_id).map((r) => r.role),
        })),
      }, 200, H);
    }

    if (action === "grant" || action === "revoke") {
      const userId = String(body.user_id ?? "");
      const role = String(body.role ?? "") as Manageable;
      if (!userId) return json({ error: "Missing account." }, 400, H);
      if (!MANAGEABLE.includes(role)) return json({ error: "Unsupported role." }, 400, H);

      const { data: target } = await svc
        .from("profiles").select("user_id, full_name, membership_id").eq("user_id", userId).maybeSingle();
      if (!target) return json({ error: "No account found." }, 404, H);

      if (action === "grant") {
        const { data: existing } = await svc
          .from("user_roles").select("id").eq("user_id", userId).eq("role", role).maybeSingle();
        if (!existing) {
          const { error } = await svc.from("user_roles").insert({ user_id: userId, role });
          if (error) return json({ error: error.message }, 500, H);
        }
      } else {
        if (role === "main_admin") {
          if (userId === caller.userId) {
            return json({ error: "You cannot remove your own main admin role." }, 400, H);
          }
          const { count } = await svc
            .from("user_roles").select("*", { count: "exact", head: true }).eq("role", "main_admin");
          if ((count ?? 0) <= 1) return json({ error: "At least one main admin must remain." }, 400, H);
        }
        const { error } = await svc
          .from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) return json({ error: error.message }, 500, H);
      }

      await audit(svc, caller, action === "grant" ? "role_granted" : "role_revoked", "user_roles", userId, {
        role, target_name: target.full_name, target_membership_id: target.membership_id,
      }, clientIp(req));

      return json({ ok: true, admins: await listAdmins() }, 200, H);
    }

    return json({ error: "Unknown action." }, 400, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
