-- Drop and recreate the get_consented_donors function to handle manual donors correctly
-- The issue is that all manual donors share the same email (manual@shraddha.org)
-- which causes DISTINCT ON to only return one of them

CREATE OR REPLACE FUNCTION public.get_consented_donors()
 RETURNS TABLE(name text, donated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    name,
    created_at as donated_at
  FROM public.donations
  WHERE consent_to_publish = true 
    AND status = 'verified'
  ORDER BY created_at DESC
$function$;