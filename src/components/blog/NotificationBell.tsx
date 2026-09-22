import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, MessageCircle, Check, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Notif {
  id: string;
  type: "like" | "comment";
  blog_id: string | null;
  blog_title: string | null;
  blog_slug: string | null;
  actor_name: string | null;
  comment_body: string | null;
  comment_id?: string | null;
  read_at: string | null;
  created_at: string;
}

const db = supabase as any;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function targetFor(n: Notif) {
  if (!n.blog_slug && !n.blog_id) return "/profile";
  const base = `/blog/${n.blog_slug || n.blog_id}`;
  if (n.type === "comment" && n.comment_id) return `${base}?c=${n.comment_id}#comment-${n.comment_id}`;
  if (n.type === "comment") return `${base}#comments-heading`;
  return `${base}?highlight=likes#reader-actions`;
}

export function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const unread = items.filter((i) => !i.read_at).length;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db
      .from("author_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data as Notif[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUserId(data.session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    load();
    const channel = supabase
      .channel(`author_notifications_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "author_notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setItems((prev) => [payload.new as Notif, ...prev].slice(0, 30));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const markAllRead = async () => {
    const ids = items.filter((i) => !i.read_at).map((i) => i.id);
    if (!ids.length) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => (i.read_at ? i : { ...i, read_at: now })));
    await db.from("author_notifications").update({ read_at: now }).in("id", ids);
  };

  const markRead = async (id: string) => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read_at: i.read_at ?? now } : i)));
    await db.from("author_notifications").update({ read_at: now }).eq("id", id);
  };

  const markUnread = async (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read_at: null } : i)));
    await db.from("author_notifications").update({ read_at: null }).eq("id", id);
  };

  if (!userId) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative w-11 h-11 flex items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent active:bg-accent/80 touch-manipulation"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 z-[65] bg-black/30 sm:hidden" aria-hidden="true" />
          <div
            className={cn(
              // Mobile: full-width sheet anchored under the header, never clipped
              "fixed left-2 right-2 top-[4.5rem] z-[70] w-auto max-w-[calc(100vw-1rem)]",
              // Desktop: dropdown anchored to the bell
              "sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[22rem] sm:max-w-[92vw]",
              "rounded-xl border border-border bg-popover shadow-xl overflow-hidden"
            )}
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">Notifications</span>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={markAllRead}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Mark all read
                  </Button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent sm:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto overscroll-contain">
              {loading && items.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications yet. Likes and comments on your blogs will show up here.
                </p>
              ) : (
                items.map((n) => {
                  const actor = n.actor_name?.trim() || "Someone";
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-2 border-b border-border/60 last:border-0 transition-colors hover:bg-accent",
                        !n.read_at && "bg-primary/5"
                      )}
                    >
                      <Link
                        to={targetFor(n)}
                        onClick={() => {
                          markRead(n.id);
                          setOpen(false);
                        }}
                        className="flex min-w-0 flex-1 gap-3 px-4 py-3"
                      >
                        <span
                          className={cn(
                            "mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center",
                            n.type === "like" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                          )}
                        >
                          {n.type === "like" ? <Heart className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          {n.type === "like" ? (
                            <span className="block text-sm text-foreground">Your post got a new like</span>
                          ) : (
                            <>
                              <span className="block text-sm text-foreground italic line-clamp-2 break-words">
                                &lsquo;{stripHtml(n.comment_body ?? "")}&rsquo;
                              </span>
                              <span className="block text-sm text-foreground mt-0.5 break-words">
                                new comment by {actor}
                              </span>
                            </>
                          )}
                          {n.blog_title && (
                            <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              on “{n.blog_title}”
                            </span>
                          )}
                          <span className="block text-[11px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</span>
                        </span>
                      </Link>
                      <button
                        onClick={() => (n.read_at ? markUnread(n.id) : markRead(n.id))}
                        aria-label={n.read_at ? "Mark as unread" : "Mark as read"}
                        title={n.read_at ? "Mark as unread" : "Mark as read"}
                        className="mr-2 mt-3 h-8 w-8 shrink-0 flex items-center justify-center rounded-md hover:bg-accent"
                      >
                        {n.read_at ? (
                          <span className="h-2.5 w-2.5 rounded-full border border-muted-foreground" />
                        ) : (
                          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
