import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SessionProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  membership_id: string | null;
  status: string | null;
}

/**
 * Auth-aware profile for the header. Keeps itself in step with sign-in and
 * sign-out anywhere in the app.
 */
export function useSessionProfile() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<SessionProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async (uid: string | null) => {
      if (!uid) {
        if (!cancelled) { setSignedIn(false); setProfile(null); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, membership_id, status")
        .eq("user_id", uid)
        .maybeSingle();
      if (cancelled) return;
      setSignedIn(true);
      setProfile((data as SessionProfile) ?? null);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      hydrate(session?.user.id ?? null);
    });
    supabase.auth.getSession().then(({ data }) => hydrate(data.session?.user.id ?? null));

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return { loading, signedIn, profile };
}
