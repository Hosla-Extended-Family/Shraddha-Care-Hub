import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  LevelFormat,
  PageBreak,
  PageNumber,
  Header,
  Footer,
  BorderStyle,
} from "npm:docx@9.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LayoutMode = "standard" | "compact" | "magazine";
type BlogKind = "story" | "poem" | "recitation" | "essay" | "other";

const KIND_RE = /^\s*<!--\s*kind:(story|poem|recitation|essay|other)\s*-->\s*\n?/i;

function extractKind(text: string): { kind: BlogKind; body: string } {
  const m = (text || "").match(KIND_RE);
  if (!m) return { kind: "story", body: text || "" };
  return { kind: m[1].toLowerCase() as BlogKind, body: text.slice(m[0].length) };
}

// Parse markdown-lite into an array of docx Paragraphs.
// Supports: **bold**, blank lines = paragraph break, single newline = line break within paragraph, "- " line = bullet.
// Poem / recitation kinds are centered and italicized, preserving every line break.
function parseBody(text: string, layout: LayoutMode = "standard"): Paragraph[] {
  const { kind, body } = extractKind(text);
  const paragraphs: Paragraph[] = [];
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let paragraphBuffer: string[] = [];
  const spacing = layout === "compact"
    ? { before: 60, after: 60, line: 280 }
    : { before: 120, after: 120, line: 340 };
  let firstParagraphSeen = false;
  const isVerse = kind === "poem" || kind === "recitation";

  const buildRunsWithBreaks = (linesArr: string[], italic = false): TextRun[] => {
    const runs: TextRun[] = [];
    linesArr.forEach((ln, idx) => {
      if (idx > 0) runs.push(new TextRun({ break: 1, font: "Calibri", size: 24 }));
      runs.push(...parseInlineBold(ln, italic));
    });
    return runs;
  };

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    const linesArr = [...paragraphBuffer];
    paragraphBuffer = [];
    if (linesArr.every((l) => !l.trim())) return;
    const runs = buildRunsWithBreaks(linesArr, isVerse);
    // Magazine layout: enlarge the first letter of the first paragraph (prose only)
    if (!isVerse && layout === "magazine" && !firstParagraphSeen && runs.length > 0) {
      firstParagraphSeen = true;
      const first = runs[0];
      const firstText = (first as any).options?.text ?? "";
      if (firstText.length > 1) {
        const dropCap = new TextRun({ text: firstText[0], size: 56, bold: true, color: "0A8F6B", font: "Calibri" });
        const rest = new TextRun({ text: firstText.slice(1), size: 24, font: "Calibri" });
        runs.splice(0, 1, dropCap, rest);
      }
    }
    paragraphs.push(new Paragraph({
      alignment: isVerse ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
      spacing,
      children: runs,
    }));
  };

  for (const rawLine of lines) {
    // Preserve blank lines as paragraph breaks; otherwise keep the raw line (with leading spaces trimmed) so it stays a line break.
    const line = rawLine.replace(/\s+$/, "");
    if (!line.trim()) { flushParagraph(); continue; }
    const bulletMatch = line.trim().match(/^-\s+(.*)$/);
    if (bulletMatch && !isVerse) {
      flushParagraph();
      paragraphs.push(new Paragraph({
        numbering: { reference: "story-bullets", level: 0 },
        spacing: { before: 40, after: 40 },
        children: parseInlineBold(bulletMatch[1]),
      }));
    } else {
      paragraphBuffer.push(line);
    }
  }
  flushParagraph();
  return paragraphs;
}

function parseInlineBold(input: string, italic = false): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    if (match.index > last) {
      runs.push(new TextRun({ text: input.slice(last, match.index), size: 24, font: "Calibri", italics: italic }));
    }
    runs.push(new TextRun({ text: match[1], bold: true, size: 24, font: "Calibri", italics: italic }));
    last = match.index + match[0].length;
  }
  if (last < input.length) {
    runs.push(new TextRun({ text: input.slice(last), size: 24, font: "Calibri", italics: italic }));
  }
  return runs.length ? runs : [new TextRun({ text: input, size: 24, font: "Calibri", italics: italic })];
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response("Not authenticated", { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response("Not authenticated", { status: 401, headers: corsHeaders });
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) return new Response("Admin access required", { status: 403, headers: corsHeaders });

    const payload = await req.json().catch(() => ({}));
    const {
      newsletterId,
      layout: layoutRaw,
      intro_text,
      title_override,
      blog_overrides,
    } = payload as {
      newsletterId?: string;
      layout?: string;
      intro_text?: string | null;
      title_override?: string | null;
      blog_overrides?: Array<{ blog_id: string; title?: string; body?: string }>;
    };
    if (!newsletterId) {
      return new Response(JSON.stringify({ error: "newsletterId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const layout: LayoutMode =
      layoutRaw === "compact" ? "compact" : layoutRaw === "magazine" ? "magazine" : "standard";
    const overrides = new Map(
      (blog_overrides ?? []).map((o) => [o.blog_id, { title: o.title, body: o.body }])
    );

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: newsletter, error: nlErr } = await service
      .from("newsletters")
      .select("id, title, issue_number")
      .eq("id", newsletterId)
      .maybeSingle();
    if (nlErr || !newsletter) {
      return new Response(JSON.stringify({ error: "Newsletter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const displayTitle = (title_override && title_override.trim()) || newsletter.title;

    const { data: items } = await service
      .from("newsletter_blogs")
      .select("position, blog:blogs(id, title, body, author_id, published_at, language)")
      .eq("newsletter_id", newsletterId)
      .order("position", { ascending: true });

    // Fetch author names
    const authorIds = Array.from(new Set((items ?? []).map((i: any) => i.blog?.author_id).filter(Boolean)));
    const { data: authorProfiles } = authorIds.length
      ? await service.from("profiles").select("user_id, full_name").in("user_id", authorIds)
      : { data: [] as Array<{ user_id: string; full_name: string | null }> };
    const authorMap = new Map((authorProfiles ?? []).map((p: any) => [p.user_id, p.full_name || "Anonymous"]));

    const sections: Paragraph[] = [];

    // Optional editor's intro at the top
    if (intro_text && intro_text.trim()) {
      sections.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: "From the editor", bold: true, size: 30, color: "0A8F6B", font: "Calibri" })],
      }));
      sections.push(...parseBody(intro_text.trim(), layout));
      sections.push(new Paragraph({ children: [new PageBreak()] }));
    }

    (items ?? []).forEach((item: any, idx: number) => {
      const b = item.blog;
      if (!b) return;
      const ov = overrides.get(b.id);
      const title = ov?.title ?? b.title;
      const body = ov?.body ?? b.body ?? "";
      if (idx > 0) sections.push(new Paragraph({ children: [new PageBreak()] }));
      sections.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: title, bold: true, size: layout === "compact" ? 40 : 48, color: "0A8F6B", font: "Calibri" })],
      }));
      sections.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: layout === "compact" ? 480 : 600 },
        children: [
          new TextRun({
            text: `${authorMap.get(b.author_id) || "Anonymous"} · ${formatDate(b.published_at)}`,
            italics: true,
            size: 22,
            color: "6b7280",
            font: "Calibri",
          }),
        ],
      }));
      sections.push(...parseBody(body, layout));
    });

    if (sections.length === 0) {
      sections.push(new Paragraph({ children: [new TextRun({ text: "No stories selected.", font: "Calibri", size: 24 })] }));
    }

    const doc = new Document({
      styles: {
        default: { document: { run: { font: "Calibri", size: 24 } } },
      },
      numbering: {
        config: [
          {
            reference: "story-bullets",
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: "•",
                alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } } },
              },
            ],
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "0A8F6B", space: 4 } },
                  children: [
                    new TextRun({
                      text: newsletter.issue_number
                        ? `${displayTitle} — Issue ${newsletter.issue_number}`
                        : displayTitle,
                      italics: true,
                      size: 20,
                      color: "6b7280",
                      font: "Calibri",
                    }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "Page ", size: 20, color: "6b7280", font: "Calibri" }),
                    new TextRun({ children: [PageNumber.CURRENT], size: 20, color: "6b7280", font: "Calibri" }),
                  ],
                }),
              ],
            }),
          },
          children: sections,
        },
      ],
    });

    const bytes = await Packer.toBuffer(doc);
    const filename = `${displayTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.docx`;

    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("generate-newsletter-docx error:", err);
    return new Response(JSON.stringify({ error: "Failed to generate DOCX" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
