DROP POLICY IF EXISTS "Authors can create own blogs" ON public.blogs;

CREATE POLICY "Authors can create own blogs"
ON public.blogs
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND status = ANY (ARRAY['draft'::text, 'submitted'::text])
  AND (
    (
      is_guest = false
      AND public.is_approved_writer(auth.uid())
    )
    OR (
      status = 'submitted'::text
      AND is_guest = true
      AND guest_name IS NOT NULL
      AND btrim(guest_name) <> ''::text
      AND guest_phone IS NOT NULL
      AND btrim(guest_phone) <> ''::text
    )
  )
);