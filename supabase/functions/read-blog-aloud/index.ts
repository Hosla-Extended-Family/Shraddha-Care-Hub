import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice configuration per script/language.
// English text → Anisha (Conversation, en-IN)
// Bengali text → Debarati (Conversational, bn-IN)
const VOICES = {
  en: { voiceId: "Anisha", style: "Conversation",   locale: "en-IN" },
  bn: { voiceId: "Debarati", style: "Conversational", locale: "bn-IN" },
} as const;

type Lang = keyof typeof VOICES;

// Classify a chunk of text by dominant script. Bengali Unicode block: U+0980–U+09FF.
function classify(text: string): Lang {
  let bn = 0, en = 0;
  for (let i = 0; i < text.length; i++) {
    const cc = text.charCodeAt(i);
    if (cc >= 0x0980 && cc <= 0x09FF) bn++;
    else if ((cc >= 0x41 && cc <= 0x5A) || (cc >= 0x61 && cc <= 0x7A)) en++;
  }
  // Prefer Bengali when there's any meaningful Bengali content — English
  // proper nouns embedded in Bengali sentences read well from Debarati and
  // avoid a jarring voice flip for a single word.
  if (bn > 0 && bn * 3 >= en) return "bn";
  return en > 0 ? "en" : "bn";
}

// Split into sentence-ish chunks, then coalesce consecutive same-language
// chunks into single Murf requests. This minimises API calls (credits) while
// still switching voice when the script actually changes for a full sentence.
function segmentByLanguage(text: string): Array<{ lang: Lang; text: string }> {
  const parts = text
    .split(/([^\n।.!?]+[।.!?]+|\n+)/g)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return [];

  const runs: Array<{ lang: Lang; text: string }> = [];
  for (const p of parts) {
    const lang = classify(p);
    const prev = runs[runs.length - 1];
    if (prev && prev.lang === lang) prev.text += " " + p;
    else runs.push({ lang, text: p });
  }
  // Merge very short runs (< 12 chars, e.g. an isolated "OK.") into neighbour
  // to avoid a jarring one-word voice switch and an extra billable call.
  const merged: typeof runs = [];
  for (const r of runs) {
    const last = merged[merged.length - 1];
    if (last && r.text.length < 12) { last.text += " " + r.text; continue; }
    merged.push(r);
  }
  return merged;
}

// Falcon max ~3000 chars per request. Split long same-language runs on
// sentence boundaries so no single call exceeds the limit.
function chunkForApi(text: string, max = 2800): string[] {
  if (text.length <= max) return [text];
  const out: string[] = [];
  let cur = "";
  for (const s of text.split(/(?<=[।.!?])\s+/)) {
    if ((cur + " " + s).length > max) {
      if (cur) out.push(cur);
      cur = s;
    } else {
      cur = cur ? cur + " " + s : s;
    }
  }
  if (cur) out.push(cur);
  return out;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function synthesize(
  murfKey: string,
  segment: { lang: Lang; text: string },
): Promise<Uint8Array> {
  const voice = VOICES[segment.lang];
  const body = JSON.stringify({
    voiceId: voice.voiceId,
    style: voice.style,
    locale: voice.locale,
    text: segment.text,
    model: "FALCON",
    format: "MP3",
    sampleRate: 24000,
    channelType: "MONO",
  });

  // Retry on 429 (concurrency) with exponential backoff. Murf's free/basic
  // plans allow ~1 concurrent request, so callers serialize; this backoff
  // handles transient overlap with other in-flight tenants.
  let lastErr = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch("https://global.api.murf.ai/v1/speech/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": murfKey },
      body,
    });
    if (res.ok) return new Uint8Array(await res.arrayBuffer());
    const errText = await res.text().catch(() => "");
    lastErr = `Murf ${res.status} (${voice.voiceId}/${voice.locale}): ${errText}`;
    if (res.status !== 429) throw new Error(lastErr);
    await sleep(800 * Math.pow(2, attempt)); // 0.8s, 1.6s, 3.2s, 6.4s, 12.8s
  }
  throw new Error(lastErr || "Murf synthesis failed");
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { blogId } = await req.json().catch(() => ({}));
    if (!blogId || typeof blogId !== "string") {
      return new Response(JSON.stringify({ error: "blogId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: blog, error } = await supabase
      .from("blogs")
      .select("id, title, body, language, status, content_hash")
      .eq("id", blogId)
      .maybeSingle();

    if (error || !blog) {
      return new Response(JSON.stringify({ error: "Blog not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (blog.status !== "published") {
      return new Response(JSON.stringify({ error: "Blog is not published" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip markdown-lite tokens for cleaner TTS.
    const cleanText = `${blog.title}. ${blog.body}`
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/^-\s+/gm, "")
      .replace(/#+\s*/g, "")
      .trim();
    if (!cleanText) {
      return new Response(JSON.stringify({ error: "Blog is empty" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache key covers the actual content + voice strategy version.
    const cacheKey = `v2|${cleanText}`;
    const hash = await sha256Hex(cacheKey);
    const objectPath = `${blogId}/${hash}.mp3`;

    // Cache hit → signed URL, no API call, no credit spend.
    const { data: existing } = await supabase.storage
      .from("blog-audio").list(blogId, { limit: 100 });
    if (existing?.some((f) => f.name === `${hash}.mp3`)) {
      const { data: signed } = await supabase.storage
        .from("blog-audio").createSignedUrl(objectPath, 60 * 60 * 24);
      if (signed?.signedUrl) {
        return new Response(JSON.stringify({ url: signed.signedUrl, cached: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const murfKey = Deno.env.get("MURF_API_KEY");
    if (!murfKey) {
      return new Response(JSON.stringify({ error: "TTS service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Segment by script → one Murf call per language run (chunked if huge).
    // MP3 frames concatenate byte-wise at the same sample rate/channel, so we
    // stitch runs into one file for a seamless play.
    const runs = segmentByLanguage(cleanText);
    const jobs: Array<{ lang: Lang; text: string }> = [];
    for (const r of runs) {
      for (const c of chunkForApi(r.text)) jobs.push({ lang: r.lang, text: c });
    }

    // Serialize calls — Murf plan enforces a strict concurrency cap and
    // parallel calls come back as 429. Sequential + retry is reliable and
    // still fast for typical blog lengths (usually 1–3 segments).
    const buffers: Uint8Array[] = [];
    for (const j of jobs) buffers.push(await synthesize(murfKey, j));
    const combined = concatBytes(buffers);

    await supabase.storage.from("blog-audio").upload(objectPath, combined, {
      contentType: "audio/mpeg", upsert: true,
    });

    if (blog.content_hash !== hash) {
      await supabase.from("blogs").update({ content_hash: hash }).eq("id", blogId);
    }

    const { data: signed } = await supabase.storage
      .from("blog-audio").createSignedUrl(objectPath, 60 * 60 * 24);

    return new Response(JSON.stringify({
      url: signed?.signedUrl, cached: false, segments: jobs.length,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("read-blog-aloud error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Read-aloud unavailable right now. Please try again later." }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
