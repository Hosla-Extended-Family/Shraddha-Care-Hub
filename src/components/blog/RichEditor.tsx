import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

// Convert markdown-lite (**bold**, single \n = <br>, blank line = <p>, "- " = <ul><li>) to HTML for the editor.
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inlineToHtml(s: string) {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
export function mdToHtml(md: string): string {
  const lines = (md || "").replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paraLines: string[] = [];
  let bulletLines: string[] = [];
  const flushList = () => {
    if (!bulletLines.length) return;
    html.push("<ul>" + bulletLines.map((l) => `<li>${inlineToHtml(l)}</li>`).join("") + "</ul>");
    bulletLines = [];
  };
  const flushPara = () => {
    if (!paraLines.length) return;
    html.push("<p>" + paraLines.map((l) => inlineToHtml(l)).join("<br>") + "</p>");
    paraLines = [];
  };
  for (const raw of lines) {
    if (!raw.trim()) { flushPara(); flushList(); continue; }
    const bm = raw.trim().match(/^-\s+(.*)$/);
    if (bm) { flushPara(); bulletLines.push(bm[1]); }
    else { flushList(); paraLines.push(raw); }
  }
  flushPara(); flushList();
  return html.join("") || "<p><br></p>";
}

// Convert the editor's HTML back into markdown-lite text.
export function htmlToMd(root: HTMLElement): string {
  const walk = (nodes: NodeListOf<ChildNode>): string => {
    let out = "";
    nodes.forEach((n) => {
      if (n.nodeType === 3) { out += n.textContent ?? ""; return; }
      const el = n as HTMLElement;
      const tag = el.tagName;
      if (tag === "BR") { out += "\n"; return; }
      if (tag === "STRONG" || tag === "B") {
        const inner = walk(el.childNodes).trim();
        if (inner) out += `**${inner}**`;
        return;
      }
      if (tag === "UL" || tag === "OL") {
        const items = Array.from(el.children).filter((c) => (c as HTMLElement).tagName === "LI") as HTMLElement[];
        items.forEach((li) => {
          const inner = walk(li.childNodes).replace(/\n+$/, "").trim();
          out += (out && !out.endsWith("\n") ? "\n" : "") + "- " + inner + "\n";
        });
        return;
      }
      if (tag === "LI") { out += walk(el.childNodes); return; }
      if (tag === "P" || tag === "DIV") {
        const inner = walk(el.childNodes);
        if (out && !out.endsWith("\n\n")) out += out.endsWith("\n") ? "\n" : "\n\n";
        out += inner;
        if (!out.endsWith("\n")) out += "\n";
        return;
      }
      out += walk(el.childNodes);
    });
    return out;
  };
  return walk(root.childNodes).replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
}

export interface RichEditorHandle {
  focus: () => void;
  setHtml: (html: string) => void;
  insertText: (text: string) => void;
  exec: (cmd: "bold" | "insertUnorderedList" | "insertParagraph") => void;
}

export interface ActiveFormats { bold: boolean; list: boolean; hasSelection: boolean; }

interface Props {
  initialMd: string;
  onChange: (md: string) => void;
  placeholder?: string;
  fontSize: number;
  className?: string;
  syncKey?: number;
  currentMd: string;
  onActiveChange?: (active: ActiveFormats) => void;
}

export const RichEditor = forwardRef<RichEditorHandle, Props>(function RichEditor(
  { initialMd, onChange, placeholder, fontSize, className, syncKey = 0, currentMd, onActiveChange },
  ref
) {
  const elRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const lastSyncKey = useRef<number>(syncKey);

  useEffect(() => {
    if (elRef.current && !mountedRef.current) {
      elRef.current.innerHTML = mdToHtml(initialMd);
      mountedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMd]);

  useEffect(() => {
    if (syncKey !== lastSyncKey.current && elRef.current) {
      elRef.current.innerHTML = mdToHtml(currentMd);
      lastSyncKey.current = syncKey;
    }
  }, [syncKey, currentMd]);

  const emitActive = () => {
    if (!onActiveChange || !elRef.current) return;
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !elRef.current.contains(sel.anchorNode)) return;
    let list = false;
    let node: Node | null = sel.anchorNode;
    while (node && node !== elRef.current) {
      const tag = (node as HTMLElement).tagName;
      if (tag === "LI" || tag === "UL" || tag === "OL") { list = true; break; }
      node = node.parentNode;
    }
    let bold = false;
    try { bold = document.queryCommandState("bold"); } catch {}
    onActiveChange({ bold, list, hasSelection: !sel.isCollapsed });
  };

  useEffect(() => {
    const handler = () => emitActive();
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onActiveChange]);

  useImperativeHandle(ref, () => ({
    focus: () => elRef.current?.focus(),
    setHtml: (html) => { if (elRef.current) elRef.current.innerHTML = html; },
    insertText: (text) => {
      const el = elRef.current;
      if (!el) return;
      el.focus();
      document.execCommand("insertText", false, text);
      onChange(htmlToMd(el));
      emitActive();
    },
    exec: (cmd) => {
      const el = elRef.current;
      if (!el) return;
      el.focus();
      document.execCommand(cmd);
      onChange(htmlToMd(el));
      emitActive();
    },
  }));

  const handleInput = () => {
    if (!elRef.current) return;
    onChange(htmlToMd(elRef.current));
    emitActive();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      document.execCommand("bold");
      if (elRef.current) onChange(htmlToMd(elRef.current));
      emitActive();
    }
  };

  return (
    <div
      ref={elRef}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={placeholder}
      data-placeholder={placeholder}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={
        "w-full min-h-[400px] rounded-lg border border-border bg-background p-4 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary rich-editor " +
        (className ?? "")
      }
      style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
    />
  );
});
