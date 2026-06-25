import { supabase } from "@/integrations/supabase/client";

type FormTable = 'donations' | 'contact_messages' | 'volunteer_applications' | 'partner_inquiries' | 'abuse_reports';

interface RateLimitResult {
  allowed: boolean;
  message?: string;
}

/**
 * Check if the user can submit a form based on rate limiting rules
 * Limits: 3 submissions per email per hour
 */
export async function checkRateLimit(
  email: string,
  tableName: FormTable
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_email: email,
      p_table_name: tableName,
      p_max_submissions: 3,
      p_time_window_minutes: 60,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // On error, allow submission (fail open for UX)
      return { allowed: true };
    }

    if (data === false) {
      return {
        allowed: false,
        message: 'You have reached the maximum number of submissions (3 per hour). Please try again later.',
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error('Rate limit check failed:', err);
    // On error, allow submission (fail open for UX)
    return { allowed: true };
  }
}
