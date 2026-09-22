// Admin authentication + admin account management.
// Admin accounts are completely separate from member accounts: they sign in with
// a username + password (no Membership ID, no phone). The main admin owns a
// dedicated "console" account used only on the hidden main-admin route.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { serviceClient, getCaller, json, audit, clientIp, SUPABASE_URL, ANON_KEY } from "../_shared/admin.ts";

const STAFF_ROLES = ["admin"];
const ALL_ROLES = ["admin", "main_admin"];

const attempts = new Map<string, { count: number; until: number }>();

const normUser = (v: unknown) => String(v ?? "").trim().toLowerCase();
const adminEmail = (username: string) => `admin.${username}@shraddha.local`;
const validUsername = (u: string) => /^[a-z0-9._-]{3,32}$/.test(u);

async function findAdmin(svc: ReturnType<typeof serviceClient>, username: string) {
  const { data } = await svc
    .from("profiles")
    .select("user_id, full_name, admin_username, is_console_admin")
    .ilike("admin_username", username)
    .maybeSingle();
  return data;
}

async function rolesOf(svc: ReturnType<typeof serviceClient>, userId: string) {
  const { data } = await svc.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: { role: string }) => r.role);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "login");

    /* ---------------------------- sign in ---------------------------- */
    if (action === "login") {
      const username = normUser(body.username);
      const password = String(body.password ?? "");
      const wantsConsole = Boolean(body.console);
      if (!username || !password) return json({ error: "Enter your username and password." }, 400, H);

      const gate = attempts.get(username);
      if (gate && gate.until > Date.now()) {
        return json({ error: "Too many attempts. Please wait a minute." }, 429, H);
      }
      const fail = () => {
        const next = { count: (gate?.count ?? 0) + 1, until: 0 };
        if (next.count >= 6) { next.until = Date.now() + 60_000; next.count = 0; }
        attempts.set(username, next);
        return json({ error: "Wrong username or password." }, 400, H);
      };

      const admin = await findAdmin(svc, username);
      if (!admin) return fail();

      const roles = await rolesOf(svc, admin.user_id);
      if (!roles.some((r) => ALL_ROLES.includes(r))) return fail();
      if (wantsConsole && !roles.includes("main_admin")) {
        return json({ error: "This console is only for the main admin." }, 403, H);
      }

      const { data: userRes } = await svc.auth.admin.getUserById(admin.user_id);
      const email = userRes?.user?.email;
      if (!email) return fail();

      const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({ email, password });
      if (signInError || !signIn.session) return fail();
      attempts.delete(username);

      return json({
        session: signIn.session,
        full_name: admin.full_name,
        username: admin.admin_username,
        roles,
      }, 200, H);
    }

    /* --------------------- management (main admin) -------------------- */
    const caller = await getCaller(req, svc);
    if (!caller) return json({ error: "Please sign in first." }, 401, H);
    if (!caller.isMainAdmin) return json({ error: "Only the main admin can manage admin accounts." }, 403, H);
    const ip = clientIp(req);

    if (action === "list") {
      const { data: rows } = await svc
        .from("profiles")
        .select("user_id, full_name, admin_username, is_console_admin, created_at")
        .not("admin_username", "is", null)
        .order("created_at", { ascending: true });
      const { data: roleRows } = await svc.from("user_roles").select("user_id, role").in("role", ALL_ROLES);
      const admins = (rows ?? []).map((r: any) => ({
        ...r,
        roles: (roleRows ?? []).filter((x: any) => x.user_id === r.user_id).map((x: any) => x.role),
      }));
      return json({ admins }, 200, H);
    }

    if (action === "create") {
      const username = normUser(body.username);
      const password = String(body.password ?? "");
      const fullName = String(body.full_name ?? "").trim();
      const role = String(body.role ?? "admin");
      if (!validUsername(username)) return json({ error: "Username: 3-32 characters, letters/numbers/._- only." }, 400, H);
      if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400, H);
      if (!fullName) return json({ error: "Enter the person's name." }, 400, H);
      if (!STAFF_ROLES.includes(role) && role !== "main_admin") return json({ error: "Unknown role." }, 400, H);
      if (await findAdmin(svc, username)) return json({ error: "That username is already taken." }, 400, H);

      const { data: created, error: createErr } = await svc.auth.admin.createUser({
        email: adminEmail(username),
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createErr || !created.user) return json({ error: createErr?.message ?? "Could not create the account." }, 400, H);

      const uid = created.user.id;
      await svc.from("profiles").update({
        admin_username: username,
        full_name: fullName,
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: caller.userId,
        is_console_admin: role === "main_admin" ? Boolean(body.console_only) : false,
        must_change_password: Boolean(body.must_change_password ?? true),
      }).eq("user_id", uid);
      await svc.from("user_roles").insert({ user_id: uid, role }).select();

      await audit(svc, caller, "admin_account_created", "admin", uid, { username, role }, ip);
      return json({ ok: true, user_id: uid }, 200, H);
    }

    const targetId = String(body.user_id ?? "");
    if (!targetId) return json({ error: "Pick an admin account first." }, 400, H);
    const { data: target } = await svc
      .from("profiles").select("user_id, admin_username, full_name, is_console_admin")
      .eq("user_id", targetId).maybeSingle();
    if (!target?.admin_username) return json({ error: "That is not an admin account." }, 400, H);

    if (action === "set_password") {
      const password = String(body.password ?? "");
      if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400, H);
      const { error } = await svc.auth.admin.updateUserById(targetId, { password });
      if (error) return json({ error: error.message }, 400, H);
      await svc.from("profiles").update({ must_change_password: Boolean(body.must_change_password ?? false) }).eq("user_id", targetId);
      await audit(svc, caller, "admin_password_reset", "admin", targetId, { username: target.admin_username }, ip);
      return json({ ok: true }, 200, H);
    }

    if (action === "set_username") {
      const username = normUser(body.username);
      if (!validUsername(username)) return json({ error: "Username: 3-32 characters, letters/numbers/._- only." }, 400, H);
      const existing = await findAdmin(svc, username);
      if (existing && existing.user_id !== targetId) return json({ error: "That username is already taken." }, 400, H);
      const { error: emailErr } = await svc.auth.admin.updateUserById(targetId, { email: adminEmail(username), email_confirm: true });
      if (emailErr) return json({ error: emailErr.message }, 400, H);
      await svc.from("profiles").update({ admin_username: username }).eq("user_id", targetId);
      await audit(svc, caller, "admin_username_changed", "admin", targetId, { from: target.admin_username, to: username }, ip);
      return json({ ok: true }, 200, H);
    }

    if (action === "set_role") {
      const role = String(body.role ?? "");
      if (!ALL_ROLES.includes(role)) return json({ error: "Unknown role." }, 400, H);
      const currentRoles = await rolesOf(svc, targetId);
      if (currentRoles.includes("main_admin") && role !== "main_admin") {
        const { count } = await svc.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "main_admin");
        if ((count ?? 0) <= 1) return json({ error: "There must always be one main admin." }, 400, H);
      }
      await svc.from("user_roles").delete().eq("user_id", targetId).in("role", ALL_ROLES);
      await svc.from("user_roles").insert({ user_id: targetId, role });
      await audit(svc, caller, "admin_role_changed", "admin", targetId, { username: target.admin_username, role }, ip);
      return json({ ok: true }, 200, H);
    }

    if (action === "delete") {
      if (targetId === caller.userId) return json({ error: "You cannot delete your own account." }, 400, H);
      const currentRoles = await rolesOf(svc, targetId);
      if (currentRoles.includes("main_admin")) {
        const { count } = await svc.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "main_admin");
        if ((count ?? 0) <= 1) return json({ error: "There must always be one main admin." }, 400, H);
      }
      await svc.from("user_roles").delete().eq("user_id", targetId);
      await svc.from("profiles").delete().eq("user_id", targetId);
      await svc.auth.admin.deleteUser(targetId);
      await audit(svc, caller, "admin_account_deleted", "admin", targetId, { username: target.admin_username }, ip);
      return json({ ok: true }, 200, H);
    }

    return json({ error: "Unknown action." }, 400, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
