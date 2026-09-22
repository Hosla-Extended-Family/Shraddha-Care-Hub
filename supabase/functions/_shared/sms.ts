// Fast2SMS DLT sender for transactional receipts.
// Never throws: a payment must always save even if SMS is down.
import { SupabaseClient } from "npm:@supabase/supabase-js@2";

const API = "https://www.fast2sms.com/dev/bulkV2";
export const COPY_NUMBERS_KEY = "sms_receipt_copy_numbers";
export const COPY_ENABLED_KEY = "sms_receipt_copy_enabled";

/** Bare 10-digit Indian mobile number, or null. */
export function tenDigits(phone: string | null | undefined): string | null {
  const d = (phone ?? "").replace(/\D/g, "");
  const last = d.slice(-10);
  return /^[6-9]\d{9}$/.test(last) ? last : null;
}

export function formatPaidUntil(date: string | null): string {
  if (!date) return "-";
  const d = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function shortDate(date: string | null): string {
  if (!date) return "-";
  const d = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/**
 * The "paid up to" variable. When the member has advance credit left over we say so
 * in the same variable, using a shorter date so the value stays compact.
 */
export function paidUntilVariable(date: string | null, creditLeft = 0, monthsBought = 1): string {
  const credit = Math.max(0, Math.round(creditLeft || 0));
  if (credit <= 0) return formatPaidUntil(date);
  const base = monthsBought > 0 ? shortDate(date) : "unchanged";
  return `${base} + Rs ${credit} credit`;
}


type SendResult = {
  status: "sent" | "failed" | "skipped";
  error: string | null;
  providerMessageId: string | null;
  recipients: string[];
};

export async function sendDltSms(opts: {
  numbers: string[];
  messageId: string;
  variables: string[];
}): Promise<SendResult> {
  const key = Deno.env.get("FAST2SMS_API_KEY");
  const senderId = Deno.env.get("FAST2SMS_SENDER_ID") ?? "HOSLAS";
  const numbers = [...new Set(opts.numbers.map(tenDigits).filter((n): n is string => !!n))];

  if (!key) return { status: "skipped", error: "FAST2SMS_API_KEY not set", providerMessageId: null, recipients: numbers };
  if (!opts.messageId) return { status: "skipped", error: "message id not set", providerMessageId: null, recipients: numbers };
  if (!numbers.length) return { status: "skipped", error: "no valid mobile number", providerMessageId: null, recipients: [] };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "dlt",
        sender_id: senderId,
        message: opts.messageId,
        variables_values: opts.variables.join("|"),
        numbers: numbers.join(","),
        flash: 0,
      }),
    });
    const text = await res.text();
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(text); } catch { /* provider returned plain text */ }
    const ok = res.ok && parsed.return === true;
    return {
      status: ok ? "sent" : "failed",
      error: ok ? null : (String(parsed.message ?? text)).slice(0, 500),
      providerMessageId: Array.isArray(parsed.request_id) ? String(parsed.request_id[0]) : (parsed.request_id ? String(parsed.request_id) : null),
      recipients: numbers,
    };
  } catch (e) {
    return { status: "failed", error: (e as Error).message.slice(0, 500), providerMessageId: null, recipients: numbers };
  }
}

/** Tracker numbers (founder / fee trackers) that receive a copy of every receipt. */
export async function copyNumbers(svc: SupabaseClient): Promise<string[]> {
  const { data } = await svc.from("app_settings").select("key, value")
    .in("key", [COPY_NUMBERS_KEY, COPY_ENABLED_KEY]);
  const map = new Map((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
  if ((map.get(COPY_ENABLED_KEY) ?? "true") === "false") return [];
  return (map.get(COPY_NUMBERS_KEY) ?? "")
    .split(/[,\s]+/).map(tenDigits).filter((n): n is string => !!n);
}

/**
 * Sends the approved payment-receipt template to the member plus tracker numbers
 * and records the attempt in sms_log. Silently returns on any problem.
 */
export async function sendPaymentReceiptSms(svc: SupabaseClient, args: {
  memberUserId: string | null;
  membershipId: string | null;
  name: string | null;
  phone: string | null;
  amount: number;
  paidUntil: string | null;
  creditLeft?: number | null;
  monthsBought?: number | null;
  transactionId?: string | null;
}) {
  try {
    const messageId = Deno.env.get("FAST2SMS_RECEIPT_MESSAGE_ID") ?? "";
    const memberDigits = tenDigits(args.phone);
    const trackers = await copyNumbers(svc);
    const numbers = memberDigits ? [memberDigits, ...trackers] : trackers;

    // Template order: name (alphanumeric), amount (number), paid-up-to (alphanumeric, <=40 chars)
    const variables = [
      (args.name ?? "Member").replace(/[^\p{L}\p{N} .]/gu, "").trim().slice(0, 30) || "Member",
      String(Math.round(args.amount)),
      paidUntilVariable(args.paidUntil, args.creditLeft ?? 0, args.monthsBought ?? 1).slice(0, 40),
    ];


    if (args.transactionId) {
      const { data: dupe } = await svc.from("sms_log").select("id")
        .eq("transaction_id", args.transactionId).eq("purpose", "payment_receipt").maybeSingle();
      if (dupe) return;
    }

    const result = numbers.length
      ? await sendDltSms({ numbers, messageId, variables })
      : { status: "skipped" as const, error: "no recipients", providerMessageId: null, recipients: [] };

    await svc.from("sms_log").insert({
      member_user_id: args.memberUserId,
      membership_id: args.membershipId,
      transaction_id: args.transactionId ?? null,
      phone_digits: memberDigits,
      recipients: result.recipients,
      purpose: "payment_receipt",
      variables: { name: variables[0], amount: variables[1], paid_until: variables[2] },
      provider_message_id: result.providerMessageId,
      status: result.status,
      error: result.error,
    });
  } catch (e) {
    console.error("receipt sms failed", (e as Error).message);
  }
}
