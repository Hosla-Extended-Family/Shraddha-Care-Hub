import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminMemberships from "@/pages/admin/Memberships";
import PlanEditor from "@/components/admin/PlanEditor";
import ReminderComposer, { type ReminderTarget } from "@/components/admin/ReminderComposer";
import SheetOnboarding from "@/components/admin/SheetOnboarding";
import MemberCredentialActions from "@/components/admin/MemberCredentialActions";
import ReceiptSmsPanel from "@/components/admin/ReceiptSmsPanel";
import { FeePaymentsLedger } from "@/components/admin/FeePaymentsLedger";
import { AuthorAvatar } from "@/components/blog/AuthorAvatar";
import { usePlanPrices } from "@/hooks/use-plan-prices";
import { PLANS, defaultAmount, monthlyEquivalent, planLabel, priceFor, type BillingCycle } from "@/lib/membership-plans";
import { Loader2, Search, HandCoins, BellRing, IdCard, UserPlus, AlertTriangle, CalendarClock, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/use-admin-role";
import {
  formatINR, prettyDate, memberStatusOf, STATUS_LABEL, monthsCovered, coveredPeriod, makeMembershipId,
} from "@/lib/membership";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  due: "bg-amber-100 text-amber-800",
  lapsed: "bg-destructive/15 text-destructive",
  none: "bg-muted text-muted-foreground",
};

const monthLabel = (date: string | null | undefined) => {
  if (!date) return "\u2014";
  return new Date(date).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

const daysUntil = (date: string | null | undefined) => {
  if (!date) return null;
  return Math.round((new Date(date).getTime() - Date.now()) / 86_400_000);
};

export default function AdminMembers({ view = "full" }: { view?: "full" | "directory" }) {
  const { toast } = useToast();
  const { isMainAdmin } = useAdminRole();
  const { prices, rows: priceRows, upcoming, reload: reloadPrices } = usePlanPrices();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [q, setQ] = useState("");

  // Cash collection dialog
  const [cashFor, setCashFor] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [saving, setSaving] = useState(false);

  // New member dialog
  const [newOpen, setNewOpen] = useState(false);
  const [nName, setNName] = useState("");
  const [nPhone, setNPhone] = useState("");
  const [nPlan, setNPlan] = useState<string>("standard-non-metro");
  const [nCycle, setNCycle] = useState<BillingCycle>("monthly");
  const [nFee, setNFee] = useState("");
  const [nLastPaid, setNLastPaid] = useState("");
  const [creating, setCreating] = useState(false);
  const [issued, setIssued] = useState<{ membership_id: string; password: string; upgraded?: boolean } | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<{ full_name: string | null; status: string | null } | null>(null);

  // Remove-from-directory dialog
  const [removeFor, setRemoveFor] = useState<any>(null);
  const [removing, setRemoving] = useState(false);

  // Selection + reminders
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTargets, setComposerTargets] = useState<ReminderTarget[]>([]);
  const [sending, setSending] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);

  const load = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone_e164, email, membership_id, plan, monthly_fee_amount, paid_up_until, last_paid_month, member_status, chapter, avatar_url")
      .not("membership_id", "is", null)
      .order("full_name");
    setMembers(data ?? []);
    if (uid) {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("user_id", uid).maybeSingle();
      setReceiver(p?.full_name || "");
    }
    setLoading(false);
  };

  const loadSchedules = async () => {
    const { data } = await supabase
      .from("scheduled_reminders")
      .select("id, user_ids, message, scheduled_for, status, sent_count, skipped_count")
      .order("scheduled_for", { ascending: false })
      .limit(20);
    setSchedules(data ?? []);
  };

  useEffect(() => {
    load();
    // Fire off any queued reminders whose time has passed.
    supabase.functions.invoke("send-fee-reminders", { body: { action: "run_due" } })
      .finally(() => loadSchedules());
  }, []);

  // Keep the new-member fee in step with the live pricing — unless the admin typed their own amount.
  const feeEdited = useRef(false);
  const planPricingKey = `${nPlan}|${nCycle}|${defaultAmount(nPlan, nCycle, prices)}`;
  useEffect(() => {
    if (feeEdited.current) return;
    setNFee(defaultAmount(nPlan, nCycle, prices));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planPricingKey]);


  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((m) =>
      [m.full_name, m.membership_id, m.phone_e164].filter(Boolean).some((v: string) => String(v).toLowerCase().includes(needle))
    );
  }, [members, q]);

  const dueMembers = members.filter((m) => memberStatusOf(m.paid_up_until) !== "active");
  const renewals = useMemo(() => {
    return [...members]
      .filter((m) => m.paid_up_until)
      .sort((a, b) => String(a.paid_up_until).localeCompare(String(b.paid_up_until)));
  }, [members]);

  const selectedList = members.filter((m) => selected[m.user_id]);
  const toTargets = (list: any[]): ReminderTarget[] => list.map((m) => ({
    user_id: m.user_id, full_name: m.full_name, membership_id: m.membership_id,
    monthly_fee_amount: m.monthly_fee_amount, paid_up_until: m.paid_up_until,
  }));

  const openComposer = (list: any[]) => {
    if (list.length === 0) return toast({ title: "Nobody selected" });
    setComposerTargets(toTargets(list));
    setComposerOpen(true);
  };

  const openCash = (m: any) => {
    setCashFor(m);
    setAmount(String(m.monthly_fee_amount || ""));
  };

  const cashPreview = (() => {
    if (!cashFor) return null;
    const months = monthsCovered(Number(amount || 0), Number(cashFor.monthly_fee_amount || 0));
    const period = coveredPeriod(cashFor.paid_up_until, months);
    if (!period) return null;
    return `${formatINR(Number(amount))} covers ${period.label} — new paid-until ${prettyDate(period.end)}`;
  })();

  const recordCash = async () => {
    if (!cashFor) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast({ title: "Enter the amount collected", variant: "destructive" });
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("record-cash-collection", {
      body: { member_user_id: cashFor.user_id, amount_inr: amt, receiver_name: receiver },
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      return toast({ title: "Couldn't record it", description: (data as any)?.error || error?.message, variant: "destructive" });
    }
    setCashFor(null);
    toast({ title: "Collection recorded", description: "The member has a receipt. It goes to the main admin for settlement." });
  };

  const submitMember = async (allowUpgrade: boolean) => {
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("member-credentials", {
      body: {
        action: "create_member",
        name: nName.trim(),
        phone: nPhone.replace(/\D/g, ""),
        plan: nPlan,
        monthly_fee_amount: monthlyEquivalent(Number(nFee), nCycle),
        last_paid_month: nLastPaid || null,
        allow_upgrade: allowUpgrade,
      },
    });
    setCreating(false);
    const payload = data as any;

    if (payload?.needs_confirmation) {
      setUpgradeInfo({ full_name: payload.full_name ?? null, status: payload.status ?? null });
      return;
    }
    if (error || payload?.error) {
      return toast({ title: "Couldn't create the member", description: payload?.error || error?.message, variant: "destructive" });
    }
    setUpgradeInfo(null);
    setIssued({ membership_id: payload.membership_id, password: payload.password, upgraded: payload.upgraded });
    setNName(""); setNPhone(""); setNLastPaid("");
    load();
  };

  const createMember = async () => {
    if (!nName.trim() || nPhone.replace(/\D/g, "").length < 10) {
      return toast({ title: "Enter a name and 10-digit phone", variant: "destructive" });
    }
    // Warn first when the phone already belongs to an account (e.g. a blog writer).
    const { data } = await supabase.functions.invoke("member-credentials", {
      body: { action: "check_phone", phone: nPhone.replace(/\D/g, "") },
    });
    const check = data as any;
    if (check?.outcome === "member_exists") {
      return toast({
        title: "Already a member",
        description: `This phone belongs to ${check.membership_id}.`,
        variant: "destructive",
      });
    }
    if (check?.outcome === "upgrade") {
      return setUpgradeInfo({ full_name: check.full_name ?? null, status: check.status ?? null });
    }
    submitMember(false);
  };

  const removeMember = async () => {
    if (!removeFor) return;
    setRemoving(true);
    const { data, error } = await supabase.functions.invoke("member-credentials", {
      body: { action: "remove_member", user_id: removeFor.user_id },
    });
    setRemoving(false);
    if (error || (data as any)?.error) {
      return toast({ title: "Couldn't remove the member", description: (data as any)?.error || error?.message, variant: "destructive" });
    }
    setRemoveFor(null);
    setSelected({});
    toast({
      title: "Removed from the directory",
      description: "They appear again under “Create profiles from the Active Members sheet”.",
    });
    load();
  };

  const memberRow = (m: any, opts: { renewal?: boolean } = {}) => {
    const status = memberStatusOf(m.paid_up_until);
    const dLeft = daysUntil(m.paid_up_until);
    return (
      <div key={m.user_id} className="py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Checkbox
            className="mt-1"
            checked={!!selected[m.user_id]}
            onCheckedChange={(v) => setSelected((s) => ({ ...s, [m.user_id]: !!v }))}
            aria-label={`Select ${m.full_name}`}
          />
          <AuthorAvatar avatarPath={m.avatar_url} name={m.full_name} className="h-10 w-10" />
          <div className="min-w-0">
            <p className="font-medium">{m.full_name || "—"} <span className="text-muted-foreground font-normal">· {m.membership_id}</span></p>
            <p className="text-xs text-muted-foreground font-mono">password ••••••••</p>
            <p className="text-sm text-muted-foreground">
              {planLabel(m.plan)}{m.monthly_fee_amount ? ` · ${formatINR(m.monthly_fee_amount)}/month` : ""} · last paid {m.last_paid_month ? monthLabel(m.last_paid_month) : "never"} · paid up to {prettyDate(m.paid_up_until)}
              {opts.renewal && dLeft !== null && (
                <span className="text-foreground">
                  {" · "}{dLeft >= 0 ? `renews in ${dLeft} day${dLeft === 1 ? "" : "s"}` : `overdue by ${Math.abs(dLeft)} days`}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={STATUS_STYLE[status]}>{STATUS_LABEL[status]}</Badge>
          <Button size="sm" variant="outline" className="h-10" onClick={() => openCash(m)}>
            <HandCoins className="h-4 w-4 mr-1" /> Record cash
          </Button>
          <Button size="sm" variant="ghost" className="h-10" onClick={() => openComposer([m])} disabled={sending}>
            <BellRing className="h-4 w-4" />
          </Button>
          <MemberCredentialActions member={m} isMainAdmin={isMainAdmin} onChanged={load} />
          <Button size="sm" variant="ghost" className="h-10 text-destructive hover:text-destructive"
            onClick={() => setRemoveFor(m)} aria-label={`Remove ${m.full_name} from the directory`}>
            <UserMinus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const directorySection = (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><IdCard className="h-5 w-5 text-primary" /> Member directory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, Membership ID or phone" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-11" />
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 pb-3 text-sm">
            <Checkbox
              checked={filtered.every((m) => selected[m.user_id])}
              onCheckedChange={(v) => setSelected((s) => {
                const next = { ...s };
                filtered.forEach((m) => { next[m.user_id] = !!v; });
                return next;
              })}
              aria-label="Select all"
            />
            <span className="text-muted-foreground">Select all shown</span>
          </div>
        )}
        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center">No members found.</p>
        ) : (
          <div className="divide-y">{filtered.map((m) => memberRow(m))}</div>
        )}
      </CardContent>
    </Card>
  );

  const selectionBar = selectedList.length > 0 && (
    <div className="sticky top-2 z-10 rounded-lg border bg-card shadow-sm p-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm">{selectedList.length} member(s) selected</p>
      <div className="flex gap-2">
        <Button size="sm" className="h-10" onClick={() => openComposer(selectedList)}>
          <BellRing className="h-4 w-4 mr-2" /> Send reminders
        </Button>
        <Button size="sm" variant="ghost" className="h-10" onClick={() => setSelected({})}>Clear</Button>
      </div>
    </div>
  );


  if (view === "directory") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold">Collect fees</h1>
            <p className="text-muted-foreground">Search a member, tap “Record cash”, done. Handy on the road — bookmark this page.</p>
          </div>
          <Button onClick={() => { setIssued(null); setUpgradeInfo(null); setNewOpen(true); }} className="h-11">
            <UserPlus className="h-4 w-4 mr-2" /> New member
          </Button>
        </div>
        {selectionBar}
        {directorySection}
        {renderDialogs()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Members &amp; Fee Management</h1>
          <p className="text-muted-foreground">Member accounts, plans &amp; pricing, cash collections, renewals, reminders and card applications — all in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setIssued(null); setUpgradeInfo(null); setNewOpen(true); }} className="h-11">
            <UserPlus className="h-4 w-4 mr-2" /> New member
          </Button>
          <Button variant="outline" className="h-11" disabled={dueMembers.length === 0}
            onClick={() => openComposer(dueMembers)}>
            <BellRing className="h-4 w-4 mr-2" /> Remind all due ({dueMembers.length})
          </Button>
        </div>
      </div>

      {selectionBar}

      <Tabs defaultValue="members">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="members">Members &amp; fees</TabsTrigger>
          <TabsTrigger value="renewals">Renewals</TabsTrigger>
          <TabsTrigger value="payments">Fee payments</TabsTrigger>
          <TabsTrigger value="onboarding">Add from sheet</TabsTrigger>
          <TabsTrigger value="plans">Plans &amp; pricing</TabsTrigger>
          <TabsTrigger value="applications">Card applications</TabsTrigger>
        </TabsList>


        <TabsContent value="applications" className="mt-4">
          <AdminMemberships />
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <PlanEditor rows={priceRows} upcoming={upcoming} prices={prices} onSaved={reloadPrices} />
        </TabsContent>

        <TabsContent value="renewals" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" /> Renewals by due date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button size="sm" variant="outline" className="h-10"
                  onClick={() => setSelected(Object.fromEntries(renewals.filter((m) => {
                    const d = daysUntil(m.paid_up_until); return d !== null && d <= 30;
                  }).map((m) => [m.user_id, true])))}>
                  Select due within 30 days
                </Button>
                <Button size="sm" variant="outline" className="h-10"
                  onClick={() => setSelected(Object.fromEntries(dueMembers.map((m) => [m.user_id, true])))}>
                  Select overdue
                </Button>
              </div>
              {renewals.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center">No members with a paid-until date yet.</p>
              ) : (
                <div className="divide-y">{renewals.map((m) => memberRow(m, { renewal: true }))}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Scheduled &amp; recent reminder batches</CardTitle></CardHeader>
            <CardContent className="divide-y">
              {schedules.length === 0 ? (
                <p className="text-muted-foreground py-4">No scheduled batches.</p>
              ) : schedules.map((s) => (
                <div key={s.id} className="py-3 text-sm flex flex-wrap items-center justify-between gap-2">
                  <span>{(s.user_ids ?? []).length} member(s) · {new Date(s.scheduled_for).toLocaleString("en-IN")}</span>
                  <Badge variant="outline">
                    {s.status === "sent" ? `sent ${s.sent_count ?? 0}` : s.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="members" className="mt-4 space-y-6">
          {directorySection}

          {isMainAdmin && (
            <p className="text-sm text-muted-foreground">
              Approvals, cash settlement and credential overrides live in the main-admin console.
            </p>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-6">
          <FeePaymentsLedger isMainAdmin={isMainAdmin} />
          <ReceiptSmsPanel />
        </TabsContent>

        <TabsContent value="onboarding" className="mt-4">
          <SheetOnboarding onCreated={load} />
        </TabsContent>
      </Tabs>

      {renderDialogs()}
    </div>
  );

  function renderDialogs() {
    return (
      <>
      <ReminderComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        targets={composerTargets}
        onDone={() => { setSelected({}); loadSchedules(); }}
      />

      {/* Cash collection: three fields only */}
      <Dialog open={!!cashFor} onOpenChange={(o) => !o && setCashFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record cash collection</DialogTitle>
            <DialogDescription>{cashFor?.full_name} · {cashFor?.membership_id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount collected (₹)</Label>
              <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                className="h-12 text-lg mt-1" />
            </div>
            <div>
              <Label>Received by</Label>
              <Input value={receiver} onChange={(e) => setReceiver(e.target.value)} className="h-12 mt-1" />
            </div>
            <div className="rounded-lg bg-muted/50 border p-3 text-sm space-y-1">
              <p>Plan: <strong>{planLabel(cashFor?.plan)}</strong> · Monthly fee: <strong>{formatINR(cashFor?.monthly_fee_amount)}</strong></p>
              <p>Currently paid up to: <strong>{prettyDate(cashFor?.paid_up_until)}</strong></p>
              {cashPreview && <p className="text-foreground">{cashPreview}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={recordCash} disabled={saving} className="h-12 w-full text-base">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <HandCoins className="h-4 w-4 mr-2" />}
              Record collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New member */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New member account</DialogTitle>
            <DialogDescription>A Membership ID and password are generated for the member.</DialogDescription>
          </DialogHeader>
          {issued ? (
            <div className="space-y-3">
              {issued.upgraded && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  This phone already had an account (a blog writer or past sign-up). It was upgraded to a
                  member account and the change is recorded in the audit log.
                </div>
              )}
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Membership ID</p>
                <p className="text-2xl font-bold tracking-[0.15em]">{issued.membership_id}</p>
                <p className="text-sm text-muted-foreground mt-3">Temporary password</p>
                <p className="text-xl font-mono">{issued.password}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Share these with the member on WhatsApp or by a call — the password is shown only once.
                They can change it in their profile.
              </p>
              <Button className="h-11 w-full" onClick={() => { setIssued(null); setNewOpen(false); }}>Done</Button>
            </div>
          ) : upgradeInfo ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm space-y-2">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <AlertTriangle className="h-4 w-4" /> This phone already has an account
                </p>
                <p>
                  Existing account: <strong>{upgradeInfo.full_name || "Unnamed"}</strong>
                  {upgradeInfo.status ? ` · ${upgradeInfo.status}` : ""}
                </p>
                <p>
                  Continuing will upgrade that same account into a member — their blogs and history stay,
                  a Membership ID is issued, and a new password replaces the old one. The upgrade is written
                  to the audit log with the old and new details.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12" onClick={() => setUpgradeInfo(null)}>Cancel</Button>
                <Button className="h-12" disabled={creating} onClick={() => submitMember(true)}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Upgrade account
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Full name</Label>
                  <Input value={nName} onChange={(e) => setNName(e.target.value)} className="h-12 mt-1" />
                </div>
                <div>
                  <Label>Phone (10 digits)</Label>
                  <Input inputMode="numeric" value={nPhone} onChange={(e) => setNPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="h-12 mt-1" />
                </div>
                <div>
                  <Label>Plan</Label>
                  <Select value={nPlan} onValueChange={(v) => { feeEdited.current = false; setNPlan(v); }}>
                    <SelectTrigger className="h-12 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLANS.map((p) => (
                        <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Billing</Label>
                    <Select value={nCycle} onValueChange={(v) => { feeEdited.current = false; setNCycle(v as BillingCycle); }}>
                      <SelectTrigger className="h-12 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount (₹ / {nCycle === "monthly" ? "month" : "year"})</Label>
                    <Input inputMode="numeric" value={nFee}
                      onChange={(e) => { feeEdited.current = true; setNFee(e.target.value.replace(/\D/g, "")); }}
                      placeholder={nPlan.startsWith("premium") ? "Custom amount" : ""} className="h-12 mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">Editable — type any amount this member pays.</p>
                  </div>
                </div>

                <div>
                  <Label>Last paid month</Label>
                  <Input type="month" value={nLastPaid} onChange={(e) => setNLastPaid(e.target.value)} className="h-12 mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    The month their fee is paid up to. Leave blank for a brand-new member who has not paid yet.
                  </p>
                </div>
                {nCycle === "yearly" && Number(nFee) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Charged as <strong>{formatINR(monthlyEquivalent(Number(nFee), "yearly"))}/month</strong> in the fee ledger.
                  </p>
                )}
                {nName && nPhone.length === 10 && (
                  <p className="text-sm text-muted-foreground">
                    Membership ID will be <strong>{makeMembershipId(nName, nPhone)}</strong>
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={createMember} disabled={creating} className="h-12 w-full text-base">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Create account
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove from directory */}
      <Dialog open={!!removeFor} onOpenChange={(o) => !o && setRemoveFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Remove {removeFor?.full_name} from the directory?</DialogTitle>
            <DialogDescription>
              Their Membership ID, plan, fee and paid-until dates are cleared. Their login stays, and because
              they are in the Active Members sheet they will reappear above under “Create profiles from the
              Active Members sheet”, ready to be set up again.
            </DialogDescription>
          </DialogHeader>
          {removeFor && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{removeFor.membership_id}</p>
              <p className="text-muted-foreground">
                {planLabel(removeFor.plan)} · last paid {removeFor.last_paid_month ? monthLabel(removeFor.last_paid_month) : "never"}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" className="h-11" onClick={() => setRemoveFor(null)}>Cancel</Button>
            <Button variant="destructive" className="h-11" onClick={removeMember} disabled={removing}>
              {removing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserMinus className="h-4 w-4 mr-2" />}
              Remove member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    );
  }
}
