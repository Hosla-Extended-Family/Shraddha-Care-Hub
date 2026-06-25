-- Create enum for abuse types
CREATE TYPE public.abuse_type AS ENUM ('physical', 'emotional', 'financial', 'neglect', 'other');

-- Create enum for report status
CREATE TYPE public.report_status AS ENUM ('new', 'investigating', 'resolved', 'archived');

-- Create enum for volunteer application status
CREATE TYPE public.volunteer_status AS ENUM ('pending', 'contacted', 'accepted', 'rejected');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create volunteer_applications table
CREATE TABLE public.volunteer_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    motivation TEXT NOT NULL,
    status volunteer_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create abuse_reports table
CREATE TABLE public.abuse_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Reporter information
    reporter_name TEXT,
    reporter_contact TEXT,
    reporter_relationship TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    -- Victim information
    victim_name TEXT NOT NULL,
    victim_age INTEGER,
    victim_location TEXT NOT NULL,
    -- Abuse details
    abuse_type abuse_type NOT NULL,
    description TEXT NOT NULL,
    -- Status tracking
    status report_status NOT NULL DEFAULT 'new',
    admin_notes TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report_evidence table for uploaded files
CREATE TABLE public.report_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.abuse_reports(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification_emails table for storing team email addresses
CREATE TABLE public.notification_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    notification_type TEXT NOT NULL, -- 'abuse_reports' or 'volunteer_applications'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create success_stories table
CREATE TABLE public.success_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT,
    author_role TEXT, -- 'Senior', 'Family Member', 'Volunteer', etc.
    image_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles (admin only)
CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can manage roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.is_admin());

-- RLS Policies for volunteer_applications
CREATE POLICY "Anyone can submit volunteer application"
    ON public.volunteer_applications FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can view all applications"
    ON public.volunteer_applications FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can update applications"
    ON public.volunteer_applications FOR UPDATE
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can delete applications"
    ON public.volunteer_applications FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- RLS Policies for abuse_reports
CREATE POLICY "Anyone can submit abuse report"
    ON public.abuse_reports FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can view all reports"
    ON public.abuse_reports FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can update reports"
    ON public.abuse_reports FOR UPDATE
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can delete reports"
    ON public.abuse_reports FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- RLS Policies for report_evidence
CREATE POLICY "Anyone can upload evidence"
    ON public.report_evidence FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can view evidence"
    ON public.report_evidence FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can delete evidence"
    ON public.report_evidence FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- RLS Policies for notification_emails (admin only)
CREATE POLICY "Admins can manage notification emails"
    ON public.notification_emails FOR ALL
    TO authenticated
    USING (public.is_admin());

-- RLS Policies for success_stories
CREATE POLICY "Anyone can view published stories"
    ON public.success_stories FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

CREATE POLICY "Admins can manage all stories"
    ON public.success_stories FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_volunteer_applications_updated_at
    BEFORE UPDATE ON public.volunteer_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_abuse_reports_updated_at
    BEFORE UPDATE ON public.abuse_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_success_stories_updated_at
    BEFORE UPDATE ON public.success_stories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for evidence (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('abuse-evidence', 'abuse-evidence', false);

-- Storage policies for abuse-evidence bucket
CREATE POLICY "Anyone can upload evidence files"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'abuse-evidence');

CREATE POLICY "Admins can view evidence files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'abuse-evidence' AND public.is_admin());

CREATE POLICY "Admins can delete evidence files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'abuse-evidence' AND public.is_admin());