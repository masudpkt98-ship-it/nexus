"use client";
// Map a PROFIL JABATAN (.docx like VP.docx) into structured Job Profile fields.
import { readDocx, type DocxBlock } from "./docx";

export interface ParsedJobProfile {
  namaJabatan: string;
  kodeJabatan: string;
  direktorat: string;
  kompartemen: string;
  departemen: string;
  purpose: string;
  responsibilities: string;
  dimensi: string;
  risks: string;
  authority: string;
  relations: string;
  qualifications: string;
}

const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const clean = (s: string) => (s || "").replace(/^[\s:.-]+/, "").replace(/\s+\n/g, "\n").trim();

/** Split a "DIMENSI"-style block off its Risiko Pekerjaan tail. */
function splitRisk(text: string): { dimensi: string; risks: string } {
  const m = text.match(/risiko\s+(?:pekerjaan|jabatan)\s*:?/i);
  if (!m || m.index == null) return { dimensi: text.trim(), risks: "" };
  return { dimensi: text.slice(0, m.index).trim(), risks: clean(text.slice(m.index + m[0].length)) };
}

export function parseJobProfileBlocks(blocks: DocxBlock[]): ParsedJobProfile {
  const out: ParsedJobProfile = {
    namaJabatan: "", kodeJabatan: "", direktorat: "", kompartemen: "", departemen: "",
    purpose: "", responsibilities: "", dimensi: "", risks: "", authority: "", relations: "", qualifications: "",
  };
  const tables = blocks.filter((b): b is Extract<DocxBlock, { kind: "table" }> => b.kind === "table");

  for (const tbl of tables) {
    const header = norm(tbl.rows[0]?.[0] || "");
    // content = every cell after the header row, joined
    const body = tbl.rows.slice(1).map((r) => r.join(" ").trim()).filter(Boolean).join("\n");

    if (header.includes("identitasjabatan")) {
      for (const r of tbl.rows.slice(1)) {
        const label = norm(r[0] || "");
        const value = clean(r.slice(1).join(" ") || (r[0] || "").split(":").slice(1).join(":"));
        if (!value) continue;
        if (label.includes("namajabatan")) out.namaJabatan = value;
        else if (label.includes("kodejabatan")) out.kodeJabatan = value;
        else if (label.includes("direktorat")) out.direktorat = value;
        else if (label.includes("kompartemen")) out.kompartemen = value;
        else if (label.includes("departemen")) out.departemen = value;
      }
    } else if (header.includes("tujuanjabatan")) out.purpose = clean(body);
    else if (header.includes("tanggungjawab")) out.responsibilities = clean(body);
    else if (header.includes("dimensi")) { const s = splitRisk(body); out.dimensi = s.dimensi; if (s.risks) out.risks = s.risks; }
    else if (header.includes("wewenang")) out.authority = clean(body);
    else if (header.includes("hubungankerja")) out.relations = clean(body);
    else if (header.includes("spesifikasijabatan") || header.includes("persyaratan")) out.qualifications = clean(body);
  }

  // Fallbacks from the header/title table if IDENTITAS was sparse.
  if (!out.namaJabatan) {
    for (const tbl of tables) {
      const flat = tbl.rows.flat().join(" ");
      const m = flat.match(/PROFIL JABATAN.*?\)\s*(.+?)\s+(?:PT |D\d)/i);
      if (m) { out.namaJabatan = clean(m[1]); break; }
    }
  }
  return out;
}

export async function importJobProfile(file: File): Promise<ParsedJobProfile> {
  return parseJobProfileBlocks(await readDocx(file));
}
