import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UsersRound, Search, Download, RefreshCw, CheckCircle2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePlanPrices } from "@/hooks/use-plan-prices";
import { PLANS, defaultAmount, monthlyEquivalent, priceFor, type BillingCycle } from "@/lib/membership-plans";
import { makeMembershipId, prettyDate } from "@/lib/membership";
import { format } from "date-fns";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1OeHRRTQw-oosoRJKxWgUOs4Kb4DcQy8cjFT0-oLOz_o/edit";

type SheetRow = { id: string; name: string; phone_digits: string };
type Issued = { name: string; phone: string; membership_id?: string; password?: string; reason?: string };


/** Bulk-creates member profiles from the synced Active Members sheet. */
export default function SheetOnboarding({ onCreated }: { onCreated?: () => void }) {
  const { toast } = useToast();
  const { prices } = usePlanPrices();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [existing, setExisting] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [plan, setPlan] = useState("standard-non-metro");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [fee, setFee] = useState("");
  const [lastPaidMonth, setLastPaidMonth] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [results, setResults] = useState<{ created: Issued[]; failed: Issued[] } | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: sheet }, { data: profiles }] = await Promise.all([
      supabase.from("active_members").select("id, name, phone_digits, synced_at").order("name"),
      supabase.from("profiles").select("phone_e164, membership_id").not("membership_id", "is", null),
    ]);
    setRows((sheet ?? []) as SheetRow[]);
    setLastSynced(
      (sheet ?? []).reduce<string | null>((max: string | null, r: any) => {
        const v = r?.synced_at ? String(r.synced_at) : null;
        return v && (!max || v > max) ? v : max;
      }, null),
    );
    setExisting(new Set((profiles ?? []).map((p: any) => String(p.phone_e164 ?? "").replace(/\D/g, "").slice(-10))));
    setLoading(false);
  };

  const syncSheet = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-active-members");
      if (error) throw error;
      if ((data as any)?.error) throw new Error(String((data as any).error));
      const payload = data as any;
      toast({
        title: "Sheet synced",
        description: `${payload.synced} member(s) imported${payload.skipped ? `, ${payload.skipped} row(s) skipped (invalid phone)` : ""}.`,
      });
      await load();
    } catch (err) {
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setFee(defaultAmount(plan, cycle, prices)); }, [plan, cycle, defaultAmount(plan, cycle, prices)]);


  const pending = useMemo(
    () => rows.filter((r) => !existing.has(r.phone_digits.slice(-10))),
    [rows, existing],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return pending;
    return pending.filter((r) =>
      r.name.toLowerCase().includes(needle) || r.phone_digits.includes(needle.replace(/\D/g, "")));
  }, [pending, q]);

  const selectedRows = pending.filter((r) => selected[r.id]);

  const createProfiles = async () => {
    if (selectedRows.length === 0) return toast({ title: "Select at least one person" });
    setRunning(true);
    setResults(null);
    const { data, error } = await supabase.functions.invoke("member-credentials", {
      body: {
        action: "bulk_create",
        plan,
        monthly_fee_amount: monthlyEquivalent(Number(fee || 0), cycle) || null,
        last_paid_month: lastPaidMonth || null,
        allow_upgrade: true,
        rows: selectedRows.map((r) => {
          const own = amounts[r.id];
          return {
            name: r.name,
            phone: r.phone_digits,
            monthly_fee_amount: own ? monthlyEquivalent(Number(own), cycle) : undefined,
          };
        }),
      },
    });
    setRunning(false);
    const payload = data as any;
    if (error || payload?.error) {
      return toast({
        title: "Couldn't create the profiles",
        description: payload?.error || error?.message,
        variant: "destructive",
      });
    }
    setResults({ created: payload.created ?? [], failed: payload.failed ?? [] });
    setSelected({});
    setAmounts({});
    toast({
      title: `${payload.created?.length ?? 0} profile(s) created`,
      description: payload.failed?.length ? `${payload.failed.length} row(s) need attention.` : "Credentials are listed below.",
    });
    load();
    onCreated?.();
  };

  const downloadCsv = () => {
    if (!results?.created.length) return;
    const csv = [
      "Name,Phone,Membership ID,Password",
      ...results.created.map((r) => `"${r.name}",${r.phone},${r.membership_id},${r.password}`),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `member-credentials-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-primary" /> Create profiles from the Active Members sheet
            </CardTitle>
            {lastSynced && (
              <p className="text-xs text-muted-foreground mt-1">
                Last synced {format(new Date(lastSynced), "MMM d, yyyy h:mm a")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-10" asChild>
              <a href={SHEET_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" /> Open sheet
              </a>
            </Button>
            <Button size="sm" className="h-10" onClick={syncSheet} disabled={syncing}>
              {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {syncing ? "Syncing..." : "Sync now"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Everyone in the synced sheet who does not have a member profile yet. Pick the plan and the month
          they have paid up to, then create the accounts — Membership IDs and passwords are generated for you.
        </p>


        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                ))}

              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Billing</Label>
            <Select value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
              <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount (₹ / {cycle === "monthly" ? "month" : "year"})</Label>
            <Input inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} className="h-11 mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Default for everyone — override per person in the list below.</p>
          </div>
          <div>
            <Label>Last paid month</Label>
            <Input type="month" value={lastPaidMonth} onChange={(e) => setLastPaidMonth(e.target.value)} className="h-11 mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Leave blank if they have not paid yet.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search the sheet by name or phone" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-11" />
          </div>
          <Button variant="outline" className="h-11" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button className="h-11" onClick={createProfiles} disabled={running || selectedRows.length === 0}>
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Create {selectedRows.length || ""} profile{selectedRows.length === 1 ? "" : "s"}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : pending.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center">
            Everyone in the sheet already has a member profile. 🎉
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filtered.length > 0 && filtered.every((r) => selected[r.id])}
                onCheckedChange={(v) => setSelected((s) => {
                  const next = { ...s };
                  filtered.forEach((r) => { next[r.id] = !!v; });
                  return next;
                })}
                aria-label="Select all shown"
              />
              <span className="text-muted-foreground">
                Select all shown · {pending.length} without a profile
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto rounded-lg border divide-y">
              {filtered.map((r) => (
                <label key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={!!selected[r.id]}
                    onCheckedChange={(v) => setSelected((s) => ({ ...s, [r.id]: !!v }))}
                  />
                  <span className="flex-1 min-w-0 truncate">{r.name}</span>
                  <span className="text-muted-foreground tabular-nums hidden sm:inline">{r.phone_digits}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    ₹
                    <Input
                      inputMode="numeric"
                      value={amounts[r.id] ?? ""}
                      placeholder={fee || "0"}
                      onClick={(e) => e.preventDefault()}
                      onChange={(e) => setAmounts((a) => ({ ...a, [r.id]: e.target.value.replace(/\D/g, "") }))}
                      className="h-9 w-20 tabular-nums"
                      aria-label={`Amount for ${r.name}`}
                    />
                  </span>
                  <Badge variant="outline" className="font-mono">{makeMembershipId(r.name, r.phone_digits)}</Badge>
                </label>
              ))}
            </div>
          </>
        )}

        {results && (
          <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {results.created.length} account(s) created
                {lastPaidMonth ? ` · paid up to ${prettyDate(lastPaidMonth + "-01")}'s month end` : ""}
              </p>
              {results.created.length > 0 && (
                <Button size="sm" variant="outline" className="h-10" onClick={downloadCsv}>
                  <Download className="h-4 w-4 mr-2" /> Download credentials (CSV)
                </Button>
              )}
            </div>
            <div className="max-h-60 overflow-y-auto divide-y text-sm">
              {results.created.map((r) => (
                <div key={r.phone} className="py-2 flex flex-wrap items-center justify-between gap-2">
                  <span>{r.name}</span>
                  <span className="font-mono">{r.membership_id} · {r.password}</span>
                </div>
              ))}
              {results.failed.map((r) => (
                <div key={`f-${r.phone}`} className="py-2 flex flex-wrap items-center justify-between gap-2 text-destructive">
                  <span>{r.name}</span>
                  <span>{r.reason}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Passwords are shown only once — download the CSV before leaving this page.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
