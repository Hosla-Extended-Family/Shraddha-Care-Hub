-- Add optional phone number fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT '+91';

-- Update the signup trigger to persist phone/country_code from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, phone_e164, country_code)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      NULLIF(NEW.raw_user_meta_data->>'phone_e164', ''),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'country_code', ''), '+91')
    );
    RETURN NEW;
END;
$function$;