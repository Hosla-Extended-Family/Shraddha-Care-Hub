import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import { coverImageOrDefault } from "@/lib/blog-cover";

interface Blog {
  id: string;
  title: string;
  slug: string | null;
  cover_image_url: string | null;
  published_at: string | null;
}

export function YouMayAlsoLike({ excludeId }: { excludeId: string }) {
  const [items, setItems] = useState<Blog[]>([]);

  useEffect(() => {
    (async () => {
      // Fetch a candidate pool of recent published blogs, then score by like+comment counts.
      const { data: blogs } = await supabase
        .from("blogs")
        .select("id, title, slug, cover_image_url, published_at")
        .eq("status", "published")
        .neq("id", excludeId)
        .order("published_at", { ascending: false })
        .limit(30);
      if (!blogs || blogs.length === 0) { setItems([]); return; }

      const ids = blogs.map((b) => b.id);
      const [likesRes, commentsRes] = await Promise.all([
        supabase.from("blog_likes").select("blog_id").in("blog_id", ids),
        supabase.from("blog_comments_public").select("blog_id").in("blog_id", ids),
      ]);
      const score = new Map<string, number>();
      (likesRes.data ?? []).forEach((r: any) => score.set(r.blog_id, (score.get(r.blog_id) ?? 0) + 2));
      (commentsRes.data ?? []).forEach((r: any) => score.set(r.blog_id, (score.get(r.blog_id) ?? 0) + 3));

      const ranked = [...blogs].sort((a, b) => {
        const sa = score.get(a.id) ?? 0;
        const sb = score.get(b.id) ?? 0;
        if (sb !== sa) return sb - sa;
        return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
      });
      setItems(ranked.slice(0, 3));
    })();
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-16 pt-10 border-t border-border">
      <h2 id="related-heading" className="font-serif text-2xl md:text-3xl font-bold flex items-center gap-2 mb-8">
        <BookOpen className="h-6 w-6 text-primary" />
        You may also like
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((b) => (
          <Link
            key={b.id}
            to={`/blog/${b.slug ?? b.id}`}
            className="group block rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="aspect-[16/10] bg-muted overflow-hidden">
              <img
                src={coverImageOrDefault(b.cover_image_url)}
                alt={b.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5">
              <h3 className="font-serif text-lg font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {b.title}
              </h3>
              {b.published_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(b.published_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Button asChild variant="outline" size="lg" className="h-12 rounded-full">
          <Link to="/blog">
            Explore other blogs
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
