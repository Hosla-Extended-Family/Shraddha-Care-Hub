CREATE TABLE public.membership_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  voter_id text NOT NULL,
  child_contact text NOT NULL,
  address text NOT NULL,
  date_of_birth date NOT NULL,
  blood_group text NOT NULL,
  major_operation text NOT NULL,
  chronic_disease text NOT NULL,
  health_insurance text NOT NULL,
  photo_path text,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.membership_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.membership_applications TO authenticated;
GRANT ALL ON public.membership_applications TO service_role;

ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a membership application"
  ON public.membership_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view membership applications"
  ON public.membership_applications
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update membership applications"
  ON public.membership_applications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete membership applications"
  ON public.membership_applications
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE TRIGGER update_membership_applications_updated_at
  BEFORE UPDATE ON public.membership_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();