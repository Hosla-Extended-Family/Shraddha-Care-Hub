// Fee arithmetic shared by the cash, approval and online payment paths.
// Mirrors src/lib/membership.ts so the UI preview and the server always agree.
import { extendPaidUntil } from "./admin.ts";

export type PaymentOutcome = {
  months: number;
  creditUsed: number;
  creditLeft: number;
  /** New paid-through date, or the unchanged one when no month was bought. */
  paidUntil: string | null;
};

/**
 * Adds the member's carried advance credit to the amount collected and works out
 * how many whole months it buys. The remainder is never dropped — it stays as credit.
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
  const paidUntil = months > 0
    ? extendPaidUntil(opts.paidUpUntil ?? null, months)
    : (opts.paidUpUntil ?? null);

  return { months, creditUsed, creditLeft, paidUntil };
}
