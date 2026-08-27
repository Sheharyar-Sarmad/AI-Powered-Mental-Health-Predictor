'use client';

import React from 'react';

/**
 * MessageContent
 * Renders lightweight markdown (bold, headings, tables, lists, rules,
 * paragraphs) as real styled elements — no raw '**', '#', '|' characters
 * ever reach the screen.
 */

// ---------- inline formatting (bold / italics) ----------
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={`${keyPrefix}-${i}`} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
  });
}

function isTableSeparator(line: string) {
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'hr' }
  | { type: 'p'; text: string };

function parseBlocks(raw: string): Block[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i++;
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Table: a row containing '|' followed by a separator row
    if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = parseTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Paragraph — collect until blank line / next special block
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,4})\s+/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+[.)]\s+/.test(lines[i].trim()) &&
      !(lines[i].includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: 'p', text: paraLines.join(' ') });
  }

  return blocks;
}

const headingClasses: Record<number, string> = {
  1: 'text-lg font-bold text-slate-100 mt-3 mb-1.5',
  2: 'text-base font-semibold text-slate-100 mt-3 mb-1.5',
  3: 'text-sm font-semibold text-violet-300 mt-2.5 mb-1 uppercase tracking-wide',
  4: 'text-sm font-semibold text-slate-200 mt-2 mb-1',
};

export default function MessageContent({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-2 text-[14px] leading-relaxed text-slate-200">
      {blocks.map((block, idx) => {
        const key = `b-${idx}`;

        if (block.type === 'heading') {
          return (
            <div key={key} className={headingClasses[Math.min(block.level, 4)]}>
              {renderInline(block.text, key)}
            </div>
          );
        }

        if (block.type === 'hr') {
          return <hr key={key} className="my-3 border-white/10" />;
        }

        if (block.type === 'ul') {
          return (
            <ul key={key} className="ml-1 list-none space-y-1.5">
              {block.items.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                  <span>{renderInline(item, `${key}-${i}`)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={key} className="ml-1 space-y-1.5">
              {block.items.map((item, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="shrink-0 font-semibold text-violet-300">{i + 1}.</span>
                  <span>{renderInline(item, `${key}-${i}`)}</span>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={key} className="my-2 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="bg-white/[0.06]">
                    {block.header.map((h, i) => (
                      <th
                        key={i}
                        className="border-b border-white/10 px-3 py-2 font-semibold text-slate-200"
                      >
                        {renderInline(h, `${key}-h-${i}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent'}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="border-b border-white/5 px-3 py-2 text-slate-300">
                          {renderInline(cell, `${key}-${ri}-${ci}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // paragraph
        if (block.text.trim() === '') return null;
        return (
          <p key={key} className="whitespace-pre-line">
            {renderInline(block.text, key)}
          </p>
        );
      })}
    </div>
  );
}