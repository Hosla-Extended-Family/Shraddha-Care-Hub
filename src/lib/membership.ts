// Membership helpers shared by the member profile and the admin panels.

export const GRACE_DAYS = 15;

/** Membership ID = first 4 letters of the name + last 4 digits of the phone (e.g. RINA1234). */
export function makeMembershipId(name: string, phone: string) {
  const letters = (name || "").replace(/[^A-Za-z]/g, "").slice(0, 4).padEnd(4, "X").toUpperCase();
  const digits = (phone || "").replace(/\D/g, "").padStart(4, "0").slice(-4);
  return `${letters}${digits}`;
}

/** How many whole months an amount covers on a given monthly fee. */
export function monthsCovered(amount: number, monthlyFee: number) {
  if (!monthlyFee || monthlyFee <= 0) return 0;
  return Math.floor(amount / monthlyFee);
}

export type PaymentOutcome = {
  /** Whole months this payment unlocks (0 for a part payment). */
  months: number;
  /** Advance credit consumed to complete a month. */
  creditUsed: number;
  /** Advance credit carried forward after this payment. */
  creditLeft: number;
  /** New paid-through date, or the unchanged one when no month was bought. */
  paidUntil: string | null;
  /** Month range covered, e.g. "September–October 2026". Null for a part payment. */
  periodLabel: string | null;
  periodStart: string | null;
};

/**
 * Works out what an amount buys once the member's carried advance credit is added.
 * Nothing is ever rounded away: whatever does not complete a month stays as credit.
 */
export function applyPayment(opts: {
  amount: number;
  monthlyFee: number | null | undefined;
  paidUpUntil: string | null | undefined;
  creditBalance?: number | null;
}): PaymentOutcome {
  const amount = Math.max(0, Math.round(Number(opts.amount) || 0));
  const fee = Math.max(0, Math.round(Number(opts.monthlyFee) || 0));
  const carried = Math.max(0, Math.round(Number(opts.creditBalance) || 0));
  const pool = amount + carried;

  const months = fee > 0 ? Math.floor(pool / fee) : 0;
  const creditLeft = fee > 0 ? pool - months * fee : pool;
  const creditUsed = Math.max(0, carried - creditLeft);
  const period = coveredPeriod(opts.paidUpUntil, months);

  return {
    months,
    creditUsed,
    creditLeft,
    paidUntil: period ? period.end : (opts.paidUpUntil ?? null),
    periodLabel: period ? period.label : null,
    periodStart: period ? period.start : null,
  };
}

/** "Rs 300 held as advance credit" — empty when there is no leftover. */
export function creditNote(creditLeft: number) {
  if (!creditLeft || creditLeft <= 0) return "";
  return `${formatINR(creditLeft)} held as advance credit`;
}

/** One professional sentence describing what a payment did. */
export function paymentSummary(outcome: PaymentOutcome) {
  const note = creditNote(outcome.creditLeft);
  if (outcome.months <= 0) {
    return `Part payment — paid-to date unchanged${note ? ` · ${note}` : ""}`;
  }
  const base = `Covers ${outcome.periodLabel} — paid to ${prettyDate(outcome.paidUntil)}`;
  return note ? `${base} · ${note}` : base;
}


function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Given the current paid-up-until date and the number of months paid,
 * returns the covered period plus a human label like "April–May".
 */
export function coveredPeriod(paidUpUntil: string | null | undefined, months: number) {
  if (months <= 0) return null;
  // A payment always continues from the member's recorded paid-through month,
  // even when that month is in the past. Otherwise arrears are silently skipped.
  const base = paidUpUntil ? new Date(`${paidUpUntil.slice(0, 10)}T12:00:00`) : new Date();
  const start = paidUpUntil
    ? new Date(base.getFullYear(), base.getMonth() + 1, 1)
    : new Date(base.getFullYear(), base.getMonth(), 1);
  const end = endOfMonth(new Date(start.getFullYear(), start.getMonth() + months - 1, 1));
  return {
    start: toISODate(start),
    end: toISODate(end),
    label: monthRangeLabel(start, end),
  };
}

export function toISODate(d: Date) {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function monthRangeLabel(start: Date, end: Date) {
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { month: "long" });
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = sameYear ? fmt(start) : `${fmt(start)} ${start.getFullYear()}`;
  const endLabel = `${fmt(end)}${sameYear ? "" : ` ${end.getFullYear()}`}`;
  if (start.getMonth() === end.getMonth() && sameYear) return `${startLabel} ${start.getFullYear()}`;
  return `${startLabel}\u2013${endLabel} ${end.getFullYear()}`;
}

export type MemberStatus = "active" | "due" | "lapsed" | "none";

/** active while paid, "due" during the 15-day grace buffer, then lapsed. */
export function memberStatusOf(paidUpUntil: string | null | undefined): MemberStatus {
  if (!paidUpUntil) return "none";
  const until = new Date(paidUpUntil);
  const today = new Date();
  const grace = new Date(until);
  grace.setDate(grace.getDate() + GRACE_DAYS);
  if (today <= until) return "active";
  if (today <= grace) return "due";
  return "lapsed";
}

export const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  due: "Renewal due",
  lapsed: "Lapsed",
  none: "Not a member",
};

export function formatINR(paise: number | null | undefined) {
  if (paise == null) return "\u2014";
  return `\u20b9${paise.toLocaleString("en-IN")}`;
}

export function prettyDate(d: string | null | undefined) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const TX_SOURCE_LABEL: Record<string, string> = {
  stripe: "Online payment",
  direct_upi: "PhonePe / GPay",
  cash: "Cash",
  offline: "Offline / other",
};

export const TX_STATE_LABEL: Record<string, string> = {
  success: "Confirmed",
  pending_verification: "Waiting for verification",
  pending_approval: "Waiting for approval",
  rejected: "Rejected",
};
