import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

export type Caller = {
  userId: string;
  roles: string[];
  isAnyAdmin: boolean;
  isMainAdmin: boolean;
  fullName: string | null;
};

/** Validates the bearer token in-code and resolves the caller's roles. */
export async function getCaller(req: Request, svc: SupabaseClient): Promise<Caller | null> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data, error } = await svc.auth.getUser(token);
  if (error || !data.user) return null;

  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    svc.from("user_roles").select("role").eq("user_id", data.user.id),
    svc.from("profiles").select("full_name").eq("user_id", data.user.id).maybeSingle(),
  ]);
  const roles = (roleRows ?? []).map((r: { role: string }) => r.role);
  return {
    userId: data.user.id,
    roles,
    isAnyAdmin: roles.some((r) => ["admin", "team_admin", "main_admin"].includes(r)),
    isMainAdmin: roles.includes("main_admin"),
    fullName: profile?.full_name ?? null,
  };
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function audit(
  svc: SupabaseClient,
  caller: Caller,
  action: string,
  entity: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
  ip: string | null = null,
) {
  await svc.from("membership_audit_log").insert({
    actor_id: caller.userId,
    actor_name: caller.fullName,
    action,
    entity,
    entity_id: entityId,
    details,
    ip,
  });
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

/** Membership ID = first 4 letters of name + last 4 digits of phone. */
export function makeMembershipId(name: string, phone: string) {
  const letters = (name || "").replace(/[^A-Za-z]/g, "").slice(0, 4).padEnd(4, "X").toUpperCase();
  const digits = (phone || "").replace(/\D/g, "").padStart(4, "0").slice(-4);
  return `${letters}${digits}`;
}

export function memberSyntheticEmail(membershipId: string) {
  return `member${membershipId.toLowerCase()}@shraddha.local`;
}

export function monthsCovered(amount: number, fee: number) {
  if (!fee || fee <= 0) return 0;
  return Math.floor(amount / fee);
}

/** Extends a paid-up-until date by N whole months, always landing on a month end. */
export function extendPaidUntil(current: string | null, months: number) {
  const today = new Date();
  // Continue from the recorded paid-through month even if it is overdue.
  // Falling back to today would skip unpaid months from the member's ledger.
  const base = current ? new Date(`${current.slice(0, 10)}T12:00:00Z`) : null;
  const startFrom = base ?? today;
  const d = new Date(startFrom.getFullYear(), startFrom.getMonth() + months + 1, 0);
  return d.toISOString().slice(0, 10);
}

/** SHA-256 hex of a string. */
export async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const PASSPHRASE_KEY = "main_admin_console_passphrase_hash";

/**
 * Checks the main-admin console passphrase. A hash stored in app_settings
 * (set from the admin UI) takes precedence over the MAIN_ADMIN_CONSOLE_PASSPHRASE secret.
 */
export async function verifyConsolePassphrase(svc: SupabaseClient, given: string) {
  const value = given.trim();
  if (!value) return false;
  const { data } = await svc
    .from("app_settings").select("value").eq("key", PASSPHRASE_KEY).maybeSingle();
  if (data?.value) return (await sha256Hex(value)) === data.value;
  const secret = Deno.env.get("MAIN_ADMIN_CONSOLE_PASSPHRASE") ?? "";
  return Boolean(secret) && value === secret.trim();
}

export async function setConsolePassphrase(svc: SupabaseClient, passphrase: string, userId: string) {
  const value = await sha256Hex(passphrase);
  const { error } = await svc.from("app_settings").upsert(
    { key: PASSPHRASE_KEY, value, updated_at: new Date().toISOString(), updated_by: userId },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
}
