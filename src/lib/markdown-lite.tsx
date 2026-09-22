import { Fragment } from "react";

// Markdown-lite: **bold**, single newline = <br>, blank line = paragraph, "- " = bullet.
// Also supports an optional first-line marker: <!--kind:poem--> etc.

export type BlogKind = "story" | "poem" | "recitation" | "essay" | "other";

export interface RenderedBlock {
  type: "paragraph" | "bullet";
  // Each child line is a list of inline spans; multiple lines = <br>-separated within one block.
  lines: Array<Array<{ text: string; bold?: boolean }>>;
}

const KIND_RE = /^\s*<!--\s*kind:(story|poem|recitation|essay|other)\s*-->\s*\n?/i;

export function extractKind(text: string): { kind: BlogKind; body: string } {
  const m = (text || "").match(KIND_RE);
  if (!m) return { kind: "story", body: text || "" };
  return { kind: m[1].toLowerCase() as BlogKind, body: text.slice(m[0].length) };
}

export function stripKindMarker(text: string): string {
  return (text || "").replace(KIND_RE, "");
}

function parseInline(line: string): Array<{ text: string; bold?: boolean }> {
  const out: Array<{ text: string; bold?: boolean }> = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) out.push({ text: line.slice(last, m.index) });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last) });
  return out.length ? out : [{ text: line }];
}

export function parseMarkdownLite(text: string): RenderedBlock[] {
  const { body } = extractKind(text);
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: RenderedBlock[] = [];
  let paraBuffer: string[] = [];

  const flushPara = () => {
    if (!paraBuffer.length) return;
    const paraLines = paraBuffer.map((l) => parseInline(l));
    paraBuffer = [];
    if (!paraLines.length) return;
    blocks.push({ type: "paragraph", lines: paraLines });
  };

  for (const raw of lines) {
    const line = raw;
    if (!line.trim()) { flushPara(); continue; }
    const b = line.trim().match(/^-\s+(.*)$/);
    if (b) {
      flushPara();
      blocks.push({ type: "bullet", lines: [parseInline(b[1])] });
    } else {
      paraBuffer.push(line);
    }
  }
  flushPara();
  return blocks;
}

function renderLine(parts: Array<{ text: string; bold?: boolean }>) {
  return parts.map((c, j) => (
    <Fragment key={j}>{c.bold ? <strong>{c.text}</strong> : c.text}</Fragment>
  ));
}

export function RenderMarkdownLite({ text, className, kind }: { text: string; className?: string; kind?: BlogKind }) {
  const parsed = extractKind(text);
  const effectiveKind = kind ?? parsed.kind;
  const blocks = parseMarkdownLite(text);
  const bullets: RenderedBlock[] = [];
  const nodes: React.ReactNode[] = [];

  const centered = effectiveKind === "poem" || effectiveKind === "recitation";
  const paraClass = centered
    ? "my-4 leading-relaxed text-center italic whitespace-pre-line font-serif"
    : "my-4 leading-relaxed";

  const flushBullets = (key: string) => {
    if (!bullets.length) return;
    nodes.push(
      <ul key={`ul-${key}`} className="list-disc pl-6 space-y-2 my-4">
        {bullets.map((b, i) => (
          <li key={i}>{renderLine(b.lines[0])}</li>
        ))}
      </ul>
    );
    bullets.length = 0;
  };

  blocks.forEach((block, idx) => {
    if (block.type === "bullet") {
      bullets.push(block);
    } else {
      flushBullets(`b-${idx}`);
      nodes.push(
        <p key={idx} className={paraClass}>
          {block.lines.map((ln, i) => (
            <Fragment key={i}>
              {renderLine(ln)}
              {i < block.lines.length - 1 && <br />}
            </Fragment>
          ))}
        </p>
      );
    }
  });
  flushBullets("last");

  return <div className={className}>{nodes}</div>;
}
