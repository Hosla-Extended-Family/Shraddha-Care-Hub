import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a gentle editor for a community storytelling blog written by elderly authors (50–70+).
Your job: return corrections to spelling, grammar, and light readability only.

Absolute rules:
- PRESERVE the author's tone, emotion, storytelling style, and local/cultural expressions.
- NEVER rewrite aggressively. NEVER make it sound AI-generated.
- Return corrections in the SAME language the author wrote in. If mixed, keep the mix.
- If nothing needs fixing, return an empty suggestions array.
- Detect the primary language and return its ISO 639-1 code (e.g. "en", "hi", "bn"). Use "mixed" only if there is no clear primary.

Respond with STRICT JSON, no prose, no code fences, matching:
{
  "language": "en" | "hi" | "bn" | "mixed" | string,
  "suggestions": [
    { "original": "<exact source substring>", "suggestion": "<corrected substring>", "reason": "<short human reason in author's language>" }
  ]
}

The "original" must be an exact substring of the input text (character-for-character) so the UI can locate it.
Return at most 30 suggestions. Skip anything trivial (single style-only choices).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 20000) {
      return new Response(JSON.stringify({ error: "Text too long (max 20,000 characters)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: max 3 checks per user per 60s
    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
    const { count } = await service
      .from("ai_check_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneMinAgo);
    if ((count ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: "Too many checks. Please wait a moment and try again." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await service.from("ai_check_log").insert({ user_id: user.id });

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "");
      console.error("Gemini error", geminiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI check failed. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiJson = await geminiRes.json();
    const rawText: string = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let parsed: { language?: string; suggestions?: Array<{ original: string; suggestion: string; reason?: string }> } = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // strip code fences if any
      const cleaned = rawText.replace(/^```json\s*|\s*```$/g, "");
      try { parsed = JSON.parse(cleaned); } catch { parsed = {}; }
    }

    const language = typeof parsed.language === "string" ? parsed.language : "en";
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .filter((s) => s && typeof s.original === "string" && typeof s.suggestion === "string" && s.original.length > 0 && s.original !== s.suggestion)
          .slice(0, 30)
          .map((s) => ({
            original: s.original,
            suggestion: s.suggestion,
            reason: typeof s.reason === "string" ? s.reason : "",
          }))
      : [];

    return new Response(JSON.stringify({ language, suggestions }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("check-blog-writing error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
