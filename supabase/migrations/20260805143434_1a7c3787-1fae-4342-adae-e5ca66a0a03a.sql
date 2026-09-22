ALTER TABLE public.registration_events
  ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_inr integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS members_free boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_note text;

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS amount_inr integer,
  ADD COLUMN IF NOT EXISTS is_member boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS event_registrations_stripe_session_idx
  ON public.event_registrations (stripe_session_id);

CREATE OR REPLACE FUNCTION public.is_hosla_member(_email text, _phone text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membership_applications
    WHERE status = 'approved'
      AND (
        (_email IS NOT NULL AND _email <> '' AND lower(email) = lower(_email))
        OR (_phone IS NOT NULL AND _phone <> '' AND regexp_replace(child_contact, '\D', '', 'g') LIKE '%' || regexp_replace(_phone, '\D', '', 'g'))
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_registration_payment_status(_registration_id uuid)
RETURNS TABLE(payment_status text, amount_inr integer, is_member boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT payment_status, amount_inr, is_member
  FROM public.event_registrations
  WHERE id = _registration_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_hosla_member(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_registration_payment_status(uuid) TO anon, authenticated;