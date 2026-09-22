import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { useImageUpload } from "@/hooks/use-image-upload";
import { OUTCOME_ICON_NAMES, getOutcomeIcon } from "@/hooks/use-collaborate-content";
import { Plus, Pencil, Trash2, Loader2, Handshake, HelpCircle, Quote, BarChart3, CalendarDays } from "lucide-react";

const PRIMARY = "hsl(250, 70%, 45%)";

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------
function SectionHeader({ title, description, onAdd, addLabel }: { title: string; description: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button onClick={onAdd} style={{ backgroundColor: PRIMARY }} className="text-white">
        <Plus className="h-4 w-4 mr-2" /> {addLabel}
      </Button>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ===========================================================================
// Collaborations tab
// ===========================================================================
type CollabForm = {
  id?: string;
  event_id: string;
  sector: string;
  initiative_type: string;
  partner_name: string;
  description: string;
  outcomesText: string;
  org_logo: string;
  collaborator_logo_url: string;
  collaborator_text: string;
  display_order: number;
  is_published: boolean;
};

const emptyCollab: CollabForm = {
  event_id: "", sector: "", initiative_type: "", partner_name: "", description: "",
  outcomesText: "", org_logo: "both", collaborator_logo_url: "", collaborator_text: "",
  display_order: 0, is_published: true,
};

function CollaborationsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CollabForm>(emptyCollab);
  const { upload, isUploading } = useImageUpload({ bucket: "project-posters", folder: "collaborators" });

  const { data: events = [] } = useQuery({
    queryKey: ["admin", "published-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_events")
        .select("id, title, event_date")
        .eq("is_published", true)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "collaborations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collaborations")
        .select("*, event:registration_events(title, event_date)")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (f: CollabForm) => {
      const outcomes = f.outcomesText.split("\n").map((s) => s.trim()).filter(Boolean);
      const payload = {
        event_id: f.event_id,
        sector: f.sector || "Other",
        initiative_type: f.initiative_type || "Collaboration",
        partner_name: f.partner_name,
        description: f.description || null,
        outcomes,
        org_logo: f.org_logo,
        collaborator_logo_url: f.collaborator_logo_url || null,
        collaborator_text: f.collaborator_text || null,
        display_order: f.display_order,
        is_published: f.is_published,
      };
      if (f.id) {
        const { error } = await supabase.from("collaborations").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("collaborations").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "collaborations"] });
      qc.invalidateQueries({ queryKey: ["collaborations", "public"] });
      setOpen(false);
      toast({ title: "Saved", description: "Collaboration saved." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collaborations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "collaborations"] });
      qc.invalidateQueries({ queryKey: ["collaborations", "public"] });
      toast({ title: "Deleted" });
    },
  });

  const openNew = () => { setForm(emptyCollab); setOpen(true); };
  const openEdit = (c: any) => {
    setForm({
      id: c.id, event_id: c.event_id, sector: c.sector, initiative_type: c.initiative_type,
      partner_name: c.partner_name, description: c.description ?? "",
      outcomesText: Array.isArray(c.outcomes) ? c.outcomes.join("\n") : "",
      org_logo: c.org_logo ?? "both", collaborator_logo_url: c.collaborator_logo_url ?? "",
      collaborator_text: c.collaborator_text ?? "", display_order: c.display_order, is_published: c.is_published,
    });
    setOpen(true);
  };

  return (
    <div>
      <SectionHeader
        title="Past Collaborations"
        description="Each collaboration is linked to a published event. Create the event first, then feature it here."
        onAdd={openNew}
        addLabel="Add Collaboration"
      />
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No collaborations yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground truncate">{c.event?.title ?? "(missing event)"}</span>
                    <Badge variant="secondary">{c.initiative_type}</Badge>
                    <Badge variant="outline">{c.sector}</Badge>
                    {!c.is_published && <Badge variant="destructive">Hidden</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{c.partner_name}</p>
                </div>
                <RowActions onEdit={() => openEdit(c)} onDelete={() => del.mutate(c.id)} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit" : "Add"} Collaboration</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Event *</Label>
              <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select a published event" /></SelectTrigger>
                <SelectContent>
                  {events.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">The event's date, title, location & banner are shown on the card.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sector</Label><Input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="Hospital & Healthcare" /></div>
              <div><Label>Initiative Type</Label><Input value={form.initiative_type} onChange={(e) => setForm({ ...form, initiative_type: e.target.value })} placeholder="Health Camp" /></div>
            </div>
            <div><Label>Partner Line *</Label><Input value={form.partner_name} onChange={(e) => setForm({ ...form, partner_name: e.target.value })} placeholder="In collaboration with ..." /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div><Label>Outcomes (one per line)</Label><Textarea value={form.outcomesText} onChange={(e) => setForm({ ...form, outcomesText: e.target.value })} rows={3} placeholder={"Free health check-ups\nOn-the-spot guidance"} /></div>
            <div>
              <Label>Organization Logo</Label>
              <Select value={form.org_logo} onValueChange={(v) => setForm({ ...form, org_logo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Shraddha + Hosla</SelectItem>
                  <SelectItem value="shraddha">Shraddha only</SelectItem>
                  <SelectItem value="hosla">Hosla only</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Collaborator Logo (optional)</Label>
              <ImageUpload value={form.collaborator_logo_url} onChange={(url) => setForm({ ...form, collaborator_logo_url: url })} onUpload={upload} isUploading={isUploading} />
            </div>
            <div>
              <Label>Collaborator Name (shown if no logo)</Label>
              <Input value={form.collaborator_text} onChange={(e) => setForm({ ...form, collaborator_text: e.target.value })} placeholder="IQ City Hospital, Durgapur" />
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pb-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate(form)} disabled={!form.event_id || !form.partner_name || save.isPending} style={{ backgroundColor: PRIMARY }} className="text-white">
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===========================================================================
// FAQ tab
// ===========================================================================
type FaqForm = { id?: string; question: string; answer: string; display_order: number; is_published: boolean };
const emptyFaq: FaqForm = { question: "", answer: "", display_order: 0, is_published: true };

function FaqsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FaqForm>(emptyFaq);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("partnership_faqs").select("*").order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (f: FaqForm) => {
      const payload = { question: f.question, answer: f.answer, display_order: f.display_order, is_published: f.is_published };
      if (f.id) { const { error } = await supabase.from("partnership_faqs").update(payload).eq("id", f.id); if (error) throw error; }
      else { const { error } = await supabase.from("partnership_faqs").insert(payload); if (error) throw error; }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      qc.invalidateQueries({ queryKey: ["partnership_faqs", "public"] });
      setOpen(false); toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("partnership_faqs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "faqs"] }); qc.invalidateQueries({ queryKey: ["partnership_faqs", "public"] }); toast({ title: "Deleted" }); },
  });

  return (
    <div>
      <SectionHeader title="Partnership FAQs" description="Questions collaborators commonly ask." onAdd={() => { setForm(emptyFaq); setOpen(true); }} addLabel="Add FAQ" />
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <div className="space-y-3">
          {items.map((f: any) => (
            <Card key={f.id}><CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><span className="font-semibold text-foreground">{f.question}</span>{!f.is_published && <Badge variant="destructive">Hidden</Badge>}</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.answer}</p>
              </div>
              <RowActions onEdit={() => { setForm({ id: f.id, question: f.question, answer: f.answer, display_order: f.display_order, is_published: f.is_published }); setOpen(true); }} onDelete={() => del.mutate(f.id)} />
            </CardContent></Card>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit" : "Add"} FAQ</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Question *</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
            <div><Label>Answer *</Label><Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={5} /></div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pb-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate(form)} disabled={!form.question || !form.answer || save.isPending} style={{ backgroundColor: PRIMARY }} className="text-white">
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===========================================================================
// Testimonials tab
// ===========================================================================
type TestiForm = { id?: string; quote: string; author_name: string; author_role: string; organization: string; image_url: string; event_date: string; display_order: number; is_published: boolean };
const emptyTesti: TestiForm = { quote: "", author_name: "", author_role: "", organization: "", image_url: "", event_date: "", display_order: 0, is_published: true };

function TestimonialsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TestiForm>(emptyTesti);
  const { upload, isUploading } = useImageUpload({ bucket: "team-photos", folder: "testimonials" });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("partner_testimonials").select("*").order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (f: TestiForm) => {
      const payload = {
        quote: f.quote, author_name: f.author_name, author_role: f.author_role || null,
        organization: f.organization || null, image_url: f.image_url || null,
        event_date: f.event_date || null, display_order: f.display_order, is_published: f.is_published,
      };
      if (f.id) { const { error } = await supabase.from("partner_testimonials").update(payload).eq("id", f.id); if (error) throw error; }
      else { const { error } = await supabase.from("partner_testimonials").insert(payload); if (error) throw error; }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      qc.invalidateQueries({ queryKey: ["partner_testimonials", "public"] });
      setOpen(false); toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("partner_testimonials").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "testimonials"] }); qc.invalidateQueries({ queryKey: ["partner_testimonials", "public"] }); toast({ title: "Deleted" }); },
  });

  return (
    <div>
      <SectionHeader title="Testimonials" description="Quotes from partner organizations." onAdd={() => { setForm(emptyTesti); setOpen(true); }} addLabel="Add Testimonial" />
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <div className="space-y-3">
          {items.map((t: any) => (
            <Card key={t.id}><CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><span className="font-semibold text-foreground">{t.author_name}</span>{t.organization && <Badge variant="outline">{t.organization}</Badge>}{!t.is_published && <Badge variant="destructive">Hidden</Badge>}</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">"{t.quote}"</p>
              </div>
              <RowActions onEdit={() => { setForm({ id: t.id, quote: t.quote, author_name: t.author_name, author_role: t.author_role ?? "", organization: t.organization ?? "", image_url: t.image_url ?? "", event_date: t.event_date ?? "", display_order: t.display_order, is_published: t.is_published }); setOpen(true); }} onDelete={() => del.mutate(t.id)} />
            </CardContent></Card>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit" : "Add"} Testimonial</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Quote *</Label><Textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} rows={4} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Author Name *</Label><Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} /></div>
              <div><Label>Role</Label><Input value={form.author_role} onChange={(e) => setForm({ ...form, author_role: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Organization</Label><Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></div>
              <div><Label>Date</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
            </div>
            <div><Label>Photo (optional)</Label><ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} onUpload={upload} isUploading={isUploading} /></div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pb-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate(form)} disabled={!form.quote || !form.author_name || save.isPending} style={{ backgroundColor: PRIMARY }} className="text-white">
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===========================================================================
// Outcomes tab
// ===========================================================================
type OutcomeForm = { id?: string; value: string; label: string; icon: string; display_order: number; is_published: boolean };
const emptyOutcome: OutcomeForm = { value: "", label: "", icon: "Sparkles", display_order: 0, is_published: true };

function OutcomesTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OutcomeForm>(emptyOutcome);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "outcomes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("partner_outcomes").select("*").order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (f: OutcomeForm) => {
      const payload = { value: f.value, label: f.label, icon: f.icon, display_order: f.display_order, is_published: f.is_published };
      if (f.id) { const { error } = await supabase.from("partner_outcomes").update(payload).eq("id", f.id); if (error) throw error; }
      else { const { error } = await supabase.from("partner_outcomes").insert(payload); if (error) throw error; }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "outcomes"] });
      qc.invalidateQueries({ queryKey: ["partner_outcomes", "public"] });
      setOpen(false); toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("partner_outcomes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "outcomes"] }); qc.invalidateQueries({ queryKey: ["partner_outcomes", "public"] }); toast({ title: "Deleted" }); },
  });

  const IconPreview = getOutcomeIcon(form.icon);

  return (
    <div>
      <SectionHeader title="Outcome Highlights" description="The stat cards shown above the testimonials." onAdd={() => { setForm(emptyOutcome); setOpen(true); }} addLabel="Add Outcome" />
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <div className="space-y-3">
          {items.map((o: any) => {
            const Icon = getOutcomeIcon(o.icon);
            return (
              <Card key={o.id}><CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: PRIMARY }}><Icon className="h-5 w-5 text-white" /></div>
                  <div><span className="font-semibold text-foreground">{o.value}</span>{!o.is_published && <Badge variant="destructive" className="ml-2">Hidden</Badge>}<p className="text-xs text-muted-foreground">{o.label}</p></div>
                </div>
                <RowActions onEdit={() => { setForm({ id: o.id, value: o.value, label: o.label, icon: o.icon, display_order: o.display_order, is_published: o.is_published }); setOpen(true); }} onDelete={() => del.mutate(o.id)} />
              </CardContent></Card>
            );
          })}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader><DialogTitle>{form.id ? "Edit" : "Add"} Outcome</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Value *</Label><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Free" /></div>
            <div><Label>Label *</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Health check-ups delivered" /></div>
            <div>
              <Label>Icon</Label>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0" style={{ background: PRIMARY }}><IconPreview className="h-5 w-5 text-white" /></div>
                <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{OUTCOME_ICON_NAMES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pb-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate(form)} disabled={!form.value || !form.label || save.isPending} style={{ backgroundColor: PRIMARY }} className="text-white">
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===========================================================================
// Page
// ===========================================================================
export default function CollaborateContent() {
  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Handshake className="h-6 w-6" style={{ color: PRIMARY }} /> Collaborate Page
        </h1>
        <p className="text-muted-foreground text-sm">Manage the content of the Collaborate / Partner page.</p>
      </div>
      <Tabs defaultValue="collaborations">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="collaborations"><CalendarDays className="h-4 w-4 mr-2" />Collaborations</TabsTrigger>
          <TabsTrigger value="faqs"><HelpCircle className="h-4 w-4 mr-2" />FAQs</TabsTrigger>
          <TabsTrigger value="testimonials"><Quote className="h-4 w-4 mr-2" />Testimonials</TabsTrigger>
          <TabsTrigger value="outcomes"><BarChart3 className="h-4 w-4 mr-2" />Outcomes</TabsTrigger>
        </TabsList>
        <TabsContent value="collaborations"><CollaborationsTab /></TabsContent>
        <TabsContent value="faqs"><FaqsTab /></TabsContent>
        <TabsContent value="testimonials"><TestimonialsTab /></TabsContent>
        <TabsContent value="outcomes"><OutcomesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
