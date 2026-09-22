import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BellRing, CalendarClock, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { prettyDate } from "@/lib/membership";

export type ReminderTarget = {
  user_id: string;
  full_name: string | null;
  membership_id: string | null;
  monthly_fee_amount: number | null;
  paid_up_until: string | null;
};

type Template = { id: string; name: string; body: string };

const BUILT_IN: Template[] = [
  {
    id: "builtin-gentle",
    name: "Gentle reminder",
    body: "Namaste {name}, a gentle reminder that your Hosla membership was paid up to {paid_up_until}. Monthly fee is ₹{amount}. You can pay from your profile or hand cash to any team member. Membership ID: {membership_id}.",
  },
  {
    id: "builtin-due",
    name: "Fee due now",
    body: "Namaste {name}, your Hosla membership fee of ₹{amount} is now due (paid up to {paid_up_until}). Please pay at your convenience so your benefits continue without a break.",
  },
  {
    id: "builtin-renewal",
    name: "Renewal coming up",
    body: "Namaste {name}, your Hosla membership renews soon — it is paid up to {paid_up_until}. Renewing early keeps everything active. Monthly fee: ₹{amount}.",
  },
];

function fill(tpl: string, m: ReminderTarget) {
  return tpl
    .replace(/\{name\}/g, m.full_name || "friend")
    .replace(/\{membership_id\}/g, m.membership_id || "—")
    .replace(/\{amount\}/g, String(m.monthly_fee_amount ?? 0))
    .replace(/\{paid_up_until\}/g, m.paid_up_until ? prettyDate(m.paid_up_until) : "—");
}

export default function ReminderComposer({
  open, onOpenChange, targets, onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  targets: ReminderTarget[];
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState("builtin-gentle");
  const [body, setBody] = useState(BUILT_IN[0].body);
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [newName, setNewName] = useState("");

  const all = [...BUILT_IN, ...templates];

  const loadTemplates = async () => {
    const { data } = await supabase.from("reminder_templates").select("id, name, body").order("created_at");
    setTemplates((data ?? []) as Template[]);
  };

  useEffect(() => { if (open) { loadTemplates(); setPreviewIdx(0); } }, [open]);

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    const t = all.find((x) => x.id === id);
    if (t) setBody(t.body);
  };

  const saveTemplate = async () => {
    if (!newName.trim()) return toast({ title: "Give the template a name", variant: "destructive" });
    const { error } = await supabase.from("reminder_templates").insert({ name: newName.trim(), body });
    if (error) return toast({ title: "Couldn't save the template", description: error.message, variant: "destructive" });
    setNewName("");
    await loadTemplates();
    toast({ title: "Template saved" });
  };

  const submit = async (schedule: boolean) => {
    if (targets.length === 0) return toast({ title: "Select at least one member", variant: "destructive" });
    if (schedule && !when) return toast({ title: "Pick a date and time", variant: "destructive" });
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("send-fee-reminders", {
      body: {
        action: schedule ? "schedule" : "send",
        user_ids: targets.map((t) => t.user_id),
        message: body,
        scheduled_for: schedule ? new Date(when).toISOString() : undefined,
      },
    });
    setBusy(false);
    const payload = data as any;
    if (error || payload?.error) {
      return toast({ title: "Couldn't send", description: payload?.error || error?.message, variant: "destructive" });
    }
    toast({
      title: schedule
        ? `Scheduled for ${targets.length} member(s)`
        : `Sent to ${payload?.sent ?? 0} member(s)`,
      description: !schedule && payload?.skipped
        ? `${payload.skipped} skipped — already reminded in the last 24 hours.`
        : undefined,
    });
    onOpenChange(false);
    onDone();
  };

  const preview = targets[previewIdx];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send fee reminders</DialogTitle>
          <DialogDescription>{targets.length} member(s) selected</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Template</Label>
            <Select value={templateId} onValueChange={pickTemplate}>
              <SelectTrigger className="h-12 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {all.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">
              Placeholders: {"{name}"}, {"{membership_id}"}, {"{amount}"}, {"{paid_up_until}"}
            </p>
          </div>

          <div className="flex gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Save as template…" className="h-11" />
            <Button variant="outline" className="h-11" onClick={saveTemplate}><Save className="h-4 w-4" /></Button>
          </div>

          {preview && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Preview</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{preview.full_name || "—"} · {preview.membership_id}</Badge>
                  {targets.length > 1 && (
                    <Button size="sm" variant="ghost" className="h-8"
                      onClick={() => setPreviewIdx((i) => (i + 1) % targets.length)}>
                      Next
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm">{fill(body, preview)}</p>
            </div>
          )}

          <div>
            <Label>Schedule for later (optional)</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="h-12 mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => submit(false)} disabled={busy} className="h-12">
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BellRing className="h-4 w-4 mr-2" />}
              Send now
            </Button>
            <Button variant="outline" onClick={() => submit(true)} disabled={busy || !when} className="h-12">
              <CalendarClock className="h-4 w-4 mr-2" /> Schedule
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A member is only reminded once in 24 hours — repeats are skipped automatically.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
