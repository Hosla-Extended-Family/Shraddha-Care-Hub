import type { Json } from "@/integrations/supabase/types";

export type EventMediaItem = {
  type: "image" | "youtube";
  url: string;
  caption?: string;
};

/** Safely parse the `gallery` jsonb column into a typed list of media items. */
export function parseGallery(gallery: Json | null | undefined): EventMediaItem[] {
  if (!Array.isArray(gallery)) return [];
  return (gallery as unknown[])
    .filter(
      (i): i is { type: string; url: string; caption?: string } =>
        !!i &&
        typeof i === "object" &&
        ((i as { type?: unknown }).type === "image" ||
          (i as { type?: unknown }).type === "youtube") &&
        typeof (i as { url?: unknown }).url === "string" &&
        ((i as { url: string }).url).length > 0
    )
    .map((i) => ({
      type: i.type as "image" | "youtube",
      url: i.url,
      caption: typeof i.caption === "string" && i.caption ? i.caption : undefined,
    }));
}

/** Extract an 11-char YouTube video id from any common YouTube URL or a bare id. */
export function youtubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (match) return match[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function youtubeThumb(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
