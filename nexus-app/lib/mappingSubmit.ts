// -----------------------------------------------------------------------------
// Submitted KPI Direksi — when the cascade matrix is done, each Direktorat's
// cascaded KPI is "Submitted" and frozen into this store (per Direktorat), so it
// can be exported to Excel and recalled by name in the Add/Edit KPI form.
// -----------------------------------------------------------------------------

import type { MapKpi } from "./perfMapping";

// Consumed via useLocalState(MAPPING_SUBMIT_KEY) → real key "nexus-mapping-submitted".
export const MAPPING_SUBMIT_KEY = "mapping-submitted";

export interface SubmittedKpi {
  kpi: string;
  fungsi: string;
  satuan: string;
  polaritas: string;
  tipe: string;
  prioritas: string;
  bobot: string;
  target: string;
  frekuensi: string;
}
export interface SubmittedDireksi {
  direktorat: string;
  submittedAt: string; // ISO
  kpis: SubmittedKpi[];
}
export type SubmittedMap = Record<string, SubmittedDireksi>; // Direktur → submission

export const toSubmittedKpi = (m: MapKpi): SubmittedKpi => ({
  kpi: m.kpi,
  fungsi: m.fungsi,
  satuan: m.satuan,
  polaritas: m.polaritas,
  tipe: m.tipe,
  prioritas: m.prioritas,
  bobot: m.bobot ?? "",
  target: m.target ?? "",
  frekuensi: m.frekuensi ?? "",
});

// All distinct submitted KPI names (for the Add/Edit KPI name picker).
export function submittedKpiNames(map: SubmittedMap): string[] {
  const set = new Set<string>();
  for (const d of Object.values(map)) for (const k of d.kpis) if (k.kpi.trim()) set.add(k.kpi.trim());
  return [...set].sort((a, b) => a.localeCompare(b));
}

// Find a submitted KPI by exact name (to recall its fields).
export function findSubmittedKpi(map: SubmittedMap, name: string): SubmittedKpi | undefined {
  const n = name.trim().toLowerCase();
  for (const d of Object.values(map)) {
    const hit = d.kpis.find((k) => k.kpi.trim().toLowerCase() === n);
    if (hit) return hit;
  }
  return undefined;
}

// Export every submitted Direktorat to a single Excel sheet.
export async function exportSubmitted(map: SubmittedMap) {
  const XLSX = await import("xlsx");
  const aoa: (string | number)[][] = [[
    "Direktorat", "No", "KPI", "Fungsi", "Satuan", "Polaritas", "Tipe", "Skala Prioritas", "Bobot", "Target Tahunan", "Frekuensi", "Disubmit",
  ]];
  for (const d of Object.values(map)) {
    const when = d.submittedAt ? new Date(d.submittedAt).toLocaleString("id-ID") : "";
    d.kpis.forEach((k, i) => aoa.push([d.direktorat, i + 1, k.kpi, k.fungsi, k.satuan, k.polaritas, k.tipe, k.prioritas, k.bobot, k.target, k.frekuensi, when]));
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 26 }, { wch: 4 }, { wch: 44 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "KPI Direksi");
  XLSX.writeFile(wb, "KPI-Direksi-Submitted.xlsx");
}
