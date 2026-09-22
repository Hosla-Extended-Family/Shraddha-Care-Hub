CREATE TABLE public.sms_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_user_id uuid,
  membership_id text,
  transaction_id uuid,
  phone_digits text,
  recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  purpose text NOT NULL DEFAULT 'payment_receipt',
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_message_id text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sms_log_txn_purpose_idx ON public.sms_log (transaction_id, purpose) WHERE transaction_id IS NOT NULL;
CREATE INDEX sms_log_created_at_idx ON public.sms_log (created_at DESC);

GRANT SELECT ON public.sms_log TO authenticated;
GRANT ALL ON public.sms_log TO service_role;

ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read sms log" ON public.sms_log
  FOR SELECT TO authenticated USING (public.is_any_admin());