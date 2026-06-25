-- Create enum types for project status and organization
CREATE TYPE public.project_status AS ENUM ('upcoming', 'ongoing', 'completed');
CREATE TYPE public.organization_type AS ENUM ('shraddha', 'hosla', 'both');

-- Create projects_events table
CREATE TABLE public.projects_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status public.project_status NOT NULL DEFAULT 'upcoming',
    resource_link TEXT,
    organization public.organization_type NOT NULL DEFAULT 'shraddha',
    is_published BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT title_length CHECK (char_length(title) <= 200),
    CONSTRAINT description_length CHECK (char_length(description) <= 1000),
    CONSTRAINT resource_link_length CHECK (char_length(resource_link) <= 500)
);

-- Enable Row Level Security
ALTER TABLE public.projects_events ENABLE ROW LEVEL SECURITY;

-- Public can view published upcoming/ongoing events
CREATE POLICY "Anyone can view published events"
ON public.projects_events
FOR SELECT
USING (is_published = true AND status != 'completed');

-- Admins have full access
CREATE POLICY "Admins can manage all events"
ON public.projects_events
FOR ALL
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_projects_events_updated_at
BEFORE UPDATE ON public.projects_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();