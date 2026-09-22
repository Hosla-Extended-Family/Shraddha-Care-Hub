import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { getAnonKey } from "@/lib/anon-key";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function BlogLikes({ blogId }: { blogId: string }) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id ?? null;
      const anon = getAnonKey();

      const { count: c } = await supabase
        .from("blog_likes")
        .select("id", { count: "exact", head: true })
        .eq("blog_id", blogId);

      let mine = null as any;
      if (uid) {
        const { data } = await supabase.from("blog_likes")
          .select("id").eq("blog_id", blogId).eq("user_id", uid).maybeSingle();
        mine = data;
      } else {
        const { data } = await supabase.from("blog_likes")
          .select("id").eq("blog_id", blogId).eq("anon_key", anon).maybeSingle();
        mine = data;
      }
      if (cancelled) return;
      setUserId(uid);
      setCount(c ?? 0);
      setLiked(!!mine);
    })();
    return () => { cancelled = true; };
  }, [blogId]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const anon = getAnonKey();
    // Optimistic
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((n) => n + (wasLiked ? -1 : 1));

    if (wasLiked) {
      const q = supabase.from("blog_likes").delete().eq("blog_id", blogId);
      const { error } = userId ? await q.eq("user_id", userId) : await q.eq("anon_key", anon);
      if (error) {
        setLiked(true); setCount((n) => n + 1);
        toast({ title: "Couldn't remove like", variant: "destructive" });
      }
    } else {
      const payload = userId
        ? { blog_id: blogId, user_id: userId }
        : { blog_id: blogId, anon_key: anon };
      const { error } = await supabase.from("blog_likes").insert(payload);
      if (error) {
        setLiked(false); setCount((n) => Math.max(0, n - 1));
        // Race: someone else already inserted → treat as liked
        if (error.code === "23505") {
          setLiked(true); setCount((n) => n + 1);
        } else {
          toast({ title: "Couldn't like this blog", description: error.message, variant: "destructive" });
        }
      }
    }
    setBusy(false);
  };

  return (
    <Button
      onClick={toggle}
      variant={liked ? "default" : "outline"}
      size="lg"
      className={cn(
        "h-11 gap-2 rounded-full transition-all",
        liked && "bg-rose-500 hover:bg-rose-600 border-rose-500"
      )}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this blog" : "Like this blog"}
    >
      <Heart className={cn("h-5 w-5", liked && "fill-current")} />
      <span className="font-medium">{count}</span>
      <span className="sr-only sm:not-sr-only sm:inline">
        {liked ? "Liked" : "Like"}
      </span>
    </Button>
  );
}
