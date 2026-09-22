import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google Sheet that the team maintains ("Hosla Active Members").
const SPREADSHEET_ID = "1OeHRRTQw-oosoRJKxWgUOs4Kb4DcQy8cjFT0-oLOz_o";
const RANGE = "Sheet1!A1:B2000";
const GATEWAY_URL = "https://connector-gateway.auth.dev/google_sheets/v4";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Last 10 digits — tolerant of +91, spaces, dashes, leading zeros. */
function normalizePhone(raw: string) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authKey = Deno.env.get("auth_API_KEY");
    const sheetsKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Backend is not configured" }, 500);
    if (!authKey || !sheetsKey) return json({ error: "Google Sheets is not connected yet." }, 500);

    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Not authenticated" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Not authenticated" }, 401);

    const { data: isAdmin, error: adminError } = await userClient.rpc("is_admin");
    if (adminError || !isAdmin) return json({ error: "Admin access required" }, 403);

    const res = await fetch(`${GATEWAY_URL}/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}`, {
      headers: {
        Authorization: `Bearer ${authKey}`,
        "X-Connection-Api-Key": sheetsKey,
      },
    });
    if (!res.ok) {
      const details = await res.text();
      console.error(`Sheets request failed [${res.status}]: ${details}`);
      return json({ error: "Could not read the members sheet", status: res.status, details }, res.status);
    }

    const sheet = await res.json();
    const rows: string[][] = Array.isArray(sheet?.values) ? sheet.values : [];

    // Skip the header row if present.
    const dataRows = rows.filter((r, i) => {
      if (i === 0 && /name/i.test(String(r?.[0] ?? "")) && /phone/i.test(String(r?.[1] ?? ""))) return false;
      return true;
    });

    const seen = new Set<string>();
    const members: { name: string; phone_digits: string; raw_phone: string; synced_at: string }[] = [];
    let skipped = 0;
    const now = new Date().toISOString();

    for (const row of dataRows) {
      const name = String(row?.[0] ?? "").trim();
      const rawPhone = String(row?.[1] ?? "").trim();
      const phone = normalizePhone(rawPhone);
      if (!phone) {
        if (name || rawPhone) skipped += 1;
        continue;
      }
      if (seen.has(phone)) continue;
      seen.add(phone);
      members.push({ name: name || "Member", phone_digits: phone, raw_phone: rawPhone, synced_at: now });
    }

    const service = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (members.length > 0) {
      for (let i = 0; i < members.length; i += 500) {
        const { error } = await service
          .from("active_members")
          .upsert(members.slice(i, i + 500), { onConflict: "phone_digits" });
        if (error) throw error;
      }
      // Anyone no longer in the sheet is no longer an active member.
      const { error: delError } = await service
        .from("active_members")
        .delete()
        .not("phone_digits", "in", `(${[...seen].map((p) => `"${p}"`).join(",")})`);
      if (delError) throw delError;
    }

    const { count } = await service
      .from("active_members")
      .select("id", { count: "exact", head: true });

    return json({ synced: members.length, skipped, total: count ?? members.length, syncedAt: now });
  } catch (err) {
    console.error("sync-active-members failed:", err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
