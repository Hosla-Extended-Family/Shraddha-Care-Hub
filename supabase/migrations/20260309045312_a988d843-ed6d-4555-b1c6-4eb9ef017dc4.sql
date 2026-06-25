
-- Drop the existing restrictive policy that excludes completed events
DROP POLICY IF EXISTS "Anyone can view published events" ON public.projects_events;

-- Create new policy that allows viewing ALL published events (including completed)
CREATE POLICY "Anyone can view published events" ON public.projects_events
FOR SELECT USING (is_published = true);
