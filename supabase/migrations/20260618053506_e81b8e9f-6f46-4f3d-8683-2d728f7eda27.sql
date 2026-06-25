-- 1. Create registration_events table
CREATE TABLE public.registration_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  start_time TEXT,
  end_time TEXT,
  venue_name TEXT,
  venue_address TEXT,
  contact_phone TEXT,
  banner_url TEXT,
  field_config JSONB NOT NULL DEFAULT '{
    "mobile": {"enabled": true, "required": true},
    "age": {"enabled": true, "required": true},
    "area": {"enabled": true, "required": true},
    "medical_concerns": {"enabled": true, "required": false},
    "source": {"enabled": true, "required": false}
  }'::jsonb,
  registration_open BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.registration_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_events TO authenticated;
GRANT ALL ON public.registration_events TO service_role;

ALTER TABLE public.registration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published events"
  ON public.registration_events FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all events"
  ON public.registration_events FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can manage events"
  ON public.registration_events FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER update_registration_events_updated_at
  BEFORE UPDATE ON public.registration_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add event_id to event_registrations
ALTER TABLE public.event_registrations
  ADD COLUMN event_id UUID REFERENCES public.registration_events(id) ON DELETE SET NULL;

-- 3. Seed the Mumbai event and attach existing registrations
WITH new_event AS (
  INSERT INTO public.registration_events (
    slug, title, description, event_date, start_time, end_time,
    venue_name, venue_address, contact_phone, registration_open, is_published
  ) VALUES (
    'mumbai-senior-citizens-health-camp',
    'Mumbai Senior Citizens'' Meet & Health Wellness Camp',
    'A wellness camp dedicated to the health and happiness of our senior citizens.',
    '2026-03-20',
    '9:00 AM',
    '10:00 AM',
    'New Life Old Age Home',
    'New Life Old Age Home, Vatar School Stop, Jeladi Rampatti Road, Jeladi Beach, Virar (W) 401301',
    '78110 09309',
    false,
    true
  )
  RETURNING id
)
UPDATE public.event_registrations
SET event_id = (SELECT id FROM new_event)
WHERE event_id IS NULL;