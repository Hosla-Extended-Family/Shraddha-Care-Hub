CREATE POLICY "Anyone can upload a membership photo"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'membership-photos');

CREATE POLICY "Admins can view membership photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'membership-photos' AND public.is_admin());

CREATE POLICY "Admins can delete membership photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'membership-photos' AND public.is_admin());