-- Collaborations (linked to published events)
CREATE TABLE public.collaborations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.registration_events(id) ON DELETE CASCADE,
  sector text NOT NULL DEFAULT 'Other',
  initiative_type text NOT NULL DEFAULT 'Collaboration',
  partner_name text NOT NULL,
  description text,
  outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
  org_logo text NOT NULL DEFAULT 'both',
  collaborator_logo_url text,
  collaborator_text text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.collaborations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collaborations TO authenticated;
GRANT ALL ON public.collaborations TO service_role;

ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published collaborations"
  ON public.collaborations FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage collaborations"
  ON public.collaborations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_collaborations_updated_at
  BEFORE UPDATE ON public.collaborations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Partnership FAQs
CREATE TABLE public.partnership_faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partnership_faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partnership_faqs TO authenticated;
GRANT ALL ON public.partnership_faqs TO service_role;

ALTER TABLE public.partnership_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published faqs"
  ON public.partnership_faqs FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage faqs"
  ON public.partnership_faqs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_partnership_faqs_updated_at
  BEFORE UPDATE ON public.partnership_faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Partner testimonials (quotes)
CREATE TABLE public.partner_testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote text NOT NULL,
  author_name text NOT NULL,
  author_role text,
  organization text,
  image_url text,
  event_date date,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partner_testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_testimonials TO authenticated;
GRANT ALL ON public.partner_testimonials TO service_role;

ALTER TABLE public.partner_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published testimonials"
  ON public.partner_testimonials FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage testimonials"
  ON public.partner_testimonials FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_partner_testimonials_updated_at
  BEFORE UPDATE ON public.partner_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Partner outcome stat cards
CREATE TABLE public.partner_outcomes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value text NOT NULL,
  label text NOT NULL,
  icon text NOT NULL DEFAULT 'Sparkles',
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partner_outcomes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_outcomes TO authenticated;
GRANT ALL ON public.partner_outcomes TO service_role;

ALTER TABLE public.partner_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published outcomes"
  ON public.partner_outcomes FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage outcomes"
  ON public.partner_outcomes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_partner_outcomes_updated_at
  BEFORE UPDATE ON public.partner_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();