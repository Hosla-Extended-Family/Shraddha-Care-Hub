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
    const { applicationId, status } = await req.json();

    if (!applicationId || !status) {
      return new Response(JSON.stringify({ error: "Missing applicationId or status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return new Response(JSON.stringify({ error: "Status must be 'accepted' or 'rejected'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(JSON.stringify({ message: "Email not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the request comes from an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is an admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if caller is admin
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: claimsData.claims.sub,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch volunteer application details
    const { data: application, error: appError } = await adminClient
      .from("volunteer_applications")
      .select("name, email, city, status")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subject = "";
    let html = "";

    if (status === "accepted") {
      subject = "🎉 Welcome to Shraddha Welfare Association!";
      html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4A3F8C; margin: 0;">Shraddha Welfare Association</h1>
          </div>
          <h2 style="color: #2D7D46;">Congratulations, ${application.name}! 🎉</h2>
          <p>We are delighted to inform you that your volunteer application has been <strong style="color: #2D7D46;">accepted</strong>!</p>
          <p>Thank you for your willingness to make a difference in the lives of elderly citizens. Your compassion and dedication are truly appreciated.</p>
          <div style="background: #f0fdf4; border-left: 4px solid #2D7D46; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>What's Next?</strong></p>
            <ul style="margin: 10px 0;">
              <li>Our team will reach out to you shortly with onboarding details</li>
              <li>You'll receive information about upcoming events and activities</li>
              <li>We'll help you find the best way to contribute based on your skills and interests</li>
            </ul>
          </div>
          <p>If you have any questions, feel free to reach out to us at <a href="mailto:shraddhawelfareassociation@gmail.com" style="color: #4A3F8C;">shraddhawelfareassociation@gmail.com</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">
            Shraddha Welfare Association, Bankura, West Bengal<br/>
            <a href="https://shraddha.hosla.in" style="color: #4A3F8C;">shraddha.hosla.in</a>
          </p>
        </div>
      `;
    } else {
      subject = "Update on Your Volunteer Application — Shraddha Welfare Association";
      html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4A3F8C; margin: 0;">Shraddha Welfare Association</h1>
          </div>
          <h2 style="color: #333;">Dear ${application.name},</h2>
          <p>Thank you for your interest in volunteering with Shraddha Welfare Association. We truly appreciate your willingness to help.</p>
          <p>After careful consideration, we regret to inform you that we are unable to onboard you as a volunteer at this time. This does not reflect on your abilities or dedication — sometimes, the timing or current needs of our programs don't align.</p>
          <div style="background: #fef3cd; border-left: 4px solid #f0ad4e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>You're Always Welcome</strong></p>
            <p style="margin: 10px 0 0;">We encourage you to apply again in the future, or connect with us on social media to stay updated on upcoming opportunities.</p>
          </div>
          <p>If you have any questions, please don't hesitate to contact us at <a href="mailto:shraddhawelfareassociation@gmail.com" style="color: #4A3F8C;">shraddhawelfareassociation@gmail.com</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">
            Shraddha Welfare Association, Bankura, West Bengal<br/>
            <a href="https://shraddha.hosla.in" style="color: #4A3F8C;">shraddha.hosla.in</a>
          </p>
        </div>
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
        to: [application.email],
        subject,
        html,
      }),
    });

    const data = await res.json();
    console.log("Volunteer status email sent:", data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending volunteer status email:", error);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
