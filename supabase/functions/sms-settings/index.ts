// Admin-managed receipt-SMS settings: tracker copy numbers and on/off switch.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { serviceClient, getCaller, json, audit, clientIp } from "../_shared/admin.ts";
import { COPY_NUMBERS_KEY, COPY_ENABLED_KEY, tenDigits } from "../_shared/sms.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller || !caller.isAnyAdmin) return json({ error: "Not authorised" }, 403, H);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "get");

    if (action === "get") {
      const { data } = await svc.from("app_settings").select("key, value")
        .in("key", [COPY_NUMBERS_KEY, COPY_ENABLED_KEY]);
      const map = new Map((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
      return json({
        numbers: (map.get(COPY_NUMBERS_KEY) ?? "").split(/[,\s]+/).filter(Boolean),
        enabled: (map.get(COPY_ENABLED_KEY) ?? "true") !== "false",
        configured: Boolean(Deno.env.get("FAST2SMS_API_KEY") && Deno.env.get("FAST2SMS_RECEIPT_MESSAGE_ID")),
      }, 200, H);
    }

    if (action === "save") {
      if (!caller.isMainAdmin) return json({ error: "Only the main admin can change this." }, 403, H);
      const raw: string[] = Array.isArray(body.numbers) ? body.numbers.map(String) : [];
      const numbers = [...new Set(raw.map(tenDigits).filter((n): n is string => !!n))];
      const enabled = body.enabled === false ? "false" : "true";
      const now = new Date().toISOString();
      const { error } = await svc.from("app_settings").upsert([
        { key: COPY_NUMBERS_KEY, value: numbers.join(","), updated_at: now, updated_by: caller.userId },
        { key: COPY_ENABLED_KEY, value: enabled, updated_at: now, updated_by: caller.userId },
      ], { onConflict: "key" });
      if (error) return json({ error: error.message }, 400, H);
      await audit(svc, caller, "update_sms_copy_numbers", "app_settings", COPY_NUMBERS_KEY,
        { numbers, enabled }, clientIp(req));
      return json({ ok: true, numbers, enabled: enabled === "true" }, 200, H);
    }




    return json({ error: "Unknown action" }, 400, H);

  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
