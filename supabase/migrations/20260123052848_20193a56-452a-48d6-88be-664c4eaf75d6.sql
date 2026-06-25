-- Add status field to donations for admin verification workflow
ALTER TABLE public.donations 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'verified', 'rejected'));

-- Add index for faster status filtering
CREATE INDEX idx_donations_status ON public.donations(status);

-- Update the consented donors function to only return VERIFIED + CONSENTED donors
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
    AND status = 'verified'
  GROUP BY LOWER(email), name
  ORDER BY LOWER(email), MAX(created_at) DESC
$$;