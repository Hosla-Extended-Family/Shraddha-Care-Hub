import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventDetails {
  id: string;
  title: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  contact_phone: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function timeLabel(ev: EventDetails): string {
  return [ev.start_time, ev.end_time].filter(Boolean).join(" – ");
}

function detailsBlock(ev: EventDetails): string {
  const dateStr = formatDate(ev.event_date);
  const time = timeLabel(ev);
  const venue = [ev.venue_name, ev.venue_address].filter(Boolean).join(", ");
  return `
    <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0;">
      ${dateStr ? `<p style="margin: 4px 0;"><strong>📅 Date:</strong> ${dateStr}</p>` : ""}
      ${time ? `<p style="margin: 4px 0;"><strong>🕘 Time:</strong> ${time}</p>` : ""}
      ${venue ? `<p style="margin: 4px 0;"><strong>📍 Venue:</strong> ${venue}</p>` : ""}
    </div>`;
}

function footer(ev: EventDetails): string {
  const phone = ev.contact_phone ? ev.contact_phone.replace(/\s/g, "") : "";
  return `
    ${ev.contact_phone ? `<p style="margin-top: 24px; color: #666;">Need help? Call us at <a href="tel:${phone}" style="color: #0d9668;">${ev.contact_phone}</a></p>` : ""}
    <p style="color: #999; font-size: 13px; margin-top: 32px; text-align: center;">Hosla & Shraddha NGO — Caring for our Elders</p>`;
}

function wrap(inner: string): string {
  return `<div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">${inner}</div>`;
}

const FROM = "Hosla & Shraddha <notifications@hosla.in>";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, registrationId, eventId, name, email } = await req.json();

    const validTypes = [
      "registration_confirmation",
      "event_reminder",
      "thank_you_attended",
      "missed_event_followup",
    ];
    if (!type || !validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!eventId) {
      return new Response(JSON.stringify({ error: "eventId is required" }), {
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

    // Load event details
    const { data: ev, error: evError } = await supabase
      .from("registration_events")
      .select("id, title, event_date, start_time, end_time, venue_name, venue_address, contact_phone")
      .eq("id", eventId)
      .maybeSingle();

    if (evError || !ev) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const event = ev as EventDetails;

    const send = async (to: string[], subject: string, html: string) => {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
        body: JSON.stringify({ from: FROM, to, subject, html }),
      });
    };

    if (type === "registration_confirmation") {
      const subject = `🌿 Registration Confirmed — ${event.title}`;
      const html = wrap(`
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0d9668; margin: 0;">Thank you for registering, ${name}! 🌿</h1>
        </div>
        <p>We are excited to have you at the <strong>${event.title}</strong>.</p>
        ${detailsBlock(event)}
        <p>Your health and happiness are our priority. We will send a reminder before the event.</p>
        ${footer(event)}
      `);
      await send([email], subject, html);

      // Notify admins
      const { data: adminEmails } = await supabase
        .from("notification_emails")
        .select("email")
        .eq("notification_type", "event_registrations")
        .eq("is_active", true);

      if (adminEmails?.length) {
        await send(
          adminEmails.map((e: { email: string }) => e.email),
          `📋 New Event Registration: ${name}`,
          `
            <h2>New Registration for ${event.title}</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Registration ID:</strong> ${registrationId}</p>
            <p><a href="https://shraddha.hosla.in/admin/dashboard/registrations">View in Dashboard</a></p>
          `
        );
      }
    } else if (type === "event_reminder") {
      const { data: regs } = await supabase
        .from("event_registrations")
        .select("email, full_name")
        .eq("event_id", eventId);

      if (regs?.length) {
        for (const reg of regs) {
          await send(
            [reg.email],
            `🔔 Reminder: ${event.title}`,
            wrap(`
              <h1 style="color: #0d9668;">Hi ${reg.full_name}, see you soon! 🌿</h1>
              <p>Just a friendly reminder — the <strong>${event.title}</strong> is coming up!</p>
              ${detailsBlock(event)}
              <p>We look forward to seeing you there. Bring your smile and your stories!</p>
              ${footer(event)}
            `)
          );
        }
      }
    } else if (type === "thank_you_attended") {
      const { data: attended } = await supabase
        .from("event_registrations")
        .select("email, full_name")
        .eq("event_id", eventId)
        .eq("checked_in", true);

      if (attended?.length) {
        for (const reg of attended) {
          await send(
            [reg.email],
            `🙏 Thank You for Attending ${event.title}!`,
            wrap(`
              <h1 style="color: #0d9668;">Thank you, ${reg.full_name}! 🌿</h1>
              <p>It was wonderful having you at the <strong>${event.title}</strong>. We hope you had a great time!</p>
              <p>Your presence made the event truly special. Stay connected with us for more such events.</p>
              <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0;">🌐 Visit us: <a href="https://shraddha.hosla.in" style="color: #0d9668;">shraddha.hosla.in</a></p>
                <p style="margin: 4px 0;">📱 Follow us on social media for updates</p>
              </div>
              ${footer(event)}
            `)
          );
        }
      }
    } else if (type === "missed_event_followup") {
      const { data: missed } = await supabase
        .from("event_registrations")
        .select("email, full_name")
        .eq("event_id", eventId)
        .eq("checked_in", false);

      if (missed?.length) {
        for (const reg of missed) {
          await send(
            [reg.email],
            `💚 We Missed You at ${event.title}!`,
            wrap(`
              <h1 style="color: #0d9668;">We missed you, ${reg.full_name}! 💚</h1>
              <p>We noticed you couldn't make it to the <strong>${event.title}</strong>, and we truly missed your presence.</p>
              <p>Don't worry — we have exciting events coming up! Stay tuned and connected so you don't miss the next one.</p>
              <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0;">🌐 Check upcoming events: <a href="https://shraddha.hosla.in/register" style="color: #0d9668;">shraddha.hosla.in/register</a></p>
                <p style="margin: 4px 0;">📱 Follow us on social media for updates</p>
              </div>
              <p>We'd love to see you at our next gathering! 🌿</p>
              ${footer(event)}
            `)
          );
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
