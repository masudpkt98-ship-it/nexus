// -----------------------------------------------------------------------------
// Performance Appraisal — Penilaian KPI (data layer).
//
// Appraisal scores the SAME planned KPIs + Realisasi entered in Monitoring.
// It does not re-enter data (though the Input Data action reuses the Realisasi
// drawer). For each active KPI:
//    ratio  = achievement(realisasi, periodTarget, polarity)
//    cap    = Validity "Exact" → 110%, otherwise 100%
//    Skor   = Bobot × min(ratio, cap)
//    Pencapaian Skor KPI (%) = ΣSkor / ΣBobot × 100   (active KPIs only)
// Inactive KPIs (frequency doesn't report in the period) contribute nothing.
// -----------------------------------------------------------------------------

import { type PlanningKpi } from "./data";
import { type PlanLevel } from "./perfPlanning";
import {
  type PeriodSel, type RealizationMap,
  achievementRatio, isActivePeriod, periodTarget, realizationKey,
} from "./perfRealization";

// ---- Achievement cap by KPI validity -----------------------------------------
export const achievementCap = (kpi: PlanningKpi): number => (kpi.validity === "Exact" ? 1.1 : 1.0);

// Raw achievement ratio for an active KPI (null if inactive). 0 if not yet realized.
export function rowRatio(kpi: PlanningKpi, sel: PeriodSel, realizations: RealizationMap): number | null {
  if (!isActivePeriod(kpi, sel)) return null;
  const entry = realizations[realizationKey(kpi.id, sel)];
  const target = periodTarget(kpi, sel);
  return entry ? achievementRatio(entry.value, target, kpi.polarity || "Maximize") : 0;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Displayed pencapaian: capped % (main) + raw % (the "A:" figure).
export function displayPct(kpi: PlanningKpi, ratio: number): { pct: number; raw: number } {
  return { pct: Math.round(Math.min(ratio, achievementCap(kpi)) * 100), raw: Math.round(ratio * 100) };
}

// Skor = Bobot × capped ratio.
export function kpiSkor(kpi: PlanningKpi, ratio: number): number {
  return round2((kpi.weight || 0) * Math.min(ratio, achievementCap(kpi)));
}

export interface AppraisalTotals {
  totalBobot: number;
  totalSkor: number;
  pencapaianPct: number; // ΣSkor / ΣBobot × 100
}

export function appraisalTotals(kpis: PlanningKpi[], sel: PeriodSel, realizations: RealizationMap): AppraisalTotals {
  let totalBobot = 0, totalSkor = 0;
  for (const k of kpis) {
    const ratio = rowRatio(k, sel, realizations);
    if (ratio === null) continue; // inactive → excluded
    totalBobot += k.weight || 0;
    totalSkor += kpiSkor(k, ratio);
  }
  totalBobot = round2(totalBobot);
  totalSkor = round2(totalSkor);
  return { totalBobot, totalSkor, pencapaianPct: totalBobot ? round2((totalSkor / totalBobot) * 100) : 0 };
}

// ---- Kriteria Penilaian KPI (legend) -----------------------------------------
export interface Criteria { label: string; tone: "red" | "amber" | "gold" | "green" }
export function kpiCriteria(pct: number): Criteria {
  if (pct < 80) return { label: "Failed", tone: "red" };
  if (pct < 90) return { label: "Low Performance", tone: "amber" };
  if (pct <= 100) return { label: "Moderate Performance", tone: "gold" };
  return { label: "High Performance", tone: "green" }; // >100–110
}
export const CRITERIA_LEGEND: { range: string; c: Criteria }[] = [
  { range: "< 80,00", c: { label: "Failed", tone: "red" } },
  { range: "80,00 – 89,99", c: { label: "Low Performance", tone: "amber" } },
  { range: "90,00 – 100,00", c: { label: "Moderate Performance", tone: "gold" } },
  { range: "> 100,00 – 110,00", c: { label: "High Performance", tone: "green" } },
];

// ---- Approval status (per unit) ----------------------------------------------
export const APPRAISAL_STATUS_KEY = "appraisal-status";
export type AppraisalStatus = "Drafted" | "Approved";
export interface UnitStatus { status: AppraisalStatus; version: number }
export type AppraisalStatusMap = Record<string, UnitStatus>; // unitKey → status
export const defaultStatus = (): UnitStatus => ({ status: "Drafted", version: 1 });

// ---- PBI (Performance Behaviour Indicator) — seeded catalog ------------------
export interface PbiItem { id: string; fungsi: string; pbi: string; tipe: string; range: string }
export const PBI_CATALOG: PbiItem[] = [
  { id: "pbi-1", fungsi: "Risiko dan Tata Kelola", pbi: "Completion of AOI GCG Recommendations", tipe: "P", range: "0,5;1" },
  { id: "pbi-2", fungsi: "Risiko dan Tata Kelola", pbi: "Completion of Audit Recommendations", tipe: "P", range: "1;2,5" },
  { id: "pbi-3", fungsi: "Risiko dan Tata Kelola", pbi: "Risk Management Compliance", tipe: "R P", range: "0,25;1,5" },
  { id: "pbi-4", fungsi: "Risiko dan Tata Kelola", pbi: "Compliance Commitment", tipe: "P", range: "1,5;2,5" },
  { id: "pbi-5", fungsi: "Risiko dan Tata Kelola", pbi: "Zero Fraud Tolerance", tipe: "P", range: "1,5;2,5" },
  { id: "pbi-6", fungsi: "Operasional Bisnis", pbi: "Number of Accident", tipe: "P", range: "1;2,5" },
  { id: "pbi-7", fungsi: "Operasional Bisnis", pbi: "Performance Management Compliance", tipe: "P", range: "0,25;5" },
  { id: "pbi-8", fungsi: "Operasional Bisnis", pbi: "Corporate Innovation Contribution", tipe: "R", range: "0,25;2,5" },
  { id: "pbi-9", fungsi: "Sumber Daya Manusia", pbi: "People Development Effectiveness", tipe: "P", range: "1;2" },
  { id: "pbi-10", fungsi: "Sumber Daya Manusia", pbi: "Learning Effectiveness", tipe: "R P", range: "0,5;2,5" },
  { id: "pbi-11", fungsi: "Sumber Daya Manusia", pbi: "TJSL Program Contribution", tipe: "P", range: "0,25;0,5" },
  { id: "pbi-12", fungsi: "Sumber Daya Manusia", pbi: "Internal Customer Satisfaction Index", tipe: "R P", range: "0,5;1" },
];
export const APPRAISAL_PBI_KEY = "appraisal-pbi";
export interface PbiScore { reward?: number; punishment?: number; skor?: number }
export type PbiScoreMap = Record<string, PbiScore>; // `${unitKey}::${pbiId}` → score
export const pbiKey = (unitKey: string, pbiId: string) => `${unitKey}::${pbiId}`;

// ---- Levels (mirror Planning/Monitoring, under /performance/appraisal) --------
export const APPRAISAL_LEVELS: { key: PlanLevel; label: string; href: string }[] = [
  { key: "korporat", label: "Korporat", href: "/performance/appraisal/korporat" },
  { key: "direktorat", label: "Direktorat", href: "/performance/appraisal/direktorat" },
  { key: "manajemen", label: "Manajemen", href: "/performance/appraisal/manajemen" },
  { key: "unit-kerja", label: "Unit Kerja", href: "/performance/appraisal/unit-kerja" },
  { key: "individu", label: "Individu (AVP & Staf)", href: "/performance/appraisal/individu" },
];
export const appraisalLevelLabel = (level: PlanLevel) => APPRAISAL_LEVELS.find((l) => l.key === level)?.label ?? level;
