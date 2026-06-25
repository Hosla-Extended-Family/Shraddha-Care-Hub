-- Add length constraints to abuse_reports table
ALTER TABLE public.abuse_reports 
  ADD CONSTRAINT check_victim_name_length CHECK (length(victim_name) <= 200),
  ADD CONSTRAINT check_victim_location_length CHECK (length(victim_location) <= 500),
  ADD CONSTRAINT check_description_length CHECK (length(description) <= 5000),
  ADD CONSTRAINT check_reporter_name_length CHECK (length(reporter_name) <= 200),
  ADD CONSTRAINT check_reporter_contact_length CHECK (length(reporter_contact) <= 100),
  ADD CONSTRAINT check_reporter_relationship_length CHECK (length(reporter_relationship) <= 100);

-- Add length constraints to volunteer_applications table
ALTER TABLE public.volunteer_applications 
  ADD CONSTRAINT check_vol_name_length CHECK (length(name) <= 200),
  ADD CONSTRAINT check_vol_email_length CHECK (length(email) <= 255),
  ADD CONSTRAINT check_vol_phone_length CHECK (length(phone) <= 20),
  ADD CONSTRAINT check_vol_city_length CHECK (length(city) <= 100),
  ADD CONSTRAINT check_vol_motivation_length CHECK (length(motivation) <= 5000);

-- Add length constraints to partner_inquiries table
ALTER TABLE public.partner_inquiries 
  ADD CONSTRAINT check_company_name_length CHECK (length(company_name) <= 200),
  ADD CONSTRAINT check_contact_name_length CHECK (length(contact_name) <= 200),
  ADD CONSTRAINT check_partner_email_length CHECK (length(email) <= 255),
  ADD CONSTRAINT check_partner_phone_length CHECK (length(phone) <= 20),
  ADD CONSTRAINT check_employee_count_length CHECK (length(employee_count) <= 50),
  ADD CONSTRAINT check_partner_message_length CHECK (length(message) <= 5000);