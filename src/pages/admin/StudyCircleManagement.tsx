import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, BookOpen, GripVertical, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MemberSearchCombobox } from "@/components/admin/MemberSearchCombobox";
import { DEFAULT_ROLES, fetchSessionBundle, formatSessionDate, PROGRAM_META, type PerformerValue, type StudyCircleProgram } from "@/lib/studycircle";
import { cn } from "@/lib/utils";

interface EditorRole {
  id: string;
  role_name: string;
  display_order: number;
  performers: PerformerValue[];
}
interface EditorPart {
  id: string;
  part_number: number | null;
  part_type: string;
  description: string;
  display_order: number;
  performers: PerformerValue[];
}
interface EditorState {
  title_bn: string;
  scheduled_date: string;
  program_type: StudyCircleProgram;
  start_time: string;
  note: string;
  is_published: boolean;
  roles: EditorRole[];
  parts: EditorPart[];
}

const emptyEditor = (program: StudyCircleProgram, date: string): EditorState => ({
  title_bn: PROGRAM_META[program].label,
  scheduled_date: date,
  program_type: program,
  start_time: "",
  note: "",
  is_published: false,
  roles: DEFAULT_ROLES.map((r, i) => ({ id: crypto.randomUUID(), role_name: r.role_name, display_order: i + 1, performers: [] })),
  parts: [],
});

export default function StudyCircleManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [dirty, setDirty] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createProgram, setCreateProgram] = useState<StudyCircleProgram>("pathochokro");
  const [createDate, setCreateDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const sessions = useQuery({
    queryKey: ["admin-study-circle-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("study_circle_sessions").select("*").order("scheduled_date", { ascending: true });
      if (error) throw error;
      const rows = data ?? [];
      const counts = await Promise.all(rows.map(async (s) => {
        const { count, error: countError } = await supabase.from("study_circle_parts").select("id", { count: "exact", head: true }).eq("session_id", s.id);
        if (countError) throw countError;
        return [s.id, count ?? 0] as const;
      }));
      return { rows, counts: new Map(counts) };
    },
  });

  const loadEditor = async (id: string) => {
    const bundle = await fetchSessionBundle(id, true);
    if (!bundle) return;
    setEditingId(id);
    setEditor({
      title_bn: bundle.session.title_bn,
      scheduled_date: bundle.session.scheduled_date,
      program_type: bundle.session.program_type as StudyCircleProgram,
      start_time: bundle.session.start_time?.slice(0, 5) ?? "",
      note: bundle.session.note ?? "",
      is_published: bundle.session.is_published,
      roles: bundle.roles.map((r) => ({
        id: r.id,
        role_name: r.role_name,
        display_order: r.display_order,
        performers: r.performers.map((p) => ({ memberId: p.member_id, guestName: p.guest_name, displayName: p.guest_name?.trim() || (p.member_id ?? "") })),
      })),
      parts: bundle.parts.map((p) => ({
        id: p.id,
        part_number: p.part_number,
        part_type: p.part_type,
        description: p.description,
        display_order: p.display_order,
        performers: p.performers.map((x) => ({ memberId: x.member_id, guestName: x.guest_name, displayName: x.guest_name?.trim() || (x.member_id ?? "") })),
      })),
    });
    setDirty(false);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("study_circle_sessions").insert({
        program_type: createProgram,
        scheduled_date: createDate,
        title_bn: PROGRAM_META[createProgram].label,
        is_published: false,
      }).select("id").single();
      if (error) throw error;
      const { error: roleError } = await supabase.from("study_circle_roles").insert(DEFAULT_ROLES.map((r) => ({ ...r, session_id: data.id })));
      if (roleError) throw roleError;
      return data.id;
    },
    onSuccess: async (id) => {
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-study-circle-sessions"] });
      await loadEditor(id);
      toast({ title: "Session created", description: "The draft session is ready to edit." });
    },
    onError: (error: any) => toast({ title: "Could not create session", description: error.code === "23505" ? "A session for this date already exists." : error.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: EditorState }) => {
      const { error: sessionError } = await supabase.from("study_circle_sessions").update({
        title_bn: value.title_bn.trim() || PROGRAM_META[value.program_type].label,
        scheduled_date: value.scheduled_date,
        program_type: value.program_type,
        start_time: value.start_time || null,
        note: value.note.trim() || null,
      }).eq("id", id);
      if (sessionError) throw sessionError;

      const { data: existingRoles, error: existingRoleError } = await supabase.from("study_circle_roles").select("id").eq("session_id", id);
      if (existingRoleError) throw existingRoleError;
      const keepRoleIds = value.roles.map((r) => r.id);
      const rolesToDelete = (existingRoles ?? []).map((r) => r.id).filter((rid) => !keepRoleIds.includes(rid));
      if (rolesToDelete.length) {
        const { error: deleteRolesError } = await supabase.from("study_circle_roles").delete().in("id", rolesToDelete);
        if (deleteRolesError) throw deleteRolesError;
      }
      if (value.roles.length) {
        const { error } = await supabase.from("study_circle_roles").upsert(value.roles.map((r, i) => ({ id: r.id, session_id: id, role_name: r.role_name.trim() || "Untitled role", display_order: i + 1 })));
        if (error) throw error;
      }
      for (const role of value.roles) {
        const { error: deleteRolePerformersError } = await supabase.from("study_circle_role_performers").delete().eq("role_id", role.id);
        if (deleteRolePerformersError) throw deleteRolePerformersError;
        const performers = role.performers.filter((p) => p.displayName.trim()).map((p, i) => ({ role_id: role.id, member_id: p.memberId, guest_name: p.guestName?.trim() || p.displayName.trim(), display_order: i + 1 }));
        if (performers.length) {
          const { error } = await supabase.from("study_circle_role_performers").insert(performers);
          if (error) throw error;
        }
      }

      const { data: existingParts, error: existingPartError } = await supabase.from("study_circle_parts").select("id").eq("session_id", id);
      if (existingPartError) throw existingPartError;
      const keepPartIds = value.parts.map((p) => p.id);
      const partsToDelete = (existingParts ?? []).map((p) => p.id).filter((pid) => !keepPartIds.includes(pid));
      if (partsToDelete.length) {
        const { error: deletePartsError } = await supabase.from("study_circle_parts").delete().in("id", partsToDelete);
        if (deletePartsError) throw deletePartsError;
      }
      if (value.parts.length) {
        const { error } = await supabase.from("study_circle_parts").upsert(value.parts.map((p, i) => ({ id: p.id, session_id: id, part_number: p.part_number, part_type: p.part_type, description: p.description, display_order: i + 1 })));
        if (error) throw error;
      }
      for (const part of value.parts) {
        const { error: deletePartPerformersError } = await supabase.from("study_circle_part_performers").delete().eq("part_id", part.id);
        if (deletePartPerformersError) throw deletePartPerformersError;
        const performers = part.performers.filter((p) => p.displayName.trim()).map((p, i) => ({ part_id: part.id, member_id: p.memberId, guest_name: p.guestName?.trim() || p.displayName.trim(), display_order: i + 1 }));
        if (performers.length) {
          const { error } = await supabase.from("study_circle_part_performers").insert(performers);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin-study-circle-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["study-circle-next"] });
      queryClient.invalidateQueries({ queryKey: ["study-circle-current"] });
    },
    onError: (error: any) => toast({ title: "Auto-save failed", description: error.message, variant: "destructive" }),
  });

  const isPending = saveMutation.isPending;
  useEffect(() => {
    if (!editingId || !editor || !dirty || isPending) return;
    const timer = window.setTimeout(() => saveMutation.mutate({ id: editingId, value: editor }), 2000);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, editingId, dirty, isPending]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!editingId || !editor) return;
      if (dirty) {
        setDirty(false);
        await saveMutation.mutateAsync({ id: editingId, value: editor });
      }
      const { error } = await supabase.from("study_circle_sessions").update({ is_published: true }).eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditor((e) => e ? { ...e, is_published: true } : e);
      setPublishOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-study-circle-sessions"] });
      toast({ title: "Published", description: "The Study Circle schedule is now public." });
    },
    onError: (error: any) => toast({ title: "Could not publish", description: error.message, variant: "destructive" }),
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase.from("study_circle_sessions").update({ is_published: false }).eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditor((e) => e ? { ...e, is_published: false } : e);
      queryClient.invalidateQueries({ queryKey: ["admin-study-circle-sessions"] });
      toast({ title: "Moved back to draft" });
    },
    onError: (error: any) => toast({ title: "Could not unpublish", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase.from("study_circle_sessions").delete().eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null); setEditor(null); setDeleteOpen(false); setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin-study-circle-sessions"] });
      toast({ title: "Session deleted" });
    },
    onError: (error: any) => toast({ title: "Could not delete", description: error.message, variant: "destructive" }),
  });

  const unpublishedWarnings = useMemo(() => {
    if (!editor) return [] as string[];
    const warnings: string[] = [];
    if (!editor.title_bn.trim()) warnings.push("Session title is empty.");
    if (!editor.roles.every((r) => r.performers.length > 0)) warnings.push("One or more roles have no performer.");
    if (!editor.parts.every((p) => p.performers.length > 0)) warnings.push("One or more parts have no performer.");
    if (!editor.parts.every((p) => p.description.trim())) warnings.push("One or more parts have no description.");
    return warnings;
  }, [editor]);

  const updateEditor = (patch: Partial<EditorState>) => {
    setEditor((current) => current ? { ...current, ...patch } : current);
    setDirty(true);
  };

  const updateEditorFn = (fn: (current: EditorState) => EditorState) => {
    setEditor((current) => current ? fn(current) : current);
    setDirty(true);
  };

  const backToList = () => { setEditingId(null); setEditor(null); setDirty(false); };

  if (editingId && editor) {
    return <SessionEditor
      editor={editor}
      dirty={dirty}
      saving={saveMutation.isPending}
      onChange={updateEditor}
      onChangeLatest={updateEditorFn}
      onSave={() => saveMutation.mutate({ id: editingId, value: editor })}
      onBack={backToList}
      onPublish={() => setPublishOpen(true)}
      onDelete={() => setDeleteOpen(true)}
      publishWarnings={unpublishedWarnings}
      publishOpen={publishOpen}
      setPublishOpen={setPublishOpen}
      publishPending={publishMutation.isPending}
      confirmPublish={() => publishMutation.mutate()}
      onUnpublish={() => unpublishMutation.mutate()}
      unpublishPending={unpublishMutation.isPending}
      deleteOpen={deleteOpen}
      setDeleteOpen={setDeleteOpen}
      deletePending={deleteMutation.isPending}
      confirmDelete={() => deleteMutation.mutate()}
    />;
  }

  const grouped = sessions.data?.rows ?? [];
  const kathamrita = grouped.filter((s) => s.program_type === "kathamrita");
  const pathochokro = grouped.filter((s) => s.program_type === "pathochokro");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Study Circle</h1>
          <p className="text-muted-foreground">Create and publish performer schedules for each dated session.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Create Session</Button>
      </div>

      {sessions.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin" /></div> : (
        <div className="grid gap-6 lg:grid-cols-2">
          <SessionColumn title="Ramakrishna Kathamrita" subtitle="Tuesday" program="kathamrita" sessions={kathamrita} counts={sessions.data?.counts ?? new Map()} onEdit={loadEditor} />
          <SessionColumn title="Pathochokro" subtitle="Thursday" program="pathochokro" sessions={pathochokro} counts={sessions.data?.counts ?? new Map()} onEdit={loadEditor} />
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Study Circle Session</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Programme</Label><Select value={createProgram} onValueChange={(v) => setCreateProgram(v as StudyCircleProgram)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kathamrita">Ramakrishna Kathamrita · Tuesday</SelectItem><SelectItem value="pathochokro">Pathochokro · Thursday</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => createMutation.mutate()} disabled={!createDate || createMutation.isPending}>{createMutation.isPending ? "Creating…" : "Create Draft"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SessionColumn({ title, subtitle, program, sessions, counts, onEdit }: { title: string; subtitle: string; program: StudyCircleProgram; sessions: any[]; counts: Map<string, number>; onEdit: (id: string) => void }) {
  return (
    <Card>
      <CardHeader className={cn("border-b", program === "kathamrita" ? "bg-orange-500/5" : "bg-purple-500/5")}>
        <CardTitle className="flex items-center justify-between"><span>{title}</span><Badge variant="outline">{subtitle}</Badge></CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {sessions.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No sessions created yet.</p> : sessions.map((session) => (
          <button key={session.id} type="button" onClick={() => onEdit(session.id)} className="w-full rounded-xl border p-4 text-left transition-colors hover:bg-accent">
            <div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{formatSessionDate(session.scheduled_date)}</div><div className="mt-1 text-sm text-muted-foreground">{session.title_bn}</div></div><Badge variant={session.is_published ? "default" : "secondary"}>{session.is_published ? "Published" : "Draft"}</Badge></div>
            <div className="mt-3 text-xs text-muted-foreground">{counts.get(session.id) || 0} parts · Edit session</div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function SortablePart({ part, index, onChange, onDelete, onPerformerChange }: { part: EditorPart; index: number; onChange: (patch: Partial<EditorPart>) => void; onDelete: () => void; onPerformerChange: (performerIndex: number, v: PerformerValue) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: part.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border bg-card p-4">
      <div className="flex gap-3">
        <button type="button" className="mt-2 cursor-grab text-muted-foreground" {...attributes} {...listeners} aria-label="Drag part"><GripVertical className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[100px_150px_1fr_auto]">
            <div><Label className="text-xs">Number</Label><Input type="number" value={part.part_number ?? ""} onChange={(e) => onChange({ part_number: e.target.value ? Number(e.target.value) : null })} /></div>
            <div><Label className="text-xs">Type</Label><Select value={part.part_type} onValueChange={(v) => onChange({ part_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="song">Song</SelectItem><SelectItem value="reading">Reading</SelectItem><SelectItem value="prayer">Prayer</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Description</Label><Textarea value={part.description} onChange={(e) => onChange({ description: e.target.value })} rows={2} placeholder="What will be read/sung?" /></div>
            <Button type="button" variant="ghost" size="icon" className="mt-5 text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2"><Label className="text-xs">Performers</Label>{part.performers.map((performer: PerformerValue, performerIndex: number) => <div key={`${part.id}-${performerIndex}`} className="flex gap-2"><div className="min-w-0 flex-1"><MemberSearchCombobox value={performer} onChange={(v) => onPerformerChange(performerIndex, v)} /></div><Button type="button" variant="ghost" size="icon" onClick={() => onChange({ performers: part.performers.filter((_, i) => i !== performerIndex) })}><X className="h-4 w-4" /></Button></div>)}<Button type="button" variant="outline" size="sm" onClick={() => onChange({ performers: [...part.performers, { memberId: null, guestName: null, displayName: "" }] })}><Plus className="mr-1 h-3.5 w-3.5" />Add performer</Button>{part.performers.length === 0 && <p className="text-xs text-muted-foreground">No performer assigned.</p>}</div>
        </div>
      </div>
      <div className="mt-2 text-right text-xs text-muted-foreground">Part {index + 1} in display order</div>
    </div>
  );
}

function SessionEditor({ editor, dirty, saving, onChange, onSave, onBack, onPublish, onUnpublish, unpublishPending, onDelete, publishWarnings, publishOpen, setPublishOpen, publishPending, confirmPublish, deleteOpen, setDeleteOpen, deletePending, confirmDelete, onChangeLatest }: any) {
  const updateRole = (id: string, patch: Partial<EditorRole>) => onChange({ roles: editor.roles.map((r: EditorRole) => r.id === id ? { ...r, ...patch } : r) });
  const updatePart = (id: string, patch: Partial<EditorPart>) => onChange({ parts: editor.parts.map((p: EditorPart) => p.id === id ? { ...p, ...patch } : p) });
  const updateRolePerformer = (roleId: string, performerIndex: number, v: PerformerValue) =>
    onChangeLatest((current: EditorState) => {
      const roles = current.roles.map((r: EditorRole) => {
        if (r.id !== roleId) return r;
        const performers = v.displayName
          ? r.performers.map((p: PerformerValue, i: number) => (i === performerIndex ? v : p))
          : r.performers.filter((_: PerformerValue, i: number) => i !== performerIndex);
        return { ...r, performers };
      });
      return { ...current, roles };
    });
  const updatePartPerformer = (partId: string, performerIndex: number, v: PerformerValue) =>
    onChangeLatest((current: EditorState) => {
      const parts = current.parts.map((p: EditorPart) => {
        if (p.id !== partId) return p;
        const performers = v.displayName
          ? p.performers.map((x: PerformerValue, i: number) => (i === performerIndex ? v : x))
          : p.performers.filter((_: PerformerValue, i: number) => i !== performerIndex);
        return { ...p, performers };
      });
      return { ...current, parts };
    });
  const addRole = () => onChange({ roles: [...editor.roles, { id: crypto.randomUUID(), role_name: "Custom Role", display_order: editor.roles.length + 1, performers: [] }] });
  const addPart = () => onChange({ parts: [...editor.parts, { id: crypto.randomUUID(), part_number: editor.parts.length + 1, part_type: "other", description: "", display_order: editor.parts.length + 1, performers: [] }] });
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = editor.parts.findIndex((p: EditorPart) => p.id === active.id);
    const newIndex = editor.parts.findIndex((p: EditorPart) => p.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0) onChange({ parts: arrayMove(editor.parts, oldIndex, newIndex).map((p: EditorPart, i: number) => ({ ...p, display_order: i + 1 })) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button><div><div className="flex items-center gap-2"><BookOpen className="h-5 w-5" /><h1 className="text-xl font-bold">{PROGRAM_META[editor.program_type].label}</h1></div><p className="text-sm text-muted-foreground">{formatSessionDate(editor.scheduled_date)}</p></div></div>
        <div className="flex flex-wrap items-center gap-2"><span className={cn("text-xs", saving ? "text-primary" : dirty ? "text-amber-600" : "text-muted-foreground")}>{saving ? "Saving…" : dirty ? "Unsaved changes" : "Saved ✓"}</span><Button variant="outline" size="sm" onClick={onSave} disabled={!dirty || saving}><Save className="mr-1 h-4 w-4" />Save</Button>{editor.is_published ? <><Badge>Published</Badge><Button variant="outline" size="sm" onClick={onUnpublish} disabled={unpublishPending}>Make Draft</Button></> : <Button size="sm" onClick={onPublish}>Publish</Button>}<Button variant="destructive" size="sm" onClick={onDelete}><Trash2 className="mr-1 h-4 w-4" />Delete</Button></div>
      </div>

      <Card><CardHeader><CardTitle>Session Metadata</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2"><Label>Title (Bengali) *</Label><Input value={editor.title_bn} onChange={(e) => onChange({ title_bn: e.target.value })} /></div>
        <div className="space-y-2"><Label>Scheduled Date *</Label><Input type="date" value={editor.scheduled_date} onChange={(e) => onChange({ scheduled_date: e.target.value })} /></div>
        <div className="space-y-2"><Label>Programme</Label><Select value={editor.program_type} onValueChange={(v) => onChange({ program_type: v as StudyCircleProgram })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kathamrita">Ramakrishna Kathamrita</SelectItem><SelectItem value="pathochokro">Pathochokro</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={editor.start_time} onChange={(e) => onChange({ start_time: e.target.value })} /><p className="text-xs text-muted-foreground">Leave blank if the default time is used.</p></div>
        <div className="space-y-2 md:col-span-2"><Label>Note / Announcement</Label><Textarea value={editor.note} onChange={(e) => onChange({ note: e.target.value })} rows={3} placeholder="Time change or other announcement…" /></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center justify-between">Roles <Button variant="outline" size="sm" onClick={addRole}><Plus className="mr-1 h-4 w-4" />Add role</Button></CardTitle></CardHeader><CardContent className="space-y-3">
        {editor.roles.map((role: EditorRole, i: number) => <div key={role.id} className="rounded-xl border p-4"><div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><div><Label className="text-xs">Role</Label><Input value={role.role_name} onChange={(e) => updateRole(role.id, { role_name: e.target.value })} /></div><div className="space-y-2 md:col-span-2"><Label className="text-xs">Performers</Label>{role.performers.map((performer: PerformerValue, performerIndex: number) => <div key={`${role.id}-${performerIndex}`} className="flex gap-2"><div className="min-w-0 flex-1"><MemberSearchCombobox value={performer} onChange={(v) => updateRolePerformer(role.id, performerIndex, v)} /></div><Button type="button" variant="ghost" size="icon" onClick={() => updateRole(role.id, { performers: role.performers.filter((_, i) => i !== performerIndex) })}><X className="h-4 w-4" /></Button></div>)}<Button type="button" variant="outline" size="sm" onClick={() => updateRole(role.id, { performers: [...role.performers, { memberId: null, guestName: null, displayName: "" }] })}><Plus className="mr-1 h-3.5 w-3.5" />Add performer</Button>{role.performers.length === 0 && <p className="text-xs text-muted-foreground">No performer assigned.</p>}</div><Button variant="ghost" size="icon" className="mt-5 text-destructive" onClick={() => onChange({ roles: editor.roles.filter((r: EditorRole) => r.id !== role.id) })}><X className="h-4 w-4" /></Button></div><p className="mt-2 text-xs text-muted-foreground">Role {i + 1}</p></div>)}
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center justify-between">Programme Parts <Button variant="outline" size="sm" onClick={addPart}><Plus className="mr-1 h-4 w-4" />Add Part</Button></CardTitle></CardHeader><CardContent>
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={editor.parts.map((p: EditorPart) => p.id)} strategy={verticalListSortingStrategy}><div className="space-y-3">{editor.parts.map((part: EditorPart, i: number) => <SortablePart key={part.id} part={part} index={i} onChange={(patch) => updatePart(part.id, patch)} onDelete={() => onChange({ parts: editor.parts.filter((p: EditorPart) => p.id !== part.id) })} onPerformerChange={(performerIndex, v) => updatePartPerformer(part.id, performerIndex, v)} />)}</div></SortableContext></DndContext>
        {editor.parts.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No parts yet. Add the first programme part.</div>}
      </CardContent></Card>

      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Publish this session?</AlertDialogTitle><AlertDialogDescription>{publishWarnings.length ? <span className="space-y-2">The following items need attention:<br />{publishWarnings.map((w: string) => <span key={w} className="block">• {w}</span>)}<br />You can still publish if these are intentional.</span> : "Everything looks assigned. The public page will show this session immediately."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep Draft</AlertDialogCancel><AlertDialogAction onClick={confirmPublish} disabled={publishPending}>{publishPending ? "Publishing…" : "Publish"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this session?</AlertDialogTitle><AlertDialogDescription>This permanently removes the session, its roles and its parts.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={confirmDelete} disabled={deletePending}>{deletePending ? "Deleting…" : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
