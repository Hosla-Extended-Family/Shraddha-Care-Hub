import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, ExternalLink, RefreshCw } from "lucide-react";
import {
  eventPreviewJsonUrl,
  routinePreviewJsonUrl,
  eventPreviewUrl,
  routinePreviewUrl,
} from "@/lib/preview";

interface ResolvedMeta {
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

export default function PreviewInspector() {
  const { toast } = useToast();
  const [type, setType] = useState<"routine" | "event">("event");
  const [slug, setSlug] = useState("");
  const [meta, setMeta] = useState<ResolvedMeta | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: events } = useQuery({
    queryKey: ["preview-inspector-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_events")
        .select("slug, title, updated_at")
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const inspect = async () => {
    setLoading(true);
    setMeta(null);
    try {
      if (type === "event") {
        if (!slug) {
          toast({ title: "Pick an event first", variant: "destructive" });
          setLoading(false);
          return;
        }
        const ev = events?.find((e) => e.slug === slug);
        const res = await fetch(eventPreviewJsonUrl(slug));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setMeta(await res.json());
        setShareUrl(eventPreviewUrl(slug, ev?.updated_at));
      } else {
        const res = await fetch(routinePreviewJsonUrl());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setMeta(await res.json());
        setShareUrl(routinePreviewUrl());
      }
    } catch (err) {
      toast({
        title: "Could not resolve preview",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Preview Inspector</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Check the exact OpenGraph / X tags a routine or event link will show
          before you share it on WhatsApp, Facebook or X.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as "routine" | "event");
                setMeta(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="routine">Daily Routine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "event" && (
            <div className="space-y-2">
              <Label>Event</Label>
              <Select value={slug} onValueChange={setSlug}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events?.map((e) => (
                    <SelectItem key={e.slug} value={e.slug}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button onClick={inspect} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Resolve preview
        </Button>
      </div>

      {meta && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          {meta.ogImage && (
            <div className="overflow-hidden rounded-lg border border-border">
              <img
                src={meta.ogImage}
                alt="Preview thumbnail"
                className="w-full aspect-[1.91/1] object-cover bg-muted"
              />
            </div>
          )}

          <dl className="space-y-3 text-sm">
            <Field label="og:title" value={meta.ogTitle} />
            <Field label="og:description" value={meta.ogDescription} />
            <Field label="og:image" value={meta.ogImage} mono />
            <Field label="twitter:title" value={meta.twitterTitle} />
            <Field label="twitter:description" value={meta.twitterDescription} />
            <Field label="twitter:image" value={meta.twitterImage} mono />
            <Field label="canonical" value={meta.canonical} mono />
          </dl>

          <div className="space-y-2 border-t border-border pt-4">
            <Label>Shareable link (versioned to bust stale caches)</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={shareUrl} className="font-mono text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copy(shareUrl)}
                aria-label="Copy link"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                aria-label="Open link"
              >
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The <code>v=</code> parameter changes when the content updates, so
              WhatsApp / Facebook re-scrape instead of showing an old preview.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3">
      <dt className="text-muted-foreground font-medium">{label}</dt>
      <dd className={mono ? "break-all font-mono text-xs" : "break-words"}>
        {value || <span className="text-muted-foreground italic">—</span>}
      </dd>
    </div>
  );
}
