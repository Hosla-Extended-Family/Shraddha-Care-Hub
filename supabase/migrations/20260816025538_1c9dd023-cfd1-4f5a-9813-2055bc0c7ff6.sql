ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_username text,
  ADD COLUMN IF NOT EXISTS is_console_admin boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_admin_username_key
  ON public.profiles (lower(admin_username)) WHERE admin_username IS NOT NULL;

-- Fresh start: clear every existing admin role. New admin accounts are created
-- from the main-admin console with their own username + password.
DELETE FROM public.user_roles WHERE role IN ('admin','team_admin','main_admin');