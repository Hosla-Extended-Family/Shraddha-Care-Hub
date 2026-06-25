import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, reportId, applicationId, inquiryId, email, name, companyName } = await req.json();
    
    // Validate required fields
    const validTypes = ["abuse_report", "volunteer_application", "partner_inquiry"];
    if (!type || !validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: "Invalid notification type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(JSON.stringify({ message: "Email notifications not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the report/application/inquiry exists and was recently created (within 5 minutes)
    // This prevents spam attacks by ensuring the function is only called for real submissions
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    if (type === "abuse_report" && reportId) {
      const { data: report, error: reportError } = await supabase
        .from("abuse_reports")
        .select("id, created_at")
        .eq("id", reportId)
        .gte("created_at", fiveMinutesAgo)
        .single();
      
      if (reportError || !report) {
        console.log("Report not found or too old:", reportId);
        return new Response(JSON.stringify({ error: "Invalid or expired report" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (type === "volunteer_application" && applicationId) {
      const { data: application, error: appError } = await supabase
        .from("volunteer_applications")
        .select("id, created_at")
        .eq("id", applicationId)
        .gte("created_at", fiveMinutesAgo)
        .single();
      
      if (appError || !application) {
        console.log("Application not found or too old:", applicationId);
        return new Response(JSON.stringify({ error: "Invalid or expired application" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (type === "partner_inquiry" && inquiryId) {
      const { data: inquiry, error: inquiryError } = await supabase
        .from("partner_inquiries")
        .select("id, created_at")
        .eq("id", inquiryId)
        .gte("created_at", fiveMinutesAgo)
        .single();
      
      if (inquiryError || !inquiry) {
        console.log("Inquiry not found or too old:", inquiryId);
        return new Response(JSON.stringify({ error: "Invalid or expired inquiry" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Missing report, application, or inquiry ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get notification emails based on type
    let notificationType = "";
    if (type === "abuse_report") {
      notificationType = "abuse_reports";
    } else if (type === "volunteer_application") {
      notificationType = "volunteer_applications";
    } else if (type === "partner_inquiry") {
      notificationType = "partner_inquiries";
    }

    const { data: emails } = await supabase
      .from("notification_emails")
      .select("email")
      .eq("notification_type", notificationType)
      .eq("is_active", true);

    if (!emails || emails.length === 0) {
      return new Response(JSON.stringify({ message: "No notification emails configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipientEmails = emails.map(e => e.email);
    
    let subject = "";
    let html = "";

    if (type === "abuse_report") {
      subject = "🚨 New Abuse Report Submitted - Shraddha";
      html = `
        <h1>New Abuse Report</h1>
        <p>A new abuse report has been submitted through the Shraddha website.</p>
        <p><strong>Report ID:</strong> ${reportId}</p>
        <p>Please log in to the admin dashboard to review the full details.</p>
        <p><a href="https://shraddha.hosla.in/admin/dashboard/reports">View Report</a></p>
      `;
    } else if (type === "volunteer_application") {
      subject = "🙋 New Volunteer Application - Shraddha";
      html = `
        <h1>New Volunteer Application</h1>
        <p>A new volunteer application has been received!</p>
        <p><strong>Name:</strong> ${name || "Not provided"}</p>
        <p><strong>Email:</strong> ${email || "Not provided"}</p>
        <p>Please log in to the admin dashboard to review the full application.</p>
        <p><a href="https://shraddha.hosla.in/admin/dashboard/volunteers">View Application</a></p>
      `;
    } else if (type === "partner_inquiry") {
      subject = "🏢 New Corporate Partnership Inquiry - Shraddha";
      html = `
        <h1>New Corporate Partnership Inquiry</h1>
        <p>A new corporate partnership inquiry has been received!</p>
        <p><strong>Company:</strong> ${companyName || "Not provided"}</p>
        <p><strong>Contact Person:</strong> ${name || "Not provided"}</p>
        <p><strong>Email:</strong> ${email || "Not provided"}</p>
        <p>Please log in to the admin dashboard to review the full inquiry and follow up.</p>
        <p><a href="https://shraddha.hosla.in/admin/dashboard">View Dashboard</a></p>
      `;
    }

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Shraddha <notifications@hosla.in>",
        to: recipientEmails,
        subject,
        html,
      }),
    });

    const data = await res.json();
    console.log("Email sent:", data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    // Return generic error message to prevent information leakage
    return new Response(JSON.stringify({ error: "Failed to send notification" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
