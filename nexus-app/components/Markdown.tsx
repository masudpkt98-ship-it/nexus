import React from "react";

/** Minimal, dependency-free Markdown renderer: headings, tables, lists, bold/italic. */
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const isTable = (l: string) => /^\s*\|.*\|\s*$/.test(l);
  const cells = (l: string) =>
    l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const isSep = (l: string) => cells(l).every((c) => /^:?-{2,}:?$/.test(c.replace(/\s/g, "")));

  while (i < lines.length) {
    const line = lines[i];

    if (/^#\s/.test(line)) {
      blocks.push(<h2 key={key++} className="mt-1 text-lg font-bold tracking-tight">{inline(line.replace(/^#\s/, ""))}</h2>);
      i++;
      continue;
    }
    if (/^##\s/.test(line)) {
      blocks.push(<h3 key={key++} className="mt-4 text-sm font-semibold text-royal-400">{inline(line.replace(/^##\s/, ""))}</h3>);
      i++;
      continue;
    }
    if (/^###\s/.test(line)) {
      blocks.push(<h4 key={key++} className="mt-3 text-[13px] font-semibold">{inline(line.replace(/^###\s/, ""))}</h4>);
      i++;
      continue;
    }

    // Table block
    if (isTable(line) && i + 1 < lines.length && isSep(lines[i + 1])) {
      const header = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && isTable(lines[i])) {
        rows.push(cells(lines[i]));
        i++;
      }
      blocks.push(
        <div key={key++} className="my-2 overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b">
                {header.map((h, hi) => (
                  <th key={hi} className="px-2 py-1.5 text-left font-semibold text-[var(--muted)]">{inline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b last:border-0">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-2 py-1.5 align-top">{inline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Bullet list
    if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-1.5 space-y-1 pl-1">
          {items.map((it, ii) => (
            <li key={ii} className="flex gap-2 text-[13px] leading-relaxed">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-royal-400" />
              <span>{inline(it)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="my-1.5 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed marker:text-royal-400">
          {items.map((it, ii) => (
            <li key={ii}>{inline(it)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    blocks.push(<p key={key++} className="my-1.5 text-[13px] leading-relaxed">{inline(line)}</p>);
    i++;
  }

  return <div className="text-[var(--text)]">{blocks}</div>;
}

/** Inline **bold** and _italic_. */
function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|_(.+?)_/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={k++}>{m[1]}</strong>);
    else out.push(<em key={k++} className="text-[var(--muted)]">{m[2]}</em>);
    last = regex.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
