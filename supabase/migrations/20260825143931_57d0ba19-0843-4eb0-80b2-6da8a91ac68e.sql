CREATE OR REPLACE FUNCTION public.admin_approve_writer(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _phone text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.profiles
    SET status='approved', approved_at=now(), approved_by=auth.uid(), rejected_reason=NULL
    WHERE user_id=_user_id
    RETURNING phone_e164 INTO _phone;

  -- Un-mark this writer's own blogs as guest submissions now that they have a real profile.
  UPDATE public.blogs
    SET is_guest = false, guest_name = NULL, guest_phone = NULL
    WHERE author_id = _user_id AND is_guest = true;

  -- Claim orphan guest submissions made with the same phone number (guest form, no account yet).
  IF _phone IS NOT NULL AND length(regexp_replace(_phone, '\D', '', 'g')) >= 10 THEN
    UPDATE public.blogs
      SET author_id = _user_id, is_guest = false, guest_name = NULL, guest_phone = NULL
      WHERE author_id IS NULL
        AND is_guest = true
        AND guest_phone IS NOT NULL
        AND right(regexp_replace(guest_phone, '\D', '', 'g'), 10)
            = right(regexp_replace(_phone, '\D', '', 'g'), 10);
  END IF;
END;
$function$;