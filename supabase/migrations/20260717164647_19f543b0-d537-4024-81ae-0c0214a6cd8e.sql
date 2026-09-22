
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Avatar bucket storage policies
DROP POLICY IF EXISTS "Avatar owners can read" ON storage.objects;
CREATE POLICY "Avatar owners can read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload their avatar" ON storage.objects;
CREATE POLICY "Users can upload their avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their avatar" ON storage.objects;
CREATE POLICY "Users can update their avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their avatar" ON storage.objects;
CREATE POLICY "Users can delete their avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Blog likes
CREATE TABLE IF NOT EXISTS public.blog_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anon_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT blog_likes_liker_check CHECK (user_id IS NOT NULL OR anon_key IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS blog_likes_user_unique
  ON public.blog_likes (blog_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS blog_likes_anon_unique
  ON public.blog_likes (blog_id, anon_key) WHERE anon_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS blog_likes_blog_idx ON public.blog_likes(blog_id);

GRANT SELECT, INSERT, DELETE ON public.blog_likes TO anon, authenticated;
GRANT ALL ON public.blog_likes TO service_role;

ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.blog_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can like" ON public.blog_likes FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid() AND anon_key IS NULL)
    OR (auth.uid() IS NULL AND user_id IS NULL AND anon_key IS NOT NULL AND length(anon_key) BETWEEN 8 AND 128)
  );
CREATE POLICY "Users can remove own like" ON public.blog_likes FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL AND anon_key IS NOT NULL)
  );

-- Blog comments
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT blog_comments_name_len CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT blog_comments_body_len CHECK (char_length(body) BETWEEN 1 AND 2000),
  CONSTRAINT blog_comments_status_check CHECK (status IN ('pending','approved','spam'))
);

CREATE INDEX IF NOT EXISTS blog_comments_blog_idx ON public.blog_comments(blog_id, created_at DESC);

GRANT SELECT, INSERT ON public.blog_comments TO anon, authenticated;
GRANT UPDATE, DELETE ON public.blog_comments TO authenticated;
GRANT ALL ON public.blog_comments TO service_role;

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved comments are public" ON public.blog_comments FOR SELECT
  USING (status = 'approved' OR public.is_admin());
CREATE POLICY "Anyone can post a comment" ON public.blog_comments FOR INSERT
  WITH CHECK (status = 'approved' AND char_length(trim(name)) > 0 AND char_length(trim(body)) > 0);
CREATE POLICY "Admins can update comments" ON public.blog_comments FOR UPDATE
  USING (public.is_admin());
CREATE POLICY "Admins can delete comments" ON public.blog_comments FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER update_blog_comments_updated_at
  BEFORE UPDATE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public author lookup (safe columns only)
CREATE OR REPLACE FUNCTION public.get_author_public(_user_id UUID)
RETURNS TABLE(user_id UUID, full_name TEXT, avatar_url TEXT, bio TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT user_id, full_name, avatar_url, bio
  FROM public.profiles
  WHERE user_id = _user_id AND status = 'approved';
$$;
