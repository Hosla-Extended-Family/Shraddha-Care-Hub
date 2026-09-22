CREATE OR REPLACE FUNCTION public.get_writer_status_by_phone(_phone text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status::text FROM public.profiles WHERE phone_e164 = _phone LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_writer_status_by_phone(text) TO anon, authenticated;