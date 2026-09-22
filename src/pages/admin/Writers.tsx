import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, Phone, Search, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { toE164, validatePhone } from "@/lib/phone-auth";

type Writer = {
  user_id: string;
  full_name: string | null;
  phone_e164: string | null;
  country_code: string | null;
  status: "pending" | "approved" | "rejected";
  rejected_reason: string | null;
  approved_at: string | null;
  created_at: string;
};

export default function AdminWriters() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [cleanupPhone, setCleanupPhone] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone_e164, country_code, status, rejected_reason, approved_at, created_at")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows((data as Writer[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (userId: string) => {
    setBusy(userId);
    const { error } = await supabase.rpc("admin_approve_writer", { _user_id: userId });
    setBusy(null);
    if (error) return toast({ title: "Approve failed", description: error.message, variant: "destructive" });
    toast({ title: "Writer approved" });
    load();
  };

  const reject = async (userId: string) => {
    setBusy(userId);
    const { error } = await supabase.rpc("admin_reject_writer", { _user_id: userId, _reason: rejectReason.trim() || null });
    setBusy(null);
    setRejectingId(null);
    setRejectReason("");
    if (error) return toast({ title: "Reject failed", description: error.message, variant: "destructive" });
    toast({ title: "Writer rejected" });
    load();
  };

  const deleteWriterAccount = async (writer: Writer) => {
    const label = writer.phone_e164 || writer.full_name || "this writer";
    if (!confirm(`Permanently delete ${label}? This removes the writer account, PIN, profile, and linked blogs. This cannot be undone.`)) return;
    setBusy(writer.user_id);
    const { data, error } = await supabase.functions.invoke("delete-writer-account", {
      body: { userId: writer.user_id, phoneE164: writer.phone_e164 },
    });
    setBusy(null);
    if (error || data?.error) return toast({ title: "Delete failed", description: (error as any)?.message || data?.error, variant: "destructive" });
    toast({ title: "Writer account deleted", description: "The phone/PIN can now be registered again." });
    load();
  };

  const cleanupDeletedPhone = async () => {
    const v = validatePhone("+91", cleanupPhone);
    if (!v.ok) return toast({ title: "Check phone number", description: v.msg, variant: "destructive" });
    const phoneE164 = cleanupPhone.trim().startsWith("+") ? cleanupPhone.trim().replace(/[\s-]/g, "") : toE164("+91", v.digits);
    if (!confirm(`Delete any hidden writer account/PIN for ${phoneE164}? Use this only after a profile was manually removed.`)) return;
    setBusy("cleanup-phone");
    const { data, error } = await supabase.functions.invoke("delete-writer-account", { body: { phoneE164 } });
    setBusy(null);
    if (error || data?.error) return toast({ title: "Cleanup failed", description: (error as any)?.message || data?.error, variant: "destructive" });
    setCleanupPhone("");
    toast({ title: "Phone/PIN cleaned", description: "This phone can now sign up again." });
    load();
  };

  const filtered = useMemo(
    () => rows.filter((r) => r.status === filter &&
      (!q.trim() || (r.full_name || "").toLowerCase().includes(q.toLowerCase()) || (r.phone_e164 || "").includes(q))),
    [rows, filter, q]
  );

  const counts = useMemo(() => ({
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
  }), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold">Writers</h1>
          <p className="text-sm text-muted-foreground">Approve or reject new writer accounts.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone" className="pl-9 w-64" />
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <div>
              <div className="font-medium text-sm">Clean up a manually deleted phone/PIN</div>
              <p className="text-xs text-muted-foreground">Use this if a profile was removed from the database but signup still says the phone is already registered.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                value={cleanupPhone}
                onChange={(e) => setCleanupPhone(e.target.value.replace(/[^\d+\s-]/g, ""))}
                placeholder="10-digit India number"
                className="md:w-56"
              />
              <Button type="button" variant="outline" onClick={cleanupDeletedPhone} disabled={busy === "cleanup-phone"}>
                {busy === "cleanup-phone" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Clean"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">Pending {counts.pending > 0 && <Badge variant="destructive" className="ml-2">{counts.pending}</Badge>}</TabsTrigger>
          <TabsTrigger value="approved">Approved <span className="ml-1 text-xs text-muted-foreground">({counts.approved})</span></TabsTrigger>
          <TabsTrigger value="rejected">Rejected <span className="ml-1 text-xs text-muted-foreground">({counts.rejected})</span></TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No {filter} writers.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <Card key={w.user_id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg">{w.full_name || "No name"}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Phone className="h-3.5 w-3.5" /> {w.phone_e164 || "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Signed up</div>
                    <div className="text-sm">{new Date(w.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {w.status === "rejected" && w.rejected_reason && (
                  <p className="text-sm bg-amber-50 border border-amber-200 rounded p-2 mb-3">Reason: {w.rejected_reason}</p>
                )}
                {rejectingId === w.user_id ? (
                  <div className="space-y-2">
                    <Textarea placeholder="Reason (optional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" disabled={busy === w.user_id} onClick={() => reject(w.user_id)}>Confirm reject</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {w.status !== "approved" && (
                      <Button size="sm" onClick={() => approve(w.user_id)} disabled={busy === w.user_id}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    )}
                    {w.status !== "rejected" && (
                      <Button size="sm" variant="outline" onClick={() => setRejectingId(w.user_id)}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => deleteWriterAccount(w)} disabled={busy === w.user_id}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete account + PIN
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
