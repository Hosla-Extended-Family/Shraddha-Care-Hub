// Records cash collected in person. The receiver records it, never the elder.
// Team admins create pending_approval entries; main admins are self-approved.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { serviceClient, getCaller, json, audit, clientIp } from "../_shared/admin.ts";
import { applyPayment } from "../_shared/fees.ts";
import { sendPaymentReceiptSms } from "../_shared/sms.ts";
import { syncTransactionsToSheet } from "../_shared/fee-sheet.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller || !caller.isAnyAdmin) return json({ error: "Not authorised" }, 403, H);
    const ip = clientIp(req);

    const body = await req.json().catch(() => ({}));
    const memberUserId = String(body.member_user_id ?? "");
    const amount = Number(body.amount_inr ?? 0);
    const receiverName = String(body.receiver_name ?? "").trim() || caller.fullName || "Office";
    if (!memberUserId) return json({ error: "Pick a member" }, 400, H);
    if (!Number.isFinite(amount) || amount <= 0) return json({ error: "Enter a valid amount" }, 400, H);

    const { data: member } = await svc.from("profiles")
      .select("user_id, full_name, membership_id, plan, monthly_fee_amount, paid_up_until, credit_balance_inr, email, phone_e164")
      .eq("user_id", memberUserId).maybeSingle();
    if (!member) return json({ error: "Member not found" }, 404, H);

    // Duplicate guard: the same member recorded again within 10 minutes needs a confirmation.
    if (!body.confirm_duplicate) {
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recent } = await svc.from("membership_transactions")
        .select("id, amount_inr, created_at")
        .eq("member_user_id", memberUserId).eq("source", "cash")
        .gte("created_at", since).order("created_at", { ascending: false }).limit(1);
      if (recent && recent.length) {
        return json({
          duplicate_warning: true,
          recent: recent[0],
          message: `A cash entry of Rs ${recent[0].amount_inr} was recorded for this member a few minutes ago. Record this one as well?`,
        }, 200, H);
      }
    }

    const fee = member.monthly_fee_amount ?? 0;
    const selfApproved = caller.isMainAdmin;
    const carried = member.credit_balance_inr ?? 0;

    // Advance credit is only consumed when the entry is confirmed. A pending entry
    // shows an estimate on the amount alone; approval recomputes with the live balance.
    const outcome = applyPayment({
      amount,
      monthlyFee: fee,
      paidUpUntil: member.paid_up_until,
      creditBalance: selfApproved ? carried : 0,
    });
    const months = outcome.months;
    const periodEnd = months > 0 ? outcome.paidUntil : null;

    const { data: tx, error } = await svc.from("membership_transactions").insert({
      member_user_id: memberUserId,
      membership_id: member.membership_id,
      amount_inr: amount,
      monthly_fee_amount: fee || null,
      months_covered: months || null,
      period_end: periodEnd,
      credit_used_inr: selfApproved ? outcome.creditUsed : 0,
      advance_credit_inr: selfApproved ? outcome.creditLeft : 0,
      source: "cash",
      state: selfApproved ? "success" : "pending_approval",
      receiver_name: receiverName,
      recorded_by: caller.userId,
      approved_by: selfApproved ? caller.userId : null,
      approved_at: selfApproved ? new Date().toISOString() : null,
      note: body.note ? String(body.note) : null,
    }).select().single();
    if (error) return json({ error: error.message }, 400, H);

    if (selfApproved) {
      const patch: Record<string, unknown> = { credit_balance_inr: outcome.creditLeft };
      if (periodEnd) {
        patch.paid_up_until = periodEnd;
        patch.last_paid_month = `${periodEnd.slice(0, 7)}-01`;
        patch.member_status = "active";
      }
      await svc.from("profiles").update(patch).eq("user_id", memberUserId);

      await sendPaymentReceiptSms(svc, {
        memberUserId,
        membershipId: member.membership_id,
        name: member.full_name,
        phone: member.phone_e164,
        amount,
        paidUntil: periodEnd ?? member.paid_up_until,
        creditLeft: outcome.creditLeft,
        monthsBought: months,
        transactionId: tx.id,
      });

      await syncTransactionsToSheet(svc, [tx.id]);
    }

    await audit(svc, caller, "record_cash", "membership_transactions", tx.id,
      {
        amount, months, receiver: receiverName, membership_id: member.membership_id,
        credit_used: outcome.creditUsed, credit_left: outcome.creditLeft,
      }, ip);

    return json({
      transaction: tx,
      months,
      period_end: periodEnd,
      credit_used: selfApproved ? outcome.creditUsed : 0,
      credit_left: selfApproved ? outcome.creditLeft : carried,
    }, 200, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
