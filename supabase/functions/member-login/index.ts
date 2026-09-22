// Signs a member in with their Membership ID + password.
// The membership ID is resolved to the account's internal auth email server-side,
// so no phone number or email is ever exposed to the browser.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { serviceClient, json, SUPABASE_URL, ANON_KEY } from "../_shared/admin.ts";

const attempts = new Map<string, { count: number; until: number }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const body = await req.json().catch(() => ({}));
    const membershipId = String(body.membership_id ?? "").trim().toUpperCase();
    const password = String(body.password ?? "");
    if (!/^[A-Z]{4}\d{4}$/.test(membershipId)) {
      return json({ error: "Membership ID looks like ABCD1234 — please check it." }, 400, H);
    }
    if (password.length < 4) return json({ error: "Enter your password." }, 400, H);

    const gate = attempts.get(membershipId);
    if (gate && gate.until > Date.now()) {
      return json({ error: "Too many attempts. Please wait a minute and try again." }, 429, H);
    }

    const svc = serviceClient();
    const { data: profile } = await svc
      .from("profiles")
      .select("user_id, full_name, status, must_change_password")
      .eq("membership_id", membershipId)
      .maybeSingle();

    if (!profile) return json({ error: "No account with that Membership ID." }, 400, H);

    const { data: userRes } = await svc.auth.admin.getUserById(profile.user_id);
    const email = userRes?.user?.email;
    if (!email) return json({ error: "This account has no sign-in set up yet. Please contact the office." }, 400, H);

    const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({ email, password });

    if (signInError || !signIn.session) {
      const next = { count: (gate?.count ?? 0) + 1, until: 0 };
      if (next.count >= 5) { next.until = Date.now() + 60_000; next.count = 0; }
      attempts.set(membershipId, next);
      return json({ error: "Wrong Membership ID or password." }, 400, H);
    }
    attempts.delete(membershipId);

    if (profile.status === "rejected") {
      return json({ error: "This account is not active. Please contact the office." }, 403, H);
    }

    return json({
      session: signIn.session,
      full_name: profile.full_name,
      must_change_password: profile.must_change_password,
    }, 200, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
