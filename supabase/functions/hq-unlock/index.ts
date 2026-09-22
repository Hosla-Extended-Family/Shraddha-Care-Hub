// Unlocks the hidden main-admin console. Requires BOTH the main_admin role
// and the shared console passphrase (never shipped to the browser).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { serviceClient, getCaller, json, audit, clientIp, verifyConsolePassphrase } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller) return json({ error: "Please sign in first." }, 401, H);
    if (!caller.isMainAdmin) return json({ error: "This console is not available for your account." }, 403, H);

    const body = await req.json().catch(() => ({}));
    const given = String(body.passphrase ?? "");

    if (!(await verifyConsolePassphrase(svc, given))) {
      await audit(svc, caller, "hq_unlock_failed", "console", null, {}, clientIp(req));
      return json({ error: "Wrong passphrase." }, 400, H);
    }

    await audit(svc, caller, "hq_unlock", "console", null, {}, clientIp(req));
    return json({ ok: true, expires_at: Date.now() + 30 * 60 * 1000 }, 200, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
