import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DonationEmailRequest {
  name: string;
  email: string;
  phone: string;
  panCard?: string;
  amount: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, panCard, amount }: DonationEmailRequest = await req.json();

    // Validate required fields
    if (!name || !email || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const currentDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4A6741 0%, #6B8E23 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Generosity! 🙏</h1>
        </div>
        
        <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="font-size: 16px;">Dear <strong>${name}</strong>,</p>
          
          <p style="font-size: 16px;">We are deeply grateful for your intention to donate <strong>₹${amount}</strong> to Shraddha Welfare Association. Your contribution helps us continue our mission of protecting and supporting senior citizens across India.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #4A6741;">Donation Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Name:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Phone:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${phone}</td>
              </tr>
              ${panCard ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>PAN Card:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${panCard}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Amount:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong style="color: #4A6741;">₹${amount}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Date:</strong></td>
                <td style="padding: 8px 0;">${currentDate}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fff8e1; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
            <h4 style="margin-top: 0; color: #856404;">Complete Your Donation</h4>
            <p style="margin-bottom: 10px;">Please complete your donation using one of the following methods:</p>
            <p style="margin: 5px 0;"><strong>UPI ID:</strong> shraddhango@ucobank</p>
            <p style="margin: 5px 0;"><strong>Account Name:</strong> SHRADDHA WELFARE ASSOCIATION</p>
            <p style="margin: 5px 0;"><strong>Account No:</strong> 22890110076118</p>
            <p style="margin: 5px 0;"><strong>IFSC Code:</strong> UCBA0002289</p>
            <p style="margin: 5px 0;"><strong>Bank:</strong> UCO Bank</p>
          </div>
          
          ${panCard ? `
          <p style="font-size: 14px; color: #666;"><em>Note: Your 80G tax exemption certificate will be sent to your email after your donation is confirmed.</em></p>
          ` : ''}
          
          <p style="font-size: 16px;">If you have any questions, please don't hesitate to reach out to us at <a href="mailto:shraddhawelfareassociation@gmail.com" style="color: #4A6741;">shraddhawelfareassociation@gmail.com</a> or call us at <a href="tel:7811009309" style="color: #4A6741;">7811009309</a>.</p>
          
          <p style="font-size: 16px;">With heartfelt gratitude,<br><strong>Shraddha Welfare Association</strong></p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
          <p style="margin: 0;">Shraddha Welfare Association | Bishnupur, West Bengal</p>
          <p style="margin: 5px 0;">Follow us on <a href="https://www.facebook.com/shraddhawelfareassociation" style="color: #4A6741;">Facebook</a> | Visit <a href="https://shraddha.hosla.in" style="color: #4A6741;">shraddha.hosla.in</a></p>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Shraddha Welfare Association <notifications@hosla.in>",
        to: [email],
        subject: "Thank You for Your Donation - Shraddha Welfare Association",
        html: emailHtml,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Donation confirmation email sent to donor:", data);

    // Send admin notification
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get admin notification emails for donations
      const { data: adminEmails } = await supabase
        .from("notification_emails")
        .select("email")
        .eq("notification_type", "donations")
        .eq("is_active", true);

      if (adminEmails && adminEmails.length > 0) {
        const adminEmailList = adminEmails.map(e => e.email);
        
        const adminEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4A6741 0%, #6B8E23 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">💰 New Donation Intent Received!</h1>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
              <p style="font-size: 16px;">A potential donor has submitted their details on the donation page.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #4A6741;">Donor Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Name:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Email:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><a href="mailto:${email}">${email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Phone:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><a href="tel:${phone}">${phone}</a></td>
                  </tr>
                  ${panCard ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>PAN Card:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${panCard}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Intended Amount:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong style="color: #4A6741; font-size: 18px;">₹${amount}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Date:</strong></td>
                    <td style="padding: 8px 0;">${currentDate}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                <p style="margin: 0; font-size: 14px;"><strong>Next Steps:</strong> Please verify if the donation is received via UPI or bank transfer and follow up with the donor if needed.</p>
              </div>
            </div>
            
            <div style="background: #f5f5f5; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
              <p style="margin: 0;">Shraddha Welfare Association - Admin Notification</p>
            </div>
          </body>
          </html>
        `;

        const adminRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Shraddha Welfare Association <notifications@hosla.in>",
            to: adminEmailList,
            subject: `💰 New Donation Intent: ₹${amount} from ${name}`,
            html: adminEmailHtml,
          }),
        });

        const adminData = await adminRes.json();
        console.log("Admin notification sent:", adminData);
      } else {
        console.log("No admin emails configured for donations");
      }
    } catch (adminError) {
      console.error("Error sending admin notification:", adminError);
      // Don't fail the whole request if admin notification fails
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-donation-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send confirmation" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
