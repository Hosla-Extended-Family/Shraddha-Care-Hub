import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthorAvatar } from "@/components/blog/AuthorAvatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, HandCoins, X, CheckCircle2, RefreshCw } from "lucide-react";
import { planLabel } from "@/lib/membership-plans";
import {
  formatINR, prettyDate, memberStatusOf, STATUS_LABEL, applyPayment, creditNote,
} from "@/lib/membership";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  due: "bg-amber-100 text-amber-800",
  lapsed: "bg-destructive/15 text-destructive",
  none: "bg-muted text-muted-foreground",
};

type Member = {
  user_id: string;
  full_name: string | null;
  phone_e164: string | null;
  membership_id: string | null;
  plan: string | null;
  monthly_fee_amount: number | null;
  paid_up_until: string | null;
  credit_balance_inr: number | null;
  avatar_url: string | null;
};

/**
 * Mobile-first fee collection page for volunteers on the road:
 * sticky search, thumb-sized member cards and a one-tap cash sheet.
 */
export default function AdminCollectFees() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [onlyDue, setOnlyDue] = useState(false);

  const [cashFor, setCashFor] = useState<Member | null>(null);
  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [saving, setSaving] = useState(false);
  const [doneFor, setDoneFor] = useState<Record<string, boolean>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const load = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone_e164, membership_id, plan, monthly_fee_amount, paid_up_until, credit_balance_inr, avatar_url")
      .not("membership_id", "is", null)
      .order("full_name");
    setMembers((data ?? []) as Member[]);
    if (uid) {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("user_id", uid).maybeSingle();
      setReceiver(p?.full_name || "");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = members;
    if (needle) {
      list = list.filter((m) =>
        [m.full_name, m.membership_id, m.phone_e164]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle))
      );
    }
    if (onlyDue) list = list.filter((m) => memberStatusOf(m.paid_up_until) !== "active");
    return list;
  }, [members, q, onlyDue]);

  const openCash = (m: Member) => {
    setCashFor(m);
    setDuplicateWarning(null);
    setAmount(String(m.monthly_fee_amount || ""));
  };

  // Preview folds in any advance credit the member is already carrying.
  const cashPreview = (() => {
    if (!cashFor) return null;
    const carried = Number(cashFor.credit_balance_inr || 0);
    const outcome = applyPayment({
      amount: Number(amount || 0),
      monthlyFee: cashFor.monthly_fee_amount,
      paidUpUntil: cashFor.paid_up_until,
      creditBalance: carried,
    });
    return {
      months: outcome.months,
      label: outcome.periodLabel,
      end: outcome.paidUntil ? prettyDate(outcome.paidUntil) : null,
      carried,
      creditUsed: outcome.creditUsed,
      note: creditNote(outcome.creditLeft),
    };
  })();

  const recordCash = async (confirmDuplicate = false) => {
    if (!cashFor) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast({ title: "Enter the amount collected", variant: "destructive" });
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("record-cash-collection", {
      body: {
        member_user_id: cashFor.user_id, amount_inr: amt, receiver_name: receiver,
        confirm_duplicate: confirmDuplicate,
      },
    });
    setSaving(false);
    // A very recent entry for the same member needs a second tap to go through.
    if ((data as any)?.duplicate_warning) {
      setDuplicateWarning((data as any).message as string);
      return;
    }
    if (error || (data as any)?.error) {
      return toast({ title: "Couldn't record it", description: (data as any)?.error || error?.message, variant: "destructive" });
    }
    setDuplicateWarning(null);
    setDoneFor((d) => ({ ...d, [cashFor.user_id]: true }));
    setCashFor(null);
    toast({ title: "Collection recorded", description: "Receipt SMS sent. It goes to the main admin for settlement." });
    load();
  };

  const quickAmounts = (m: Member | null) => {
    const fee = Number(m?.monthly_fee_amount || 0);
    if (!fee) return [];
    return [1, 2, 3, 6, 12].map((n) => ({ months: n, value: fee * n }));
  };

  return (
    <div className="pb-24 md:pb-6 w-full max-w-2xl mx-auto overflow-x-hidden">
      {/* Sticky header: title + search always in reach */}
      <div className="sticky top-14 lg:top-0 -mx-4 md:mx-0 px-4 md:px-0 pt-2 pb-3 bg-background/95 backdrop-blur z-20 border-b md:border-0">

        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h1 className="font-serif text-xl md:text-3xl font-bold leading-tight">Collect fees</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              Search a member, tap Record cash. Bookmark this page.
            </p>
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={load} aria-label="Refresh list">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search name, ID or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            inputMode="search"
            autoComplete="off"
            className="pl-10 pr-10 h-14 text-base rounded-xl"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Button
            size="sm"
            variant={onlyDue ? "default" : "outline"}
            className="h-10 rounded-full shrink-0"
            onClick={() => setOnlyDue((v) => !v)}
          >
            Due &amp; lapsed only
          </Button>
          <span className="text-xs text-muted-foreground shrink-0 px-1">{filtered.length} shown</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No members found.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((m) => {
            const status = memberStatusOf(m.paid_up_until);
            return (
              <li key={m.user_id} className="rounded-xl border bg-card p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <AuthorAvatar avatarPath={m.avatar_url} name={m.full_name} className="h-11 w-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-tight truncate">{m.full_name || "—"}</p>
                      <Badge className={`${STATUS_STYLE[status]} shrink-0`}>{STATUS_LABEL[status]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {m.membership_id}{m.phone_e164 ? ` · ${m.phone_e164.replace("+91", "")}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {planLabel(m.plan)}
                      {m.monthly_fee_amount ? ` · ${formatINR(m.monthly_fee_amount)}/mo` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">Paid up to {prettyDate(m.paid_up_until)}</p>
                  </div>
                </div>
                <Button
                  className="mt-3 h-12 w-full text-base rounded-xl"
                  variant={doneFor[m.user_id] ? "outline" : "default"}
                  onClick={() => openCash(m)}
                >
                  {doneFor[m.user_id]
                    ? <><CheckCircle2 className="h-5 w-5 mr-2" /> Recorded · add another</>
                    : <><HandCoins className="h-5 w-5 mr-2" /> Record cash</>}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Cash sheet — full-width on phones, dialog on desktop */}
      <Dialog open={!!cashFor} onOpenChange={(o) => !o && setCashFor(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="font-serif pr-8">Record cash collection</DialogTitle>
            <DialogDescription>{cashFor?.full_name} · {cashFor?.membership_id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 min-w-0">
            <div className="min-w-0">
              <Label>Amount collected (₹)</Label>
              <Input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                className="h-14 text-2xl font-semibold mt-1 rounded-xl w-full"
              />
              <div className="flex flex-wrap gap-2 mt-2">

                {quickAmounts(cashFor).map((qa) => (
                  <Button
                    key={qa.months}
                    type="button"
                    size="sm"
                    variant={Number(amount) === qa.value ? "default" : "outline"}
                    className="h-10 rounded-full shrink-0"
                    onClick={() => setAmount(String(qa.value))}
                  >
                    {qa.months} mo · ₹{qa.value}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Received by</Label>
              <Input value={receiver} onChange={(e) => setReceiver(e.target.value)} className="h-12 mt-1 rounded-xl" />
            </div>
            <div className="rounded-xl bg-muted/50 border p-3 text-sm space-y-1">
              <p>Monthly fee: <strong>{formatINR(cashFor?.monthly_fee_amount)}</strong></p>
              <p>Currently paid up to: <strong>{prettyDate(cashFor?.paid_up_until)}</strong></p>
              {!!cashPreview?.carried && (
                <p>Advance credit in hand: <strong>{formatINR(cashPreview.carried)}</strong></p>
              )}
              {cashPreview && cashPreview.months > 0 && (
                <p className="text-foreground">
                  Covers <strong>{cashPreview.label}</strong> — new paid-until <strong>{cashPreview.end}</strong>
                </p>
              )}
              {cashPreview && cashPreview.months === 0 && Number(amount) > 0 && (
                <p className="text-foreground">Part payment — paid-until stays the same.</p>
              )}
              {cashPreview?.note && <p className="text-foreground">{cashPreview.note}.</p>}
            </div>
            {duplicateWarning && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                {duplicateWarning}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => recordCash(!!duplicateWarning)}
              disabled={saving}
              className="h-14 w-full text-base rounded-xl"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <HandCoins className="h-5 w-5 mr-2" />}
              {duplicateWarning ? "Yes, record it anyway" : "Record collection"}
            </Button>
            <Button variant="ghost" className="h-11 w-full" onClick={() => setCashFor(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
