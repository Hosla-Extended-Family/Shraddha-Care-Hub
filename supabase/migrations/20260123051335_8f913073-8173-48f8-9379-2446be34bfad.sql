-- Create donations table to track all donation intents
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  pan_card TEXT,
  amount TEXT NOT NULL,
  consent_to_publish BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints for input validation
  CONSTRAINT donations_name_length CHECK (char_length(name) <= 100),
  CONSTRAINT donations_email_length CHECK (char_length(email) <= 255),
  CONSTRAINT donations_phone_length CHECK (char_length(phone) <= 20),
  CONSTRAINT donations_pan_length CHECK (char_length(pan_card) <= 20),
  CONSTRAINT donations_amount_length CHECK (char_length(amount) <= 50)
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a donation record
CREATE POLICY "Anyone can submit donation"
ON public.donations
FOR INSERT
WITH CHECK (true);

-- Only admins can view donations
CREATE POLICY "Admins can view all donations"
ON public.donations
FOR SELECT
USING (is_admin());

-- Only admins can update donations
CREATE POLICY "Admins can update donations"
ON public.donations
FOR UPDATE
USING (is_admin());

-- Only admins can delete donations
CREATE POLICY "Admins can delete donations"
ON public.donations
FOR DELETE
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster email lookups (for grouping donors)
CREATE INDEX idx_donations_email ON public.donations(email);

-- Add index for date-based queries
CREATE INDEX idx_donations_created_at ON public.donations(created_at DESC);