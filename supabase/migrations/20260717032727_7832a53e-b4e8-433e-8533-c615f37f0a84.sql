
DROP POLICY IF EXISTS "Authors can update own editable blogs" ON public.blogs;
CREATE POLICY "Authors can update own editable blogs" ON public.blogs
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    AND status = ANY (ARRAY['draft','submitted','needs_changes','published'])
    AND public.is_approved_writer(auth.uid())
  )
  WITH CHECK (
    author_id = auth.uid()
    AND status = ANY (ARRAY['draft','submitted','needs_changes'])
  );
