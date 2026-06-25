import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Clock } from "lucide-react";
import { GoogleMeetIcon, YouTubeIcon, FacebookIcon } from "@/components/routine/PlatformIcons";
import { WEEK_DAYS, getISTNow, formatTime12, timeToMinutes, type RoutineSession } from "@/lib/routine";

interface FormState {
  day_of_week: number;
  start_time: string;
  end_time: string;
  title: string;
  title_bn: string;
  note: string;
  facebook_url: string;
  youtube_url: string;
  meet_url: string;
  display_order: number;
  is_active: boolean;
}

const emptyForm = (day: number): FormState => ({
  day_of_week: day,
  start_time: "",
  end_time: "",
  title: "",
  title_bn: "",
  note: "",
  facebook_url: "",
  youtube_url: "",
  meet_url: "",
  display_order: 0,
  is_active: true,
});

export default function RoutineManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<number>(() => getISTNow().day);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(getISTNow().day));

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["admin-routine-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routine_sessions")
        .select("*")
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as RoutineSession[];
    },
  });

  const daySessions = useMemo(
    () =>
      sessions
        .filter((s) => s.day_of_week === selectedDay)
        .sort(
          (a, b) =>
            (timeToMinutes(a.start_time) ?? 0) - (timeToMinutes(b.start_time) ?? 0) ||
            a.display_order - b.display_order,
        ),
    [sessions, selectedDay],
  );

  const buildPayload = (d: FormState) => ({
    day_of_week: d.day_of_week,
    start_time: d.start_time,
    end_time: d.end_time || null,
    title: d.title.trim(),
    title_bn: d.title_bn.trim() || null,
    note: d.note.trim() || null,
    facebook_url: d.facebook_url.trim() || null,
    youtube_url: d.youtube_url.trim() || null,
    meet_url: d.meet_url.trim() || null,
    display_order: d.display_order,
    is_active: d.is_active,
  });

  const saveMutation = useMutation({
    mutationFn: async (d: FormState) => {
      if (editingId) {
        const { error } = await supabase.from("routine_sessions").update(buildPayload(d)).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("routine_sessions").insert(buildPayload(d));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routine-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["routine-sessions"] });
      toast({ title: "Saved", description: `Session ${editingId ? "updated" : "added"} successfully.` });
      handleClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("routine_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routine-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["routine-sessions"] });
      toast({ title: "Deleted", description: "Session removed." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("routine_sessions").update({ is_active: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routine-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["routine-sessions"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm(selectedDay));
  };

  const handleAdd = () => {
    setEditingId(null);
    const nextOrder = daySessions.length ? Math.max(...daySessions.map((s) => s.display_order)) + 1 : 1;
    setForm({ ...emptyForm(selectedDay), display_order: nextOrder });
    setIsDialogOpen(true);
  };

  const handleEdit = (s: RoutineSession) => {
    setEditingId(s.id);
    setForm({
      day_of_week: s.day_of_week,
      start_time: (s.start_time || "").slice(0, 5),
      end_time: (s.end_time || "").slice(0, 5),
      title: s.title,
      title_bn: s.title_bn || "",
      note: s.note || "",
      facebook_url: s.facebook_url || "",
      youtube_url: s.youtube_url || "",
      meet_url: s.meet_url || "",
      display_order: s.display_order,
      is_active: s.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast({ title: "Validation", description: "Title is required.", variant: "destructive" });
      return;
    }
    if (!form.start_time) {
      toast({ title: "Validation", description: "Start time is required.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Routine</h1>
          <p className="text-muted-foreground">
            Manage the weekly wellness schedule shown on the public Daily Routine page. Add join links
            (Facebook, YouTube, Google Meet) so seniors can join in one tap.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Session
        </Button>
      </div>

      {/* Day selector */}
      <div className="flex flex-wrap gap-2">
        {WEEK_DAYS.map((d) => {
          const count = sessions.filter((s) => s.day_of_week === d.value).length;
          return (
            <button
              key={d.value}
              onClick={() => setSelectedDay(d.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDay === d.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.short} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : daySessions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No sessions for this day. Click "Add Session" to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {daySessions.map((s) => (
                <div
                  key={s.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border p-3 ${
                    s.is_active ? "border-border bg-background" : "border-border bg-muted/30 opacity-60"
                  }`}
                >
                  <div className="sm:w-28 shrink-0 font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {formatTime12(s.start_time)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{s.title}</div>
                    {s.title_bn && <div className="text-sm text-muted-foreground truncate">{s.title_bn}</div>}
                    {s.note && <div className="text-xs text-muted-foreground truncate">{s.note}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.meet_url && <GoogleMeetIcon className="h-5 w-5" />}
                    {s.youtube_url && <YouTubeIcon className="h-5 w-5" />}
                    {s.facebook_url && <FacebookIcon className="h-5 w-5" />}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={(v) => toggleActive.mutate({ id: s.id, value: v })}
                      aria-label="Active"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Session</AlertDialogTitle>
                          <AlertDialogDescription>
                            Delete "{s.title}"? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(s.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(o) => (o ? setIsDialogOpen(true) : handleClose())}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Session" : "Add Session"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Day *</Label>
              <Select value={String(form.day_of_week)} onValueChange={(v) => setForm({ ...form, day_of_week: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEEK_DAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start">Start time *</Label>
                <Input id="start" type="time" value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End time</Label>
                <Input id="end" type="time" value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Meditation & Happiness Therapy Practice" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title_bn">Title (Bengali)</Label>
              <Input id="title_bn" value={form.title_bn}
                onChange={(e) => setForm({ ...form, title_bn: e.target.value })}
                placeholder="optional Bengali title" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note / Sub-text</Label>
              <Textarea id="note" value={form.note} rows={2}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="e.g. Online, or venue address & contact" />
            </div>

            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-foreground">Join Links</p>
              <p className="text-xs text-muted-foreground -mt-2">
                Add a link for whichever platform this session uses. For one-off changes (e.g. a special
                meeting at 4 PM), just edit the link here.
              </p>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm"><GoogleMeetIcon className="h-5 w-5" /> Google Meet</Label>
                <Input value={form.meet_url} onChange={(e) => setForm({ ...form, meet_url: e.target.value })}
                  placeholder="https://meet.google.com/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm"><YouTubeIcon className="h-5 w-5" /> YouTube</Label>
                <Input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm"><FacebookIcon className="h-5 w-5" /> Facebook</Label>
                <Input value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-2">
                <Label htmlFor="order">Display order</Label>
                <Input id="order" type="number" value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active (visible)</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Save Changes" : "Add Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
