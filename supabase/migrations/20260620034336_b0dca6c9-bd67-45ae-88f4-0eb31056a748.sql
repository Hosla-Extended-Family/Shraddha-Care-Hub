-- 1. Remove event_registrations (contains PII) from Realtime publication.
ALTER PUBLICATION supabase_realtime DROP TABLE public.event_registrations;

-- 2. Restrict project-posters bucket writes to admins only.
DROP POLICY IF EXISTS "Authenticated upload project posters" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update project posters" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete project posters" ON storage.objects;

CREATE POLICY "Admins can upload project posters"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-posters' AND public.is_admin());

CREATE POLICY "Admins can update project posters"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'project-posters' AND public.is_admin())
WITH CHECK (bucket_id = 'project-posters' AND public.is_admin());

CREATE POLICY "Admins can delete project posters"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-posters' AND public.is_admin());