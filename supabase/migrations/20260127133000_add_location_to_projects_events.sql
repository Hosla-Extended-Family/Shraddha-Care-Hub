ALTER TABLE public.projects_events
ADD COLUMN location TEXT;

ALTER TABLE public.projects_events
ADD CONSTRAINT projects_events_location_length
CHECK (char_length(location) <= 200);
