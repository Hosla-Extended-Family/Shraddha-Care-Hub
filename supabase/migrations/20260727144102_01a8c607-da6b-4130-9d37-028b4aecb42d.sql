
-- Blog subscribers table
CREATE TABLE public.blog_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT false,
  verify_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  unsubscribe_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_subscribers TO authenticated;
GRANT INSERT ON public.blog_subscribers TO anon;
GRANT ALL ON public.blog_subscribers TO service_role;

ALTER TABLE public.blog_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert), but not read tokens back
CREATE POLICY "Anyone can subscribe"
  ON public.blog_subscribers FOR INSERT
  WITH CHECK (true);

-- Only admins can view the list
CREATE POLICY "Admins can view subscribers"
  ON public.blog_subscribers FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete subscribers"
  ON public.blog_subscribers FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE TRIGGER update_blog_subscribers_updated_at
  BEFORE UPDATE ON public.blog_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add phone to blog_comments, relax email requirement
ALTER TABLE public.blog_comments ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.blog_comments ALTER COLUMN email DROP NOT NULL;
