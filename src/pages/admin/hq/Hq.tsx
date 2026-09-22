import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, Lock, Check, X, Banknote, KeyRound, Download, ScrollText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminAccountsPanel from "@/components/admin/AdminAccountsPanel";
import { usePlanPrices } from "@/hooks/use-plan-prices";
import { PLANS, defaultAmount, monthlyEquivalent, priceFor, type BillingCycle } from "@/lib/membership-plans";
import { formatINR, prettyDate, TX_SOURCE_LABEL, TX_STATE_LABEL } from "@/lib/membership";

export default function Hq() {
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const [pending, setPending] = useState<any[]>([]);
  const [cash, setCash] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [imports, setImports] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);

  // Activate dialog — plan / fee / last paid month for a staged row
  const { prices } = usePlanPrices();
  const [activateRow, setActivateRow] = useState<any>(null);
  const [aPlan, setAPlan] = useState("standard-non-metro");
  const [aCycle, setACycle] = useState<BillingCycle>("monthly");
  const [aFee, setAFee] = useState("");
  const [aLastPaid, setALastPaid] = useState("");

  useEffect(() => { setAFee(defaultAmount(aPlan, aCycle, prices)); }, [aPlan, aCycle, prices]);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (uid) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
        if ((data ?? []).some((r: any) => r.role === "main_admin")) {
          setUnlocked(true);
          loadAll();
        }
      }
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const loadAll = async () => {
    const [tx, req, imp, log] = await Promise.all([
      supabase.from("membership_transactions").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("credential_requests").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("member_imports").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("membership_audit_log").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    const all = tx.data ?? [];
    setPending(all.filter((t: any) => t.state === "pending_verification" || t.state === "pending_approval"));
    setCash(all.filter((t: any) => t.source === "cash" && !t.settled));
    setRequests(req.data ?? []);
    setImports(imp.data ?? []);
    setAudit(log.data ?? []);
  };

  const unlock = async () => {
    if (!username.trim() || !password) {
      return toast({ title: "Enter your main admin ID and password", variant: "destructive" });
    }
    setUnlocking(true);
    const { data, error } = await supabase.functions.invoke("admin-auth", {
      body: { action: "login", console: true, username: username.trim(), password },
    });
    const payload = data as any;
    if (error || !payload?.session) {
      setUnlocking(false);
      return toast({ title: "Console locked", description: payload?.error || error?.message, variant: "destructive" });
    }
    const { error: setErr } = await supabase.auth.setSession({
      access_token: payload.session.access_token,
      refresh_token: payload.session.refresh_token,
    });
    setUnlocking(false);
    if (setErr) return toast({ title: "Couldn't start your session", description: setErr.message, variant: "destructive" });
    setUnlocked(true);
    setPassword("");
    loadAll();
  };


  const review = async (body: Record<string, unknown>, okMsg: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("review-transaction", { body });
    setBusy(false);
    if (error || (data as any)?.error) {
      return toast({ title: "Action failed", description: (data as any)?.error || error?.message, variant: "destructive" });
    }
    toast({ title: okMsg });
    loadAll();
  };

  const reviewRequest = async (id: string, approve: boolean) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("member-credentials", {
      body: { action: "review_request", request_id: id, approve },
    });
    setBusy(false);
    const payload = data as any;
    if (error || payload?.error) {
      return toast({ title: "Action failed", description: payload?.error || error?.message, variant: "destructive" });
    }
    if (payload?.password) setIssued(`${payload.membership_id ?? "Member"} — new password: ${payload.password}`);
    toast({ title: approve ? "Request approved" : "Request rejected" });
    loadAll();
  };

  const runImport = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("import-members", { body: { action, ...extra } });
    setBusy(false);
    const payload = data as any;
    if (error || payload?.error) {
      return toast({ title: "Import failed", description: payload?.error || error?.message, variant: "destructive" });
    }
    if (payload?.password) setIssued(`${payload.membership_id} — temporary password: ${payload.password}`);
    toast({ title: action === "prepare" ? `${payload.added ?? 0} rows staged` : "Member activated" });
    loadAll();
  };

  const cashByReceiver = cash.reduce((acc: Record<string, any[]>, t: any) => {
    const k = t.receiver_name || "Unknown";
    (acc[k] ||= []).push(t);
    return acc;
  }, {});

  if (checking) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-sm w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-serif text-xl">Main admin console</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Main admin ID</Label>
              <Input value={username} autoCapitalize="none" autoComplete="username"
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
                className="h-12 mt-1" autoFocus />
            </div>
            <div>
              <Label>Password</Label>
              <PasswordInput value={password} autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && unlock()} className="h-12 mt-1" />
            </div>
            <Button onClick={unlock} disabled={unlocking} className="h-12 w-full">
              {unlocking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Sign in
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              These credentials are separate from the normal admin login.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-5xl px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" /> Main admin console
            </h1>
            <p className="text-muted-foreground">Approvals, cash settlement, credentials and imports.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="h-11"><Link to="/admin/dashboard">Team panel</Link></Button>
            <Button variant="ghost" className="h-11" onClick={() => setUnlocked(false)}>Lock</Button>
          </div>
        </div>

        {issued && (
          <div className="rounded-lg border bg-card p-4">
            <p className="font-mono text-lg">{issued}</p>
            <p className="text-sm text-muted-foreground mt-1">Shown once — note it down, then dismiss.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setIssued(null)}>Dismiss</Button>
          </div>
        )}

        <Tabs defaultValue="approvals">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="approvals">Approvals ({pending.length})</TabsTrigger>
            <TabsTrigger value="cash">Cash settlement ({cash.length})</TabsTrigger>
            <TabsTrigger value="credentials">Credentials ({requests.length})</TabsTrigger>
            <TabsTrigger value="imports">Imports</TabsTrigger>
            <TabsTrigger value="admins">Admin accounts</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Payments waiting for you</CardTitle></CardHeader>
              <CardContent>
                {pending.length === 0 ? <p className="text-muted-foreground">Nothing pending.</p> : (
                  <div className="divide-y">
                    {pending.map((t) => (
                      <div key={t.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{formatINR(t.amount_inr)} · {t.membership_id}</p>
                          <p className="text-sm text-muted-foreground">
                            {TX_SOURCE_LABEL[t.source] || t.source} · {TX_STATE_LABEL[t.state]}
                            {t.months_covered ? ` · ${t.months_covered} month(s)` : ""}
                            {t.period_end ? ` · up to ${prettyDate(t.period_end)}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {prettyDate(t.paid_on || t.created_at)}{t.receiver_name ? ` · received by ${t.receiver_name}` : ""}
                            {t.transaction_ref ? ` · ref ${t.transaction_ref}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-10" disabled={busy}
                            onClick={() => review({ action: "approve", transaction_id: t.id }, "Payment approved")}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-10" disabled={busy}
                            onClick={() => {
                              const reason = window.prompt("Reason for rejecting?") || "Not verified";
                              review({ action: "reject", transaction_id: t.id, reason }, "Payment rejected");
                            }}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cash" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" /> Floating cash</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {Object.keys(cashByReceiver).length === 0 ? <p className="text-muted-foreground">All cash is settled.</p> : (
                  Object.entries(cashByReceiver).map(([receiver, list]) => {
                    const total = (list as any[]).reduce((s, t) => s + Number(t.amount_inr || 0), 0);
                    return (
                      <div key={receiver} className="rounded-lg border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{receiver}</p>
                            <p className="text-sm text-muted-foreground">{(list as any[]).length} collection(s) · {formatINR(total)} in hand</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="h-10" disabled={busy}
                              onClick={() => review({ action: "settle", transaction_ids: (list as any[]).map((t) => t.id) }, `Settled ${formatINR(total)}`)}>
                              Mark settled
                            </Button>
                            <Button size="sm" variant="outline" className="h-10 text-destructive hover:text-destructive" disabled={busy}
                              onClick={() => {
                                if (!window.confirm(`Remove all ${(list as any[]).length} floating entr${(list as any[]).length === 1 ? "y" : "ies"} for ${receiver}? This cannot be undone.`)) return;
                                review({ action: "delete_cash", transaction_ids: (list as any[]).map((t) => t.id) }, "Entries removed");
                              }}>
                              <Trash2 className="h-4 w-4 mr-1" /> Remove all
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 divide-y">
                          {(list as any[]).map((t) => (
                            <div key={t.id} className="flex items-center justify-between gap-3 py-2">
                              <p className="text-sm">
                                {formatINR(t.amount_inr)} · {t.membership_id} · {prettyDate(t.created_at)} · {TX_STATE_LABEL[t.state]}
                              </p>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" disabled={busy}
                                aria-label="Remove entry"
                                onClick={() => {
                                  if (!window.confirm(`Remove this ${formatINR(t.amount_inr)} entry? This cannot be undone.`)) return;
                                  review({ action: "delete_cash", transaction_ids: [t.id] }, "Entry removed");
                                }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credentials" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Password requests</CardTitle></CardHeader>
              <CardContent>
                {requests.length === 0 ? <p className="text-muted-foreground">No pending requests.</p> : (
                  <div className="divide-y">
                    {requests.map((r) => (
                      <div key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {r.target_membership_id || r.target_user_id}
                            <span className="ml-2 text-xs font-normal rounded-full bg-muted px-2 py-0.5">
                              {r.kind === "password_view" ? "wants to see the password" : "wants a password reset"}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Asked by {r.requested_by_name || "an admin"} · {prettyDate(r.created_at)}
                          </p>
                          {r.reason && <p className="text-sm">{r.reason}</p>}
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" className="h-10" disabled={busy} onClick={() => reviewRequest(r.id, true)}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-10" disabled={busy} onClick={() => reviewRequest(r.id, false)}>Reject</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="imports" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Download className="h-5 w-5 text-primary" /> Existing members</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Button className="h-11" disabled={busy} onClick={() => runImport("prepare")}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Stage from members sheet & approved applications
                </Button>
                {imports.length === 0 ? <p className="text-muted-foreground">Nothing staged yet.</p> : (
                  <div className="divide-y">
                    {imports.map((r) => (
                      <div key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{r.name} <span className="text-muted-foreground font-normal">· {r.membership_id || "no ID yet"}</span></p>
                          <p className="text-sm text-muted-foreground">{r.source} · {r.phone_digits || "no phone"} · {r.plan || "no plan"}</p>
                        </div>
                        {r.status === "activated" ? (
                          <Badge className="bg-emerald-100 text-emerald-800">Activated</Badge>
                        ) : (
                          <Button size="sm" className="h-10" disabled={busy} onClick={() => {
                            setActivateRow(r);
                            setAPlan(r.plan || "standard-non-metro");
                            setACycle("monthly");
                            setALastPaid(r.last_paid_month ? String(r.last_paid_month).slice(0, 7) : "");
                          }}>
                            Activate
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins" className="mt-4">
            <AdminAccountsPanel />
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ScrollText className="h-5 w-5 text-primary" /> Recent activity</CardTitle></CardHeader>
              <CardContent>
                <div className="divide-y">
                  {audit.map((a) => (
                    <div key={a.id} className="py-2 text-sm">
                      <span className="font-medium">{a.action}</span> · {a.actor_name || a.actor_id} · {new Date(a.created_at).toLocaleString()}
                      {a.entity ? ` · ${a.entity}` : ""}
                    </div>
                  ))}
                  {audit.length === 0 && <p className="text-muted-foreground">Nothing yet.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Activate: fill in plan, fee and last paid month before creating the member */}
        <Dialog open={!!activateRow} onOpenChange={(o) => !o && setActivateRow(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">Activate {activateRow?.name}</DialogTitle>
              <DialogDescription>
                {activateRow?.membership_id || "Membership ID will be generated"} · {activateRow?.phone_digits || "no phone"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Plan</Label>
                <Select value={aPlan} onValueChange={setAPlan}>
                  <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
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
                  <Select value={aCycle} onValueChange={(v) => setACycle(v as BillingCycle)}>
                    <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (₹ / {aCycle === "monthly" ? "month" : "year"})</Label>
                  <Input inputMode="numeric" value={aFee}
                    onChange={(e) => setAFee(e.target.value.replace(/\D/g, ""))} className="h-11 mt-1" />
                </div>
              </div>
              <div>
                <Label>Last paid month</Label>
                <Input type="month" value={aLastPaid} onChange={(e) => setALastPaid(e.target.value)} className="h-11 mt-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank if they have not paid yet — the account starts as pending payment.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" className="h-11" onClick={() => setActivateRow(null)}>Cancel</Button>
              <Button className="h-11" disabled={busy} onClick={async () => {
                const id = activateRow.id;
                setActivateRow(null);
                await runImport("activate", {
                  import_id: id,
                  plan: aPlan,
                  monthly_fee_amount: monthlyEquivalent(Number(aFee || 0), aCycle),
                  last_paid_month: aLastPaid || null,
                });
              }}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Activate member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
