import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "admin" | "team_admin" | "main_admin";

/** Reads the signed-in user's admin roles. Server-side RLS remains the real gate. */
export function useAdminRole() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) {
        if (!cancelled) { setRoles([]); setLoading(false); }
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (!cancelled) {
        setRoles((data ?? []).map((r: any) => String(r.role)));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return {
    loading,
    roles,
    isMainAdmin: roles.includes("main_admin"),
    isAnyAdmin: roles.some((r) => ["admin", "team_admin", "main_admin"].includes(r)),
  };
}
