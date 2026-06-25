-- Create a secure function to get consented donor names (public access)
CREATE OR REPLACE FUNCTION public.get_consented_donors()
RETURNS TABLE (name text, donated_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (LOWER(email)) 
    name,
    MAX(created_at) as donated_at
  FROM public.donations
  WHERE consent_to_publish = true
  GROUP BY LOWER(email), name
  ORDER BY LOWER(email), MAX(created_at) DESC
$$;