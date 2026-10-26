import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Copy,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MemberSearchCombobox } from "@/components/admin/MemberSearchCombobox";
import {
  DEFAULT_ROLES,
  DEMO_SESSIONS,
  fetchSessionBundle,
  formatSessionDate,
  generateWhatsAppMessage,
  PROGRAMS,
  type SessionBundle,
  type StudyCircleProgram,
  type StudyCircleSession,
} from "@/lib/studycircle";
import { cn } from "@/lib/utils";

interface EditorRole {
  id: string;
  role_name: string;
  display_order: number;
  performers: {
    member_id: string | null;
    performer_name: string;
    is_guest: boolean;
  }[];
}

interface EditorPart {
  id: string;
  part_number: number | null;
  item_type: "song" | "reading" | "prayer" | "other";
  description: string;
  reference_link: string;
  display_order: number;
  performers: {
    member_id: string | null;
    performer_name: string;
    is_guest: boolean;
  }[];
}

interface EditorState {
  title_bn: string;
  scheduled_date: string;
  program_type: StudyCircleProgram;
  start_time: string;
  status: "scheduled" | "cancelled";
  note: string;
  meeting_link: string;
  is_published: boolean;
  roles: EditorRole[];
  parts: EditorPart[];
}

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

  // Load all sessions
  const sessions = useQuery({
    queryKey: ["admin-study-circle-sessions"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("study_circle_sessions")
          .select("*")
          .order("scheduled_date", { ascending: false });
        if (error || !data || data.length === 0) {
          return {
            rows: [DEMO_SESSIONS.kathamrita, DEMO_SESSIONS.pathochokro],
            counts: new Map([["demo-kathamrita", 3], ["demo-pathochokro", 4]]),
          };
        }
        const rows = (data ?? []) as unknown as StudyCircleSession[];

        const counts = await Promise.all(
          rows.map(async (s) => {
            const { count } = await supabase
              .from("study_circle_parts")
              .select("id", { count: "exact", head: true })
              .eq("session_id", s.id);
            return [s.id, count ?? 0] as const;
          }),
        );
        return { rows, counts: new Map(counts) };
      } catch {
        return {
          rows: [DEMO_SESSIONS.kathamrita, DEMO_SESSIONS.pathochokro],
          counts: new Map([["demo-kathamrita", 3], ["demo-pathochokro", 4]]),
        };
      }
    },
  });

  const loadEditor = async (id: string) => {
    try {
      const bundle = await fetchSessionBundle(id);
      setEditingId(id);
      setEditor({
        title_bn: bundle.session.title_bn,
        scheduled_date: bundle.session.scheduled_date,
        program_type: bundle.session.program_type,
        start_time: bundle.session.start_time?.slice(0, 5) ?? "",
        status: bundle.session.status ?? "scheduled",
        note: bundle.session.note ?? "",
        meeting_link: bundle.session.meeting_link ?? "",
        is_published: bundle.session.is_published,
        roles: bundle.roles.map((r) => ({
          id: r.id,
          role_name: r.role_name,
          display_order: r.display_order,
          performers: r.performers.map((p) => ({
            member_id: p.member_id,
            performer_name: p.performer_name,
            is_guest: p.is_guest,
          })),
        })),
        parts: bundle.parts.map((p) => ({
          id: p.id,
          part_number: p.part_number,
          item_type: p.item_type ?? "other",
          description: p.description ?? "",
          reference_link: p.reference_link ?? "",
          display_order: p.display_order,
          performers: p.performers.map((x) => ({
            member_id: x.member_id,
            performer_name: x.performer_name,
            is_guest: x.is_guest,
          })),
        })),
      });
      setDirty(false);
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Failed to load session", description: err.message, variant: "destructive" });
    }
  };

  // Create session
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("study_circle_sessions")
        .insert({
          program_type: createProgram,
          scheduled_date: createDate,
          title_bn: PROGRAMS[createProgram].labelBn,
          status: "scheduled",
          is_published: false,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Seed default roles
      const defaultRoleRows = DEFAULT_ROLES.map((name, idx) => ({
        session_id: data.id,
        role_name: name,
        display_order: idx + 1,
      }));

      const { error: roleErr } = await supabase.from("study_circle_roles").insert(defaultRoleRows);
      if (roleErr) throw roleErr;

      return data.id;
    },
    onSuccess: async (id) => {
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-study-circle-sessions"] });
      await loadEditor(id);
      toast({ title: "Session created", description: "Default roles pre-seeded. Ready to edit." });
    },
    onError: (err: unknown) => {
      const error = err as { code?: string; message?: string };
      toast({
        title: "Could not create session",
        description: error.code === "23505" ? "A session for this program and date already exists." : (error.message ?? "Error creating session"),
        variant: "destructive",
      });
    },
  });

  // Save session mutation
  const saveMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: EditorState }) => {
      // 1. Update session row
      const { error: sErr } = await supabase
        .from("study_circle_sessions")
        .update({
          title_bn: value.title_bn.trim() || PROGRAMS[value.program_type].labelBn,
          scheduled_date: value.scheduled_date,
          program_type: value.program_type,
          start_time: value.start_time || null,
          status: value.status,
          note: value.note.trim() || null,
          meeting_link: value.meeting_link.trim() || null,
        })
        .eq("id", id);
      if (sErr) throw sErr;

      // 2. Roles sync
      const { data: existingRoles } = await supabase.from("study_circle_roles").select("id").eq("session_id", id);
      const keepRoleIds = value.roles.map((r) => r.id);
      const roleRows = (existingRoles ?? []) as unknown as { id: string }[];
      const rolesToDelete = roleRows.map((r) => r.id).filter((rid: string) => !keepRoleIds.includes(rid));
      if (rolesToDelete.length > 0) {
        await supabase.from("study_circle_roles").delete().in("id", rolesToDelete);
      }

      for (let i = 0; i < value.roles.length; i++) {
        const r = value.roles[i];
        await supabase.from("study_circle_roles").upsert({
          id: r.id,
          session_id: id,
          role_name: r.role_name.trim() || "Untitled Role",
          display_order: i + 1,
        });

        // Sync role performers
        await supabase.from("study_circle_role_performers").delete().eq("role_id", r.id);
        const performers = r.performers
          .filter((p) => p.performer_name.trim())
          .map((p, pIdx) => ({
            role_id: r.id,
            member_id: p.member_id,
            performer_name: p.performer_name.trim(),
            is_guest: p.is_guest,
            display_order: pIdx + 1,
          }));
        if (performers.length > 0) {
          await supabase.from("study_circle_role_performers").insert(performers);
        }
      }

      // 3. Parts sync
      const { data: existingParts } = await supabase.from("study_circle_parts").select("id").eq("session_id", id);
      const keepPartIds = value.parts.map((p) => p.id);
      const partRows = (existingParts ?? []) as unknown as { id: string }[];
      const partsToDelete = partRows.map((p) => p.id).filter((pid: string) => !keepPartIds.includes(pid));
      if (partsToDelete.length > 0) {
        await supabase.from("study_circle_parts").delete().in("id", partsToDelete);
      }

      for (let i = 0; i < value.parts.length; i++) {
        const p = value.parts[i];
        await supabase.from("study_circle_parts").upsert({
          id: p.id,
          session_id: id,
          part_number: p.part_number,
          item_type: p.item_type,
          description: p.description.trim(),
          reference_link: p.reference_link.trim() || null,
          display_order: i + 1,
        });

        // Sync part performers
        await supabase.from("study_circle_part_performers").delete().eq("part_id", p.id);
        const performers = p.performers
          .filter((x) => x.performer_name.trim())
          .map((x, xIdx) => ({
            part_id: p.id,
            member_id: x.member_id,
            performer_name: x.performer_name.trim(),
            is_guest: x.is_guest,
            display_order: xIdx + 1,
          }));
        if (performers.length > 0) {
          await supabase.from("study_circle_part_performers").insert(performers);
        }
      }
    },
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin-study-circle-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["study-circle-next"] });
      queryClient.invalidateQueries({ queryKey: ["study-circle-current"] });
      toast({ title: "Saved successfully", description: "All changes updated." });
    },
    onError: (err: unknown) => {
      const error = err as Error;
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    },
  });

  // Publish / Unpublish / Delete
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!editingId || !editor) return;
      if (dirty) await saveMutation.mutateAsync({ id: editingId, value: editor });
      const { error } = await supabase
        .from("study_circle_sessions")
        .update({ is_published: true, published_at: new Date().toISOString() })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditor((e) => (e ? { ...e, is_published: true } : e));
      setPublishOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-study-circle-sessions"] });
      toast({ title: "Session Published", description: "Now visible on the public schedule page." });
    },
    onError: (err: unknown) => {
      const error = err as Error;
      toast({ title: "Publish failed", description: error.message, variant: "destructive" });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase
        .from("study_circle_sessions")
        .update({ is_published: false })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditor((e) => (e ? { ...e, is_published: false } : e));
      queryClient.invalidateQueries({ queryKey: ["admin-study-circle-sessions"] });
      toast({ title: "Converted to Draft", description: "Hidden from public view." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase.from("study_circle_sessions").delete().eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      setEditor(null);
      setDeleteOpen(false);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin-study-circle-sessions"] });
      toast({ title: "Session deleted" });
    },
  });

  // Copy WhatsApp broadcast
  const handleCopyWhatsApp = () => {
    if (!editor || !editingId) return;
    const bundle: SessionBundle = {
      session: {
        id: editingId,
        program_type: editor.program_type,
        scheduled_date: editor.scheduled_date,
        start_time: editor.start_time || null,
        status: editor.status,
        title_bn: editor.title_bn,
        note: editor.note || null,
        meeting_link: editor.meeting_link || null,
        is_published: editor.is_published,
        published_at: null,
        created_at: "",
        updated_at: "",
      },
      roles: editor.roles.map((r) => ({
        id: r.id,
        session_id: editingId,
        role_name: r.role_name,
        display_order: r.display_order,
        created_at: "",
        performers: r.performers.map((p, idx) => ({
          id: `${r.id}-${idx}`,
          role_id: r.id,
          member_id: p.member_id,
          performer_name: p.performer_name,
          is_guest: p.is_guest,
          display_order: idx + 1,
          created_at: "",
        })),
      })),
      parts: editor.parts.map((p) => ({
        id: p.id,
        session_id: editingId,
        part_number: p.part_number,
        item_type: p.item_type,
        description: p.description,
        reference_link: p.reference_link || null,
        display_order: p.display_order,
        created_at: "",
        performers: p.performers.map((x, idx) => ({
          id: `${p.id}-${idx}`,
          part_id: p.id,
          member_id: x.member_id,
          performer_name: x.performer_name,
          is_guest: x.is_guest,
          display_order: idx + 1,
          created_at: "",
        })),
      })),
    };

    const text = generateWhatsAppMessage(bundle);
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied for WhatsApp! 📱",
      description: "Formatted Bengali schedule is copied to your clipboard.",
    });
  };

  const updateEditor = (patch: Partial<EditorState>) => {
    setEditor((curr) => (curr ? { ...curr, ...patch } : curr));
    setDirty(true);
  };

  const backToList = () => {
    setEditingId(null);
    setEditor(null);
    setDirty(false);
  };

  // Render View B: Editor
  if (editingId && editor) {
    return (
      <SessionEditor
        editor={editor}
        dirty={dirty}
        saving={saveMutation.isPending}
        onChange={updateEditor}
        onSave={() => saveMutation.mutate({ id: editingId, value: editor })}
        onBack={backToList}
        onCopyWhatsApp={handleCopyWhatsApp}
        onPublish={() => setPublishOpen(true)}
        onUnpublish={() => unpublishMutation.mutate()}
        onDelete={() => setDeleteOpen(true)}
        publishOpen={publishOpen}
        setPublishOpen={setPublishOpen}
        confirmPublish={() => publishMutation.mutate()}
        deleteOpen={deleteOpen}
        setDeleteOpen={setDeleteOpen}
        confirmDelete={() => deleteMutation.mutate()}
      />
    );
  }

  // Render View A: Session List
  const rows = sessions.data?.rows ?? [];
  const counts = sessions.data?.counts ?? new Map<string, number>();
  const kathamrita = rows.filter((r) => r.program_type === "kathamrita");
  const pathochokro = rows.filter((r) => r.program_type === "pathochokro");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Study Circle Schedule (পাঠচক্র সূচী)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage weekly Study Circle sessions, assign member performers, and generate WhatsApp broadcasts.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Session
        </Button>
      </div>

      {sessions.isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <SessionColumn
            title="রামকৃষ্ণ কথামৃত"
            subtitle="Tuesday (মঙ্গলবার)"
            program="kathamrita"
            sessions={kathamrita}
            counts={counts}
            onEdit={loadEditor}
          />
          <SessionColumn
            title="পাঠচক্র"
            subtitle="Thursday (বৃহস্পতিবার)"
            program="pathochokro"
            sessions={pathochokro}
            counts={counts}
            onEdit={loadEditor}
          />
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Study Circle Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>Programme Type</Label>
              <Select value={createProgram} onValueChange={(v) => setCreateProgram(v as StudyCircleProgram)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pathochokro">পাঠচক্র (Thursday · প্রতি বৃহস্পতিবার)</SelectItem>
                  <SelectItem value="kathamrita">রামকৃষ্ণ কথামৃত (Tuesday · মঙ্গলবার)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={!createDate || createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Session list card
function SessionColumn({
  title,
  subtitle,
  program,
  sessions,
  counts,
  onEdit,
}: {
  title: string;
  subtitle: string;
  program: StudyCircleProgram;
  sessions: StudyCircleSession[];
  counts: Map<string, number>;
  onEdit: (id: string) => void;
}) {
  const isKathamrita = program === "kathamrita";

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className={cn("border-b py-4", isKathamrita ? "bg-orange-500/10" : "bg-purple-500/10")}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <Badge variant="outline" className={isKathamrita ? "border-orange-300 text-orange-700" : "border-purple-300 text-purple-700"}>
            {sessions.length} sessions
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {sessions.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No sessions created yet.</p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onEdit(s.id)}
              className="w-full text-left rounded-xl border p-4 transition-all hover:border-primary/50 hover:bg-accent/40 bg-card group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {formatSessionDate(s.scheduled_date)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 font-serif">{s.title_bn}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {s.status === "cancelled" ? (
                    <Badge variant="destructive">Cancelled</Badge>
                  ) : s.is_published ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                  <span className="text-xs text-muted-foreground mt-1">
                    {counts.get(s.id) || 0} agenda parts
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// Editor view
function SessionEditor({
  editor,
  dirty,
  saving,
  onChange,
  onSave,
  onBack,
  onCopyWhatsApp,
  onPublish,
  onUnpublish,
  onDelete,
  publishOpen,
  setPublishOpen,
  confirmPublish,
  deleteOpen,
  setDeleteOpen,
  confirmDelete,
}: {
  editor: EditorState;
  dirty: boolean;
  saving: boolean;
  onChange: (patch: Partial<EditorState>) => void;
  onSave: () => void;
  onBack: () => void;
  onCopyWhatsApp: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  publishOpen: boolean;
  setPublishOpen: (open: boolean) => void;
  confirmPublish: () => void;
  deleteOpen: boolean;
  setDeleteOpen: (open: boolean) => void;
  confirmDelete: () => void;
}) {
  const meta = PROGRAMS[editor.program_type];

  const addRole = () => {
    onChange({
      roles: [
        ...editor.roles,
        {
          id: crypto.randomUUID(),
          role_name: "নতুন ভূমিকা (New Role)",
          display_order: editor.roles.length + 1,
          performers: [],
        },
      ],
    });
  };

  const updateRole = (id: string, patch: Partial<EditorRole>) => {
    onChange({
      roles: editor.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const addPart = () => {
    onChange({
      parts: [
        ...editor.parts,
        {
          id: crypto.randomUUID(),
          part_number: editor.parts.length + 1,
          item_type: "reading",
          description: "",
          reference_link: "",
          display_order: editor.parts.length + 1,
          performers: [],
        },
      ],
    });
  };

  const updatePart = (id: string, patch: Partial<EditorPart>) => {
    onChange({
      parts: editor.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = editor.parts.findIndex((p) => p.id === active.id);
    const newIdx = editor.parts.findIndex((p) => p.id === over.id);
    if (oldIdx >= 0 && newIdx >= 0) {
      const reordered = arrayMove(editor.parts, oldIdx, newIdx).map((p, i) => ({
        ...p,
        display_order: i + 1,
      }));
      onChange({ parts: reordered });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-bold uppercase px-2 py-0.5 rounded border", meta.soft)}>
                {meta.shortLabel}
              </span>
              <h1 className="text-xl font-bold">{editor.title_bn}</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{formatSessionDate(editor.scheduled_date)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Copy */}
          <Button variant="outline" size="sm" onClick={onCopyWhatsApp} className="gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-300">
            <Copy className="h-4 w-4" />
            WhatsApp Text
          </Button>

          {/* Dirty indicator */}
          <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
            {saving ? "Saving…" : dirty ? "● Unsaved" : "✓ Saved"}
          </span>

          <Button size="sm" onClick={onSave} disabled={!dirty || saving} className="gap-1.5">
            <Save className="h-4 w-4" />
            Save
          </Button>

          {editor.is_published ? (
            <Button variant="outline" size="sm" onClick={onUnpublish}>
              Make Draft
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={onPublish} className="bg-emerald-600 hover:bg-emerald-700">
              Publish
            </Button>
          )}

          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metadata Card */}
      <Card>
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-base font-semibold">Session Settings & Timing</CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Bengali Title</Label>
            <Input value={editor.title_bn} onChange={(e) => onChange({ title_bn: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={editor.status} onValueChange={(v) => onChange({ status: v as "scheduled" | "cancelled" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled (অনলাইন / কেন্দ্র)</SelectItem>
                <SelectItem value="cancelled">Cancelled (স্থগিত)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Scheduled Date</Label>
            <Input type="date" value={editor.scheduled_date} onChange={(e) => onChange({ scheduled_date: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>Start Time</Label>
            <Input type="time" value={editor.start_time} onChange={(e) => onChange({ start_time: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>Meeting Link (Google Meet / Zoom)</Label>
            <Input
              value={editor.meeting_link}
              onChange={(e) => onChange({ meeting_link: e.target.value })}
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div className="space-y-1.5 md:col-span-3">
            <Label>Note / Announcement (বিজ্ঞপ্তি)</Label>
            <Textarea
              value={editor.note}
              onChange={(e) => onChange({ note: e.target.value })}
              rows={2}
              placeholder="Special instructions, time changes, or cancellation reasons..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Roles */}
      <Card>
        <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Leadership Roles (দায়িত্বপ্রাপ্ত)</CardTitle>
          <Button variant="outline" size="sm" onClick={addRole} className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            Add Role
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {editor.roles.map((role) => (
            <div key={role.id} className="rounded-xl border p-4 bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={role.role_name}
                      onChange={(e) => updateRole(role.id, { role_name: e.target.value })}
                      className="font-medium h-9 max-w-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onChange({ roles: editor.roles.filter((r) => r.id !== role.id) })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Performer chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {role.performers.map((p, pIdx) => (
                      <span
                        key={pIdx}
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm",
                          p.is_guest
                            ? "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200"
                            : "bg-primary/10 text-primary border-primary/20",
                        )}
                      >
                        {p.performer_name}
                        {p.is_guest && <span className="text-[10px] opacity-75">(Guest)</span>}
                        <button
                          type="button"
                          onClick={() =>
                            updateRole(role.id, {
                              performers: role.performers.filter((_, idx) => idx !== pIdx),
                            })
                          }
                          className="hover:opacity-75"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}

                    <div className="w-56">
                      <MemberSearchCombobox
                        onSelect={(val) => {
                          if ("id" in val) {
                            updateRole(role.id, {
                              performers: [
                                ...role.performers,
                                { member_id: val.id, performer_name: val.name, is_guest: false },
                              ],
                            });
                          } else {
                            updateRole(role.id, {
                              performers: [
                                ...role.performers,
                                { member_id: null, performer_name: val.guestName, is_guest: true },
                              ],
                            });
                          }
                        }}
                        placeholder="+ Add performer…"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section 3: Agenda Parts with Drag and Drop */}
      <Card>
        <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Programme Parts (সূচী ও বিবরণ)</CardTitle>
          <Button variant="outline" size="sm" onClick={addPart} className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            Add Part
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={editor.parts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {editor.parts.map((part, idx) => (
                  <SortablePartItem
                    key={part.id}
                    part={part}
                    index={idx}
                    onChange={(patch) => updatePart(part.id, patch)}
                    onDelete={() => onChange({ parts: editor.parts.filter((p) => p.id !== part.id) })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {editor.parts.length === 0 && (
            <div className="py-12 border border-dashed rounded-xl text-center text-sm text-muted-foreground">
              No parts added yet. Click &ldquo;Add Part&rdquo; to structure the agenda.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publish Dialog */}
      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Study Circle Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the schedule visible on the public website. Members and visitors will be able to see the
              agenda and assigned performers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish} className="bg-emerald-600 hover:bg-emerald-700">
              Confirm & Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this session? All roles and agenda parts will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sortable part item
function SortablePartItem({
  part,
  index,
  onChange,
  onDelete,
}: {
  part: EditorPart;
  index: number;
  onChange: (patch: Partial<EditorPart>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: part.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border p-4 bg-card shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-2 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label="Drag part to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 grid gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">No. (ক্রমিক)</Label>
            <Input
              type="number"
              placeholder="Optional"
              value={part.part_number ?? ""}
              onChange={(e) =>
                onChange({ part_number: e.target.value === "" ? null : parseInt(e.target.value, 10) })
              }
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select
              value={part.item_type}
              onValueChange={(v) => onChange({ item_type: v as EditorPart["item_type"] })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">পাঠ (Reading)</SelectItem>
                <SelectItem value="song">সঙ্গীত (Song)</SelectItem>
                <SelectItem value="prayer">প্রণাম ও প্রার্থনা (Prayer)</SelectItem>
                <SelectItem value="other">অন্যান্য (Other)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Reference URL (Audio / PDF)</Label>
            <Input
              placeholder="https://..."
              value={part.reference_link}
              onChange={(e) => onChange({ reference_link: e.target.value })}
              className="h-9"
            />
          </div>

          <div className="space-y-1 sm:col-span-4">
            <Label className="text-xs">Description (বিবরণ / গান / অধ্যায়)</Label>
            <Textarea
              placeholder="e.g. পূর্বপাঠ সংক্ষিপ্তসার ও প্রণাম মন্ত্র..."
              value={part.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Performers */}
          <div className="sm:col-span-4 flex flex-wrap items-center gap-2 pt-1">
            <Label className="text-xs text-muted-foreground w-full">Performers for this part:</Label>
            {part.performers.map((p, pIdx) => (
              <span
                key={pIdx}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm",
                  p.is_guest
                    ? "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200"
                    : "bg-primary/10 text-primary border-primary/20",
                )}
              >
                {p.performer_name}
                {p.is_guest && <span className="text-[10px] opacity-75">(Guest)</span>}
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      performers: part.performers.filter((_, idx) => idx !== pIdx),
                    })
                  }
                  className="hover:opacity-75"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}

            <div className="w-56">
              <MemberSearchCombobox
                onSelect={(val) => {
                  if ("id" in val) {
                    onChange({
                      performers: [
                        ...part.performers,
                        { member_id: val.id, performer_name: val.name, is_guest: false },
                      ],
                    });
                  } else {
                    onChange({
                      performers: [
                        ...part.performers,
                        { member_id: null, performer_name: val.guestName, is_guest: true },
                      ],
                    });
                  }
                }}
                placeholder="+ Add performer…"
              />
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive shrink-0 mt-1"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
