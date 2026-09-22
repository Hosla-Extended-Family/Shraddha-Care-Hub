-- 1. Vault for member passwords (service-role only; revealed through an edge function)
CREATE TABLE IF NOT EXISTS public.member_passwords (
  user_id uuid PRIMARY KEY,
  password text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT ALL ON public.member_passwords TO service_role;
ALTER TABLE public.member_passwords ENABLE ROW LEVEL SECURITY;

-- 2. Credential requests can now also be a "show me this member's password" request
ALTER TABLE public.credential_requests
  ADD COLUMN IF NOT EXISTS proposed_password text;

-- 3. Event registrations can carry a Membership ID so attendance syncs to the profile
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS membership_id text;
CREATE INDEX IF NOT EXISTS event_registrations_membership_id_idx
  ON public.event_registrations (membership_id);

-- 4. Profile activity: a member's own event registrations
CREATE OR REPLACE FUNCTION public.my_event_registrations()
RETURNS TABLE(
  id uuid, event_id uuid, created_at timestamptz, checked_in boolean,
  checked_in_at timestamptz, payment_status text, amount_inr integer,
  event_title text, event_slug text, event_date date
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.id, r.event_id, r.created_at, r.checked_in, r.checked_in_at,
         r.payment_status, r.amount_inr, e.title, e.slug, e.event_date
  FROM public.event_registrations r
  LEFT JOIN public.registration_events e ON e.id = r.event_id
  WHERE auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND (
          (p.membership_id IS NOT NULL AND r.membership_id = p.membership_id)
          OR (
            p.phone_e164 IS NOT NULL
            AND length(regexp_replace(r.mobile, '\D', '', 'g')) >= 10
            AND right(regexp_replace(r.mobile, '\D', '', 'g'), 10)
              = right(regexp_replace(p.phone_e164, '\D', '', 'g'), 10)
          )
        )
    )
  ORDER BY r.created_at DESC;
$$;

-- 5. Profile activity: a member's own donations (matched on phone)
CREATE OR REPLACE FUNCTION public.my_donations()
RETURNS TABLE(id uuid, name text, amount text, status text, created_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT d.id, d.name, d.amount, d.status, d.created_at
  FROM public.donations d
  WHERE auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.phone_e164 IS NOT NULL
        AND length(regexp_replace(d.phone, '\D', '', 'g')) >= 10
        AND right(regexp_replace(d.phone, '\D', '', 'g'), 10)
          = right(regexp_replace(p.phone_e164, '\D', '', 'g'), 10)
    )
  ORDER BY d.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.my_event_registrations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_donations() TO authenticated;

-- 6. Admins can manage member photos in the avatars bucket
CREATE POLICY "Admins manage avatars" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND public.is_any_admin())
  WITH CHECK (bucket_id = 'avatars' AND public.is_any_admin());