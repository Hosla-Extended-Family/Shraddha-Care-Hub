DROP POLICY IF EXISTS "Approved comments are public" ON public.blog_comments;

CREATE POLICY "Admins can read comments"
ON public.blog_comments
FOR SELECT
USING (is_admin());

CREATE POLICY "Authors can read own comments"
ON public.blog_comments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE VIEW public.blog_comments_public
WITH (security_invoker = off) AS
SELECT id, blog_id, name, website, body, created_at
FROM public.blog_comments
WHERE status = 'approved';

GRANT SELECT ON public.blog_comments_public TO anon, authenticated;