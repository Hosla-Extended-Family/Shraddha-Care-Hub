// Main-admin actions on the ledger: approve, reject, settle cash, adjust paid-until.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { serviceClient, getCaller, json, audit, clientIp } from "../_shared/admin.ts";
import { applyPayment } from "../_shared/fees.ts";
import { syncTransactionsToSheet, deleteRowsFromSheet } from "../_shared/fee-sheet.ts";
import { sendPaymentReceiptSms } from "../_shared/sms.ts";

/** Inverse of extendPaidUntil: steps the paid-through date back by whole months. */
function rollBackPaidUntil(current: string, months: number) {
  const d = new Date(`${current.slice(0, 10)}T12:00:00Z`);
  // Last day of the month that is `months` earlier.
  const back = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - months + 1, 0, 12));
  return back.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller || !caller.isMainAdmin) return json({ error: "Only the main admin can do this." }, 403, H);
    const ip = clientIp(req);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "approve" || action === "reject") {
      const txId = String(body.transaction_id ?? "");
      const { data: tx } = await svc.from("membership_transactions").select("*").eq("id", txId).maybeSingle();
      if (!tx) return json({ error: "Entry not found" }, 404, H);

      if (action === "reject") {
        await svc.from("membership_transactions").update({
          state: "rejected",
          rejected_reason: body.reason ? String(body.reason) : "Not verified",
          approved_by: caller.userId,
          approved_at: new Date().toISOString(),
        }).eq("id", txId);
        await audit(svc, caller, "reject_payment", "membership_transactions", txId, { reason: body.reason }, ip);
        return json({ ok: true }, 200, H);
      }

      if (tx.state === "success") return json({ error: "This entry is already confirmed." }, 400, H);

      const { data: member } = await svc.from("profiles")
        .select("paid_up_until, monthly_fee_amount, credit_balance_inr, full_name, phone_e164, membership_id")
        .eq("user_id", tx.member_user_id).maybeSingle();
      const fee = tx.monthly_fee_amount ?? member?.monthly_fee_amount ?? 0;

      // Credit is consumed here, once, using the member's live balance.
      const outcome = applyPayment({
        amount: tx.amount_inr,
        monthlyFee: fee,
        paidUpUntil: member?.paid_up_until ?? null,
        creditBalance: member?.credit_balance_inr ?? 0,
      });
      const months = outcome.months;
      const periodEnd = months > 0 ? outcome.paidUntil : null;

      await svc.from("membership_transactions").update({
        state: "success",
        months_covered: months || null,
        period_end: periodEnd,
        credit_used_inr: outcome.creditUsed,
        advance_credit_inr: outcome.creditLeft,
        approved_by: caller.userId,
        approved_at: new Date().toISOString(),
      }).eq("id", txId);

      const patch: Record<string, unknown> = { credit_balance_inr: outcome.creditLeft };
      if (periodEnd) {
        patch.paid_up_until = periodEnd;
        patch.last_paid_month = `${periodEnd.slice(0, 7)}-01`;
        patch.member_status = "active";
      }
      await svc.from("profiles").update(patch).eq("user_id", tx.member_user_id);

      await sendPaymentReceiptSms(svc, {
        memberUserId: tx.member_user_id,
        membershipId: member?.membership_id ?? tx.membership_id ?? null,
        name: member?.full_name ?? null,
        phone: member?.phone_e164 ?? null,
        amount: tx.amount_inr,
        paidUntil: periodEnd ?? member?.paid_up_until ?? null,
        creditLeft: outcome.creditLeft,
        monthsBought: months,
        transactionId: txId,
      });

      await syncTransactionsToSheet(svc, [txId]);

      await audit(svc, caller, "approve_payment", "membership_transactions", txId,
        {
          amount: tx.amount_inr, months, period_end: periodEnd,
          credit_used: outcome.creditUsed, credit_left: outcome.creditLeft,
        }, ip);
      return json({
        ok: true, period_end: periodEnd,
        credit_used: outcome.creditUsed, credit_left: outcome.creditLeft,
      }, 200, H);
    }

    if (action === "settle") {
      const ids: string[] = Array.isArray(body.transaction_ids) ? body.transaction_ids.map(String) : [];
      if (!ids.length) return json({ error: "Nothing to settle" }, 400, H);
      await svc.from("membership_transactions").update({
        settled: true, settled_at: new Date().toISOString(), settled_by: caller.userId,
      }).in("id", ids);
      await syncTransactionsToSheet(svc, ids);
      await audit(svc, caller, "settle_cash", "membership_transactions", null, { count: ids.length, ids }, ip);
      return json({ ok: true, count: ids.length }, 200, H);
    }

    if (action === "delete_cash") {
      const ids: string[] = Array.isArray(body.transaction_ids) ? body.transaction_ids.map(String) : [];
      if (!ids.length) return json({ error: "Nothing to remove" }, 400, H);
      const { data: rows } = await svc.from("membership_transactions")
        .select("id, amount_inr, membership_id, source, settled").in("id", ids);
      const cashIds = (rows ?? []).filter((r: any) => r.source === "cash" && !r.settled).map((r: any) => r.id);
      if (!cashIds.length) return json({ error: "Only unsettled cash entries can be removed." }, 400, H);
      const { error } = await svc.from("membership_transactions").delete().in("id", cashIds);
      if (error) return json({ error: error.message }, 400, H);
      await audit(svc, caller, "delete_cash", "membership_transactions", null,
        { count: cashIds.length, removed: rows }, ip);
      return json({ ok: true, count: cashIds.length }, 200, H);
    }

    // Removes any ledger entries (used to clear test data). A confirmed entry is
    // rolled back on the member's profile first: months come off the paid-until
    // date and the amount comes off the advance credit balance.
    if (action === "delete_entries") {
      const ids: string[] = Array.isArray(body.transaction_ids) ? body.transaction_ids.map(String) : [];
      if (!ids.length) return json({ error: "Nothing to remove" }, 400, H);

      const { data: rows } = await svc.from("membership_transactions").select("*").in("id", ids);
      if (!rows?.length) return json({ error: "Entries not found" }, 404, H);

      // Newest first, so reversing several entries for one member unwinds in order.
      const ordered = [...rows].sort((a: any, b: any) =>
        String(b.created_at).localeCompare(String(a.created_at)));

      for (const tx of ordered) {
        if (tx.state !== "success" || !tx.member_user_id) continue;
        const { data: member } = await svc.from("profiles")
          .select("paid_up_until, monthly_fee_amount, credit_balance_inr")
          .eq("user_id", tx.member_user_id).maybeSingle();
        if (!member) continue;

        const fee = tx.monthly_fee_amount ?? member.monthly_fee_amount ?? 0;
        const months = tx.months_covered ?? 0;
        const patch: Record<string, unknown> = {};

        if (months > 0 && member.paid_up_until) {
          patch.paid_up_until = rollBackPaidUntil(member.paid_up_until, months);
          patch.last_paid_month = `${String(patch.paid_up_until).slice(0, 7)}-01`;
        }
        const credit = Math.max(
          0,
          Math.round((member.credit_balance_inr ?? 0) - (tx.amount_inr ?? 0) + months * fee),
        );
        patch.credit_balance_inr = credit;
        await svc.from("profiles").update(patch).eq("user_id", tx.member_user_id);
      }

      const { error } = await svc.from("membership_transactions").delete().in("id", ids);
      if (error) return json({ error: error.message }, 400, H);

      const sheet = await deleteRowsFromSheet(ids);
      await audit(svc, caller, "delete_fee_entries", "membership_transactions", null,
        { count: rows.length, removed: rows.map((r: any) => ({ id: r.id, amount: r.amount_inr, state: r.state })), sheet }, ip);

      return json({ ok: true, count: rows.length, sheet_removed: sheet.removed, sheet_error: sheet.error ?? null }, 200, H);
    }

    if (action === "adjust_member") {
      const userId = String(body.user_id ?? "");
      const patch: Record<string, unknown> = {};
      if (body.paid_up_until !== undefined) patch.paid_up_until = body.paid_up_until || null;
      if (body.monthly_fee_amount !== undefined) patch.monthly_fee_amount = body.monthly_fee_amount || null;
      if (body.plan !== undefined) patch.plan = body.plan || null;
      if (body.chapter !== undefined) patch.chapter = body.chapter || null;
      if (body.member_status !== undefined) patch.member_status = body.member_status || "none";
      if (!userId || !Object.keys(patch).length) return json({ error: "Nothing to change" }, 400, H);
      const { error } = await svc.from("profiles").update(patch).eq("user_id", userId);
      if (error) return json({ error: error.message }, 400, H);
      await audit(svc, caller, "adjust_member", "profiles", userId, patch, ip);
      return json({ ok: true }, 200, H);
    }

    return json({ error: "Unknown action" }, 400, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
