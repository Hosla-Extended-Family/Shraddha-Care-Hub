ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS sort_order INTEGER;
CREATE INDEX IF NOT EXISTS idx_blogs_sort_order ON public.blogs (sort_order NULLS LAST, published_at DESC);