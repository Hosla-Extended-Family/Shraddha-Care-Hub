import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PriceMap } from "@/lib/membership-plans";

export type PlanPriceRow = {
  id: string;
  plan_key: string;
  monthly_amount: number | null;
  yearly_amount: number | null;
  effective_from: string;
  note: string | null;
  created_at: string;
};

const today = () => new Date().toISOString().slice(0, 10);

/** Latest effective price per plan, plus the full history for the plan editor. */
export function usePlanPrices() {
  const [rows, setRows] = useState<PlanPriceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("plan_prices")
      .select("id, plan_key, monthly_amount, yearly_amount, effective_from, note, created_at")
      .order("effective_from", { ascending: false })
      .order("created_at", { ascending: false });
    setRows((data ?? []) as PlanPriceRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const prices: PriceMap = {};
  const now = today();
  for (const r of rows) {
    if (r.effective_from > now) continue; // future price — not active yet
    if (prices[r.plan_key]) continue; // rows are newest-first
    prices[r.plan_key] = {
      monthly: r.monthly_amount,
      yearly: r.yearly_amount,
      effectiveFrom: r.effective_from,
    };
  }

  const upcoming = rows.filter((r) => r.effective_from > now);

  return { prices, rows, upcoming, loading, reload };
}
