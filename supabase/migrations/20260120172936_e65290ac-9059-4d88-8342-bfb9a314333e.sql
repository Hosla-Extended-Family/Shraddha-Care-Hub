-- Create storage bucket for team member photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-photos', 'team-photos', true);

-- Allow anyone to view team photos (public bucket)
CREATE POLICY "Anyone can view team photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-photos');

-- Only admins can upload team photos
CREATE POLICY "Admins can upload team photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'team-photos' AND is_admin());

-- Only admins can update team photos
CREATE POLICY "Admins can update team photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'team-photos' AND is_admin());

-- Only admins can delete team photos
CREATE POLICY "Admins can delete team photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'team-photos' AND is_admin());