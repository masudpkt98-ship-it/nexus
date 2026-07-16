// -----------------------------------------------------------------------------
// KPI eligibility ("Wajib KPI"). Some Directory employees are NOT obligated to
// have a KPI (Cuti Diluar Tanggungan / CDTP, PBP, Tugas Belajar, Dedicated, …).
// These are marked MANUALLY (reasons span several columns / other causes), each
// with a reason, and are excluded from the "Total Wajib KPI" denominator.
// -----------------------------------------------------------------------------

export const EXCLUSION_KEY = "kpi-exclusions";

export const EXCLUSION_REASONS = ["CDTP", "PBP", "Tugas Belajar", "Dedicated", "Lainnya"] as const;
export type ExclusionReason = (typeof EXCLUSION_REASONS)[number];

export interface Exclusion {
  reason: string; // one of EXCLUSION_REASONS (or custom)
  note?: string;
  at: string; // ISO — when marked
}

// Keyed by NPK.
export type Exclusions = Record<string, Exclusion>;

export const isNik9 = (npk: string) => String(npk ?? "").trim().startsWith("9");

// Reason breakdown for a set of excluded NPKs actually present in the directory.
export function reasonCounts(exclusions: Exclusions, npks: Iterable<string>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const npk of npks) {
    const ex = exclusions[npk];
    if (!ex) continue;
    out[ex.reason] = (out[ex.reason] || 0) + 1;
  }
  return out;
}
