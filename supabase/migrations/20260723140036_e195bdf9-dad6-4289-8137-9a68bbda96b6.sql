
-- Allow guest submissions on blogs
ALTER TABLE public.blogs ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- Allow anonymous visitors to submit guest blogs (status='submitted' only, must be flagged guest)
GRANT INSERT ON public.blogs TO anon;

DROP POLICY IF EXISTS "Guests can submit blogs" ON public.blogs;
CREATE POLICY "Guests can submit blogs"
  ON public.blogs FOR INSERT
  TO anon
  WITH CHECK (
    is_guest = TRUE
    AND status = 'submitted'
    AND title IS NOT NULL
    AND body IS NOT NULL
    AND guest_name IS NOT NULL
    AND guest_phone IS NOT NULL
  );
