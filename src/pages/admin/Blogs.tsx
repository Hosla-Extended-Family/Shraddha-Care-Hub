import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, MessageSquareWarning, Archive, EyeOff, Send, Trash2, ImagePlus, X, Save, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RenderMarkdownLite } from "@/lib/markdown-lite";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageUpload } from "@/hooks/use-image-upload";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STATUSES = ["submitted", "under_review", "needs_changes", "approved", "published", "archived"] as const;

type BlogRow = any;

export default function AdminBlogs() {
  const { toast } = useToast();
  const [rows, setRows] = useState<BlogRow[]>([]);
  const [authors, setAuthors] = useState<Record<string, { name: string; email: string }>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("submitted");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCover, setEditCover] = useState<string | null>(null);
  const [origSnapshot, setOrigSnapshot] = useState<{ title: string; body: string; cover: string | null }>({ title: "", body: "", cover: null });
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const { upload: uploadCover, isUploading: coverUploading, progress: coverProgress } = useImageUpload({
    bucket: "project-posters",
    folder: "blogs",
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blogs")
      .select("*")
      .neq("status", "draft")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(200);
    setRows(data ?? []);
    const ids = Array.from(new Set((data ?? []).map((r: any) => r.author_id)));
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids);
      const map: Record<string, { name: string; email: string }> = {};
      (profiles ?? []).forEach((p: any) => { map[p.user_id] = { name: p.full_name || "Anonymous", email: p.email }; });
      setAuthors(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => r.status === filter), [rows, filter]);

  const openRow = (row: any) => {
    if (expanded === row.id) { setExpanded(null); return; }
    setExpanded(row.id);
    setEditTitle(row.title || "");
    setEditBody(row.body || "");
    setEditCover(row.cover_image_url || null);
    setOrigSnapshot({ title: row.title || "", body: row.body || "", cover: row.cover_image_url || null });
    setNotes(row.admin_notes || "");
  };

  const isDirty = editTitle !== origSnapshot.title || editBody !== origSnapshot.body || editCover !== origSnapshot.cover;

  const saveEdits = async (row: any): Promise<boolean> => {
    setBusy(true);
    const { error } = await supabase.from("blogs").update({ title: editTitle, body: editBody, cover_image_url: editCover }).eq("id", row.id);
    setBusy(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return false; }
    toast({ title: "Saved" });
    setOrigSnapshot({ title: editTitle, body: editBody, cover: editCover });
    setRows((rs) => rs.map((r) => r.id === row.id ? { ...r, title: editTitle, body: editBody, cover_image_url: editCover } : r));
    return true;
  };

  const saveAndPublish = async (row: any) => {
    if (isDirty) {
      const ok = await saveEdits(row);
      if (!ok) return;
    }
    await runAction(row, "publish");
  };

  const handleCoverFile = async (file: File) => {
    const url = await uploadCover(file);
    if (!url) return;
    setEditCover(url);
    if (expanded) {
      const { error } = await supabase.from("blogs").update({ cover_image_url: url }).eq("id", expanded);
      if (error) toast({ title: "Cover saved locally only", description: error.message, variant: "destructive" });
      else {
        toast({ title: "Cover updated" });
        setRows((rs) => rs.map((r) => r.id === expanded ? { ...r, cover_image_url: url } : r));
        setOrigSnapshot((s) => ({ ...s, cover: url }));
      }
    }
  };

  const clearCover = async (row: any) => {
    setEditCover(null);
    const { error } = await supabase.from("blogs").update({ cover_image_url: null }).eq("id", row.id);
    if (error) toast({ title: "Couldn't remove cover", description: error.message, variant: "destructive" });
    else {
      setRows((rs) => rs.map((r) => r.id === row.id ? { ...r, cover_image_url: null } : r));
      setOrigSnapshot((s) => ({ ...s, cover: null }));
    }
  };

  const runAction = async (row: any, action: string, notesOverride?: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("publish-blog", { body: { blogId: row.id, action, adminNotes: notesOverride ?? notes } });
    setBusy(false);
    if (error || data?.error) {
      toast({ title: "Failed", description: (error as any)?.message || data?.error, variant: "destructive" });
    } else {
      toast({ title: "Done" });
      setExpanded(null);
      load();
    }
  };

  const deleteBlog = async (row: any) => {
    if (!confirm(`Permanently delete "${row.title || "Untitled"}"? This removes it from the database and cannot be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.from("blogs").delete().eq("id", row.id);
    setBusy(false);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); setExpanded(null); load(); }
  };

  // Drag-drop reordering (published tab only)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = filtered.findIndex((r) => r.id === active.id);
    const newIdx = filtered.findIndex((r) => r.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(filtered, oldIdx, newIdx);
    // Assign sequential sort_order (10, 20, 30…) to give room for future inserts.
    const updates = reordered.map((r, i) => ({ id: r.id, sort_order: (i + 1) * 10 }));
    // Optimistic update
    setRows((rs) => {
      const map = new Map(updates.map((u) => [u.id, u.sort_order]));
      const next = rs.map((r) => map.has(r.id) ? { ...r, sort_order: map.get(r.id) } : r);
      return next.sort((a, b) => {
        if (a.status !== b.status) return 0;
        const ao = a.sort_order ?? Number.MAX_SAFE_INTEGER;
        const bo = b.sort_order ?? Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    });
    // Persist
    await Promise.all(updates.map((u) => supabase.from("blogs").update({ sort_order: u.sort_order }).eq("id", u.id)));
    toast({ title: "Order updated", description: "Blogs on the public page now use this order." });
  };

  const canReorder = filter === "published";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Story moderation</h1>
          <p className="text-muted-foreground">Review, edit, and publish community stories.</p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="flex-wrap h-auto">
          {STATUSES.map((s) => {
            const count = rows.filter((r) => r.status === s).length;
            return <TabsTrigger key={s} value={s} className="capitalize">{s.replace("_", " ")} ({count})</TabsTrigger>;
          })}
        </TabsList>
      </Tabs>

      {canReorder && filtered.length > 1 && (
        <p className="text-sm text-muted-foreground">Drag <GripVertical className="inline h-4 w-4" /> to reorder — the top item appears first on the public Blogs page.</p>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No stories in this state.</CardContent></Card>
      ) : canReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={filtered.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filtered.map((row) => (
                <SortableBlogRow
                  key={row.id}
                  row={row}
                  expanded={expanded === row.id}
                  onToggle={() => openRow(row)}
                  authors={authors}
                >
                  {expanded === row.id && renderExpanded(row)}
                </SortableBlogRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <Card key={row.id}>
              <CardHeader className="cursor-pointer" onClick={() => openRow(row)}>
                <RowHeader row={row} authors={authors} />
              </CardHeader>
              {expanded === row.id && renderExpanded(row)}
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  function renderExpanded(row: any) {
    const isPublished = row.status === "published";
    return (
      <CardContent className="space-y-4 border-t">
        <div>
          <Label>Cover image</Label>
          <div className="mt-2 space-y-2">
            {editCover ? (
              <div className="relative">
                <img src={editCover} alt="cover" className="w-full max-h-64 object-cover rounded border" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => clearCover(row)}
                  disabled={coverUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded p-6 text-center text-sm text-muted-foreground">
                No cover image
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverFile(f); e.currentTarget.value = ""; }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
            >
              {coverUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading {coverProgress}%</> : <><ImagePlus className="h-4 w-4 mr-2" />{editCover ? "Replace cover" : "Add cover"}</>}
            </Button>
            <p className="text-xs text-muted-foreground">Cover updates save automatically.</p>
          </div>
        </div>

        <div>
          <Label>Title</Label>
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
        </div>
        <div>
          <Label>Body (markdown-lite)</Label>
          <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} className="min-h-[300px] font-mono text-sm" />
        </div>
        <div>
          <Label>Preview</Label>
          <div className="border border-border rounded p-4 bg-background max-h-64 overflow-auto">
            <RenderMarkdownLite text={editBody} />
          </div>
        </div>
        {!isPublished && (
          <div>
            <Label>Note to author (used with "Request changes")</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Could you add a bit more about the day at the temple?" />
          </div>
        )}

        {isPublished ? (
          <>
            <div className="rounded-md bg-muted/50 border border-border p-3 text-xs text-muted-foreground">
              This blog is live. Saving changes updates it in place — the original publish date is kept so it won't jump above newer posts.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => saveEdits(row)} disabled={busy || !isDirty}>
                <Save className="h-4 w-4 mr-1" />{isDirty ? "Save changes" : "No changes to save"}
              </Button>
              <Button variant="outline" onClick={() => runAction(row, "unpublish")} disabled={busy}><EyeOff className="h-4 w-4 mr-1" />Unpublish</Button>
              <Button variant="ghost" onClick={() => runAction(row, "archive")} disabled={busy}><Archive className="h-4 w-4 mr-1" />Archive</Button>
              <Button variant="destructive" onClick={() => deleteBlog(row)} disabled={busy} className="ml-auto"><Trash2 className="h-4 w-4 mr-1" />Delete permanently</Button>
            </div>
          </>
        ) : (
          <>
            {isDirty && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-900 dark:text-amber-200">
                You have unsaved edits. "Save & publish" will save them before publishing.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => saveEdits(row)} disabled={busy || !isDirty}><Save className="h-4 w-4 mr-1" />Save edits</Button>
              <Button onClick={() => saveAndPublish(row)} disabled={busy}><Send className="h-4 w-4 mr-1" />{isDirty ? "Save & publish" : "Publish"}</Button>
              <Button variant="outline" onClick={() => runAction(row, "approve")} disabled={busy}><CheckCircle2 className="h-4 w-4 mr-1" />Approve</Button>
              <Button variant="outline" onClick={() => runAction(row, "request_changes")} disabled={busy || !notes.trim()}><MessageSquareWarning className="h-4 w-4 mr-1" />Request changes</Button>
              <Button variant="ghost" onClick={() => runAction(row, "archive")} disabled={busy}><Archive className="h-4 w-4 mr-1" />Archive</Button>
              <Button variant="destructive" onClick={() => deleteBlog(row)} disabled={busy} className="ml-auto"><Trash2 className="h-4 w-4 mr-1" />Delete permanently</Button>
            </div>
          </>
        )}
      </CardContent>
    );
  }
}

function RowHeader({ row, authors }: { row: any; authors: Record<string, { name: string; email: string }> }) {
  const isGuest = !!row.is_guest;
  const displayName = isGuest
    ? (row.guest_name || "Guest")
    : (authors[row.author_id]?.name || "Unknown");
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <CardTitle className="text-lg truncate flex items-center gap-2">
          {row.title || "Untitled"}
          {isGuest && <Badge variant="secondary" className="text-xs">Guest</Badge>}
        </CardTitle>
        <div className="text-xs text-muted-foreground mt-1">
          By {displayName}
          {isGuest && row.guest_phone && <> · <span className="font-mono">{row.guest_phone}</span></>}
          {isGuest && row.author_id && <> · linked to writer profile</>}
          {" · "}Updated {new Date(row.updated_at).toLocaleString()}
          {row.language && <> · {row.language.toUpperCase()}</>}
        </div>
      </div>
      <Badge variant="outline">{row.status}</Badge>
    </div>
  );
}

function SortableBlogRow({ row, expanded, onToggle, authors, children }: {
  row: any; expanded: boolean; onToggle: () => void; authors: Record<string, { name: string; email: string }>; children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <Card ref={setNodeRef} style={style}>
      <CardHeader className="flex flex-row items-start gap-2 space-y-0">
        <button
          type="button"
          className="mt-1 cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex-1 cursor-pointer" onClick={onToggle}>
          <RowHeader row={row} authors={authors} />
        </div>
      </CardHeader>
      {expanded && children}
    </Card>
  );
}
