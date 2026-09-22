CREATE OR REPLACE FUNCTION public.guest_account_hint(_phone text)
RETURNS TABLE(exists_account boolean, status text, has_membership_id boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT true, p.status::text, (p.membership_id IS NOT NULL)
  FROM public.profiles p
  WHERE p.phone_e164 = _phone
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.guest_account_hint(text) TO anon, authenticated;