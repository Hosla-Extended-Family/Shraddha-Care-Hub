import { Button } from "@/components/ui/button";
import { Facebook, Linkedin, Link2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  title: string;
  author?: string;
  /** Clean URL copied / shared to humans (defaults to current page). */
  url?: string;
  /**
   * URL crawlers should scrape for the rich link preview (image + title).
   * Falls back to `url`. Use the preview edge-function URL for per-item OG tags.
   */
  previewUrl?: string;
  className?: string;
}

/** WhatsApp glyph (not in lucide) */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z" />
    </svg>
  );
}

/** X (formerly Twitter) glyph — lucide's Twitter icon is the old bird. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
  );
}

export function SocialShare({ title, author, url, previewUrl, className }: SocialShareProps) {
  const { toast } = useToast();
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const crawlUrl = previewUrl || shareUrl;
  const text = author 
    ? `${title} - ${author} - Shraddha Welfare Association`
    : `${title} - Shraddha Welfare Association`;
  const enc = encodeURIComponent;

  const links = {
    whatsapp: `https://wa.me/?text=${enc(`${text} ${crawlUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(crawlUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(crawlUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(crawlUrl)}`,
  };

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied!", description: "Share it anywhere you like." });
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    copy();
  };

  const open = (href: string) =>
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=600");

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm font-medium text-muted-foreground mr-1">Share:</span>

        <button
          onClick={() => open(links.whatsapp)}
          aria-label="Share on WhatsApp"
          className="h-11 w-11 rounded-full flex items-center justify-center bg-[#25D366] text-white hover:opacity-90 transition-opacity shadow-sm"
        >
          <WhatsAppIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => open(links.facebook)}
          aria-label="Share on Facebook"
          className="h-11 w-11 rounded-full flex items-center justify-center bg-[#1877F2] text-white hover:opacity-90 transition-opacity shadow-sm"
        >
          <Facebook className="h-5 w-5" />
        </button>
        <button
          onClick={() => open(links.twitter)}
          aria-label="Share on X"
          className="h-11 w-11 rounded-full flex items-center justify-center bg-foreground text-background hover:opacity-90 transition-opacity shadow-sm"
        >
          <XIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => open(links.linkedin)}
          aria-label="Share on LinkedIn"
          className="h-11 w-11 rounded-full flex items-center justify-center bg-[#0A66C2] text-white hover:opacity-90 transition-opacity shadow-sm"
        >
          <Linkedin className="h-5 w-5" />
        </button>
        <button
          onClick={copy}
          aria-label="Copy link"
          className="h-11 w-11 rounded-full flex items-center justify-center bg-muted text-foreground hover:bg-muted/70 transition-colors shadow-sm"
        >
          <Link2 className="h-5 w-5" />
        </button>

        <Button onClick={nativeShare} size="sm" variant="outline" className="gap-2 sm:hidden">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
