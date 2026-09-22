ALTER TABLE public.author_notifications ADD COLUMN IF NOT EXISTS comment_id uuid;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_digest_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS digest_email text,
  ADD COLUMN IF NOT EXISTS digest_last_sent_at timestamptz;

CREATE OR REPLACE FUNCTION public.notify_blog_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE b RECORD;
BEGIN
  SELECT id, title, slug, author_id INTO b FROM public.blogs WHERE id = NEW.blog_id;
  IF b.author_id IS NULL OR b.author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.author_notifications (user_id, type, blog_id, blog_title, blog_slug, actor_name, comment_body, comment_id)
  VALUES (b.author_id, 'comment', b.id, b.title, b.slug, NULLIF(NEW.name,''), NEW.body, NEW.id);
  RETURN NEW;
END;
$function$;