-- Add poster image URL to projects_events table
ALTER TABLE public.projects_events
ADD COLUMN poster_url TEXT;

ALTER TABLE public.projects_events
ADD CONSTRAINT projects_events_poster_url_length
CHECK (char_length(poster_url) <= 500);