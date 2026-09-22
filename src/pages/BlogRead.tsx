import { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Volume2, Pause, Play, ArrowLeft, Clock, MessageCircle } from "lucide-react";
import { RenderMarkdownLite } from "@/lib/markdown-lite";
import { useFontSize, FontSizeToggle } from "@/hooks/use-font-size";
import { useToast } from "@/hooks/use-toast";
import { SocialShare } from "@/components/events/SocialShare";
import { blogPreviewUrl } from "@/lib/preview";
import { AuthorAvatar } from "@/components/blog/AuthorAvatar";
import { BlogLikes } from "@/components/blog/BlogLikes";
import { BlogComments } from "@/components/blog/BlogComments";
import { BlogSubscribe } from "@/components/blog/BlogSubscribe";
import { YouMayAlsoLike } from "@/components/blog/YouMayAlsoLike";
import { coverImageOrDefault } from "@/lib/blog-cover";
import { useI18n } from "@/i18n";

interface BlogRow {
  id: string;
  title: string;
  slug: string | null;
  body: string;
  cover_image_url: string | null;
  language: string | null;
  published_at: string | null;
  updated_at?: string | null;
  author_id: string;
  is_guest?: boolean | null;
  guest_name?: string | null;
}

interface Author {
  full_name: string;
  avatar_url: string | null;
}

function estimateReadingMinutes(body: string): number {
  const words = (body || "").replace(/[*_>#-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function BlogRead() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const highlightLikes = new URLSearchParams(location.search).get("highlight") === "likes";
  const { t } = useI18n();
  const [blog, setBlog] = useState<BlogRow | null>(null);
  const [author, setAuthor] = useState<Author>({ full_name: "Anonymous", avatar_url: null });
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { size, setSize } = useFontSize();
  const { toast } = useToast();

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      let query = supabase.from("blogs").select("*").eq("status", "published");
      const bySlug = await query.eq("slug", slug).maybeSingle();
      let row = bySlug.data;
      if (!row) {
        const byId = await supabase.from("blogs").select("*").eq("status", "published").eq("id", slug).maybeSingle();
        row = byId.data;
      }
      if (row) {
        setBlog(row as BlogRow);
        if ((row as any).is_guest) {
          setAuthor({ full_name: (row as any).guest_name || "Anonymous", avatar_url: null });
        } else if ((row as any).author_id) {
          const { data: profile } = await supabase
            .rpc("get_author_public", { _user_id: (row as any).author_id })
            .maybeSingle();
          if (profile) setAuthor({ full_name: (profile as any).full_name || "Anonymous", avatar_url: (profile as any).avatar_url });
        }
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (blog?.title) document.title = `${blog.title} — Shraddha Blogs`;
  }, [blog?.title]);

  // Deep-link scroll for like notifications
  useEffect(() => {
    if (!highlightLikes || !blog) return;
    const timer = setTimeout(() => {
      document.getElementById("reader-actions")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return () => clearTimeout(timer);
  }, [highlightLikes, blog?.id]);

  // Reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? Math.min(100, Math.max(0, (h.scrollTop / total) * 100)) : 0;
      setProgress(pct);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [blog?.id]);

  const handleReadAloud = async () => {
    if (!blog) return;
    if (audioUrl && audioRef.current) {
      if (playing) { audioRef.current.pause(); setPlaying(false); }
      else { audioRef.current.play(); setPlaying(true); }
      return;
    }
    setTtsLoading(true);
    const { data, error } = await supabase.functions.invoke("read-blog-aloud", { body: { blogId: blog.id } });
    setTtsLoading(false);
    if (error || !data?.url) {
      toast({ title: t("Read-aloud unavailable"), description: (error as any)?.message || data?.error || t("Please try again later."), variant: "destructive" });
      return;
    }
    setAudioUrl(data.url);
    setTimeout(() => { audioRef.current?.play(); setPlaying(true); }, 100);
  };

  if (loading) {
    return <Layout><div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }
  if (!blog) {
    return <Layout>
      <div className="container max-w-2xl py-16 text-center px-4">
        <h1 className="font-serif text-3xl font-bold">{t("Blog not found")}</h1>
        <p className="text-muted-foreground mt-2">{t("This blog may have been unpublished or removed.")}</p>
        <Button asChild className="mt-6"><Link to="/blog">{t("Browse other blogs")}</Link></Button>
      </div>
    </Layout>;
  }

  const readMinutes = estimateReadingMinutes(blog.body);
  const publishedLabel = blog.published_at
    ? new Date(blog.published_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <Layout>
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-primary/10 z-40 pointer-events-none"
        aria-hidden="true"
      >
        <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      <article>
        {/* Cover hero with overlay title */}
        {(
          <header className="relative w-full overflow-hidden">
            <div className="relative h-[60vh] min-h-[420px] max-h-[720px] w-full">
              <img
                src={coverImageOrDefault(blog.cover_image_url)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                fetchPriority="high"
              />
              {/* dark gradient for readable text */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />
              <div className="relative h-full container max-w-4xl px-4 flex flex-col justify-end pb-10 md:pb-16">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-6 self-start"
                >
                  <ArrowLeft className="h-4 w-4" /> {t("All blogs")}
                </Link>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] drop-shadow-md max-w-3xl">
                  {blog.title}
                </h1>
                <div className="mt-6 flex items-center flex-wrap gap-4 text-white/90">
                  {blog.is_guest ? (
                    <div className="flex items-center gap-3">
                      <AuthorAvatar avatarPath={null} name={author.full_name} className="h-11 w-11 border-white/30" />
                      <span className="font-medium">{author.full_name} <span className="text-white/70 font-normal">({t("Guest Blogger")})</span></span>
                    </div>
                  ) : (
                    <Link to={`/author/${blog.author_id}`} className="flex items-center gap-3 group">
                      <AuthorAvatar avatarPath={author.avatar_url} name={author.full_name} className="h-11 w-11 border-white/30" />
                      <span className="font-medium group-hover:underline">{author.full_name}</span>
                    </Link>
                  )}
                  {publishedLabel && (
                    <>
                      <span className="text-white/50">•</span>
                      <span className="text-sm">{publishedLabel}</span>
                    </>
                  )}
                  <span className="text-white/50">•</span>
                  <span className="text-sm inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {readMinutes} {t("min read")}
                  </span>
                  {blog.language && (
                    <>
                      <span className="text-white/50">•</span>
                      <span className="text-sm">{blog.language.toUpperCase()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Article body — optimized for reading */}
        <div className="container max-w-[720px] px-4 py-10 md:py-14">
          {/* Reader toolbar */}
          <div
            id="reader-actions"
            className={
              "flex flex-wrap items-center justify-between gap-3 mb-8 pb-6 border-b border-border scroll-mt-24 rounded-xl transition-colors " +
              (highlightLikes ? "bg-primary/10 ring-2 ring-primary/40 p-4" : "")
            }
          >
            <div className="flex items-center gap-2">
              <BlogLikes blogId={blog.id} />
              <Button
                variant="ghost"
                size="lg"
                className="h-11 px-4 gap-2 rounded-full hover:bg-muted"
                onClick={() => {
                  document.getElementById("comments-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <span className="hidden sm:inline font-medium">{t("Comments")}</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <FontSizeToggle size={size} onChange={setSize} />
              <Button onClick={handleReadAloud} variant="outline" size="lg" className="h-11 gap-2" disabled={ttsLoading}>
                {ttsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : audioUrl ? <Play className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                <span className="hidden sm:inline">{playing ? t("Pause") : audioUrl ? t("Play") : t("Read aloud")}</span>
              </Button>
            </div>
          </div>

          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full mb-8"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
          )}

          <RenderMarkdownLite
            text={blog.body}
            className="blog-reader prose prose-lg max-w-none text-foreground"
          />
          <style>{`
            .blog-reader p, .blog-reader li {
              font-size: ${size}px;
              line-height: 1.75;
              letter-spacing: 0.005em;
            }
            .blog-reader p { margin-bottom: 1.5em; }
            .blog-reader { hyphens: auto; text-wrap: pretty; }
          `}</style>

          {/* Share */}
          <div className="mt-12 pt-8 border-t border-border">
            <SocialShare
              title={blog.title}
              author={author.full_name}
              previewUrl={blogPreviewUrl(blog.slug || blog.id, blog.updated_at || blog.published_at)}
            />
          </div>

          {/* Author card */}
          {blog.is_guest ? (
            <div className="mt-12 flex items-center gap-4 p-6 rounded-2xl border border-border bg-muted/30">
              <AuthorAvatar avatarPath={null} name={author.full_name} className="h-16 w-16 text-lg" />
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("Written by")}</p>
                <p className="font-serif text-xl font-semibold">{author.full_name}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("Guest Blogger")}</p>
              </div>
            </div>
          ) : (
            <Link
              to={`/author/${blog.author_id}`}
              className="mt-12 flex items-center gap-4 p-6 rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <AuthorAvatar avatarPath={author.avatar_url} name={author.full_name} className="h-16 w-16 text-lg" />
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("Written by")}</p>
                <p className="font-serif text-xl font-semibold group-hover:text-primary transition-colors">{author.full_name}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("View all blogs by this author →")}</p>
              </div>
            </Link>
          )}

          {/* Subscribe */}
          <div className="mt-16">
            <BlogSubscribe />
          </div>

          {/* Comments */}
          <div id="comments-section" className="scroll-mt-24">
            <BlogComments blogId={blog.id} />
          </div>

          {/* Related */}
          <YouMayAlsoLike excludeId={blog.id} />
        </div>
      </article>
    </Layout>
  );
}
