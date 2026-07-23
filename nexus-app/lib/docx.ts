"use client";
// -----------------------------------------------------------------------------
// Minimal browser .docx reader — no dependencies. A .docx is a ZIP; we locate
// word/document.xml via the central directory, inflate it with the native
// DecompressionStream, and return the body as an ordered list of blocks
// (paragraphs + tables). Enough to import structured Job Profile documents.
// -----------------------------------------------------------------------------

export type DocxBlock = { kind: "p"; text: string } | { kind: "table"; rows: string[][] };

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Extract word/document.xml text from a .docx File/ArrayBuffer. */
async function readDocumentXml(file: File | ArrayBuffer): Promise<string> {
  const buf = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const dv = new DataView(buf);
  const dec = new TextDecoder();
  // find End Of Central Directory (0x06054b50), scanning back from the tail
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 22 - 65536; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Not a valid .docx (no ZIP end record)");
  const cdCount = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  for (let n = 0; n < cdCount; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const compSize = dv.getUint32(p + 20, true);
    const fnLen = dv.getUint16(p + 28, true);
    const exLen = dv.getUint16(p + 30, true);
    const cmLen = dv.getUint16(p + 32, true);
    const localOff = dv.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + fnLen));
    if (name === "word/document.xml") {
      const lfnLen = dv.getUint16(localOff + 26, true);
      const lexLen = dv.getUint16(localOff + 28, true);
      const dataStart = localOff + 30 + lfnLen + lexLen;
      const comp = bytes.subarray(dataStart, dataStart + compSize);
      const raw = method === 0 ? comp : await inflateRaw(comp);
      return dec.decode(raw);
    }
    p += 46 + fnLen + exLen + cmLen;
  }
  throw new Error("word/document.xml not found in .docx");
}

const textOf = (el: Element): string => {
  let s = "";
  for (const t of Array.from(el.getElementsByTagName("*"))) {
    if (t.localName === "t") s += t.textContent || "";
    else if (t.localName === "tab") s += " ";
    else if (t.localName === "br" || t.localName === "cr") s += "\n";
  }
  return s.replace(/[ \t]+/g, " ").trim();
};

/** Parse a .docx into an ordered list of paragraph / table blocks. */
export async function readDocx(file: File | ArrayBuffer): Promise<DocxBlock[]> {
  const xml = await readDocumentXml(file);
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const body = Array.from(doc.getElementsByTagName("*")).find((e) => e.localName === "body");
  if (!body) return [];
  const blocks: DocxBlock[] = [];
  for (const el of Array.from(body.children)) {
    if (el.localName === "p") {
      const txt = textOf(el);
      if (txt) blocks.push({ kind: "p", text: txt });
    } else if (el.localName === "tbl") {
      const rows: string[][] = [];
      for (const tr of Array.from(el.children).filter((c) => c.localName === "tr")) {
        const cells = Array.from(tr.children).filter((c) => c.localName === "tc").map((tc) => textOf(tc));
        if (cells.some((c) => c)) rows.push(cells);
      }
      if (rows.length) blocks.push({ kind: "table", rows });
    }
  }
  return blocks;
}
