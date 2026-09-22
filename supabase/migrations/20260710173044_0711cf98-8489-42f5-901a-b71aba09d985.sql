ALTER TABLE public.partner_inquiries
  ADD COLUMN IF NOT EXISTS organization_type text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS collaboration_area text,
  ADD COLUMN IF NOT EXISTS preferred_contact_time text;