import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@18.5.0";
import { z } from "npm:zod@3.23.8";

const BodySchema = z.object({
  registrationId: z.string().uuid(),
  returnUrl: z.string().url().max(500),
});

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
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { registrationId, returnUrl } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: reg, error: regError } = await supabase
      .from("event_registrations")
      .select("id, full_name, email, mobile, event_id, payment_status, is_member")
      .eq("id", registrationId)
      .maybeSingle();

    if (regError) throw regError;
    if (!reg) return json({ error: "Registration not found." }, 404);
    if (reg.payment_status === "paid") return json({ alreadyPaid: true });

    const { data: event, error: eventError } = await supabase
      .from("registration_events")
      .select("id, title, slug, is_paid, price_inr, members_free")
      .eq("id", reg.event_id!)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) return json({ error: "Event not found." }, 404);
    if (!event.is_paid || !event.price_inr || event.price_inr <= 0) {
      return json({ error: "This event does not require payment." }, 400);
    }
    if (event.members_free && reg.is_member) {
      return json({ error: "Hosla members attend this event free of charge." }, 400);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const base = returnUrl.split("?")[0];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: reg.email ?? undefined,
      client_reference_id: reg.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "inr",
            unit_amount: event.price_inr * 100,
            product_data: {
              name: `${event.title} — Registration`,
              description: `Non-member registration for ${reg.full_name}`,
            },
          },
        },
      ],
      metadata: { registration_id: reg.id, event_id: event.id },
      success_url: `${base}?payment=success&reg=${reg.id}`,
      cancel_url: `${base}?payment=cancelled&reg=${reg.id}`,
    });

    await supabase
      .from("event_registrations")
      .update({
        stripe_session_id: session.id,
        payment_status: "pending",
        amount_inr: event.price_inr,
      })
      .eq("id", reg.id);

    return json({ url: session.url });
  } catch (err) {
    console.error("create-event-checkout failed:", err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
