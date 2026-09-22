-- Ensure the blogs table is reachable through the Data API for the roles allowed by RLS.
GRANT SELECT, INSERT ON public.blogs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blogs TO authenticated;
GRANT ALL ON public.blogs TO service_role;

-- Replace the writer insert rule so signed-in but not-yet-approved writers can submit
-- their first guest-tagged blog linked to their account. This keeps the blog visible
-- in moderation and lets admin approval later convert it into a normal writer blog.
DROP POLICY IF EXISTS "Authors can create own blogs" ON public.blogs;

CREATE POLICY "Authors can create own blogs"
ON public.blogs
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND status = ANY (ARRAY['draft'::text, 'submitted'::text])
  AND (
    -- Approved writers create normal writer-owned rows.
    (is_guest = false)
    OR
    -- Pending/new writers coming through the guest flow can create a linked guest row.
    (
      status = 'submitted'::text
      AND is_guest = true
      AND guest_name IS NOT NULL
      AND btrim(guest_name) <> ''
      AND guest_phone IS NOT NULL
      AND btrim(guest_phone) <> ''
    )
  )
);

-- Keep anonymous one-time guest submissions explicit and complete.
DROP POLICY IF EXISTS "Guests can submit blogs" ON public.blogs;

CREATE POLICY "Guests can submit blogs"
ON public.blogs
FOR INSERT
TO anon
WITH CHECK (
  author_id IS NULL
  AND is_guest = true
  AND status = 'submitted'::text
  AND title IS NOT NULL
  AND body IS NOT NULL
  AND guest_name IS NOT NULL
  AND btrim(guest_name) <> ''
  AND guest_phone IS NOT NULL
  AND btrim(guest_phone) <> ''
);