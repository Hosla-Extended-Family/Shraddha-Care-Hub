import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageSquare, Loader2, Plus, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/use-admin-role";

type SmsRow = {
  id: string;
  membership_id: string | null;
  recipients: string[] | null;
  purpose: string;
  status: string;
  error: string | null;
  variables: Record<string, string> | null;
  created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-800",
  failed: "bg-destructive/15 text-destructive",
  skipped: "bg-muted text-muted-foreground",
};

/** Tracker numbers that get a copy of every payment receipt, plus the delivery log. */
export default function ReceiptSmsPanel() {
  const { toast } = useToast();
  const { isMainAdmin } = useAdminRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [numbers, setNumbers] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [draft, setDraft] = useState("");
  const [log, setLog] = useState<SmsRow[]>([]);

  const load = async () => {
    const [settings, rows] = await Promise.all([
      supabase.functions.invoke("sms-settings", { body: { action: "get" } }),
      supabase.from("sms_log").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    const data = settings.data as { numbers?: string[]; enabled?: boolean; configured?: boolean } | null;
    if (data) {
      setNumbers(data.numbers ?? []);
      setEnabled(data.enabled ?? true);
      setConfigured(data.configured ?? false);
    }
    setLog(((rows.data ?? []) as unknown) as SmsRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const save = async (next: string[], nextEnabled: boolean) => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("sms-settings", {
      body: { action: "save", numbers: next, enabled: nextEnabled },
    });
    setSaving(false);
    const err = error?.message ?? (data as { error?: string } | null)?.error;
    if (err) { toast({ title: "Could not save", description: err, variant: "destructive" }); return; }
    setNumbers((data as { numbers: string[] }).numbers);
    setEnabled(nextEnabled);
    toast({ title: "Receipt SMS settings saved" });
  };

  const add = () => {
    const digits = draft.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) {
      toast({ title: "Enter a valid 10-digit mobile number", variant: "destructive" });
      return;
    }
    setDraft("");
    void save([...new Set([...numbers, digits])], enabled);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" /> Receipt SMS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!configured && !loading && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
            <span>SMS is not configured yet — receipts will be logged as skipped until the SMS provider keys are added.</span>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Every recorded or approved payment sends the member a receipt SMS. These tracker numbers get the same
          message at the same time.
        </p>

        <div className="flex items-center gap-3">
          <Switch id="copy-enabled" checked={enabled} disabled={!isMainAdmin || saving}
            onCheckedChange={(v) => void save(numbers, v)} />
          <Label htmlFor="copy-enabled">Send a copy to tracker numbers</Label>
        </div>

        <div className="flex flex-wrap gap-2">
          {numbers.length === 0 ? (
            <span className="text-sm text-muted-foreground">No tracker numbers yet.</span>
          ) : numbers.map((n) => (
            <Badge key={n} variant="secondary" className="h-8 gap-2 px-3 text-sm">
              +91 {n}
              {isMainAdmin && (
                <button type="button" aria-label={`Remove ${n}`} disabled={saving}
                  onClick={() => void save(numbers.filter((x) => x !== n), enabled)}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </Badge>
          ))}
        </div>

        {isMainAdmin && (
          <div className="flex gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} inputMode="numeric"
              placeholder="Add a 10-digit mobile number" className="max-w-xs h-11" />
            <Button onClick={add} disabled={saving} className="h-11">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-1">Add</span>
            </Button>
          </div>
        )}

        <div>
          <h4 className="font-medium mb-2">Recent receipts</h4>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : log.length === 0 ? (
            <p className="text-sm text-muted-foreground">No receipt messages sent yet.</p>
          ) : (
            <div className="divide-y">
              {log.map((r) => (
                <div key={r.id} className="py-2.5 text-sm space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {r.variables?.name ?? r.membership_id ?? "Member"} · ₹{r.variables?.amount ?? "—"}
                      {r.variables?.paid_until && (
                        <span className="text-muted-foreground font-normal"> · paid to {r.variables.paid_until}</span>
                      )}
                    </span>
                    <Badge className={STATUS_STYLE[r.status] ?? ""} variant="outline">{r.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("en-IN")} · {r.purpose.replace(/_/g, " ")}
                    {r.membership_id ? ` · ${r.membership_id}` : ""}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(r.recipients ?? []).length === 0 ? (
                      <span className="text-xs text-muted-foreground">No recipients</span>
                    ) : (r.recipients ?? []).map((n, i) => (
                      <Badge key={`${r.id}-${n}`} variant="secondary" className="font-mono text-[11px] px-2 py-0">
                        +91 {n}{i === 0 ? " (member)" : ""}
                      </Badge>
                    ))}
                  </div>
                  {r.error && <p className="text-xs text-destructive break-words">{r.error}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
