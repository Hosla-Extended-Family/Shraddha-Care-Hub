-- When an admin approves a writer, flip any guest-tagged blogs they submitted
-- (via the guest form with a PIN before approval) into normal writer blogs so
-- the author profile shows up correctly on the blog page.
CREATE OR REPLACE FUNCTION public.admin_approve_writer(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.profiles
    SET status='approved', approved_at=now(), approved_by=auth.uid(), rejected_reason=NULL
    WHERE user_id=_user_id;
  -- Un-mark this writer's own blogs as guest submissions now that they have a real profile.
  UPDATE public.blogs
    SET is_guest = false, guest_name = NULL, guest_phone = NULL
    WHERE author_id = _user_id AND is_guest = true;
END;
$function$;