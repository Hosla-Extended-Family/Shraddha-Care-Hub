-- Public author view: exposes only name/avatar/bio of approved writers to everyone
CREATE OR REPLACE VIEW public.authors_public
WITH (security_invoker = off) AS
  SELECT user_id, full_name, avatar_url, bio
  FROM public.profiles
  WHERE status = 'approved';

GRANT SELECT ON public.authors_public TO anon, authenticated;