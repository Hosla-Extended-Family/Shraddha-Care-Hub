-- Study Circle / পাঠচক্র সূচী
-- Manages weekly study circle sessions with performer assignments.

CREATE TABLE IF NOT EXISTS public.study_circle_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_type text NOT NULL CHECK (program_type IN ('kathamrita', 'pathochokro')),
  scheduled_date date NOT NULL,
  start_time time,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled')),
  title_bn text NOT NULL,
  note text,
  meeting_link text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT study_circle_sessions_prog_date_uniq UNIQUE (program_type, scheduled_date)
);

CREATE TABLE IF NOT EXISTS public.study_circle_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.study_circle_sessions(id) ON DELETE CASCADE,
  role_name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_circle_role_performers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id uuid NOT NULL REFERENCES public.study_circle_roles(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.member_imports(id) ON DELETE SET NULL,
  performer_name text NOT NULL,
  is_guest boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_circle_parts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.study_circle_sessions(id) ON DELETE CASCADE,
  part_number integer,
  item_type text NOT NULL DEFAULT 'other' CHECK (item_type IN ('song', 'reading', 'prayer', 'other')),
  description text NOT NULL DEFAULT '',
  reference_link text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_circle_part_performers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id uuid NOT NULL REFERENCES public.study_circle_parts(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.member_imports(id) ON DELETE SET NULL,
  performer_name text NOT NULL,
  is_guest boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS study_circle_sessions_date_idx
  ON public.study_circle_sessions (scheduled_date, program_type);
CREATE INDEX IF NOT EXISTS study_circle_roles_session_idx
  ON public.study_circle_roles (session_id, display_order);
CREATE INDEX IF NOT EXISTS study_circle_parts_session_idx
  ON public.study_circle_parts (session_id, display_order);
CREATE INDEX IF NOT EXISTS study_circle_role_performers_role_idx
  ON public.study_circle_role_performers (role_id, display_order);
CREATE INDEX IF NOT EXISTS study_circle_part_performers_part_idx
  ON public.study_circle_part_performers (part_id, display_order);

-- Grants
GRANT SELECT ON public.study_circle_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_circle_sessions TO authenticated;
GRANT ALL ON public.study_circle_sessions TO service_role;

GRANT SELECT ON public.study_circle_roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_circle_roles TO authenticated;
GRANT ALL ON public.study_circle_roles TO service_role;

GRANT SELECT ON public.study_circle_role_performers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_circle_role_performers TO authenticated;
GRANT ALL ON public.study_circle_role_performers TO service_role;

GRANT SELECT ON public.study_circle_parts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_circle_parts TO authenticated;
GRANT ALL ON public.study_circle_parts TO service_role;

GRANT SELECT ON public.study_circle_part_performers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_circle_part_performers TO authenticated;
GRANT ALL ON public.study_circle_part_performers TO service_role;

-- Row Level Security
ALTER TABLE public.study_circle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_circle_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_circle_role_performers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_circle_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_circle_part_performers ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read published sessions and their children
CREATE POLICY "Public read published sessions"
  ON public.study_circle_sessions FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public read roles of published sessions"
  ON public.study_circle_roles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.study_circle_sessions s
    WHERE s.id = session_id AND s.is_published = true
  ));

CREATE POLICY "Public read performers of published roles"
  ON public.study_circle_role_performers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.study_circle_roles r
    JOIN public.study_circle_sessions s ON s.id = r.session_id
    WHERE r.id = role_id AND s.is_published = true
  ));

CREATE POLICY "Public read parts of published sessions"
  ON public.study_circle_parts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.study_circle_sessions s
    WHERE s.id = session_id AND s.is_published = true
  ));

CREATE POLICY "Public read performers of published parts"
  ON public.study_circle_part_performers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.study_circle_parts p
    JOIN public.study_circle_sessions s ON s.id = p.session_id
    WHERE p.id = part_id AND s.is_published = true
  ));

-- Admin: full CRUD
CREATE POLICY "Admin manage sessions"
  ON public.study_circle_sessions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin manage roles"
  ON public.study_circle_roles FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin manage role performers"
  ON public.study_circle_role_performers FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin manage parts"
  ON public.study_circle_parts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin manage part performers"
  ON public.study_circle_part_performers FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Auto-update updated_at on sessions
CREATE TRIGGER update_study_circle_sessions_updated_at
  BEFORE UPDATE ON public.study_circle_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
