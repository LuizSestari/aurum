"use client";

import { useMemo } from "react";

interface Props {
  content: string;
}

// Lightweight markdown renderer — no external deps
// Supports: **bold**, *italic*, `inline code`, ```code blocks```, - lists, # headings, [links](url)
export default function MarkdownRenderer({ content }: Props) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return (
    <div
      className="aurum-md whitespace-pre-wrap text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdown(md: string): string {
  // Code blocks first
  let result = md.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (_match, lang, code) => {
      const l = lang ? `<span class="aurum-md-lang">${escapeHtml(lang)}</span>` : "";
      return `<div class="aurum-md-codeblock">${l}<pre><code>${escapeHtml(code.trimEnd())}</code></pre></div>`;
    },
  );

  // Process line by line
  const lines = result.split("\n");
  const processed: string[] = [];

  for (const line of lines) {
    let l = line;

    // Headings
    if (/^### (.+)/.test(l)) {
      l = l.replace(/^### (.+)/, '<h3 class="aurum-md-h3">$1</h3>');
    } else if (/^## (.+)/.test(l)) {
      l = l.replace(/^## (.+)/, '<h2 class="aurum-md-h2">$1</h2>');
    } else if (/^# (.+)/.test(l)) {
      l = l.replace(/^# (.+)/, '<h1 class="aurum-md-h1">$1</h1>');
    }

    // List items
    if (/^[-*] (.+)/.test(l)) {
      l = l.replace(/^[-*] (.+)/, '<li class="aurum-md-li">$1</li>');
    }

    // Numbered list
    if (/^\d+\. (.+)/.test(l)) {
      l = l.replace(/^\d+\. (.+)/, '<li class="aurum-md-li aurum-md-ol">$1</li>');
    }

    // Inline formatting
    l = l.replace(/`([^`]+)`/g, '<code class="aurum-md-inline">$1</code>');
    l = l.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    l = l.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    l = l.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="aurum-md-link">$1</a>',
    );

    processed.push(l);
  }

  return processed.join("\n");
}
