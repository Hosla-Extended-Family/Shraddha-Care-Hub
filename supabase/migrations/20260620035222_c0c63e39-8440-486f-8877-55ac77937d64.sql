-- 1. Add display columns to registration_events
ALTER TABLE public.registration_events
  ADD COLUMN IF NOT EXISTS status public.project_status NOT NULL DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS organization public.organization_type NOT NULL DEFAULT 'shraddha',
  ADD COLUMN IF NOT EXISTS resource_link text,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS enable_registration boolean NOT NULL DEFAULT false;

-- 2. Enrich existing registration_events rows
UPDATE public.registration_events
  SET status = 'completed', organization = 'both', enable_registration = false
  WHERE slug = 'mumbai-senior-citizens-health-camp';

UPDATE public.registration_events
  SET status = 'upcoming', organization = 'shraddha', enable_registration = true
  WHERE slug = 'senior-serenity-summit';

UPDATE public.registration_events
  SET status = 'upcoming', organization = 'both', enable_registration = true
  WHERE slug = 'hosla-belurmath';

-- 3. Migrate HOSLA PREMIER LEAGUE (only non-duplicate project) into registration_events
INSERT INTO public.registration_events
  (slug, title, description, event_date, end_date, status, organization, resource_link,
   location, banner_url, enable_registration, registration_open, is_published, display_order)
SELECT
  'hosla-premier-league',
  pe.title,
  pe.description,
  pe.start_date,
  pe.end_date,
  pe.status,
  pe.organization,
  COALESCE(pe.resource_link, '/hpl'),
  pe.location,
  pe.poster_url,
  false,
  false,
  pe.is_published,
  pe.display_order
FROM public.projects_events pe
WHERE pe.title = '🏆 HOSLA PREMIER LEAGUE 🏆'
  AND NOT EXISTS (SELECT 1 FROM public.registration_events re WHERE re.slug = 'hosla-premier-league');

-- 4. Drop the redundant projects_events table
DROP TABLE IF EXISTS public.projects_events;