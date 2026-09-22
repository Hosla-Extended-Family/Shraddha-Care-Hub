// Starts a Stripe Checkout session for a member's own membership fee.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import Stripe from "npm:stripe@17";
import { serviceClient, getCaller, json } from "../_shared/admin.ts";

const SITE_URL = "https://shraddha.hosla.in";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) return json({ error: "Payments are not configured yet." }, 500, H);

    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller) return json({ error: "Please sign in first." }, 401, H);

    const body = await req.json().catch(() => ({}));
    const months = Math.max(1, Math.min(12, Number(body.months ?? 1)));

    const { data: member } = await svc.from("profiles")
      .select("user_id, full_name, membership_id, monthly_fee_amount, email, paid_up_until")
      .eq("user_id", caller.userId).maybeSingle();
    if (!member?.monthly_fee_amount) {
      return json({ error: "Your monthly fee is not set yet. Please contact the office." }, 400, H);
    }

    const amount = member.monthly_fee_amount * months;
    const stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" });

    const origin = req.headers.get("origin") ?? SITE_URL;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "inr",
          unit_amount: amount * 100,
          product_data: {
            name: `Hosla membership \u2014 ${months} month${months > 1 ? "s" : ""}`,
            description: `Membership ID ${member.membership_id ?? ""}`,
          },
        },
        quantity: 1,
      }],
      customer_email: member.email ?? undefined,
      success_url: `${origin}/profile?payment=success`,
      cancel_url: `${origin}/profile?payment=cancelled`,
      metadata: {
        kind: "membership_fee",
        member_user_id: member.user_id,
        membership_id: member.membership_id ?? "",
        months: String(months),
        monthly_fee_amount: String(member.monthly_fee_amount),
      },
    });

    await svc.from("membership_transactions").insert({
      member_user_id: member.user_id,
      membership_id: member.membership_id,
      amount_inr: amount,
      monthly_fee_amount: member.monthly_fee_amount,
      months_covered: months,
      source: "stripe",
      state: "pending_verification",
      stripe_session_id: session.id,
      note: "Waiting for Stripe confirmation",
    });

    return json({ url: session.url }, 200, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
