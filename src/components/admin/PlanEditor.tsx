import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, IndianRupee, CalendarClock, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PLANS, planLabel } from "@/lib/membership-plans";
import { formatINR, prettyDate } from "@/lib/membership";
import type { PlanPriceRow } from "@/hooks/use-plan-prices";

type Props = {
  rows: PlanPriceRow[];
  upcoming: PlanPriceRow[];
  prices: Record<string, { monthly: number | null; yearly: number | null; effectiveFrom?: string | null } | undefined>;
  onSaved: () => void;
};

export default function PlanEditor({ rows, upcoming, prices, onSaved }: Props) {
  const { toast } = useToast();
  const [plan, setPlan] = useState(PLANS[0].key as string);
  const [monthly, setMonthly] = useState("");
  const [yearly, setYearly] = useState("");
  const [effective, setEffective] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!monthly && !yearly) {
      return toast({ title: "Enter a monthly or yearly amount", variant: "destructive" });
    }
    setSaving(true);
    const { error } = await supabase.from("plan_prices").insert({
      plan_key: plan,
      monthly_amount: monthly ? Number(monthly) : null,
      yearly_amount: yearly ? Number(yearly) : null,
      effective_from: effective,
      note: note.trim() || null,
    });
    setSaving(false);
    if (error) return toast({ title: "Couldn't save the price", description: error.message, variant: "destructive" });
    setMonthly(""); setYearly(""); setNote("");
    toast({
      title: "Pricing saved",
      description: effective > new Date().toISOString().slice(0, 10)
        ? `It takes effect on ${prettyDate(effective)}.`
        : "It applies from today — the plan dropdown now uses it.",
    });
    onSaved();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" /> Current pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {PLANS.map((p) => {
            const live = prices[p.key];
            return (
              <div key={p.key} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{p.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {live?.monthly ? `${formatINR(live.monthly)}/month` : "Custom monthly"}
                    {" · "}
                    {live?.yearly ? `${formatINR(live.yearly)}/year` : "Custom yearly"}
                  </p>
                </div>
                <Badge variant="outline">
                  since {live?.effectiveFrom ? prettyDate(live.effectiveFrom) : "—"}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Update a plan's price</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="h-12 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monthly (₹)</Label>
              <Input inputMode="numeric" value={monthly} onChange={(e) => setMonthly(e.target.value.replace(/\D/g, ""))}
                placeholder="Leave blank for custom" className="h-12 mt-1" />
            </div>
            <div>
              <Label>Yearly (₹)</Label>
              <Input inputMode="numeric" value={yearly} onChange={(e) => setYearly(e.target.value.replace(/\D/g, ""))}
                placeholder="Leave blank for custom" className="h-12 mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Effective from</Label>
              <Input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} className="h-12 mt-1" />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 2027 revision" className="h-12 mt-1" />
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="h-12 w-full text-base">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save pricing
          </Button>
        </CardContent>
      </Card>

      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" /> Scheduled price changes
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {upcoming.map((r) => (
              <div key={r.id} className="py-3 text-sm flex flex-wrap items-center justify-between gap-2">
                <span>{planLabel(r.plan_key)} — {r.monthly_amount ? `${formatINR(r.monthly_amount)}/mo` : "custom"} · {r.yearly_amount ? `${formatINR(r.yearly_amount)}/yr` : "custom"}</span>
                <Badge>from {prettyDate(r.effective_from)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Price history</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {rows.length === 0 ? (
            <p className="text-muted-foreground py-4">No pricing recorded yet.</p>
          ) : rows.map((r) => (
            <div key={r.id} className="py-3 text-sm flex flex-wrap items-center justify-between gap-2">
              <span>
                {planLabel(r.plan_key)} — {r.monthly_amount ? `${formatINR(r.monthly_amount)}/mo` : "custom"} · {r.yearly_amount ? `${formatINR(r.yearly_amount)}/yr` : "custom"}
                {r.note ? <span className="text-muted-foreground"> · {r.note}</span> : null}
              </span>
              <span className="text-muted-foreground">from {prettyDate(r.effective_from)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
