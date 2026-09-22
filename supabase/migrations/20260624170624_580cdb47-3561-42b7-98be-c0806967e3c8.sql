ALTER TABLE public.registration_events
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.registration_events.gallery IS 'Array of media items for completed events: [{ "type": "image" | "youtube", "url": "...", "caption": "..." }]';