-- 1. Roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'main_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';
