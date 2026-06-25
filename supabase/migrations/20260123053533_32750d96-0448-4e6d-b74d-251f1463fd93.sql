-- Create a function to check rate limits across form tables
-- Returns true if the user CAN submit (under limit), false if blocked
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_email TEXT,
  p_table_name TEXT,
  p_max_submissions INTEGER DEFAULT 3,
  p_time_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submission_count INTEGER;
  time_threshold TIMESTAMP WITH TIME ZONE;
BEGIN
  time_threshold := NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  
  -- Count recent submissions based on table
  CASE p_table_name
    WHEN 'donations' THEN
      SELECT COUNT(*) INTO submission_count
      FROM public.donations
      WHERE LOWER(email) = LOWER(p_email)
        AND created_at > time_threshold;
    WHEN 'contact_messages' THEN
      SELECT COUNT(*) INTO submission_count
      FROM public.contact_messages
      WHERE LOWER(email) = LOWER(p_email)
        AND created_at > time_threshold;
    WHEN 'volunteer_applications' THEN
      SELECT COUNT(*) INTO submission_count
      FROM public.volunteer_applications
      WHERE LOWER(email) = LOWER(p_email)
        AND created_at > time_threshold;
    WHEN 'partner_inquiries' THEN
      SELECT COUNT(*) INTO submission_count
      FROM public.partner_inquiries
      WHERE LOWER(email) = LOWER(p_email)
        AND created_at > time_threshold;
    WHEN 'abuse_reports' THEN
      SELECT COUNT(*) INTO submission_count
      FROM public.abuse_reports
      WHERE LOWER(reporter_contact) = LOWER(p_email)
        AND created_at > time_threshold;
    ELSE
      -- Unknown table, allow submission
      RETURN TRUE;
  END CASE;
  
  -- Return true if under limit, false if at/over limit
  RETURN submission_count < p_max_submissions;
END;
$$;

-- Grant execute to anonymous users so rate limit can be checked before submission
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;