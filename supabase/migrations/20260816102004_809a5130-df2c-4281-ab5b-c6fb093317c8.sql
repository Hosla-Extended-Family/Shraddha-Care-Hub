ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_paid_month date;
ALTER TABLE public.member_imports ADD COLUMN IF NOT EXISTS last_paid_month date;
UPDATE public.profiles
  SET last_paid_month = date_trunc('month', paid_up_until)::date
  WHERE paid_up_until IS NOT NULL AND last_paid_month IS NULL;