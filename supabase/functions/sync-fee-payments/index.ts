// Re-syncs the confirmed fee ledger into the team Google Sheet on demand.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { serviceClient, getCaller, json, audit, clientIp } from "../_shared/admin.ts";
import { syncTransactionsToSheet } from "../_shared/fee-sheet.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller || !caller.isAnyAdmin) return json({ error: "Not authorised" }, 403, H);

    const result = await syncTransactionsToSheet(svc, null);
    await audit(svc, caller, "sync_fee_sheet", "membership_transactions", null,
      { synced: result.synced, ok: result.ok, error: result.error ?? null }, clientIp(req));

    if (!result.ok) return json({ error: result.error ?? "Sheet sync failed" }, 400, H);
    return json({ ok: true, synced: result.synced }, 200, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
