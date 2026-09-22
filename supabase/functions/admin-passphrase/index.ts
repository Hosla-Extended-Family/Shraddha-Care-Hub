// Lets a signed-in main admin change the console passphrase after re-confirming
// their own account password. The new passphrase is stored hashed in app_settings.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  serviceClient, getCaller, json, audit, clientIp,
  verifyConsolePassphrase, setConsolePassphrase, SUPABASE_URL, ANON_KEY,
} from "../_shared/admin.ts";

const attempts = new Map<string, { count: number; until: number }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller) return json({ error: "Please sign in first." }, 401, H);
    if (!caller.isMainAdmin) return json({ error: "Main admin only." }, 403, H);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "update");

    if (action === "status") {
      const { data } = await svc
        .from("app_settings")
        .select("updated_at").eq("key", "main_admin_console_passphrase_hash").maybeSingle();
      return json({ ok: true, updated_at: data?.updated_at ?? null }, 200, H);
    }

    const gate = attempts.get(caller.userId);
    if (gate && gate.until > Date.now()) {
      return json({ error: "Too many attempts. Please wait a few minutes." }, 429, H);
    }

    const password = String(body.password ?? "");
    const currentPassphrase = String(body.current_passphrase ?? "");
    const newPassphrase = String(body.new_passphrase ?? "").trim();
    const confirm = String(body.confirm_passphrase ?? "").trim();

    if (newPassphrase.length < 10) {
      return json({ error: "New passphrase must be at least 10 characters." }, 400, H);
    }
    if (newPassphrase !== confirm) {
      return json({ error: "The two new passphrases do not match." }, 400, H);
    }

    // 1) Re-confirm identity with the admin's own account password.
    const { data: userRes } = await svc.auth.admin.getUserById(caller.userId);
    const email = userRes?.user?.email;
    if (!email) return json({ error: "This account has no sign-in email." }, 400, H);

    const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({ email, password });
    const badPassword = signInErr || !signIn?.session;

    // 2) Also require the current passphrase.
    const passOk = !badPassword && (await verifyConsolePassphrase(svc, currentPassphrase));

    if (badPassword || !passOk) {
      const next = { count: (gate?.count ?? 0) + 1, until: 0 };
      if (next.count >= 5) { next.until = Date.now() + 5 * 60_000; next.count = 0; }
      attempts.set(caller.userId, next);
      await audit(svc, caller, "console_passphrase_change_failed", "console", null,
        { reason: badPassword ? "password" : "passphrase" }, clientIp(req));
      return json(
        { error: badPassword ? "Your account password is incorrect." : "Current passphrase is incorrect." },
        403, H,
      );
    }
    attempts.delete(caller.userId);

    if (newPassphrase === currentPassphrase) {
      return json({ error: "Please choose a different passphrase." }, 400, H);
    }

    await setConsolePassphrase(svc, newPassphrase, caller.userId);
    await audit(svc, caller, "console_passphrase_changed", "console", null, {}, clientIp(req));

    return json({ ok: true }, 200, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
