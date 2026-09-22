
-- Allow pending (not-yet-approved) writers to submit blogs for review.
-- Approval still gates publishing (done by admins), not initial submission.
DROP POLICY IF EXISTS "Authors can create own blogs" ON public.blogs;
CREATE POLICY "Authors can create own blogs"
ON public.blogs
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND status = ANY (ARRAY['draft'::text, 'submitted'::text])
  AND is_guest = false
);
