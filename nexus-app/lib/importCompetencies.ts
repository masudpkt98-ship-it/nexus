import type { DictionaryCompetency, CompetencyLevelDef } from "./data";

export type RawRow = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v).trim());

const findKey = (row: RawRow, re: RegExp) => Object.keys(row).find((k) => re.test(k));

/** Kamus sheet → competencies (code, name, definition, level 1–5 indicators). */
export function parseKamus(rows: RawRow[]): DictionaryCompetency[] {
  const out: DictionaryCompetency[] = [];
  for (const r of rows) {
    const codeKey = findKey(r, /kode/i);
    const nameKey = findKey(r, /nama/i);
    const defKey = findKey(r, /definisi|definition/i);
    const code = s(codeKey ? r[codeKey] : "");
    const name = s(nameKey ? r[nameKey] : "");
    if (!code && !name) continue;
    const indicators = [1, 2, 3, 4, 5].map((lv) => {
      const k = findKey(r, new RegExp(`^\\s*level\\s*${lv}\\b`, "i"));
      return { level: lv, indicator: k ? s(r[k]) : "" };
    });
    out.push({
      id: (code || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40),
      code: code || "—",
      name,
      category: "Kompetensi Teknis",
      definition: s(defKey ? r[defKey] : ""),
      indicators,
    });
  }
  return out;
}

/** Daftar sheet → grouping keyed by competency name (Job Family / Function). Merged cells are forward-filled. */
export function parseDaftarGrouping(rows: RawRow[]): Map<string, { jobFamily: string; jobFamilyName: string; functionName: string }> {
  const map = new Map<string, { jobFamily: string; jobFamilyName: string; functionName: string }>();
  let jf = "", jfName = "", fn = "";
  for (const r of rows) {
    const jfKey = findKey(r, /^job family$/i);
    const jfNameKey = findKey(r, /job family name/i);
    const fnKey = findKey(r, /^function$/i);
    const compKey = findKey(r, /technical competency|kompetensi teknis|competency/i);
    if (jfKey && s(r[jfKey])) jf = s(r[jfKey]);
    if (jfNameKey && s(r[jfNameKey])) jfName = s(r[jfNameKey]);
    if (fnKey && s(r[fnKey])) fn = s(r[fnKey]);
    const name = s(compKey ? r[compKey] : "");
    if (!name) continue;
    map.set(name.toLowerCase(), { jobFamily: jf, jobFamilyName: jfName, functionName: fn });
  }
  return map;
}

/** Standar Proficiency sheet → level descriptions by level number. */
export function parseProficiency(rows: RawRow[]): { level: number; description: string; name: string }[] {
  const out: { level: number; description: string; name: string }[] = [];
  for (const r of rows) {
    const lvKey = findKey(r, /^level$/i);
    const nameKey = findKey(r, /level kecakapan|kecakapan/i);
    const descKey = findKey(r, /deskripsi|indikator kinerja|description/i);
    const level = Number(s(lvKey ? r[lvKey] : ""));
    if (!level) continue;
    out.push({ level, description: s(descKey ? r[descKey] : ""), name: s(nameKey ? r[nameKey] : "") });
  }
  return out;
}

/** Apply grouping map onto competencies (match by name). */
export function applyGrouping(comps: DictionaryCompetency[], grouping: Map<string, { jobFamily: string; jobFamilyName: string; functionName: string }>): DictionaryCompetency[] {
  return comps.map((c) => {
    const g = grouping.get(c.name.toLowerCase());
    return g ? { ...c, jobFamily: g.jobFamily, jobFamilyName: g.jobFamilyName, functionName: g.functionName } : c;
  });
}

/** Merge parsed proficiency descriptions into the level scale (by level number). */
export function mergeLevels(base: CompetencyLevelDef[], parsed: { level: number; description: string; name: string }[]): CompetencyLevelDef[] {
  return base.map((l) => {
    const p = parsed.find((x) => x.level === l.level);
    return p ? { ...l, description: p.description || l.description } : l;
  });
}
