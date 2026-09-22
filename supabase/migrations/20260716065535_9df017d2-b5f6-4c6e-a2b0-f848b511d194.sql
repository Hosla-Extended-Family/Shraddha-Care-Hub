-- ============ blogs ============
CREATE TABLE public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cover_image_url text,
  language text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','under_review','needs_changes','approved','published','archived')),
  admin_notes text,
  slug text UNIQUE,
  content_hash text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blogs_status_published_at_idx ON public.blogs (status, published_at DESC);
CREATE INDEX blogs_author_idx ON public.blogs (author_id);
CREATE INDEX blogs_language_idx ON public.blogs (language);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blogs TO authenticated;
GRANT SELECT ON public.blogs TO anon;
GRANT ALL ON public.blogs TO service_role;

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Anyone can read published
CREATE POLICY "Anyone can read published blogs"
  ON public.blogs FOR SELECT
  USING (status = 'published');

-- Authors can see their own (any status)
CREATE POLICY "Authors can read own blogs"
  ON public.blogs FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

-- Admins can read all
CREATE POLICY "Admins can read all blogs"
  ON public.blogs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Authors can insert as themselves (only in editable statuses)
CREATE POLICY "Authors can create own blogs"
  ON public.blogs FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid() AND status IN ('draft','submitted'));

-- Authors can update own while draft/needs_changes/submitted
CREATE POLICY "Authors can update own editable blogs"
  ON public.blogs FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() AND status IN ('draft','submitted','needs_changes'))
  WITH CHECK (author_id = auth.uid() AND status IN ('draft','submitted','needs_changes'));

-- Admins can update anything
CREATE POLICY "Admins can update blogs"
  ON public.blogs FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Authors can delete own drafts
CREATE POLICY "Authors can delete own drafts"
  ON public.blogs FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() AND status IN ('draft','needs_changes'));

CREATE POLICY "Admins can delete blogs"
  ON public.blogs FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ blog_ai_suggestions ============
CREATE TABLE public.blog_ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestions jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.blog_ai_suggestions TO authenticated;
GRANT ALL ON public.blog_ai_suggestions TO service_role;

ALTER TABLE public.blog_ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ai suggestions"
  ON public.blog_ai_suggestions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own ai suggestions"
  ON public.blog_ai_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============ newsletters ============
CREATE TABLE public.newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  issue_number int,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','exported')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletters TO authenticated;
GRANT ALL ON public.newsletters TO service_role;

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage newsletters"
  ON public.newsletters FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_newsletters_updated_at
BEFORE UPDATE ON public.newsletters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ newsletter_blogs ============
CREATE TABLE public.newsletter_blogs (
  newsletter_id uuid NOT NULL REFERENCES public.newsletters(id) ON DELETE CASCADE,
  blog_id uuid NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  PRIMARY KEY (newsletter_id, blog_id)
);

CREATE INDEX newsletter_blogs_order_idx ON public.newsletter_blogs (newsletter_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_blogs TO authenticated;
GRANT ALL ON public.newsletter_blogs TO service_role;

ALTER TABLE public.newsletter_blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage newsletter_blogs"
  ON public.newsletter_blogs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============ ai_check_log ============
CREATE TABLE public.ai_check_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_check_log_user_time_idx ON public.ai_check_log (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.ai_check_log TO authenticated;
GRANT ALL ON public.ai_check_log TO service_role;

ALTER TABLE public.ai_check_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ai check log"
  ON public.ai_check_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own ai check log"
  ON public.ai_check_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============ profiles font pref ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_font_size int NOT NULL DEFAULT 18;
