import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthorAvatar } from "@/components/blog/AuthorAvatar";
import { coverImageOrDefault } from "@/lib/blog-cover";
import { useI18n } from "@/i18n";

interface AuthorRow { user_id: string; full_name: string | null; avatar_url: string | null; bio: string | null; }
interface BlogRow { id: string; title: string; slug: string | null; cover_image_url: string | null; published_at: string | null; }

export default function Author() {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useI18n();
  const [author, setAuthor] = useState<AuthorRow | null>(null);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const [{ data: a }, { data: b }] = await Promise.all([
        supabase.rpc("get_author_public", { _user_id: userId }).maybeSingle(),
        supabase.from("blogs")
          .select("id, title, slug, cover_image_url, published_at")
          .eq("author_id", userId)
          .eq("status", "published")
          .order("published_at", { ascending: false }),
      ]);
      setAuthor((a as AuthorRow) ?? null);
      setBlogs((b as BlogRow[]) ?? []);
      setLoading(false);
    })();
  }, [userId]);

  useEffect(() => {
    if (author?.full_name) document.title = `${author.full_name} — Shraddha Blogs`;
  }, [author?.full_name]);

  if (loading) {
    return <Layout><div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }
  if (!author) {
    return <Layout>
      <div className="container max-w-2xl py-16 text-center px-4">
        <h1 className="font-serif text-3xl font-bold">{t("Author not found")}</h1>
        <Button asChild className="mt-6"><Link to="/blog">{t("Back to blogs")}</Link></Button>
      </div>
    </Layout>;
  }

  return (
    <Layout>
      <div className="container max-w-5xl px-4 py-8 md:py-12">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> {t("All blogs")}
        </Link>

        <header className="flex flex-col items-center text-center gap-4 mb-12">
          <AuthorAvatar avatarPath={author.avatar_url} name={author.full_name} className="h-24 w-24 text-2xl" />
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold">{author.full_name || t("Anonymous")}</h1>
            {author.bio && <p className="text-muted-foreground mt-3 max-w-xl">{author.bio}</p>}
            <p className="text-sm text-muted-foreground mt-3">
              {t(blogs.length === 1 ? "{n} published blog" : "{n} published blogs", { n: blogs.length })}
            </p>
          </div>
        </header>

        {blogs.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{t("No published blogs yet.")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((b) => (
              <Link key={b.id} to={`/blog/${b.slug ?? b.id}`}
                    className="group block rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  <img src={coverImageOrDefault(b.cover_image_url)} alt={b.title} loading="lazy"
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
        )}
      </div>
    </Layout>
  );
}
