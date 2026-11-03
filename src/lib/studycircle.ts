import type { Database } from "@/integrations/supabase/types";
import { formatTime12 } from "@/lib/routine";
import { supabase } from "@/integrations/supabase/client";

export type StudyCircleProgram = "kathamrita" | "pathochokro";
export type StudyCircleSession = Database["public"]["Tables"]["study_circle_sessions"]["Row"];
export type StudyCircleRole = Database["public"]["Tables"]["study_circle_roles"]["Row"];
export type StudyCircleRolePerformer = Database["public"]["Tables"]["study_circle_role_performers"]["Row"];
export type StudyCirclePart = Database["public"]["Tables"]["study_circle_parts"]["Row"];
export type StudyCirclePartPerformer = Database["public"]["Tables"]["study_circle_part_performers"]["Row"];

export type PerformerValue = {
  memberId: string | null;
  guestName: string | null;
  displayName: string;
};

export type StudyCircleRoleWithPerformers = StudyCircleRole & {
  performers: StudyCircleRolePerformer[];
};

export type StudyCirclePartWithPerformers = StudyCirclePart & {
  performers: StudyCirclePartPerformer[];
};

export type StudyCircleBundle = {
  session: StudyCircleSession;
  roles: StudyCircleRoleWithPerformers[];
  parts: StudyCirclePartWithPerformers[];
};

export const PROGRAM_META: Record<StudyCircleProgram, {
  label: string;
  shortLabel: string;
  accent: string;
  soft: string;
}> = {
  kathamrita: {
    label: "রামকৃষ্ণ কথামৃত",
    shortLabel: "Kathamrita · Tuesday",
    accent: "orange",
    soft: "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300",
  },
  pathochokro: {
    label: "পাঠচক্র",
    shortLabel: "Pathochokro · Thursday",
    accent: "purple",
    soft: "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300",
  },
};

export const DEFAULT_ROLES = [
  { role_name: "Rule Reader", display_order: 1 },
  { role_name: "Improvement Catalyst", display_order: 2 },
  { role_name: "Backup Reader", display_order: 3 },
  { role_name: "Backup Singer", display_order: 4 },
] as const;

export function formatSessionDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00+05:30`));
}

export function getProgramLabel(program: string): string {
  return program === "kathamrita" ? PROGRAM_META.kathamrita.label : PROGRAM_META.pathochokro.label;
}

export function getPerformerName(p: { guest_name: string | null; member_id?: string | null }): string {
  return p.guest_name?.trim() || "";
}

export function getPerformerNames(
  performers: Array<{ guest_name: string | null; member_id?: string | null }>,
): string[] {
  return performers.map(getPerformerName).filter((name) => name.length > 0);
}

export function displayTime(time: string | null): string {
  return time ? formatTime12(time) : "Time to be announced";
}

/** Rejects after `ms` milliseconds so React Query can transition to the error state. */
function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms),
    ),
  ]);
}

export async function fetchUpcomingPublishedSession(program: StudyCircleProgram): Promise<StudyCircleSession | null> {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const { data, error } = await withTimeout(
    supabase
      .from("study_circle_sessions")
      .select("*")
      .eq("program_type", program)
      .eq("is_published", true)
      .gte("scheduled_date", today)
      .order("scheduled_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  );
  if (error) throw error;
  return data;
}

export async function fetchSessionBundle(
  sessionId: string,
  includeUnpublished = false,
): Promise<StudyCircleBundle | null> {
  let sessionQuery = supabase.from("study_circle_sessions").select("*").eq("id", sessionId);
  if (!includeUnpublished) sessionQuery = sessionQuery.eq("is_published", true);
  const { data: session, error: sessionError } = await withTimeout(sessionQuery.maybeSingle());
  if (sessionError) throw sessionError;
  if (!session) return null;

  const [{ data: roles, error: rolesError }, { data: parts, error: partsError }] = await withTimeout(
    Promise.all([
      supabase.from("study_circle_roles").select("*").eq("session_id", sessionId).order("display_order"),
      supabase.from("study_circle_parts").select("*").eq("session_id", sessionId).order("display_order"),
    ]),
  );
  if (rolesError) throw rolesError;
  if (partsError) throw partsError;

  const roleRows = roles ?? [];
  const partRows = parts ?? [];
  const roleIds = roleRows.map((r) => r.id);
  const partIds = partRows.map((p) => p.id);

  const [{ data: rolePerformers, error: rolePerformersError }, { data: partPerformers, error: partPerformersError }] =
    await withTimeout(
      Promise.all([
        roleIds.length
          ? supabase.from("study_circle_role_performers").select("*").in("role_id", roleIds).order("display_order")
          : Promise.resolve({ data: [], error: null }),
        partIds.length
          ? supabase.from("study_circle_part_performers").select("*").in("part_id", partIds).order("display_order")
          : Promise.resolve({ data: [], error: null }),
      ]),
    );
  if (rolePerformersError) throw rolePerformersError;
  if (partPerformersError) throw partPerformersError;

  return {
    session,
    roles: roleRows.map((role) => ({
      ...role,
      performers: (rolePerformers ?? []).filter((p) => p.role_id === role.id),
    })),
    parts: partRows.map((part) => ({
      ...part,
      performers: (partPerformers ?? []).filter((p) => p.part_id === part.id),
    })),
  };
}
