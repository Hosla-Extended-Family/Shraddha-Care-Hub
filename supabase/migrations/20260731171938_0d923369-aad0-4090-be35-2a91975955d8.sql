CREATE TABLE public.author_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null check (type in ('like','comment')),
  blog_id uuid references public.blogs(id) on delete cascade,
  blog_title text,
  blog_slug text,
  actor_name text,
  comment_body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

CREATE INDEX author_notifications_user_idx ON public.author_notifications (user_id, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.author_notifications TO authenticated;
GRANT ALL ON public.author_notifications TO service_role;

ALTER TABLE public.author_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.author_notifications
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON public.author_notifications
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own notifications" ON public.author_notifications
FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_blog_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE b RECORD;
BEGIN
  SELECT id, title, slug, author_id INTO b FROM public.blogs WHERE id = NEW.blog_id;
  IF b.author_id IS NULL OR b.author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.author_notifications (user_id, type, blog_id, blog_title, blog_slug, actor_name, comment_body)
  VALUES (b.author_id, 'comment', b.id, b.title, b.slug, NULLIF(NEW.name,''), NEW.body);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_blog_comment
AFTER INSERT ON public.blog_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_blog_comment();

CREATE OR REPLACE FUNCTION public.notify_blog_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE b RECORD; actor text;
BEGIN
  SELECT id, title, slug, author_id INTO b FROM public.blogs WHERE id = NEW.blog_id;
  IF b.author_id IS NULL OR b.author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS NOT NULL THEN
    SELECT full_name INTO actor FROM public.profiles WHERE user_id = NEW.user_id;
  END IF;
  INSERT INTO public.author_notifications (user_id, type, blog_id, blog_title, blog_slug, actor_name)
  VALUES (b.author_id, 'like', b.id, b.title, b.slug, actor);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_blog_like
AFTER INSERT ON public.blog_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_blog_like();

ALTER PUBLICATION supabase_realtime ADD TABLE public.author_notifications;