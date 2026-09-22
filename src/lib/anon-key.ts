// Persistent anonymous browser key for one-per-visitor blog likes.
const STORAGE_KEY = "sh_anon_v1";

export function getAnonKey(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const fresh = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // Private mode / storage disabled → best-effort ephemeral key
    return `ephemeral-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
