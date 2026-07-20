// -----------------------------------------------------------------------------
// Performance Monitoring — Realisasi KPI (data layer).
//
// Monitoring does NOT create KPIs. It reads the SAME planned KPIs stored by
// Performance Planning (PLAN_UNIT_KPIS_KEY per unit + Korporat) and overlays a
// realization value per KPI per period slot. A KPI is fillable as soon as it is
// planned — no separate "submit" step is required.
//
// Periods follow four granularities: Bulanan · Triwulanan · Semesteran · Tahunan.
// The planned monthly targets (kpi.monthlyTargets, keyed by kpiMonths) + the
// KPI's Consolidation rule produce the target for any period slot.
// -----------------------------------------------------------------------------

import { kpiMonths, type PlanningKpi } from "./data";
import type { PlanLevel } from "./perfPlanning";

export const REALIZATION_KEY = "monitoring-realizations";

export type Gran = "Bulanan" | "Triwulanan" | "Semesteran" | "Tahunan";
export const GRANS: Gran[] = ["Bulanan", "Triwulanan", "Semesteran", "Tahunan"];
export const ROMAN = ["I", "II", "III", "IV"];

// A concrete period selection: granularity + year + index within the year.
//   Bulanan idx 1..12 · Triwulanan 1..4 · Semesteran 1..2 · Tahunan 0
export interface PeriodSel {
  gran: Gran;
  year: string;
  idx: number;
}

export const defaultPeriod = (year = "2026"): PeriodSel => ({ gran: "Bulanan", year, idx: 6 });

// Sub-period options for a granularity (idx + label).
export function subPeriods(gran: Gran): { idx: number; label: string }[] {
  switch (gran) {
    case "Bulanan": return kpiMonths.map((m, i) => ({ idx: i + 1, label: m }));
    case "Triwulanan": return ROMAN.map((r, i) => ({ idx: i + 1, label: `Triwulan ${r}` }));
    case "Semesteran": return [{ idx: 1, label: "Semester I" }, { idx: 2, label: "Semester II" }];
    case "Tahunan": return [{ idx: 0, label: "Tahunan" }];
  }
}

export function periodLabel(sel: PeriodSel): string {
  switch (sel.gran) {
    case "Bulanan": return kpiMonths[sel.idx - 1] ?? `Bulan ${sel.idx}`;
    case "Triwulanan": return `Triwulan ${ROMAN[sel.idx - 1] ?? sel.idx}`;
    case "Semesteran": return `Semester ${sel.idx === 2 ? "II" : "I"}`;
    case "Tahunan": return "Tahunan";
  }
}

// Full month label (for prose, e.g. "Bulan Juni").
const MONTH_FULL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const periodLongLabel = (sel: PeriodSel): string =>
  sel.gran === "Bulanan" ? `Bulan ${MONTH_FULL[sel.idx - 1] ?? sel.idx}` : periodLabel(sel);

// Month indices (1..12) covered by the selected period.
export function monthsOf(sel: PeriodSel): number[] {
  switch (sel.gran) {
    case "Bulanan": return [sel.idx];
    case "Triwulanan": return [1, 2, 3].map((k) => (sel.idx - 1) * 3 + k);
    case "Semesteran": return (sel.idx === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12]);
    case "Tahunan": return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }
}

// Which calendar months a frequency actually "reports" on.
function reportMonths(frequency: string): number[] {
  switch (frequency) {
    case "Quarterly": return [3, 6, 9, 12];
    case "Half Yearly": return [6, 12];
    case "Yearly": return [12];
    default: return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Monthly
  }
}

// A KPI is active in a period if its reporting cadence intersects that period.
export function isActivePeriod(kpi: PlanningKpi, sel: PeriodSel): boolean {
  if (sel.gran === "Tahunan") return true;
  const rep = new Set(reportMonths(kpi.frequency || "Monthly"));
  return monthsOf(sel).some((m) => rep.has(m));
}

function consolidate(values: number[], rule: string): number {
  const nums = values.filter((v) => v !== undefined && v !== null && !Number.isNaN(v));
  if (!nums.length) return 0;
  let out: number;
  if (rule === "Sum") out = nums.reduce((s, n) => s + n, 0);
  else if (rule === "Average") out = nums.reduce((s, n) => s + n, 0) / nums.length;
  else out = nums[nums.length - 1]; // Take Last Known
  return Math.round(out * 100) / 100;
}

// Planned target for the selected period, from monthlyTargets + Consolidation.
export function periodTarget(kpi: PlanningKpi, sel: PeriodSel): number {
  if (sel.gran === "Tahunan") return kpi.annualTarget || 0;
  const mt = kpi.monthlyTargets || {};
  const vals = monthsOf(sel)
    .map((m) => mt[kpiMonths[m - 1]])
    .filter((v): v is number => v !== undefined && v !== null && String(v) !== "" && !Number.isNaN(Number(v)))
    .map(Number);
  if (!vals.length) return sel.gran === "Bulanan" ? 0 : kpi.annualTarget || 0;
  return consolidate(vals, kpi.consolidation || "Take Last Known");
}

// Achievement ratio (1 = 100%) given polarity. Uncapped; caller caps for display.
export function achievementRatio(real: number, target: number, polarity: string): number {
  if (polarity === "Minimize") {
    if (real <= 0) return target > 0 ? 2 : 0; // over-achieved (clamp)
    return target > 0 ? target / real : 0;
  }
  if (polarity === "Stabilize") {
    if (target <= 0) return 0;
    return Math.max(0, 1 - Math.abs(real - target) / target);
  }
  // Maximize (default)
  return target > 0 ? real / target : real > 0 ? 1 : 0;
}

// ---- Realization store -------------------------------------------------------
export type EvidenceType = "upload" | "link";
export interface RealizationEntry {
  value: number; // Realisasi
  evidenceType?: EvidenceType;
  evidence?: string; // data URL (upload) or URL (link)
  evidenceName?: string;
  note?: string; // Deskripsi
  createdBy?: string;
  createdAt?: string; // ISO
}
// keyed by `${kpiId}::${slot}` — kpiIds are globally unique across units.
export type RealizationMap = Record<string, RealizationEntry>;

export const slotKey = (sel: PeriodSel): string =>
  `${sel.year}-${sel.gran[0]}${sel.idx}`;
export const realizationKey = (kpiId: string, sel: PeriodSel): string =>
  `${kpiId}::${slotKey(sel)}`;

// ---- Levels (mirror Planning's, under /performance/monitoring) ----------------
export const MONITOR_LEVELS: { key: PlanLevel; label: string; href: string }[] = [
  { key: "korporat", label: "Korporat", href: "/performance/monitoring/korporat" },
  { key: "direktorat", label: "Direktorat", href: "/performance/monitoring/direktorat" },
  { key: "manajemen", label: "Manajemen", href: "/performance/monitoring/manajemen" },
  { key: "unit-kerja", label: "Unit Kerja", href: "/performance/monitoring/unit-kerja" },
  { key: "individu", label: "Individu (AVP & Staf)", href: "/performance/monitoring/individu" },
];
export const monitorLevelLabel = (level: PlanLevel) => MONITOR_LEVELS.find((l) => l.key === level)?.label ?? level;
