import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IdCard, Loader2, ReceiptText, Smartphone, CreditCard, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  formatINR, prettyDate, memberStatusOf, STATUS_LABEL, monthsCovered, coveredPeriod,
  TX_SOURCE_LABEL, TX_STATE_LABEL,
} from "@/lib/membership";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  due: "bg-amber-100 text-amber-800",
  lapsed: "bg-destructive/15 text-destructive",
  none: "bg-muted text-muted-foreground",
};

const STATE_STYLE: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-800",
  pending_verification: "bg-amber-100 text-amber-800",
  pending_approval: "bg-blue-100 text-blue-800",
  rejected: "bg-destructive/15 text-destructive",
};

export function MembershipSection({ profile }: { profile: any }) {
  const { toast } = useToast();
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState("1");
  const [paying, setPaying] = useState(false);

  // "I already paid on PhonePe / GPay" report
  const [reportOpen, setReportOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [reporting, setReporting] = useState(false);

  const fee = Number(profile?.monthly_fee_amount || 0);
  const status = memberStatusOf(profile?.paid_up_until);

  const loadTx = async () => {
    const { data } = await supabase
      .from("membership_transactions")
      .select("*")
      .eq("member_user_id", profile.user_id)
      .order("created_at", { ascending: false });
    setTxs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadTx(); }, [profile?.user_id]);

  if (!profile?.membership_id) return null;

  const payOnline = async () => {
    setPaying(true);
    const { data, error } = await supabase.functions.invoke("create-membership-checkout", {
      body: { months: Number(months) },
    });
    setPaying(false);
    const url = (data as any)?.url;
    if (error || !url) {
      toast({ title: "Couldn't start the payment", description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    window.location.href = url;
  };

  const submitReport = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast({ title: "Enter the amount you paid", variant: "destructive" });
    setReporting(true);

    let screenshotPath: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${profile.user_id}/upi-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file, { contentType: file.type });
      if (upErr) {
        setReporting(false);
        return toast({ title: "Screenshot upload failed", description: upErr.message, variant: "destructive" });
      }
      screenshotPath = path;
    }

    const m = monthsCovered(amt, fee);
    const period = coveredPeriod(profile.paid_up_until, m);
    const { error } = await supabase.from("membership_transactions").insert({
      member_user_id: profile.user_id,
      membership_id: profile.membership_id,
      amount_inr: amt,
      monthly_fee_amount: fee || null,
      months_covered: m || null,
      period_start: period?.start ?? null,
      period_end: period?.end ?? null,
      source: "direct_upi",
      state: "pending_verification",
      paid_on: paidOn || null,
      transaction_ref: ref.trim() || null,
      screenshot_path: screenshotPath,
      note: note.trim() || null,
    } as any);
    setReporting(false);
    if (error) return toast({ title: "Couldn't record your payment", description: error.message, variant: "destructive" });

    setReportOpen(false);
    setAmount(""); setRef(""); setNote(""); setFile(null);
    toast({ title: "Thank you — payment reported", description: "The office will verify it and your membership will update." });
    loadTx();
  };

  const preview = (() => {
    const m = monthsCovered(Number(amount || 0), fee);
    const p = coveredPeriod(profile.paid_up_until, m);
    if (!p) return null;
    return `${formatINR(Number(amount))} covers ${p.label} — new paid-until ${prettyDate(p.end)}`;
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IdCard className="h-5 w-5 text-primary" />
          My Hosla membership
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/40 p-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Membership ID</p>
            <p className="text-2xl font-bold tracking-[0.15em]">{profile.membership_id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge className={`${STATUS_STYLE[status]} text-base mt-1`}>{STATUS_LABEL[status]}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="text-lg font-medium">{profile.plan || "—"}{fee ? ` · ${formatINR(fee)}/month` : ""}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Paid up to</p>
            <p className="text-lg font-medium">{prettyDate(profile.paid_up_until)}</p>
          </div>
        </div>

        {status !== "active" && (
          <p className="text-base bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3">
            {status === "none"
              ? "Your fee record is not set up yet. The office will help you start."
              : `Your membership fee is due. Please pay ${fee ? formatINR(fee) : "the monthly fee"} to continue.`}
          </p>
        )}

        {/* Pay */}
        {fee > 0 && (
          <div className="space-y-3">
            <Label className="text-base">Pay your fee</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={months} onValueChange={setMonths}>
                <SelectTrigger className="h-12 w-[190px] text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 6, 12].map((m) => (
                    <SelectItem key={m} value={String(m)}>{m} month{m > 1 ? "s" : ""} · {formatINR(m * fee)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={payOnline} disabled={paying} className="h-12 text-base">
                {paying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                Pay online
              </Button>

              <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-12 text-base">
                    <Smartphone className="h-4 w-4 mr-2" />
                    I paid on PhonePe / GPay
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Tell us about your payment</DialogTitle>
                    <DialogDescription>The office will verify it. A screenshot helps but is not required.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Amount paid (₹)</Label>
                      <Input inputMode="numeric" value={amount}
                        onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                        className="h-12 text-lg mt-1" placeholder={String(fee)} />
                      {preview && <p className="text-sm text-muted-foreground mt-1">{preview}</p>}
                    </div>
                    <div>
                      <Label>Date of payment</Label>
                      <Input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className="h-12 mt-1" />
                    </div>
                    <div>
                      <Label>Reference / UTR number (optional)</Label>
                      <Input value={ref} onChange={(e) => setRef(e.target.value)} className="h-12 mt-1" />
                    </div>
                    <div>
                      <Label>Screenshot (optional)</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Anything else (optional)</Label>
                      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={submitReport} disabled={reporting} className="h-12 w-full text-base">
                      {reporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Send to office
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ReceiptText className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Payment history</h3>
          </div>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : txs.length === 0 ? (
            <p className="text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="divide-y">
              {txs.map((t) => (
                <div key={t.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-lg">{formatINR(t.amount_inr)}</p>
                    <p className="text-sm text-muted-foreground">
                      {TX_SOURCE_LABEL[t.source] || t.source}
                      {t.months_covered ? ` · ${t.months_covered} month${t.months_covered > 1 ? "s" : ""}` : ""}
                      {t.period_end ? ` · up to ${prettyDate(t.period_end)}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {prettyDate(t.paid_on || t.created_at)}
                      {t.receiver_name ? ` · received by ${t.receiver_name}` : ""}
                    </p>
                    {t.rejected_reason && <p className="text-sm text-destructive mt-1">{t.rejected_reason}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge className={STATE_STYLE[t.state] || ""}>{TX_STATE_LABEL[t.state] || t.state}</Badge>
                    {t.receipt_url && (
                      <a href={t.receipt_url} target="_blank" rel="noreferrer" className="text-sm underline inline-flex items-center gap-1">
                        Receipt <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
