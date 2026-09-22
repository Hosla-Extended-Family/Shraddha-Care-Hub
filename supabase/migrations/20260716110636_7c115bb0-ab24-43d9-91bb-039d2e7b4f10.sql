
-- === 1. Wipe test data (cascades to profiles, blogs, blog_ai_suggestions, user_roles) ===
DELETE FROM auth.users;

-- === 2. Extend profiles with writer approval workflow ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS rejected_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Enforce unique phone (nullable allowed only for edge cases; new signups always supply it)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_e164_key ON public.profiles(phone_e164) WHERE phone_e164 IS NOT NULL;

-- === 3. Admin can view all profiles (needed for Writers admin page & badges) ===
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- === 4. Helper: is the signed-in user an approved writer? ===
CREATE OR REPLACE FUNCTION public.is_approved_writer(_uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND status = 'approved'
  );
$$;

-- === 5. Tighten blogs author policies: require approved writer ===
DROP POLICY IF EXISTS "Authors can create own blogs" ON public.blogs;
CREATE POLICY "Authors can create own blogs" ON public.blogs
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND status = ANY (ARRAY['draft','submitted'])
    AND public.is_approved_writer(auth.uid())
  );

DROP POLICY IF EXISTS "Authors can update own editable blogs" ON public.blogs;
CREATE POLICY "Authors can update own editable blogs" ON public.blogs
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    AND status = ANY (ARRAY['draft','submitted','needs_changes'])
    AND public.is_approved_writer(auth.uid())
  )
  WITH CHECK (
    author_id = auth.uid()
    AND status = ANY (ARRAY['draft','submitted','needs_changes'])
  );

-- === 6. Update signup trigger to store phone + start as pending ===
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- First ever signup becomes admin + approved automatically (bootstrap)
  SELECT COUNT(*) = 0 INTO is_first_user FROM auth.users WHERE id <> NEW.id;

  INSERT INTO public.profiles (user_id, email, full_name, phone_e164, country_code, status, approved_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NULLIF(NEW.raw_user_meta_data->>'phone_e164', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'country_code',''), '+91'),
    CASE WHEN is_first_user THEN 'approved' ELSE 'pending' END,
    CASE WHEN is_first_user THEN now() ELSE NULL END
  );

  IF is_first_user THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- === 7. Admin RPCs to approve / reject writers ===
CREATE OR REPLACE FUNCTION public.admin_approve_writer(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.profiles
    SET status='approved', approved_at=now(), approved_by=auth.uid(), rejected_reason=NULL
    WHERE user_id=_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_writer(_user_id UUID, _reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.profiles
    SET status='rejected', rejected_reason=_reason, approved_at=NULL, approved_by=auth.uid()
    WHERE user_id=_user_id;
END;
$$;

-- === 8. Public phone-availability check for signup ===
CREATE OR REPLACE FUNCTION public.is_phone_available(_phone TEXT)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT NOT EXISTS(SELECT 1 FROM public.profiles WHERE phone_e164 = _phone);
$$;

GRANT EXECUTE ON FUNCTION public.is_phone_available(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved_writer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_writer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_writer(UUID, TEXT) TO authenticated;
