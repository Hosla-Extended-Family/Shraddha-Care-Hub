import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, RefreshCw, ReceiptText, TableProperties, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatINR, prettyDate } from "@/lib/membership";

type Row = {
  id: string;
  member_user_id: string;
  membership_id: string | null;
  amount_inr: number;
  monthly_fee_amount: number | null;
  months_covered: number | null;
  period_end: string | null;
  credit_used_inr: number | null;
  advance_credit_inr: number | null;
  source: string;
  state: string;
  receiver_name: string | null;
  settled: boolean;
  paid_on: string | null;
  created_at: string;
};

const STATE_STYLE: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-800",
  pending_approval: "bg-amber-100 text-amber-800",
  rejected: "bg-destructive/15 text-destructive",
};

const STATE_LABEL: Record<string, string> = {
  success: "Confirmed",
  pending_approval: "Awaiting approval",
  rejected: "Rejected",
};

/**
 * The full fee payment history: every entry, who collected it, what it bought and
 * whether the cash has been settled. Doubles as the export/mirror point so the
 * team sheet and the database can be cross-checked against each other.
 */
export function FeePaymentsLedger({ isMainAdmin }: { isMainAdmin: boolean }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const [source, setSource] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("membership_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    const list = (data ?? []) as Row[];
    setRows(list);

    const ids = [...new Set(list.map((r) => r.member_user_id).filter(Boolean))];
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles").select("user_id, full_name").in("user_id", ids);
      setNames(Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.full_name ?? ""])));
    }
    setPicked({});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (state !== "all" && r.state !== state) return false;
      if (source !== "all" && r.source !== source) return false;
      if (!needle) return true;
      return [names[r.member_user_id], r.membership_id, r.receiver_name, String(r.amount_inr)]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [rows, q, state, source, names]);

  const totals = useMemo(() => {
    const confirmed = filtered.filter((r) => r.state === "success");
    return {
      count: filtered.length,
      collected: confirmed.reduce((s, r) => s + (r.amount_inr || 0), 0),
      pending: filtered.filter((r) => r.state === "pending_approval").reduce((s, r) => s + (r.amount_inr || 0), 0),
      unsettled: confirmed.filter((r) => r.source === "cash" && !r.settled).reduce((s, r) => s + (r.amount_inr || 0), 0),
    };
  }, [filtered]);

  const exportCsv = () => {
    const head = [
      "Date", "Membership ID", "Member", "Amount", "Monthly fee", "Months", "Paid up to",
      "Credit used", "Advance credit", "Source", "State", "Collected by", "Settled",
    ];
    const lines = filtered.map((r) => [
      (r.paid_on ?? r.created_at ?? "").slice(0, 10),
      r.membership_id ?? "",
      names[r.member_user_id] ?? "",
      r.amount_inr,
      r.monthly_fee_amount ?? "",
      r.months_covered ?? 0,
      r.period_end ?? "",
      r.credit_used_inr ?? 0,
      r.advance_credit_inr ?? 0,
      r.source,
      r.state,
      r.receiver_name ?? "",
      r.settled ? "yes" : "no",
    ]);
    const csv = [head, ...lines]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const syncSheet = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("sync-fee-payments", { body: {} });
    setSyncing(false);
    if (error || (data as any)?.error) {
      return toast({
        title: "Sheet sync failed",
        description: (data as any)?.error || error?.message,
        variant: "destructive",
      });
    }
    toast({ title: "Sheet updated", description: `${(data as any)?.synced ?? 0} confirmed entries mirrored.` });
  };

  const pickedIds = useMemo(() => Object.keys(picked).filter((id) => picked[id]), [picked]);
  const pickedRows = useMemo(() => rows.filter((r) => picked[r.id]), [rows, picked]);
  const pickedConfirmed = pickedRows.filter((r) => r.state === "success").length;

  const deletePicked = async () => {
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("review-transaction", {
      body: { action: "delete_entries", transaction_ids: pickedIds },
    });
    setDeleting(false);
    if (error || (data as any)?.error) {
      return toast({
        title: "Couldn't remove them",
        description: (data as any)?.error || error?.message,
        variant: "destructive",
      });
    }
    setConfirmDelete(false);
    const sheetError = (data as any)?.sheet_error;
    toast({
      title: `${(data as any)?.count ?? pickedIds.length} entr${pickedIds.length === 1 ? "y" : "ies"} removed`,
      description: sheetError
        ? `Removed here, but the team sheet could not be updated: ${sheetError}`
        : `Also removed from the team sheet. Member paid-until dates and credit were rolled back.`,
      variant: sheetError ? "destructive" : undefined,
    });
    load();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-primary" /> Fee payment history
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Every fee entry with what it covered, who collected it and whether the cash is settled.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totals */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { label: "Entries", value: String(totals.count) },
            { label: "Confirmed", value: formatINR(totals.collected) },
            { label: "Awaiting approval", value: formatINR(totals.pending) },
            { label: "Cash unsettled", value: formatINR(totals.unsettled) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search member, ID, collector or amount"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11"
          />
          <div className="flex gap-2">
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="h-11 w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                <SelectItem value="success">Confirmed</SelectItem>
                <SelectItem value="pending_approval">Awaiting approval</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="h-11 w-full sm:w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="stripe">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-10" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          {isMainAdmin && !!pickedIds.length && (
            <Button variant="destructive" size="sm" className="h-10" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete {pickedIds.length} selected
            </Button>
          )}
          {isMainAdmin && (
            <Button variant="outline" size="sm" className="h-10" onClick={syncSheet} disabled={syncing}>
              {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TableProperties className="h-4 w-4 mr-2" />}
              Update team sheet
            </Button>
          )}
        </div>

        {/* Entries — cards on mobile, roomy rows on desktop */}
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No entries match these filters.</p>
        ) : (
          <div className="divide-y">
            {filtered.map((r) => (
              <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                {isMainAdmin && (
                  <Checkbox
                    className="mt-1 sm:mt-0 shrink-0"
                    checked={!!picked[r.id]}
                    onCheckedChange={(v) => setPicked((p) => ({ ...p, [r.id]: !!v }))}
                    aria-label="Select entry"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {names[r.member_user_id] || "Member"}
                    {r.membership_id && (
                      <span className="text-muted-foreground font-normal"> · {r.membership_id}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {prettyDate(r.paid_on ?? r.created_at)}
                    {r.receiver_name ? ` · collected by ${r.receiver_name}` : ""}
                    {r.source === "stripe" ? " · online" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.months_covered
                      ? `${r.months_covered} month(s) · paid to ${prettyDate(r.period_end)}`
                      : "Part payment — paid-to date unchanged"}
                    {r.advance_credit_inr ? ` · ${formatINR(r.advance_credit_inr)} credit held` : ""}
                    {r.credit_used_inr ? ` · ${formatINR(r.credit_used_inr)} credit used` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold">{formatINR(r.amount_inr)}</span>
                  <Badge className={STATE_STYLE[r.state] ?? "bg-muted text-muted-foreground"}>
                    {STATE_LABEL[r.state] ?? r.state}
                  </Badge>
                  {r.source === "cash" && r.state === "success" && (
                    <Badge variant="outline">{r.settled ? "settled" : "unsettled"}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {pickedIds.length} entr{pickedIds.length === 1 ? "y" : "ies"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes them from the ledger and from the team sheet. {pickedConfirmed > 0
                ? `${pickedConfirmed} confirmed entr${pickedConfirmed === 1 ? "y" : "ies"} will also be rolled back on the member's paid-until date and advance credit.`
                : "No confirmed payments are affected."} This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep them</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); deletePicked(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
