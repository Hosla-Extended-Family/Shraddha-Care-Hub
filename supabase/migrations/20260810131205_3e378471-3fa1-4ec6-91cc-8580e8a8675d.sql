CREATE TABLE public.active_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_digits text NOT NULL UNIQUE,
  raw_phone text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_members TO authenticated;
GRANT ALL ON public.active_members TO service_role;

ALTER TABLE public.active_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view active members"
  ON public.active_members FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can manage active members"
  ON public.active_members FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_active_members_updated_at
  BEFORE UPDATE ON public.active_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_active_members_phone ON public.active_members (phone_digits);

CREATE OR REPLACE FUNCTION public.is_active_member(_phone text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.active_members
    WHERE _phone IS NOT NULL
      AND length(regexp_replace(_phone, '\D', '', 'g')) >= 10
      AND phone_digits = right(regexp_replace(_phone, '\D', '', 'g'), 10)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_member(text) TO anon, authenticated;