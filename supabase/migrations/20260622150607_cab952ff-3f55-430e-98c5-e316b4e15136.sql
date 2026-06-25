CREATE TABLE public.routine_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time,
  title text NOT NULL,
  title_bn text,
  note text,
  facebook_url text,
  youtube_url text,
  meet_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.routine_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routine_sessions TO authenticated;
GRANT ALL ON public.routine_sessions TO service_role;

ALTER TABLE public.routine_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active routine sessions"
  ON public.routine_sessions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage routine sessions"
  ON public.routine_sessions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_routine_sessions_updated_at
  BEFORE UPDATE ON public.routine_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();