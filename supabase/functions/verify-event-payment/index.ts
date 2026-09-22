import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@18.5.0";
import { z } from "npm:zod@3.23.8";

const BodySchema = z.object({ registrationId: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Payments are not configured yet." }, 500);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: reg, error } = await supabase
      .from("event_registrations")
      .select("id, full_name, email, event_id, payment_status, stripe_session_id, amount_inr")
      .eq("id", parsed.data.registrationId)
      .maybeSingle();

    if (error) throw error;
    if (!reg) return json({ error: "Registration not found." }, 404);
    if (reg.payment_status === "paid") return json({ paymentStatus: "paid" });
    if (!reg.stripe_session_id) return json({ paymentStatus: reg.payment_status });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(reg.stripe_session_id);

    if (session.payment_status !== "paid") {
      return json({ paymentStatus: reg.payment_status });
    }

    await supabase
      .from("event_registrations")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        amount_inr: reg.amount_inr ?? Math.round((session.amount_total ?? 0) / 100),
      })
      .eq("id", reg.id);

    // Confirmation email (never blocks the payment result)
    if (reg.email) {
      try {
        await supabase.functions.invoke("send-event-email", {
          body: {
            type: "registration_confirmation",
            registrationId: reg.id,
            eventId: reg.event_id,
            name: reg.full_name,
            email: reg.email,
          },
        });
      } catch (mailErr) {
        console.error("confirmation email failed:", mailErr);
      }
    }

    return json({ paymentStatus: "paid" });
  } catch (err) {
    console.error("verify-event-payment failed:", err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
