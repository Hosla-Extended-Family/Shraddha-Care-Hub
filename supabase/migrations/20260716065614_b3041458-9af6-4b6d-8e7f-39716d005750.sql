-- storage.objects policies for blog-audio (service-role writes only; reads via signed URLs)
-- (no anon/authenticated policies needed since access is via signed URLs generated server-side)
CREATE POLICY "Service role manages blog-audio"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'blog-audio')
  WITH CHECK (bucket_id = 'blog-audio');
