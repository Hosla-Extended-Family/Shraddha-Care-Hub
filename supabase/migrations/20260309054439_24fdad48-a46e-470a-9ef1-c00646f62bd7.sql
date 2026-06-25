
-- Create event_registrations table
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  age INTEGER NOT NULL,
  area TEXT NOT NULL,
  medical_concerns TEXT,
  source TEXT NOT NULL DEFAULT 'Other',
  checked_in BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Public can register
CREATE POLICY "Anyone can register for events"
  ON public.event_registrations
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all
CREATE POLICY "Admins can view all registrations"
  ON public.event_registrations
  FOR SELECT
  USING (is_admin());

-- Admins can update (for check-in)
CREATE POLICY "Admins can update registrations"
  ON public.event_registrations
  FOR UPDATE
  USING (is_admin());

-- Admins can delete
CREATE POLICY "Admins can delete registrations"
  ON public.event_registrations
  FOR DELETE
  USING (is_admin());

-- Add updated_at trigger
CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for admin notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
