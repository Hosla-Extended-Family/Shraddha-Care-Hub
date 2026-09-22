import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bold, List, Send, Type, X, UserCircle, PenLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFontSize, FontSizeToggle } from "@/hooks/use-font-size";
import { RichEditor, type RichEditorHandle, type ActiveFormats } from "@/components/blog/RichEditor";
import { GuestSubmitDialog } from "@/components/blog/GuestSubmitDialog";
import { stripKindMarker, type BlogKind } from "@/lib/markdown-lite";
import { useI18n } from "@/i18n";

const BACKUP_KEY = "blog_guest_backup";

export default function BlogWriteGuest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const { size, setSize } = useFontSize();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<BlogKind>("story");
  const [initialBody, setInitialBody] = useState("");
  const [editorSyncKey, setEditorSyncKey] = useState(0);
  const [active, setActive] = useState<ActiveFormats>({ bold: false, list: false, hasSelection: false });
  const [fabOpen, setFabOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const editorRef = useRef<RichEditorHandle>(null);
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const ready = title.trim() && body.trim();

  // Approved writers use the real editor; pending/rejected sessions write as anonymous guests only.
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: p } = await supabase.from("profiles").select("status").eq("user_id", data.session.user.id).maybeSingle();
        if ((p as any)?.status === "approved") {
          navigate("/blog/write", { replace: true });
        } else {
          await supabase.auth.signOut();
        }
      }
    })();
  }, [navigate]);

  // Restore any earlier unfinished guest draft (local only — we never persist guest drafts server-side).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      if (raw) {
        const b = JSON.parse(raw);
        if (b && (b.title || b.body)) {
          setTitle(b.title || "");
          setBody(b.body || "");
          const stripped = stripKindMarker(b.body || "");
          setInitialBody(stripped);
          setKind((b.kind as BlogKind) || "story");
        }
      }
    } catch {}
  }, []);

  // Local autosave — survives refresh/phone-call. Guest drafts stay only on this device.
  useEffect(() => {
    if (!title.trim() && !body.trim()) return;
    try { localStorage.setItem(BACKUP_KEY, JSON.stringify({ title, body, kind, ts: Date.now() })); } catch {}
  }, [title, body, kind]);

  const handleSubmit = async ({ guest_name, guest_phone, author_id, is_approved_writer }: { guest_name: string; guest_phone: string; author_id: string | null; is_approved_writer: boolean }) => {
    // Rule: this stays a "guest" submission until the author has an *approved* writer profile.
    // - No account at all → guest, no author_id.
    // - Brand-new account (still pending approval) → guest, but linked via author_id so admin approval
    //   automatically flips it to a normal writer blog (see admin_approve_writer).
    // - Existing approved writer → not guest, just came through the guest form.
    const treatAsGuest = !author_id || !is_approved_writer;
    const { error } = await supabase.from("blogs").insert({
      title: title.trim() || "Untitled",
      body,
      status: "submitted",
      is_guest: treatAsGuest,
      guest_name: treatAsGuest ? guest_name : null,
      guest_phone: treatAsGuest ? guest_phone : null,
      author_id,
    });
    if (error) return { ok: false as const, error: error.message };
    try { localStorage.removeItem(BACKUP_KEY); } catch {}
    return { ok: true as const };
  };

  return (
    <Layout>
      <div className="container max-w-3xl px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-4">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t("Back to blogs")}
          </Link>
          <FontSizeToggle size={size} onChange={setSize} />
        </div>

        <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2">
          <UserCircle className="h-4 w-4" /> {t("Writing as a guest")}
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">{t("Share your blog")}</h1>
        <p className="text-muted-foreground mb-6">
          {t("Write freely — no account needed. After you're done, we'll ask for your name and phone so we can credit you. If you'd like your blogs saved to a profile, you can request a writer account then. It's optional.")}
        </p>

        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="pt-5 text-sm space-y-1">
            <div className="font-semibold text-primary flex items-center gap-2"><PenLine className="h-4 w-4" /> {t("Guest writing — how it works")}</div>
            <ul className="list-disc pl-5 text-foreground/80 space-y-1">
              <li>{t("Your writing is saved locally on this device while you type. Nothing goes to us until you submit.")}</li>
              <li>{t("On submit, you'll fill a short form (name + phone) so the admin team knows who wrote this.")}</li>
              <li>{t("If your phone already has an account, we'll ask for your Membership ID and password to save this blog to your profile.")}</li>
              <li>{t("Otherwise you can request a writer account (recommended!) or submit as a one-time guest.")}</li>
            </ul>
          </CardContent>
        </Card>


        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("Title")}
            className="h-14 text-xl font-serif"
            style={{ fontSize: `${Math.max(size, 20)}px` }}
          />

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
            <Button type="button" variant={active.bold ? "default" : "ghost"} size="sm" onClick={() => editorRef.current?.exec("bold")} className="h-11" aria-pressed={active.bold}><Bold className="h-4 w-4 mr-1" />Bold</Button>
            <Button type="button" variant={active.list ? "default" : "ghost"} size="sm" onClick={() => editorRef.current?.exec("insertUnorderedList")} className="h-11" aria-pressed={active.list}><List className="h-4 w-4 mr-1" />Bullet</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editorRef.current?.exec("insertParagraph")} className="h-11">¶ Paragraph</Button>
            <div className="ml-auto text-sm text-muted-foreground">{t("{n} words", { n: wordCount })}</div>
          </div>

          <div className="md:hidden text-xs text-muted-foreground px-1">{t("{n} words", { n: wordCount })}</div>


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

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-4">
                <div>{t("Title")} {title.trim() ? "✓" : "·"}</div>
                <div>{t("Blog content")} {body.trim() ? "✓" : "·"}</div>
              </div>
              <Button
                onClick={() => {
                  if (!ready) {
                    toast({ title: t("Add a title and blog"), description: t("Please fill in both before submitting."), variant: "destructive" });
                    return;
                  }
                  setDialogOpen(true);
                }}
                className="h-12"
              >
                <Send className="h-4 w-4 mr-2" /> {t("Continue to submit")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile floating format toolbar (same UX as writer editor) */}
      <div className="md:hidden fixed bottom-24 right-4 z-40">
        {fabOpen ? (
          <div className="flex items-center gap-1 rounded-full bg-card border border-border shadow-lg pl-1 pr-1 py-1">
            <Button type="button" size="sm" variant={active.bold ? "default" : "ghost"} onClick={() => editorRef.current?.exec("bold")} aria-pressed={active.bold} className="h-11 w-11 rounded-full p-0"><Bold className="h-5 w-5" /></Button>
            <Button type="button" size="sm" variant={active.list ? "default" : "ghost"} onClick={() => editorRef.current?.exec("insertUnorderedList")} aria-pressed={active.list} className="h-11 w-11 rounded-full p-0"><List className="h-5 w-5" /></Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => editorRef.current?.exec("insertParagraph")} className="h-11 w-11 rounded-full p-0 text-lg">¶</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setFabOpen(false)} className="h-11 w-11 rounded-full p-0"><X className="h-5 w-5" /></Button>
          </div>
        ) : (
          <Button type="button" onClick={() => setFabOpen(true)} aria-label="Open formatting toolbar" className="h-14 w-14 rounded-full shadow-lg p-0"><Type className="h-6 w-6" /></Button>
        )}
      </div>

      <GuestSubmitDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleSubmit} />
    </Layout>
  );
}
