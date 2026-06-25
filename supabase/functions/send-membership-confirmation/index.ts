import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM = "Hosla & Shraddha <notifications@hosla.in>";

function wrap(inner: string): string {
  return `<div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">${inner}</div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, name, email } = await req.json();

    if (!applicationId || !name || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ message: "Email not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const send = async (to: string[], subject: string, html: string) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({ from: FROM, to, subject, html }),
      });
      if (!res.ok) {
        console.error("Resend error:", await res.text());
      }
    };

    // Confirmation to the applicant
    const subject = "🌿 We've received your Hosla Membership application";
    const html = wrap(`
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0d9668; margin: 0;">Thank you, ${name}! 🌿</h1>
      </div>
      <p>We've successfully received your application for the <strong>Hosla Membership Card</strong>.</p>
      <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="margin: 4px 0;">Our care team will review your details and reach out to you shortly to complete your membership.</p>
      </div>
      <p>If you have any questions in the meantime, simply reply to this email or call us at
        <a href="tel:7811009309" style="color: #0d9668;">7811009309</a>.</p>
      <p>Warm regards,<br/>The Hosla &amp; Shraddha Care Team</p>
      <p style="color: #999; font-size: 13px; margin-top: 32px; text-align: center;">Hosla &amp; Shraddha NGO — Health. Happiness. Companionship.</p>
    `);
    await send([email], subject, html);

    // Notify admins
    const { data: adminEmails } = await supabase
      .from("notification_emails")
      .select("email")
      .eq("notification_type", "membership_applications")
      .eq("is_active", true);

    if (adminEmails?.length) {
      await send(
        adminEmails.map((e: { email: string }) => e.email),
        `🪪 New Hosla Membership Application: ${name}`,
        `
          <h2>New Membership Application</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Application ID:</strong> ${applicationId}</p>
          <p><a href="https://shraddha.hosla.in/admin/dashboard/memberships">View in Dashboard</a></p>
        `
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
