import type { Employee } from "./data";

// Normalise a spreadsheet cell to a clean string ("-", "#N/A", blanks → "").
const clean = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = (typeof v === "number" ? String(v) : String(v)).trim();
  if (!s || s === "-" || s === "#N/A" || s === "#REF!" || s.toLowerCase() === "nan") return "";
  return s;
};
// Numeric-ish codes come through as "10.0" / "12345.0" — drop the trailing .0.
const num = (v: unknown): string => clean(v).replace(/\.0+$/, "");
// Date cells (cellDates:true) → ISO yyyy-mm-dd; otherwise a clean string.
const dateStr = (v: unknown): string => (v instanceof Date && !isNaN(v.getTime()) ? v.toISOString().slice(0, 10) : clean(v));

// Map our field → the header spellings we accept from the sheet.
const HEADERS: Record<keyof Omit<Employee, never>, string[]> = {
  npk: ["NPK", "npk"],
  name: ["Nama", "Name"],
  position: ["Jabatan", "Position"],
  unit: ["Unit Kerja", "Unit"],
  directorate: ["Direktorat", "Directorate"],
  compartment: ["Kompartemen", "Compartment"],
  location: ["Lokasi", "Location"],
  stream: ["Stream"],
  pg: ["PG"],
  jg: ["JG"],
  gender: ["Gender", "Jenis Kelamin"],
  age: ["Usia", "Age"],
  supervisor: ["Atasan", "Supervisor"],
  education: ["Jenjang", "Pendidikan", "Education"],
  major: ["Prodi", "Program Studi", "Major"],
  university: ["Universitas", "University"],
  sf: ["S/F", "SF"],
  pbp: ["PBP"],
};

export type RawRow = Record<string, unknown>;

// Convert rows parsed from the sheet (objects keyed by header) into Employee records.
export function rowsToEmployees(rows: RawRow[]): Employee[] {
  const pick = (r: RawRow, keys: string[]) => {
    for (const k of keys) if (k in r) return r[k];
    return "";
  };
  const list: Employee[] = [];
  for (const r of rows) {
    const npk = num(pick(r, HEADERS.npk));
    const name = clean(pick(r, HEADERS.name));
    if (!npk && !name) continue; // skip empty / spacer rows
    list.push({
      npk: npk || name,
      name,
      position: clean(pick(r, HEADERS.position)),
      unit: clean(pick(r, HEADERS.unit)),
      directorate: clean(pick(r, HEADERS.directorate)),
      compartment: clean(pick(r, HEADERS.compartment)),
      location: clean(pick(r, HEADERS.location)),
      stream: clean(pick(r, HEADERS.stream)),
      pg: num(pick(r, HEADERS.pg)),
      jg: num(pick(r, HEADERS.jg)),
      gender: clean(pick(r, HEADERS.gender)),
      age: num(pick(r, HEADERS.age)),
      supervisor: clean(pick(r, HEADERS.supervisor)),
      education: clean(pick(r, HEADERS.education)),
      major: clean(pick(r, HEADERS.major)),
      university: clean(pick(r, HEADERS.university)),
      sf: clean(pick(r, HEADERS.sf)),
      pbp: dateStr(pick(r, HEADERS.pbp)),
    });
  }
  // de-dupe by NPK, keeping the last occurrence
  const byNpk = new Map<string, Employee>();
  for (const e of list) byNpk.set(e.npk, e);
  return Array.from(byNpk.values());
}
