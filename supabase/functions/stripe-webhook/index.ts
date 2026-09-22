// Confirms Stripe payments server-side so validity extends even if the
// member closes the browser before the redirect.
import Stripe from "npm:stripe@17";
import { serviceClient, extendPaidUntil } from "../_shared/admin.ts";
import { sendPaymentReceiptSms } from "../_shared/sms.ts";
import { syncTransactionsToSheet } from "../_shared/fee-sheet.ts";

Deno.serve(async (req) => {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!key) return new Response("stripe not configured", { status: 500 });

  const stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" });
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    if (secret) {
      const sig = req.headers.get("stripe-signature") ?? "";
      event = await stripe.webhooks.constructEventAsync(raw, sig, secret);
    } else {
      event = JSON.parse(raw) as Stripe.Event;
    }
  } catch (e) {
    return new Response(`signature error: ${(e as Error).message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("ignored", { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const svc = serviceClient();
  const meta = session.metadata ?? {};

  try {
    if (meta.kind === "membership_fee" && meta.member_user_id) {
      const months = Number(meta.months ?? 1);
      const { data: member } = await svc.from("profiles")
        .select("paid_up_until, full_name, phone_e164, membership_id").eq("user_id", meta.member_user_id).maybeSingle();
      const periodEnd = extendPaidUntil(member?.paid_up_until ?? null, months);

      let receiptUrl: string | null = null;
      if (session.payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(String(session.payment_intent), { expand: ["latest_charge"] });
        const charge = pi.latest_charge as Stripe.Charge | null;
        receiptUrl = charge?.receipt_url ?? null;
      }

      const { data: existing } = await svc.from("membership_transactions")
        .select("id").eq("stripe_session_id", session.id).maybeSingle();

      const amountInr = Math.round((session.amount_total ?? 0) / 100);
      let txId: string | null = existing?.id ?? null;

      if (existing) {
        await svc.from("membership_transactions").update({
          state: "success", period_end: periodEnd, receipt_url: receiptUrl,
          approved_at: new Date().toISOString(), note: null,
        }).eq("id", existing.id);
      } else {
        const { data: inserted } = await svc.from("membership_transactions").insert({
          member_user_id: meta.member_user_id,
          membership_id: meta.membership_id || null,
          amount_inr: amountInr,
          monthly_fee_amount: meta.monthly_fee_amount ? Number(meta.monthly_fee_amount) : null,
          months_covered: months,
          period_end: periodEnd,
          source: "stripe",
          state: "success",
          stripe_session_id: session.id,
          receipt_url: receiptUrl,
          approved_at: new Date().toISOString(),
        }).select("id").maybeSingle();
        txId = inserted?.id ?? null;
      }

      await svc.from("profiles").update({ paid_up_until: periodEnd, member_status: "active" })
        .eq("user_id", meta.member_user_id);

      await svc.from("author_notifications").insert({
        user_id: meta.member_user_id,
        type: "fee_receipt",
        blog_title: "Membership payment received",
        comment_body: `Thank you! Your membership is now paid up to ${periodEnd}.`,
      });

      await sendPaymentReceiptSms(svc, {
        memberUserId: meta.member_user_id,
        membershipId: member?.membership_id ?? meta.membership_id ?? null,
        name: member?.full_name ?? null,
        phone: member?.phone_e164 ?? null,
        amount: amountInr,
        paidUntil: periodEnd,
        monthsBought: months,
        transactionId: txId,
      });

      if (txId) await syncTransactionsToSheet(svc, [txId]);
    } else if (session.id) {
      // Event registration payments (existing flow) — mark paid.
      await svc.from("event_registrations").update({
        payment_status: "paid", paid_at: new Date().toISOString(),
      }).eq("stripe_session_id", session.id);
    }
  } catch (e) {
    return new Response(`handler error: ${(e as Error).message}`, { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
