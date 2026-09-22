import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MessageCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/avatar";

const SAVED_KEY = "sh_commenter_v1";

interface Row {
  id: string;
  name: string;
  website: string | null;
  body: string;
  created_at: string;
}

export function BlogComments({ blogId }: { blogId: string }) {
  const { toast } = useToast();
  const location = useLocation();
  const highlightId = new URLSearchParams(location.search).get("c");
  const highlightedRef = useRef<HTMLLIElement | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [body, setBody] = useState("");
  const [saveInfo, setSaveInfo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("blog_comments_public")
      .select("id, name, website, body, created_at")
      .eq("blog_id", blogId)
      .order("created_at", { ascending: false });

    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_KEY) || "{}");
      if (saved.name) setName(saved.name);
      if (saved.phone) setPhone(saved.phone);
      if (saved.website) setWebsite(saved.website);
    } catch {}
  }, [blogId]);

  // Scroll to and highlight a specific comment (deep link from notifications)
  useEffect(() => {
    if (!highlightId || loading) return;
    const el = highlightedRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => clearTimeout(timer);
  }, [highlightId, loading, rows.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const p = phone.replace(/[^\d+]/g, "");
    const b = body.trim();
    if (!n || !p || !b) {
      toast({ title: "Please fill your name, phone and comment", variant: "destructive" });
      return;
    }
    const digitsOnly = p.replace(/\D/g, "");
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      toast({ title: "Please enter a valid phone number", variant: "destructive" });
      return;
    }
    if (b.length > 2000) {
      toast({ title: "Comment is too long (max 2000 characters)", variant: "destructive" });
      return;
    }
    let siteClean: string | null = null;
    const w = website.trim();
    if (w) {
      const withProto = /^https?:\/\//i.test(w) ? w : `https://${w}`;
      try { new URL(withProto); siteClean = withProto; } catch { siteClean = null; }
    }
    setSubmitting(true);
    const { data: sess } = await supabase.auth.getSession();
    const { error } = await supabase.from("blog_comments").insert({
      blog_id: blogId,
      user_id: sess.session?.user.id ?? null,
      name: n.slice(0, 100),
      phone: p.slice(0, 20),
      email: null,
      website: siteClean,
      body: b,
      status: "approved",
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't post comment", description: error.message, variant: "destructive" });
      return;
    }
    if (saveInfo) {
      try { localStorage.setItem(SAVED_KEY, JSON.stringify({ name: n, phone: p, website: w })); } catch {}
    } else {
      try { localStorage.removeItem(SAVED_KEY); } catch {}
    }
    setBody("");
    toast({ title: "Comment posted", description: "Thanks for joining the conversation!" });
    load();
  };

  return (
    <section aria-labelledby="comments-heading" className="mt-16 pt-10 border-t border-border">
      <h2 id="comments-heading" className="font-serif text-2xl md:text-3xl font-bold flex items-center gap-2 mb-8">
        <MessageCircle className="h-6 w-6 text-primary" />
        Comments {rows.length > 0 && <span className="text-muted-foreground text-lg">({rows.length})</span>}
      </h2>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground italic mb-10">Be the first to leave a comment.</p>
      ) : (
        <ul className="space-y-6 mb-12">
          {rows.map((c) => (
            <li
              key={c.id}
              id={`comment-${c.id}`}
              ref={c.id === highlightId ? highlightedRef : undefined}
              className={
                "flex gap-4 scroll-mt-24 rounded-xl transition-colors " +
                (c.id === highlightId ? "bg-primary/10 ring-2 ring-primary/40 p-4 -m-1" : "")
              }
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
                {getInitials(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                  {c.website ? (
                    <a href={c.website} target="_blank" rel="noopener noreferrer nofollow ugc"
                       className="font-semibold text-foreground hover:text-primary inline-flex items-center gap-1">
                      {c.name}<ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="font-semibold text-foreground">{c.name}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="bg-muted/30 border border-border rounded-2xl p-6 md:p-8 space-y-5">
        <div>
          <h3 className="font-serif text-xl font-bold">Leave a Reply</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your phone number will not be published. Required fields are marked <span className="text-destructive">*</span>
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className="h-12 bg-background" required />
          <Input placeholder="Phone *" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} className="h-12 bg-background" required />
          <Input placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={255} className="h-12 bg-background" />
        </div>
        <Textarea placeholder="Add Comment *" value={body} onChange={(e) => setBody(e.target.value)}
                  maxLength={2000} rows={5} className="bg-background resize-y min-h-[140px]" required />
        <div className="flex items-start gap-2">
          <Checkbox id="save-info" checked={saveInfo} onCheckedChange={(v) => setSaveInfo(!!v)} className="mt-0.5" />
          <label htmlFor="save-info" className="text-sm text-muted-foreground cursor-pointer">
            Save my name, phone and website in this browser for the next time I comment.
          </label>
        </div>
        <Button type="submit" size="lg" disabled={submitting} className="h-12 px-8">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Post Comment
        </Button>
      </form>
    </section>
  );
}
