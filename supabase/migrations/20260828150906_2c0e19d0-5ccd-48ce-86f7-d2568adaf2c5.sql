ALTER TABLE public.membership_transactions
  ADD COLUMN IF NOT EXISTS credit_used_inr integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_credit_inr integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credit_balance_inr integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS membership_transactions_created_at_idx
  ON public.membership_transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS membership_transactions_member_created_idx
  ON public.membership_transactions (member_user_id, created_at DESC);