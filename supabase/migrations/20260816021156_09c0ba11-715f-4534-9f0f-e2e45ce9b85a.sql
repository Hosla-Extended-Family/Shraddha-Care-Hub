-- Plan pricing with effective dates
CREATE TABLE public.plan_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_key text NOT NULL,
  monthly_amount integer,
  yearly_amount integer,
  effective_from date NOT NULL DEFAULT current_date,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX plan_prices_lookup ON public.plan_prices (plan_key, effective_from DESC);

GRANT SELECT ON public.plan_prices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_prices TO authenticated;
GRANT ALL ON public.plan_prices TO service_role;
ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plan prices" ON public.plan_prices FOR SELECT USING (true);
CREATE POLICY "Admins manage plan prices" ON public.plan_prices FOR ALL TO authenticated
  USING (public.is_any_admin()) WITH CHECK (public.is_any_admin());
CREATE TRIGGER update_plan_prices_updated_at BEFORE UPDATE ON public.plan_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reusable reminder message templates
CREATE TABLE public.reminder_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  body text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_templates TO authenticated;
GRANT ALL ON public.reminder_templates TO service_role;
ALTER TABLE public.reminder_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage reminder templates" ON public.reminder_templates FOR ALL TO authenticated
  USING (public.is_any_admin()) WITH CHECK (public.is_any_admin());
CREATE TRIGGER update_reminder_templates_updated_at BEFORE UPDATE ON public.reminder_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scheduled bulk reminders
CREATE TABLE public.scheduled_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_ids uuid[] NOT NULL,
  message text,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_count integer,
  skipped_count integer,
  error text,
  created_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX scheduled_reminders_due ON public.scheduled_reminders (status, scheduled_for);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_reminders TO authenticated;
GRANT ALL ON public.scheduled_reminders TO service_role;
ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scheduled reminders" ON public.scheduled_reminders FOR ALL TO authenticated
  USING (public.is_any_admin()) WITH CHECK (public.is_any_admin());
CREATE TRIGGER update_scheduled_reminders_updated_at BEFORE UPDATE ON public.scheduled_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed current pricing so the dropdown has a starting point
INSERT INTO public.plan_prices (plan_key, monthly_amount, yearly_amount, effective_from, note)
VALUES
  ('standard-non-metro', 400, 4000, current_date, 'Initial pricing'),
  ('standard-metro', 500, 5000, current_date, 'Initial pricing'),
  ('premium-non-metro', NULL, NULL, current_date, 'Custom pricing'),
  ('premium-metro', NULL, NULL, current_date, 'Custom pricing');