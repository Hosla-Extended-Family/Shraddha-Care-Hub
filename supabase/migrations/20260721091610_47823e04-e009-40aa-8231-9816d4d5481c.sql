DROP VIEW IF EXISTS public.authors_public;

CREATE OR REPLACE FUNCTION public.get_authors_public(_user_ids uuid[])
RETURNS TABLE(user_id uuid, full_name text, avatar_url text, bio text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, full_name, avatar_url, bio
  FROM public.profiles
  WHERE status = 'approved' AND user_id = ANY(_user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_authors_public(uuid[]) TO anon, authenticated;