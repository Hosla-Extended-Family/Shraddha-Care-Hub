import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Download, GripVertical, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RenderMarkdownLite } from "@/lib/markdown-lite";

interface Newsletter { id: string; title: string; issue_number: number | null; status: string; created_at: string; }
interface BlogRow { id: string; title: string; author_id: string; published_at: string | null; status?: string; }
interface FullBlog { id: string; title: string; body: string; author_id: string; published_at: string | null; language: string | null; }

type Layout = "standard" | "compact" | "magazine";

function SortableItem({ id, title, onRemove }: { id: string; title: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 border border-border rounded p-2 bg-card">
      <button {...attributes} {...listeners} className="cursor-grab touch-none"><GripVertical className="h-4 w-4 text-muted-foreground" /></button>
      <div className="flex-1 truncate">{title}</div>
      <Button variant="ghost" size="icon" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}

export default function AdminNewsletters() {
  const { toast } = useToast();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ blog_id: string; position: number; title: string }>>([]);
  const [available, setAvailable] = useState<BlogRow[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newIssue, setNewIssue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [fullBlogs, setFullBlogs] = useState<FullBlog[]>([]);
  const [authorMap, setAuthorMap] = useState<Record<string, string>>({});
  const [editedTitles, setEditedTitles] = useState<Record<string, string>>({});
  const [editedBodies, setEditedBodies] = useState<Record<string, string>>({});
  const [introText, setIntroText] = useState("");
  const [overrideTitle, setOverrideTitle] = useState("");
  const [layout, setLayout] = useState<Layout>("standard");

  const load = async () => {
    setLoading(true);
    const [{ data: nl }, { data: blogs }] = await Promise.all([
      supabase.from("newsletters").select("*").order("created_at", { ascending: false }),
      supabase.from("blogs").select("id, title, author_id, published_at, status").in("status", ["published", "approved"]).order("published_at", { ascending: false, nullsFirst: false }),
    ]);
    setNewsletters((nl ?? []) as Newsletter[]);
    setAvailable((blogs ?? []) as BlogRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadItems = async (id: string) => {
    const { data } = await supabase
      .from("newsletter_blogs")
      .select("blog_id, position, blogs(title)")
      .eq("newsletter_id", id)
      .order("position", { ascending: true });
    setItems((data ?? []).map((r: any) => ({ blog_id: r.blog_id, position: r.position, title: r.blogs?.title || "Untitled" })));
  };

  const selectNewsletter = async (id: string) => {
    setSelectedId(id);
    await loadItems(id);
  };

  const createNewsletter = async () => {
    if (!newTitle.trim()) return;
    const { data, error } = await supabase.from("newsletters").insert({
      title: newTitle.trim(),
      issue_number: newIssue ? parseInt(newIssue) : null,
    }).select("*").single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setNewTitle(""); setNewIssue("");
    await load();
    if (data) selectNewsletter(data.id);
  };

  const addBlog = async (blogId: string) => {
    if (!selectedId) return;
    if (items.some((i) => i.blog_id === blogId)) return;
    const newPos = items.length;
    const { error } = await supabase.from("newsletter_blogs").insert({ newsletter_id: selectedId, blog_id: blogId, position: newPos });
    if (error) { toast({ title: "Add failed", description: error.message, variant: "destructive" }); return; }
    loadItems(selectedId);
  };

  const removeBlog = async (blogId: string) => {
    if (!selectedId) return;
    await supabase.from("newsletter_blogs").delete().eq("newsletter_id", selectedId).eq("blog_id", blogId);
    loadItems(selectedId);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !selectedId) return;
    const oldIndex = items.findIndex((i) => i.blog_id === active.id);
    const newIndex = items.findIndex((i) => i.blog_id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex).map((it, idx) => ({ ...it, position: idx }));
    setItems(reordered);
    setSaving(true);
    await Promise.all(reordered.map((it) =>
      supabase.from("newsletter_blogs").update({ position: it.position }).eq("newsletter_id", selectedId).eq("blog_id", it.blog_id)
    ));
    setSaving(false);
  };

  const deleteNewsletter = async (id: string) => {
    if (!confirm("Delete this newsletter? Blog rows are not deleted.")) return;
    await supabase.from("newsletters").delete().eq("id", id);
    if (selectedId === id) setSelectedId(null);
    load();
  };

  const openPreview = async () => {
    if (!selectedId || items.length === 0) return;
    const selected = newsletters.find((n) => n.id === selectedId);
    setOverrideTitle(selected?.title || "");
    setPreviewOpen(true);
    setPreviewLoading(true);
    // Fetch full bodies + author names in one pass
    const blogIds = items.map((i) => i.blog_id);
    const { data: fullData } = await supabase
      .from("blogs")
      .select("id, title, body, author_id, published_at, language")
      .in("id", blogIds);
    const ordered = blogIds
      .map((id) => (fullData ?? []).find((b: any) => b.id === id))
      .filter(Boolean) as FullBlog[];
    setFullBlogs(ordered);
    const authorIds = Array.from(new Set(ordered.map((b) => b.author_id)));
    const { data: profs } = authorIds.length
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", authorIds)
      : { data: [] as any[] };
    const map: Record<string, string> = {};
    (profs ?? []).forEach((p: any) => { map[p.user_id] = p.full_name || "Anonymous"; });
    setAuthorMap(map);
    // Reset overrides
    setEditedTitles({});
    setEditedBodies({});
    setIntroText("");
    setPreviewLoading(false);
  };

  const exportDocx = async () => {
    if (!selectedId) return;
    setExporting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const overrides = fullBlogs.map((b) => ({
        blog_id: b.id,
        title: editedTitles[b.id] ?? b.title,
        body: editedBodies[b.id] ?? b.body,
      }));
      const res = await fetch(`https://${projectRef}.supabase.co/functions/v1/generate-newsletter-docx`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          newsletterId: selectedId,
          layout,
          intro_text: introText || null,
          title_override: overrideTitle || null,
          blog_overrides: overrides,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safe = (overrideTitle || "newsletter").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      a.href = url; a.download = `${safe}.docx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Open the file in Word or Google Docs to review." });
      setPreviewOpen(false);
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const selected = newsletters.find((n) => n.id === selectedId);
  const usedIds = useMemo(() => new Set(items.map((i) => i.blog_id)), [items]);

  const layoutClasses: Record<Layout, string> = {
    standard: "prose max-w-none",
    compact: "prose prose-sm max-w-none",
    magazine: "prose max-w-none first-letter:font-serif first-letter:text-5xl first-letter:font-bold first-letter:text-primary first-letter:mr-2 first-letter:float-left first-letter:leading-none",
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Newsletters</h1>
        <p className="text-muted-foreground">Bundle published stories, preview the layout, then export a formatted DOCX.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Create newsletter</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input placeholder="Title (e.g. Hosla Voices)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="flex-1 min-w-[200px]" />
          <Input placeholder="Issue #" value={newIssue} onChange={(e) => setNewIssue(e.target.value)} type="number" className="w-32" />
          <Button onClick={createNewsletter}><Plus className="h-4 w-4 mr-1" />Create</Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>All newsletters</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {newsletters.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : newsletters.map((n) => (
              <div key={n.id} className={`flex items-center justify-between gap-2 p-2 rounded border ${selectedId === n.id ? "border-primary bg-primary/5" : "border-border"}`}>
                <button className="flex-1 text-left truncate" onClick={() => selectNewsletter(n.id)}>
                  <div className="font-medium truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.issue_number ? `Issue ${n.issue_number}` : "No issue"}</div>
                </button>
                <Button size="icon" variant="ghost" onClick={() => deleteNewsletter(n.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle>{selected ? selected.title : "Select a newsletter"}</CardTitle>
              {selected && (
                <Button onClick={openPreview} disabled={items.length === 0}>
                  <Eye className="h-4 w-4 mr-1" /> Preview & Export
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selected ? <p className="text-muted-foreground">Pick a newsletter on the left, or create one.</p> : (
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">Included stories {saving && <Loader2 className="h-3 w-3 animate-spin inline ml-2" />}</Label>
                  {items.length === 0 ? <p className="text-sm text-muted-foreground">No stories yet.</p> : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={items.map((i) => i.blog_id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {items.map((it) => <SortableItem key={it.blog_id} id={it.blog_id} title={it.title} onRemove={() => removeBlog(it.blog_id)} />)}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block">Add stories (published & approved)</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded p-2">
                    {available.filter((b) => !usedIds.has(b.id)).map((b) => (
                      <button key={b.id} onClick={() => addBlog(b.id)} className="w-full text-left p-2 rounded hover:bg-accent flex items-center justify-between gap-2">
                        <span className="truncate flex-1">{b.title}</span>
                        <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${b.status === "published" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"}`}>
                          {b.status === "published" ? "Published" : "Approved"}
                        </span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                    {available.filter((b) => !usedIds.has(b.id)).length === 0 && <p className="text-sm text-muted-foreground p-2">All eligible stories are already in this newsletter.</p>}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview + Layout dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Preview & Export</DialogTitle>
            <DialogDescription>
              Edit any story's title or wording just for this issue. The original stays untouched.
            </DialogDescription>
          </DialogHeader>

          {previewLoading ? (
            <div className="flex-1 flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <Label htmlFor="nl-title">Newsletter title (for this export)</Label>
                    <Input id="nl-title" value={overrideTitle} onChange={(e) => setOverrideTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="nl-intro">Editor's note / intro (optional)</Label>
                    <Textarea id="nl-intro" rows={3} placeholder="A short note that opens the issue…" value={introText} onChange={(e) => setIntroText(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Layout</Label>
                  <RadioGroup value={layout} onValueChange={(v) => setLayout(v as Layout)} className="space-y-2">
                    {([
                      { v: "standard", label: "Standard", desc: "Comfortable reading" },
                      { v: "compact", label: "Compact", desc: "Tighter spacing, more per page" },
                      { v: "magazine", label: "Magazine", desc: "Drop-cap first letter" },
                    ] as { v: Layout; label: string; desc: string }[]).map((o) => (
                      <label key={o.v} className={`flex items-start gap-2 p-2 border rounded cursor-pointer ${layout === o.v ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value={o.v} className="mt-1" />
                        <div>
                          <div className="text-sm font-medium">{o.label}</div>
                          <div className="text-xs text-muted-foreground">{o.desc}</div>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {/* Live preview */}
              <div className="border border-border rounded-lg bg-card p-6 space-y-8">
                <header className="border-b border-border pb-4">
                  <div className="text-xs uppercase tracking-widest text-primary font-semibold">{selected?.issue_number ? `Issue ${selected.issue_number}` : "Newsletter"}</div>
                  <h2 className="font-serif text-3xl font-bold mt-1">{overrideTitle || selected?.title}</h2>
                  {introText && <p className="mt-3 italic text-muted-foreground leading-relaxed">{introText}</p>}
                </header>

                {fullBlogs.map((b, idx) => {
                  const t = editedTitles[b.id] ?? b.title;
                  const bd = editedBodies[b.id] ?? b.body;
                  return (
                    <article key={b.id} className={idx > 0 ? "pt-6 border-t border-border" : ""}>
                      <div className="mb-3">
                        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Story title</Label>
                        <Input value={t} onChange={(e) => setEditedTitles((prev) => ({ ...prev, [b.id]: e.target.value }))} className="mt-1 font-serif text-xl h-11" />
                      </div>
                      <div className="text-sm text-muted-foreground italic mb-3">
                        By {authorMap[b.author_id] || "Anonymous"}
                        {b.published_at && <> · {new Date(b.published_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</>}
                      </div>
                      <details className="mb-2">
                        <summary className="text-xs text-primary cursor-pointer hover:underline">Edit story text</summary>
                        <Textarea rows={8} className="mt-2 font-mono text-xs" value={bd} onChange={(e) => setEditedBodies((prev) => ({ ...prev, [b.id]: e.target.value }))} />
                      </details>
                      <div className={layoutClasses[layout]}>
                        <RenderMarkdownLite text={bd} className="text-foreground" />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
            <Button onClick={exportDocx} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
              Export DOCX
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
