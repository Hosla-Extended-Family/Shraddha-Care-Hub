import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function syntheticEmail(phoneE164: string) {
  return `writer${phoneE164.replace(/[^0-9]/g, "")}@shraddha.local`;
}

async function findAuthUserByEmail(service: any, email: string) {
  const perPage = 1000;
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = Array.isArray(data?.users) ? data.users : [];
    const found = users.find((u: any) => String(u.email || "").toLowerCase() === email.toLowerCase());
    if (found?.id) return found.id as string;
    if (users.length < perPage) return null;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Backend is not configured" }, 500);

    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Not authenticated" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Not authenticated" }, 401);

    const { data: isAdmin, error: adminError } = await userClient.rpc("is_admin");
    if (adminError || !isAdmin) return json({ error: "Admin access required" }, 403);

    const body = await req.json().catch(() => ({}));
    const requestedUserId = typeof body.userId === "string" ? body.userId : "";
    const phoneE164 = typeof body.phoneE164 === "string" ? body.phoneE164.replace(/[\s-]/g, "") : "";

    if (!requestedUserId && !phoneE164) return json({ error: "User or phone is required" }, 400);

    const service = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let targetUserId = requestedUserId;
    if (!targetUserId && phoneE164) {
      const { data: profile, error: profileError } = await service
        .from("profiles")
        .select("user_id")
        .eq("phone_e164", phoneE164)
        .maybeSingle();
      if (profileError) throw profileError;
      targetUserId = profile?.user_id || "";
    }

    if (!targetUserId && phoneE164) {
      targetUserId = await findAuthUserByEmail(service, syntheticEmail(phoneE164)) || "";
    }

    if (!targetUserId) return json({ error: "No writer account found for this phone" }, 404);
    if (targetUserId === user.id) return json({ error: "You cannot delete your own admin account here" }, 400);

    const { error: deleteError } = await service.auth.admin.deleteUser(targetUserId, false);
    if (deleteError) throw deleteError;

    if (phoneE164) {
      await service.from("profiles").delete().eq("phone_e164", phoneE164);
    }

    return json({ success: true, deletedUserId: targetUserId });
  } catch (error) {
    console.error("delete-writer-account error", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return json({ error: message }, 500);
  }
});