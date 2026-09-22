import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://shraddha.hosla.in";

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const redirect = (status: string, email = "") => {
    const target = new URL(`${SITE_URL}/blog/subscribed`);
    target.searchParams.set("status", status);
    if (email) target.searchParams.set("email", email);
    return new Response(null, { status: 302, headers: { Location: target.toString() } });
  };

  if (!token) return redirect("invalid");

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: sub } = await service
    .from("blog_subscribers")
    .select("id, email, verified")
    .eq("verify_token", token)
    .maybeSingle();

  if (!sub) return redirect("invalid");

  if (!sub.verified) {
    await service
      .from("blog_subscribers")
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq("id", sub.id);
    return redirect("verified", sub.email);
  }
  return redirect("already", sub.email);
});
