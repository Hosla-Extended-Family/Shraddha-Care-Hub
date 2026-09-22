// Membership plan catalogue. Prices live in the `plan_prices` table with effective
// dates; the values below are only the fallback used before prices load.

export type BillingCycle = "monthly" | "yearly";

export type PlanKey =
  | "standard-non-metro"
  | "standard-metro"
  | "premium-non-metro"
  | "premium-metro";

export type PlanPrice = { monthly: number | null; yearly: number | null; effectiveFrom?: string | null };

export type PriceMap = Partial<Record<string, PlanPrice>>;

export const PLANS: { key: PlanKey; label: string; monthly: number | null; yearly: number | null }[] = [
  { key: "standard-non-metro", label: "Standard — Non-metro", monthly: 400, yearly: 4000 },
  { key: "standard-metro", label: "Standard — Metro", monthly: 500, yearly: 5000 },
  { key: "premium-non-metro", label: "Premium — Non-metro", monthly: null, yearly: null },
  { key: "premium-metro", label: "Premium — Metro", monthly: null, yearly: null },
];

export function planByKey(key: string) {
  return PLANS.find((p) => p.key === key);
}

export function planLabel(key: string | null | undefined) {
  if (!key) return "—";
  return planByKey(key)?.label ?? key;
}

/** Current price for a plan — from the live price map when available. */
export function priceFor(key: string, cycle: BillingCycle, prices?: PriceMap): number | null {
  const live = prices?.[key];
  if (live) return cycle === "monthly" ? live.monthly : live.yearly;
  const p = planByKey(key);
  if (!p) return null;
  return cycle === "monthly" ? p.monthly : p.yearly;
}

export function defaultAmount(key: string, cycle: BillingCycle, prices?: PriceMap) {
  const v = priceFor(key, cycle, prices);
  return v == null ? "" : String(v);
}

/** The fee ledger works in monthly units, so a yearly amount is stored as its monthly equivalent. */
export function monthlyEquivalent(amount: number, cycle: BillingCycle) {
  if (!amount) return null;
  return cycle === "yearly" ? Math.round(amount / 12) : Math.round(amount);
}
