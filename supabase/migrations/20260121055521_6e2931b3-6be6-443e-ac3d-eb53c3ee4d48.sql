-- Create partner_inquiries table
CREATE TABLE public.partner_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  employee_count TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit partner inquiry"
ON public.partner_inquiries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all inquiries"
ON public.partner_inquiries
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update inquiries"
ON public.partner_inquiries
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete inquiries"
ON public.partner_inquiries
FOR DELETE
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_partner_inquiries_updated_at
BEFORE UPDATE ON public.partner_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();