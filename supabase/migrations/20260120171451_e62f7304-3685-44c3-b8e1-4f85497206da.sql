
-- Create enum for team member categories
CREATE TYPE public.team_category AS ENUM (
  'president',
  'core',
  'senior_members',
  'advocates',
  'counsellors',
  'volunteers_technical',
  'volunteers_hr',
  'volunteers_marketing',
  'volunteers_social_media',
  'volunteers_design',
  'interns'
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  category team_category NOT NULL,
  photo_url TEXT,
  bio TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Anyone can view active team members
CREATE POLICY "Anyone can view active team members"
ON public.team_members
FOR SELECT
USING (is_active = true);

-- Admins can manage all team members
CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for ordering
CREATE INDEX idx_team_members_category_order ON public.team_members(category, display_order);
