-- Create contact_messages table
CREATE TABLE public.contact_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL CHECK (char_length(name) <= 100),
    email TEXT NOT NULL CHECK (char_length(email) <= 255),
    phone TEXT CHECK (char_length(phone) <= 20),
    message TEXT NOT NULL CHECK (char_length(message) <= 2000),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message
CREATE POLICY "Anyone can submit contact message"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Only admins can view messages
CREATE POLICY "Admins can view all messages"
ON public.contact_messages
FOR SELECT
USING (is_admin());

-- Only admins can update messages
CREATE POLICY "Admins can update messages"
ON public.contact_messages
FOR UPDATE
USING (is_admin());

-- Only admins can delete messages
CREATE POLICY "Admins can delete messages"
ON public.contact_messages
FOR DELETE
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();