-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Admins can view all reports" ON public.abuse_reports;

-- Create a permissive SELECT policy that only allows admins
-- This is the correct pattern: permissive policies grant access, 
-- and without a matching policy, access is denied by default
CREATE POLICY "Admins can view all reports" 
ON public.abuse_reports 
FOR SELECT 
TO authenticated
USING (is_admin());

-- Also add an explicit deny for anon users to be extra safe
CREATE POLICY "Deny anonymous access to reports"
ON public.abuse_reports
FOR SELECT
TO anon
USING (false);