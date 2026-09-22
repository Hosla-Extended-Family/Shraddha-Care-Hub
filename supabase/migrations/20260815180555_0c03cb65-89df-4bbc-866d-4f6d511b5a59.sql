-- Helper role functions
CREATE OR REPLACE FUNCTION public.is_main_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'main_admin');
$$;

-- Any admin-level access (existing 'admin' rows keep working, treated as team admins)
CREATE OR REPLACE FUNCTION public.is_any_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','team_admin','main_admin')
  );
$$;

-- Membership ID generator: first 4 letters of name + last 4 digits of phone
CREATE OR REPLACE FUNCTION public.make_membership_id(_name text, _phone text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT upper(rpad(substring(regexp_replace(coalesce(_name,''), '[^A-Za-z]', '', 'g') from 1 for 4), 4, 'X'))
      || right(lpad(regexp_replace(coalesce(_phone,''), '\D', '', 'g'), 4, '0'), 4);
$$;

-- Profiles: member fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS plan text,
  ADD COLUMN IF NOT EXISTS monthly_fee_amount integer,
  ADD COLUMN IF NOT EXISTS paid_up_until date,
  ADD COLUMN IF NOT EXISTS chapter text,
  ADD COLUMN IF NOT EXISTS member_since date,
  ADD COLUMN IF NOT EXISTS member_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- Ledger
CREATE TABLE IF NOT EXISTS public.membership_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_user_id uuid NOT NULL,
  membership_id text,
  amount_inr integer NOT NULL,
  monthly_fee_amount integer,
  months_covered integer,
  period_start date,
  period_end date,
  source text NOT NULL,
  state text NOT NULL DEFAULT 'pending_approval',
  receiver_name text,
  recorded_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  rejected_reason text,
  paid_on date NOT NULL DEFAULT current_date,
  transaction_ref text,
  screenshot_path text,
  stripe_session_id text,
  receipt_url text,
  settled boolean NOT NULL DEFAULT false,
  settled_at timestamptz,
  settled_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_transactions TO authenticated;
GRANT ALL ON public.membership_transactions TO service_role;
ALTER TABLE public.membership_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read own transactions" ON public.membership_transactions
  FOR SELECT TO authenticated USING (member_user_id = auth.uid() OR public.is_any_admin());
CREATE POLICY "Members report own direct upi" ON public.membership_transactions
  FOR INSERT TO authenticated WITH CHECK (
    (member_user_id = auth.uid() AND source = 'direct_upi' AND state = 'pending_verification')
    OR public.is_any_admin()
  );
CREATE POLICY "Main admins update transactions" ON public.membership_transactions
  FOR UPDATE TO authenticated USING (public.is_main_admin()) WITH CHECK (public.is_main_admin());
CREATE POLICY "Main admins delete transactions" ON public.membership_transactions
  FOR DELETE TO authenticated USING (public.is_main_admin());

CREATE TRIGGER update_membership_transactions_updated_at
  BEFORE UPDATE ON public.membership_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_mtx_member ON public.membership_transactions(member_user_id);
CREATE INDEX IF NOT EXISTS idx_mtx_state ON public.membership_transactions(state);

-- Audit log
CREATE TABLE IF NOT EXISTS public.membership_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text NOT NULL,
  entity text,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.membership_audit_log TO authenticated;
GRANT ALL ON public.membership_audit_log TO service_role;
ALTER TABLE public.membership_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own or all if main admin" ON public.membership_audit_log
  FOR SELECT TO authenticated USING (actor_id = auth.uid() OR public.is_main_admin());
CREATE POLICY "Admins write audit" ON public.membership_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.is_any_admin() AND actor_id = auth.uid());

-- Credential requests
CREATE TABLE IF NOT EXISTS public.credential_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  target_membership_id text,
  requested_by uuid NOT NULL,
  requested_by_name text,
  kind text NOT NULL DEFAULT 'password_reset',
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.credential_requests TO authenticated;
GRANT ALL ON public.credential_requests TO service_role;
ALTER TABLE public.credential_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read credential requests" ON public.credential_requests
  FOR SELECT TO authenticated USING (public.is_any_admin());
CREATE POLICY "Admins raise credential requests" ON public.credential_requests
  FOR INSERT TO authenticated WITH CHECK (public.is_any_admin() AND requested_by = auth.uid());
CREATE POLICY "Main admins review credential requests" ON public.credential_requests
  FOR UPDATE TO authenticated USING (public.is_main_admin()) WITH CHECK (public.is_main_admin());
CREATE TRIGGER update_credential_requests_updated_at
  BEFORE UPDATE ON public.credential_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fee reminders
CREATE TABLE IF NOT EXISTS public.fee_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_user_id uuid NOT NULL,
  membership_id text,
  channel text NOT NULL DEFAULT 'email',
  message text,
  sent_by uuid,
  sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.fee_reminders TO authenticated;
GRANT ALL ON public.fee_reminders TO service_role;
ALTER TABLE public.fee_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read reminders" ON public.fee_reminders
  FOR SELECT TO authenticated USING (public.is_any_admin() OR member_user_id = auth.uid());
CREATE POLICY "Admins send reminders" ON public.fee_reminders
  FOR INSERT TO authenticated WITH CHECK (public.is_any_admin());

-- Member imports staging
CREATE TABLE IF NOT EXISTS public.member_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  name text NOT NULL,
  phone_digits text,
  email text,
  plan text,
  monthly_fee_amount integer,
  paid_up_until date,
  chapter text,
  membership_id text,
  status text NOT NULL DEFAULT 'pending',
  linked_user_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_imports TO authenticated;
GRANT ALL ON public.member_imports TO service_role;
ALTER TABLE public.member_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read imports" ON public.member_imports
  FOR SELECT TO authenticated USING (public.is_any_admin());
CREATE POLICY "Admins prepare imports" ON public.member_imports
  FOR INSERT TO authenticated WITH CHECK (public.is_any_admin());
CREATE POLICY "Admins edit imports" ON public.member_imports
  FOR UPDATE TO authenticated USING (public.is_any_admin()) WITH CHECK (public.is_any_admin());
CREATE POLICY "Main admins delete imports" ON public.member_imports
  FOR DELETE TO authenticated USING (public.is_main_admin());
CREATE TRIGGER update_member_imports_updated_at
  BEFORE UPDATE ON public.member_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Member search for the cash form (admins only)
CREATE OR REPLACE FUNCTION public.search_members(_q text)
RETURNS TABLE(user_id uuid, full_name text, membership_id text, phone_e164 text, plan text, monthly_fee_amount integer, paid_up_until date, member_status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.user_id, p.full_name, p.membership_id, p.phone_e164, p.plan, p.monthly_fee_amount, p.paid_up_until, p.member_status
  FROM public.profiles p
  WHERE public.is_any_admin()
    AND _q IS NOT NULL AND length(trim(_q)) >= 2
    AND (
      p.full_name ILIKE '%' || _q || '%'
      OR p.membership_id ILIKE '%' || _q || '%'
      OR regexp_replace(coalesce(p.phone_e164,''), '\D', '', 'g') LIKE '%' || regexp_replace(_q, '\D', '', 'g') || '%'
    )
  ORDER BY p.full_name
  LIMIT 20;
$$;
REVOKE ALL ON FUNCTION public.search_members(text) FROM anon;

-- Members' own summary is already readable via profiles RLS.
REVOKE ALL ON FUNCTION public.is_main_admin() FROM anon;
REVOKE ALL ON FUNCTION public.is_any_admin() FROM anon;
