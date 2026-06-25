-- Remove the redundant "Deny anonymous access to reports" policy
-- The "Admins can view all reports" policy already properly restricts SELECT to admins only
-- Having both policies is redundant and creates confusing security posture
DROP POLICY IF EXISTS "Deny anonymous access to reports" ON public.abuse_reports;