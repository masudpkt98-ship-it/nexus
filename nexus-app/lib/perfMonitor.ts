// -----------------------------------------------------------------------------
// Performance Dashboard — data layer.
// Parses the admin-imported Excel exports (Planning / Appraisal / Coaching),
// normalizes + de-duplicates them, and compiles period-aware monitoring metrics.
//
// Business rules (from the data owner):
//   • De-dupe by NIK + Nama — a repeated (NIK, Nama) pair is counted once.
//   • NIK starting with "9" is excluded from all counts (non-organic accounts).
// -----------------------------------------------------------------------------

export type DatasetKind = "planning" | "appraisal" | "coaching";

export type Row = Record<string, string | number>;

export interface Dataset {
  kind: DatasetKind;
  fileName: string;
  sheet: string;
  importedAt: string; // ISO string
  columns: string[];
  rows: Row[]; // raw rows, verbatim (kept for the audit table & search)
}

export const DATASET_KEYS: Record<DatasetKind, string> = {
  planning: "perf-ds-planning",
  appraisal: "perf-ds-appraisal",
  coaching: "perf-ds-coaching",
};

export const KIND_LABEL: Record<DatasetKind, string> = {
  planning: "Performance Planning",
  appraisal: "Performance Appraisal",
  coaching: "Performance Coaching",
};

// Which raw column holds the NIK / Nama in each dataset (they differ per export).
const NIK_COL: Record<DatasetKind, string> = {
  planning: "NIK",
  appraisal: "Nik",
  coaching: "NIK Karyawan",
};
const NAME_COL: Record<DatasetKind, string> = {
  planning: "Nama Karyawan",
  appraisal: "Nama Karyawan",
  coaching: "Nama Karyawan",
};

export const str = (v: unknown) => String(v ?? "").trim();
export const nikOf = (kind: DatasetKind, r: Row) => str(r[NIK_COL[kind]]);
export const nameOf = (kind: DatasetKind, r: Row) => str(r[NAME_COL[kind]]);

// ---- Detect which export a sheet is, from its columns --------------------------
export function detectKind(columns: string[]): DatasetKind | null {
  const has = (c: string) => columns.includes(c);
  if (has("Status KPI Individu") || has("Status KPI UNIT")) return "planning";
  if (has("Status Triwulan 1") || has("Total Nilai Triwulan 1") || has("Status Tahunan")) return "appraisal";
  if (has("NIK Superior") || has("Jumlah Coaching")) return "coaching";
  return null;
}

// ---- Business-rule filtering + de-dup ------------------------------------------
// Exclude NIK starting with "9"; then keep one row per (NIK, Nama).
export function cleanRows(kind: DatasetKind, rows: Row[]): Row[] {
  const seen = new Set<string>();
  const out: Row[] = [];
  for (const r of rows) {
    const nik = nikOf(kind, r);
    if (!nik) continue;
    if (nik.startsWith("9")) continue; // rule: NIK berawalan 9 tidak dihitung
    const key = `${nik}||${nameOf(kind, r).toLowerCase()}`;
    if (seen.has(key)) continue; // rule: NIK+Nama kembar dihitung salah satu
    seen.add(key);
    out.push(r);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Period model. The appraisal export carries native Triwulan 1–4 + Tahunan
// columns; Semester is derived (S1 = TW1+TW2, S2 = TW3+TW4) and Bulan maps to
// its containing quarter for appraisal (date-based datasets filter by month).
// -----------------------------------------------------------------------------
export type Gran = "Tahunan" | "Semesteran" | "Triwulanan" | "Bulanan";
export const GRANS: Gran[] = ["Tahunan", "Semesteran", "Triwulanan", "Bulanan"];

export const ROMAN = ["I", "II", "III", "IV"];
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export interface Period {
  gran: Gran;
  value: number; // Triwulanan 1..4 · Semesteran 1..2 · Bulanan 1..12 · Tahunan ignored
}

export function periodLabel(p: Period): string {
  switch (p.gran) {
    case "Tahunan": return "Tahunan";
    case "Semesteran": return `Semester ${p.value}`;
    case "Triwulanan": return `Triwulan ${ROMAN[p.value - 1] ?? p.value}`;
    case "Bulanan": return MONTHS[p.value - 1] ?? `Bulan ${p.value}`;
  }
}

// Quarters (1..4) covered by a period; empty = whole-year (annual columns).
export function quartersFor(p: Period): number[] {
  switch (p.gran) {
    case "Tahunan": return []; // use the Tahunan columns
    case "Semesteran": return p.value === 1 ? [1, 2] : [3, 4];
    case "Triwulanan": return [p.value];
    case "Bulanan": return [Math.ceil(p.value / 3)];
  }
}

// ---- Appraisal ---------------------------------------------------------------
const APR_STATUS = (q: number | null) => (q == null ? "Status Tahunan" : `Status Triwulan ${q}`);
const APR_SCORE = (q: number | null) => (q == null ? "Total Nilai Tahunan" : `Total Nilai Triwulan ${q}`);

export interface AppraisalStats {
  approved: number;
  waiting: number;
  notSubmitted: number;
  total: number;
  avgScore: number; // over rows with a numeric score > 0
  pctApproved: number;
}

function classifyAppraisal(status: string): "approved" | "waiting" | "not" {
  const s = status.toLowerCase();
  if (s.includes("approv")) return "approved";
  if (s.includes("wait")) return "waiting";
  return "not";
}

// -----------------------------------------------------------------------------
// Aggregation is EMPLOYEE-DRIVEN: it iterates the Wajib-KPI employee set (from
// the frozen Directory) and joins each employee to their dataset row by NIK.
// So every percentage's denominator is the Total Wajib KPI — a wajib employee
// with no record counts as "not done", NOT excluded from the base.
// -----------------------------------------------------------------------------

// One Wajib-KPI employee (from the Directory) — its org fields are authoritative.
export interface WajibEmp { npk: string; directorate: string; compartment: string; unit: string }

// Org breakdown levels — ONLY the fields present in the KPI Eligibility source
// (Employee Directory). No mixing with the performance exports.
export type OrgLevel = "Direktorat" | "Kompartemen" | "Unit Kerja";
export const ORG_LEVELS: OrgLevel[] = ["Direktorat", "Kompartemen", "Unit Kerja"];

// NIK → its (deduped) dataset row, for O(1) per-employee lookup.
export function buildIndex(kind: DatasetKind, rows: Row[]): Map<string, Row> {
  const m = new Map<string, Row>();
  for (const r of rows) { const nik = nikOf(kind, r); if (nik && !m.has(nik)) m.set(nik, r); }
  return m;
}

export function appraisalStats(wajib: WajibEmp[], idx: Map<string, Row>, p: Period): AppraisalStats {
  const qs = quartersFor(p);
  const cols = qs.length ? qs.map((q) => ({ s: APR_STATUS(q), n: APR_SCORE(q) })) : [{ s: APR_STATUS(null), n: APR_SCORE(null) }];
  let approved = 0, waiting = 0, notSubmitted = 0, scoreSum = 0, scoreN = 0;
  for (const e of wajib) {
    const r = idx.get(e.npk);
    if (!r) { notSubmitted++; continue; } // wajib but no appraisal → not submitted
    let best: "approved" | "waiting" | "not" = "not";
    let bestScore = 0;
    for (const c of cols) {
      const cls = classifyAppraisal(str(r[c.s]));
      if (cls === "approved") best = "approved";
      else if (cls === "waiting" && best !== "approved") best = "waiting";
      const sc = Number(r[c.n]) || 0;
      if (sc > bestScore) bestScore = sc;
    }
    if (best === "approved") approved++;
    else if (best === "waiting") waiting++;
    else notSubmitted++;
    if (bestScore > 0) { scoreSum += bestScore; scoreN++; }
  }
  const total = wajib.length;
  return { approved, waiting, notSubmitted, total, avgScore: scoreN ? scoreSum / scoreN : 0, pctApproved: total ? (approved / total) * 100 : 0 };
}

// ---- Planning ----------------------------------------------------------------
export interface PlanningStats {
  total: number;
  individu: Record<string, number>; // Approved / Belum / WaitApv / Drafted …
  unit: Record<string, number>; // Belum / Drafted / Submitted …
  pctIndividuApproved: number;
}

export function planningStats(wajib: WajibEmp[], idx: Map<string, Row>): PlanningStats {
  const individu: Record<string, number> = {};
  const unit: Record<string, number> = {};
  for (const e of wajib) {
    const r = idx.get(e.npk);
    const iv = r ? str(r["Status KPI Individu"]) || "Belum" : "Belum"; // no record → Belum
    const un = r ? str(r["Status KPI UNIT"]) || "Belum" : "Belum";
    individu[iv] = (individu[iv] || 0) + 1;
    unit[un] = (unit[un] || 0) + 1;
  }
  const approved = individu["Approved"] || 0;
  const total = wajib.length;
  return { total, individu, unit, pctIndividuApproved: total ? (approved / total) * 100 : 0 };
}

// ---- Coaching ----------------------------------------------------------------
export interface CoachingStats {
  employees: number; // wajib employees with a coaching record
  coverage: number; // employees / Total Wajib KPI
  totalSessions: number; // Σ Jumlah Coaching
  avgPresentase: number; // mean of Presentase column
}

export function coachingStats(wajib: WajibEmp[], idx: Map<string, Row>): CoachingStats {
  let coached = 0, sessions = 0, pctSum = 0, pctN = 0;
  for (const e of wajib) {
    const r = idx.get(e.npk);
    if (!r) continue;
    coached++;
    sessions += Number(r["Jumlah Coaching"]) || 0;
    const p = Number(String(r["Presentase"]).replace("%", "").replace(",", ".")) || 0;
    if (p > 0) { pctSum += p; pctN++; }
  }
  const total = wajib.length;
  return { employees: coached, coverage: total ? (coached / total) * 100 : 0, totalSessions: sessions, avgPresentase: pctN ? pctSum / pctN : 0 };
}

// ---- Org breakdown — denominator = Wajib KPI per org unit (any level) ----------
export interface DirRow {
  key: string; // the org unit name at the selected level
  planningTotal: number; // wajib employees in this org unit
  planningApproved: number;
  appraisalTotal: number; // same wajib base
  appraisalApproved: number;
}

// Group the Wajib-KPI employees by the chosen org level and tally approvals.
// Every count is over the wajib set, so excluded employees never appear.
export function byOrg(wajib: WajibEmp[], pIdx: Map<string, Row>, aIdx: Map<string, Row>, p: Period, level: OrgLevel): DirRow[] {
  const map = new Map<string, DirRow>();
  const get = (k: string) => {
    const key = k || "—";
    if (!map.has(key)) map.set(key, { key, planningTotal: 0, planningApproved: 0, appraisalTotal: 0, appraisalApproved: 0 });
    return map.get(key)!;
  };
  const qs = quartersFor(p);
  const cols = qs.length ? qs.map((q) => APR_STATUS(q)) : [APR_STATUS(null)];
  for (const e of wajib) {
    const pr = pIdx.get(e.npk);
    const ar = aIdx.get(e.npk);
    // Group key comes only from the Directory (KPI Eligibility) fields.
    const orgKey = level === "Direktorat" ? e.directorate : level === "Kompartemen" ? e.compartment : e.unit;
    const row = get(orgKey);
    row.planningTotal++;
    row.appraisalTotal++;
    if (pr && str(pr["Status KPI Individu"]) === "Approved") row.planningApproved++;
    if (ar && cols.some((c) => classifyAppraisal(str(ar[c])) === "approved")) row.appraisalApproved++;
  }
  return [...map.values()].sort((a, b) => b.planningTotal - a.planningTotal);
}
