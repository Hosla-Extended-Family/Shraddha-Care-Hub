import { supabase } from "@/integrations/supabase/client";

// In-memory cache of signed avatar URLs (avatars bucket is private).
const cache = new Map<string, { url: string; expires: number }>();

/**
 * Resolve a stored avatar_url (which is a storage path in the `avatars` bucket)
 * to a signed URL. If avatar_url is already an absolute URL (http/https) it's
 * returned as-is. Returns null when there's no avatar.
 */
export async function resolveAvatarUrl(avatarPath?: string | null): Promise<string | null> {
  if (!avatarPath) return null;
  if (/^https?:\/\//i.test(avatarPath)) return avatarPath;

  const cached = cache.get(avatarPath);
  const now = Date.now();
  if (cached && cached.expires > now) return cached.url;

  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarPath, 60 * 60);
  if (error || !data?.signedUrl) return null;
  cache.set(avatarPath, { url: data.signedUrl, expires: now + 55 * 60 * 1000 });
  return data.signedUrl;
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
