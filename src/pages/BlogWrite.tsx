import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, Save, Send, ImagePlus, Wand2, Check, X, Bold, List,
  ArrowLeft, Sparkles, Lightbulb, Type, RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useFontSize, FontSizeToggle } from "@/hooks/use-font-size";
import { RichEditor, type RichEditorHandle, type ActiveFormats } from "@/components/blog/RichEditor";
import { CircularWavesLoader } from "@/components/blog/CircularWavesLoader";
import { extractKind, stripKindMarker, type BlogKind } from "@/lib/markdown-lite";
import { useI18n } from "@/i18n";

interface Suggestion { original: string; suggestion: string; reason: string; }

const QUICK_PROMPT_KEYS = [
  { key: "A memory from my youth", seed: "One memory from my youth that still makes me smile is " },
  { key: "A person who shaped me", seed: "The person who shaped me most is " },
  { key: "A day I'll never forget", seed: "There's one day I'll never forget. It was " },
  { key: "What Hosla means to me", seed: "Being part of Hosla means " },
  { key: "Advice for younger people", seed: "If I could tell my younger self one thing, it would be " },
  { key: "Something I'm proud of", seed: "One thing I'm truly proud of is " },
];

const TIP_KEYS = [
  "Write like you're telling a friend. Simple words are best.",
  "Don't worry about spelling — you can fix it later with one tap.",
  "Pick one memory and describe what you saw, heard, or felt.",
  "You can save and come back anytime. Nothing is lost.",
];

// Word-level diff for a suggestion pair — highlights what changed.
function diffWords(a: string, b: string): { removed: string[]; added: string[] } {
  const A = a.split(/(\s+)/);
  const B = b.split(/(\s+)/);
  const setA = new Set(A);
  const setB = new Set(B);
  return {
    removed: A.filter((t) => t.trim() && !setB.has(t)),
    added: B.filter((t) => t.trim() && !setA.has(t)),
  };
}

function DiffLine({ original, suggestion, mode }: { original: string; suggestion: string; mode: "full" | "highlights" }) {
  const { removed, added } = diffWords(original, suggestion);
  const renderMarked = (text: string, marks: string[], variant: "removed" | "added") => {
    const cls = variant === "removed"
      ? "bg-destructive/15 text-destructive line-through decoration-2 px-1 rounded"
      : "bg-primary/15 text-primary font-semibold px-1 rounded";
    if (marks.length === 0) return <span>{text}</span>;
    const escaped = marks.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const re = new RegExp(`(${escaped.join("|")})`, "g");
    const parts = text.split(re);
    return (
      <span>
        {parts.map((p, i) =>
          marks.includes(p) ? <mark key={i} className={cls}>{p}</mark> : <span key={i}>{p}</span>
        )}
      </span>
    );
  };

  if (mode === "highlights") {
    // Compact: show only the changed chunks, no unchanged prose.
    const noChanges = removed.length === 0 && added.length === 0;
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">
          Changed only
        </div>
        {noChanges ? (
          <div className="text-sm text-muted-foreground italic">Only formatting or order changed — open full view to compare.</div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed">
            {removed.map((w, i) => (
              <mark key={`r-${i}`} className="bg-destructive/15 text-destructive line-through decoration-2 px-1 rounded">{w}</mark>
            ))}
            {removed.length > 0 && added.length > 0 && (
              <span className="text-muted-foreground">→</span>
            )}
            {added.map((w, i) => (
              <mark key={`a-${i}`} className="bg-primary/15 text-primary font-semibold px-1 rounded">{w}</mark>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-destructive/80 mb-1">Before</div>
        <div className="text-sm leading-relaxed">{renderMarked(original, removed, "removed")}</div>
      </div>
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-primary/80 mb-1">After</div>
        <div className="text-sm leading-relaxed">{renderMarked(suggestion, added, "added")}</div>
      </div>
    </div>
  );
}

export default function BlogWrite() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editingId = params.get("id");
  const { toast } = useToast();
  const { t } = useI18n();
  const { upload, isUploading, progress: uploadProgress } = useImageUpload({ bucket: "project-posters", folder: "blogs", maxSizeMB: 1, maxWidthOrHeight: 1600 });
  const { size, setSize } = useFontSize();

  const [session, setSession] = useState<any>(null);
  const [blogId, setBlogId] = useState<string | null>(editingId);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<BlogKind>("story");
  const [cover, setCover] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const [adminNotes, setAdminNotes] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [diffMode, setDiffMode] = useState<"full" | "highlights">("full");
  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [editorSyncKey, setEditorSyncKey] = useState(0);
  const [initialBody, setInitialBody] = useState<string>("");

  const [showTips, setShowTips] = useState<boolean>(() => localStorage.getItem("blog_tips_dismissed") !== "1");
  const [active, setActive] = useState<ActiveFormats>({ bold: false, list: false, hasSelection: false });
  const [fabOpen, setFabOpen] = useState(false);
  const [restorePrompt, setRestorePrompt] = useState<null | { title: string; body: string; cover: string | null; ts: number }>(null);

  const editorRef = useRef<RichEditorHandle>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const backupKey = `blog_backup_${editingId || "new"}`;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate("/auth?next=/blog/write", { replace: true }); return; }
      const { data: profile } = await supabase.from("profiles").select("status").eq("user_id", data.session.user.id).maybeSingle();
      if ((profile as any)?.status !== "approved") {
        await supabase.auth.signOut();
        toast({
          title: t("Writer approval pending"),
          description: t("You can write as a guest until the admin team approves your writer account."),
          variant: "destructive",
        });
        navigate("/blog", { replace: true });
        return;
      }
      setSession(data.session);
      let dbUpdatedAt = 0;
      if (editingId) {
        const { data: row } = await supabase.from("blogs").select("*").eq("id", editingId).maybeSingle();
        if (row && row.author_id === data.session.user.id) {
          if (row.status === "published") {
            toast({ title: t("Published blogs can't be edited"), description: t("Contact an admin if this blog needs changes.") });
            navigate(`/blog/${row.slug ?? row.id}`, { replace: true });
            return;
          }
          setBlogId(row.id);
          setTitle(row.title || "");
          const { kind: k, body: b } = extractKind(row.body || "");
          setKind(k);
          setBody(row.body || "");
          setInitialBody(b);
          setCover(row.cover_image_url);
          setStatus(row.status);
          setAdminNotes(row.admin_notes);
          dbUpdatedAt = row.updated_at ? new Date(row.updated_at).getTime() : 0;
        }

      }
      // Restore from local backup if it's newer than the DB version
      try {
        const raw = localStorage.getItem(backupKey);
        if (raw) {
          const b = JSON.parse(raw);
          if (b && typeof b.ts === "number" && b.ts > dbUpdatedAt + 1500 && (b.title || b.body)) {
            setRestorePrompt(b);
          }
        }
      } catch {}
      setPageLoading(false);
    })();
  }, [editingId, navigate, backupKey]);

  const applyRestore = () => {
    if (!restorePrompt) return;
    setTitle(restorePrompt.title);
    setBody(restorePrompt.body);
    setCover(restorePrompt.cover);
    const { kind: k, body: b } = extractKind(restorePrompt.body);
    setKind(k);
    setInitialBody(b);
    setEditorSyncKey((k2) => k2 + 1);
    setRestorePrompt(null);
    toast({ title: t("Restored"), description: t("Your unsaved changes are back.") });
  };
  const discardRestore = () => {
    localStorage.removeItem(backupKey);
    setRestorePrompt(null);
  };

  const saveDraft = useCallback(async (silent = false) => {
    if (!session?.user) return;
    if (!title.trim() && !body.trim()) return;
    if (!silent) setSavingState("saving");
    const payload = {
      author_id: session.user.id,
      title: title.trim() || "Untitled",
      body,
      cover_image_url: cover,
      status: status === "needs_changes" ? "needs_changes" : "draft",
    };
    try {
      if (blogId) {
        const { error } = await supabase.from("blogs").update(payload).eq("id", blogId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("blogs").insert(payload).select("id").single();
        if (error) throw error;
        setBlogId(data.id);
        window.history.replaceState(null, "", `/blog/write?id=${data.id}`);
      }
      setSavingState("saved");
      setLastSavedAt(Date.now());
      // Successfully persisted — clear local backup(s)
      try {
        localStorage.removeItem(backupKey);
        if (!editingId) localStorage.removeItem("blog_backup_new");
      } catch {}
    } catch (e: any) {
      console.error("save error", e);
      setSavingState("error");
      if (!silent) toast({ title: t("Couldn't save"), description: e.message, variant: "destructive" });
    }
  }, [session, title, body, cover, status, blogId, toast, backupKey, editingId]);

  // Single autosave path: debounce 2s of inactivity, silent DB save. Also flushes
  // when the tab is hidden or unloaded so a phone call / close never loses work.
  useEffect(() => {
    if (!session) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (!title.trim() && !body.trim()) return;
    setSavingState("saving");
    saveTimer.current = setTimeout(() => saveDraft(true), 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, body, cover, session, saveDraft]);

  // Local backup on every change — survives refresh/logout even before the server save runs.
  useEffect(() => {
    if (!session || restorePrompt) return;
    if (!title.trim() && !body.trim()) return;
    try {
      localStorage.setItem(backupKey, JSON.stringify({ title, body, cover, ts: Date.now() }));
    } catch {}
  }, [title, body, cover, session, backupKey, restorePrompt]);

  // Flush on tab hide / close (covers phone call, app switch, browser close).
  useEffect(() => {
    const flush = () => { if (document.visibilityState === "hidden") saveDraft(true); };
    const onUnload = () => { saveDraft(true); };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [saveDraft]);

  const applyPrompt = (seed: string) => {
    const nextBody = body.trim() ? `${body.replace(/\s+$/, "")}\n\n${seed}` : seed;
    setBody(nextBody);
    setInitialBody(stripKindMarker(nextBody));
    setEditorSyncKey((k) => k + 1);
    setTimeout(() => editorRef.current?.focus(), 50);
  };

  const dismissTips = () => {
    setShowTips(false);
    localStorage.setItem("blog_tips_dismissed", "1");
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) setCover(url);
    e.target.value = "";
  };

  const runAiCheck = async () => {
    if (!body.trim()) { toast({ title: t("Nothing to check yet"), description: t("Write something first.") }); return; }
    setChecking(true);
    setSuggestions([]);
    const { data, error } = await supabase.functions.invoke("check-blog-writing", { body: { text: body } });
    setChecking(false);
    if (error) {
      const message = (error as any)?.context?.body ? await (error as any).context.text().catch(() => "") : error.message;
      toast({ title: t("AI check failed"), description: message || t("Please try again."), variant: "destructive" });
      return;
    }
    if (data?.error) { toast({ title: t("AI check failed"), description: data.error, variant: "destructive" }); return; }
    setSuggestions(data?.suggestions ?? []);
    if ((data?.suggestions ?? []).length === 0) {
      toast({ title: t("Your writing looks great!"), description: t("No suggestions.") });
    }
  };

  const acceptSuggestion = (idx: number) => {
    const s = suggestions[idx];
    const next = body.replace(s.original, s.suggestion);
    setBody(next);
    setInitialBody(stripKindMarker(next));
    setEditorSyncKey((k) => k + 1);
    setSuggestions((prev) => prev.filter((_, i) => i !== idx));
  };
  const acceptAll = () => {
    let updated = body;
    suggestions.forEach((s) => { updated = updated.replace(s.original, s.suggestion); });
    setBody(updated);
    setInitialBody(stripKindMarker(updated));
    setEditorSyncKey((k) => k + 1);
    setSuggestions([]);
  };
  const rejectSuggestion = (idx: number) => setSuggestions((prev) => prev.filter((_, i) => i !== idx));

  const submitStory = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: t("Add a title and story"), description: t("Please fill in both before submitting."), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await saveDraft(true);
    if (!blogId) { setSubmitting(false); return; }
    const { error } = await supabase.from("blogs").update({ status: "submitted", admin_notes: null }).eq("id", blogId);
    setSubmitting(false);
    if (error) toast({ title: t("Submit failed"), description: error.message, variant: "destructive" });
    else {
      toast({ title: t("Story submitted!"), description: t("We'll review it shortly and let you know.") });
      navigate("/profile");
    }
  };

  if (pageLoading) {
    return <Layout><div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  const ready = title.trim() && body.trim();
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <Layout>
      <div className="container max-w-3xl px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-4">
          <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t("My profile")}
          </Link>
          <div className="flex items-center gap-2">
            <FontSizeToggle size={size} onChange={setSize} />
          </div>
        </div>

        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">{t("Tell your story")}</h1>
        <p className="text-muted-foreground mb-6">{t("Write in whichever language feels natural. We'll take care of the rest.")}</p>

        {/* Guided walkthrough: tips + quick prompts */}
        {showTips && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Lightbulb className="h-5 w-5" />
                  {t("Not sure where to start? Try one of these.")}
                </div>
                <button
                  type="button"
                  onClick={dismissTips}
                  aria-label={t("Hide tips")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_PROMPT_KEYS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyPrompt(p.seed)}
                    className="text-sm rounded-full border border-primary/40 bg-background hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-2 min-h-[44px]"
                  >
                    {t(p.key)}
                  </button>
                ))}
              </div>

              <ul className="mt-4 space-y-1.5 text-sm text-foreground/80">
                {TIP_KEYS.map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t(tip)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {!showTips && (
          <button
            type="button"
            onClick={() => setShowTips(true)}
            className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Lightbulb className="h-4 w-4" /> {t("Show writing tips & prompts")}
          </button>
        )}

        {status === "needs_changes" && adminNotes && (
          <Card className="mb-6 border-amber-400 bg-amber-50">
            <CardContent className="pt-6">
              <div className="text-sm font-semibold text-amber-900 mb-1">{t("Small edits needed")}</div>
              <p className="text-sm text-amber-800">{adminNotes}</p>
            </CardContent>
          </Card>
        )}

        {status === "published" && (
          <Card className="mb-6 border-primary/40 bg-primary/5">
            <CardContent className="pt-5 text-sm">
              {t("You're editing a published blog. Saving will take it off the public site and send it back for admin review before it can be republished.")}
            </CardContent>
          </Card>
        )}

        {restorePrompt && (
          <Card className="mb-4 border-primary bg-primary/5">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2">
                  <RotateCcw className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">{t("Restore unsaved changes?")}</div>
                    <div className="text-sm text-muted-foreground">
                      {t("We found a newer local backup that wasn't uploaded.")} ({new Date(restorePrompt.ts).toLocaleString()})
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={applyRestore}>{t("Restore")}</Button>
                  <Button size="sm" variant="ghost" onClick={discardRestore}>{t("Discard")}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("Title")}
            className="h-14 text-xl font-serif"
            style={{ fontSize: `${Math.max(size, 20)}px` }}
          />

          {/* Kind selector — determines formatting (poems/recitations are centered & keep line breaks) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">{t("This is a:")}</span>
            {(["story", "poem", "recitation", "essay", "other"] as BlogKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  const stripped = stripKindMarker(body);
                  const marker = k === "story" ? "" : `<!--kind:${k}-->\n\n`;
                  setBody(marker + stripped);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm min-h-[36px] transition-colors ${kind === k ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"}`}
                aria-pressed={kind === k}
              >
                {t(k === "story" ? "Story" : k === "poem" ? "Poem" : k === "recitation" ? "Recitation" : k === "essay" ? "Essay" : "Other")}
              </button>
            ))}
          </div>

          <div className="hidden md:flex flex-wrap gap-2 items-center border border-border rounded-lg p-2 bg-card">
            <Button type="button" variant={active.bold ? "default" : "ghost"} size="sm" onClick={() => editorRef.current?.exec("bold")} className="h-11" aria-pressed={active.bold} aria-label="Bold"><Bold className="h-4 w-4 mr-1" />Bold</Button>
            <Button type="button" variant={active.list ? "default" : "ghost"} size="sm" onClick={() => editorRef.current?.exec("insertUnorderedList")} className="h-11" aria-pressed={active.list} aria-label="Bullet"><List className="h-4 w-4 mr-1" />Bullet</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editorRef.current?.exec("insertParagraph")} className="h-11" aria-label="Paragraph">¶ Paragraph</Button>
            <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
              <span>{t("{n} words", { n: wordCount })}</span>
              {savingState === "saving" && <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> {t("Saving…")}</span>}
              {savingState === "saved" && <span>{t("Saved")}{lastSavedAt ? ` · ${Math.max(1, Math.round((Date.now() - lastSavedAt) / 1000))}s` : ""}</span>}
              {savingState === "error" && <span className="text-destructive">{t("Save failed")}</span>}
            </div>
          </div>

          {/* Mobile-only status row (toolbar lives in floating FAB) */}
          <div className="md:hidden flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>{t("{n} words", { n: wordCount })}</span>
            {savingState === "saving" && <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> {t("Saving…")}</span>}
            {savingState === "saved" && <span>{t("Saved")}</span>}
            {savingState === "error" && <span className="text-destructive">{t("Save failed")}</span>}
          </div>

          <RichEditor
            ref={editorRef}
            initialMd={initialBody}
            currentMd={stripKindMarker(body)}
            syncKey={editorSyncKey}
            onChange={(md) => {
              const marker = kind === "story" ? "" : `<!--kind:${kind}-->\n\n`;
              setBody(marker + md);
            }}
            onActiveChange={(a) => {
              setActive(a);
              if (a.hasSelection) setFabOpen(true);
            }}
            placeholder={kind === "poem" || kind === "recitation" ? t("Write your poem here — every line break is preserved…") : t("Write your blog here…")}
            fontSize={size}
          />


          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => document.getElementById("cover-upload")?.click()} className="h-12" disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
              {isUploading ? t("Uploading {p}%", { p: Math.round(uploadProgress) }) : cover ? t("Change cover photo") : t("Add cover photo")}
            </Button>
            <input id="cover-upload" type="file" accept="image/*" hidden onChange={handleCoverUpload} />
            <Button type="button" variant="secondary" onClick={runAiCheck} disabled={checking} className="h-12">
              {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
              {t("Check my writing")}
            </Button>
          </div>

          {isUploading && (
            <div className="rounded-lg border border-border bg-card p-6 flex items-center justify-center">
              <CircularWavesLoader progress={uploadProgress} label={t("Uploading cover photo")} />
            </div>
          )}

          {cover && !isUploading && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={cover} alt="Cover" className="w-full max-h-64 object-cover" />
            </div>
          )}

          {suggestions.length > 0 && (
            <Card className="border-primary/40">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-semibold">
                        {t(suggestions.length === 1 ? "{n} suggestion to review" : "{n} suggestions to review", { n: suggestions.length })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("Your original words stay unless you accept a change. Compare before and after below.")}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <div className="inline-flex rounded-md border border-border overflow-hidden" role="tablist" aria-label="Diff view mode">
                      <button
                        type="button"
                        onClick={() => setDiffMode("full")}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${diffMode === "full" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                        aria-pressed={diffMode === "full"}
                      >
                        {t("Full compare")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiffMode("highlights")}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${diffMode === "highlights" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                        aria-pressed={diffMode === "highlights"}
                      >
                        {t("Changes only")}
                      </button>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSuggestions([])}>{t("Reject all")}</Button>
                    <Button size="sm" onClick={acceptAll}>{t("Accept all")}</Button>
                  </div>
                </div>
                <ul className="space-y-5">
                  {suggestions.map((s, idx) => (
                    <li key={idx} className="border-b border-border pb-5 last:border-0">
                      <DiffLine original={s.original} suggestion={s.suggestion} mode={diffMode} />
                      {s.reason && (
                        <div className="mt-2 text-xs text-muted-foreground italic">
                          {s.reason}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => acceptSuggestion(idx)} className="h-10 min-w-[110px]">
                          <Check className="h-4 w-4 mr-1" /> {t("Use this")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => rejectSuggestion(idx)} className="h-10">
                          <X className="h-4 w-4 mr-1" /> {t("Keep mine")}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-4">
                <div>{t("Title")} {title.trim() ? "✓" : "·"}</div>
                <div>{t("Story")} {body.trim() ? "✓" : "·"}</div>
                <div>{t("Cover image")} {cover ? "✓" : "·"}</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => saveDraft()} disabled={savingState === "saving"} className="h-12">
                  <Save className="mr-2 h-4 w-4" /> {t("Save draft")}
                </Button>
                <Button onClick={submitStory} disabled={!ready || submitting} className="h-12">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {t("Submit for publishing")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile-only floating formatting toolbar. Collapsed = single icon; expanded = full row. */}
      <div className="md:hidden fixed bottom-24 right-4 z-40">
        {fabOpen ? (
          <div className="flex items-center gap-1 rounded-full bg-card border border-border shadow-lg pl-1 pr-1 py-1 animate-in fade-in slide-in-from-bottom-2">
            <Button
              type="button"
              size="sm"
              variant={active.bold ? "default" : "ghost"}
              onClick={() => editorRef.current?.exec("bold")}
              aria-pressed={active.bold}
              aria-label="Bold"
              className="h-11 w-11 rounded-full p-0"
            >
              <Bold className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={active.list ? "default" : "ghost"}
              onClick={() => editorRef.current?.exec("insertUnorderedList")}
              aria-pressed={active.list}
              aria-label="Bullet list"
              className="h-11 w-11 rounded-full p-0"
            >
              <List className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => editorRef.current?.exec("insertParagraph")}
              aria-label="New paragraph"
              className="h-11 w-11 rounded-full p-0 text-lg"
            >
              ¶
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setFabOpen(false)}
              aria-label="Close toolbar"
              className="h-11 w-11 rounded-full p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => setFabOpen(true)}
            aria-label="Open formatting toolbar"
            className="h-14 w-14 rounded-full shadow-lg p-0"
          >
            <Type className="h-6 w-6" />
          </Button>
        )}
      </div>
    </Layout>
  );
}
