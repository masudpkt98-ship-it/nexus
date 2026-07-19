// -----------------------------------------------------------------------------
// Performance Planning — the 5 cascade levels (Korporat · Direktorat · Manajemen
// · Unit Kerja · Individu). Each org unit at a level carries a KPI Owner (from the
// Employee Directory) and its own list of KPIs (the existing PlanningKpi shape).
//
// Org structure reuses the cascade defined in lib/perfMapping.ts:
//   Korporat → Direktorat (DIREKTUR) → SVP/Kompartemen (SVP_BY_DIREKTUR) →
//   VP/Departemen (VP_BY_SVP) → AVP/Staf (AVP_BY_VP, else "Staf …").
// -----------------------------------------------------------------------------

import { DIREKTUR, SVP_BY_DIREKTUR, VP_BY_SVP, AVP_BY_VP, type MapKpi } from "./perfMapping";
import type { PlanningKpi } from "./data";

export const KORPORAT_UNIT_KEY = "korporat";
export const KORPORAT_OWNER = "Pejabat Direktur Utama";

const numish = (v?: string) => Number(String(v ?? "").replace(/[^0-9.\-]/g, "")) || 0;

// Bridge a Performance Mapping corporate KPI (MapKpi) into an editable planning
// KPI. Deterministic id `korp-<mapId>` so re-syncing never duplicates. Brings the
// fields Mapping carries; the rest default and are completed via the Add-KPI form.
export function planningKpiFromMap(m: MapKpi, period: string): PlanningKpi {
  return {
    id: `korp-${m.id}`,
    group: "KPI Bersama",
    perspective: "Financial",
    strategicGoalId: undefined,
    name: m.kpi,
    definition: "",
    purpose: "",
    type: "Strategis",
    weight: numish(m.bobot),
    formula: "",
    hasConversion: false,
    conversions: [],
    measurement: m.pengukuran || "Exact",
    polarity: m.polaritas || "Maximize",
    frequency: m.frekuensi || "Monthly",
    cascadeType: "Fully Cascade A",
    consolidation: "Take Last Known",
    monthlyTargets: {},
    annualTarget: numish(m.target),
    dataSource: "",
    unit: m.satuan || "Persen",
    esgCriteria: m.esg ? [m.esg] : [],
    validity: "Exact",
    supportingFile: "",
    pic: KORPORAT_OWNER,
    dataManager: "",
    period,
  };
}

export type PlanLevel = "korporat" | "direktorat" | "manajemen" | "unit-kerja" | "individu";

export const PLAN_LEVELS: { key: PlanLevel; label: string; href: string }[] = [
  { key: "korporat", label: "Korporat", href: "/performance/planning/korporat" },
  { key: "direktorat", label: "Direktorat", href: "/performance/planning/direktorat" },
  { key: "manajemen", label: "Manajemen", href: "/performance/planning/manajemen" },
  { key: "unit-kerja", label: "Unit Kerja", href: "/performance/planning/unit-kerja" },
  { key: "individu", label: "Individu (AVP & Staf)", href: "/performance/planning/individu" },
];

export const planLevelLabel = (level: PlanLevel) => PLAN_LEVELS.find((l) => l.key === level)?.label ?? level;

// Levels that render as an accordion grouped by Direktorat (per the reference).
export const isAccordionLevel = (level: PlanLevel) =>
  level === "manajemen" || level === "unit-kerja" || level === "individu";

export interface PlanUnit {
  key: string; // stable id for the owner / KPI stores
  name: string; // display name (unprefixed)
  display: string; // display with any prefix (e.g. "Komp. …")
  directorate: string;
  parent?: string; // parent unit (SVP for VP, VP for AVP) — small context label
}

// VP → AVP targets; a VP with no AVP cascades to a unique "Staf …" node.
const targetsForVp = (vp: string): string[] =>
  AVP_BY_VP[vp]?.length ? AVP_BY_VP[vp] : [`Staf ${vp.replace(/^VP\s+/, "")}`];

export function unitsForLevel(level: PlanLevel): PlanUnit[] {
  switch (level) {
    case "korporat":
      return [{ key: "korporat", name: "Korporat", display: "KPI Korporat", directorate: "Korporat" }];
    case "direktorat":
      return DIREKTUR.map((d) => ({ key: `dir:${d}`, name: d, display: d, directorate: d }));
    case "manajemen":
      return DIREKTUR.flatMap((d) =>
        (SVP_BY_DIREKTUR[d] ?? []).map((svp) => ({
          key: `mnj:${d}:${svp}`, name: svp, display: `Komp. ${svp}`, directorate: d,
        }))
      );
    case "unit-kerja":
      return DIREKTUR.flatMap((d) =>
        (SVP_BY_DIREKTUR[d] ?? []).flatMap((svp) =>
          (VP_BY_SVP[svp] ?? []).map((vp) => ({
            key: `unt:${d}:${svp}:${vp}`, name: vp, display: vp, directorate: d, parent: svp,
          }))
        )
      );
    case "individu":
      return DIREKTUR.flatMap((d) =>
        (SVP_BY_DIREKTUR[d] ?? []).flatMap((svp) =>
          (VP_BY_SVP[svp] ?? []).flatMap((vp) =>
            targetsForVp(vp).map((avp) => ({
              key: `ind:${d}:${vp}:${avp}`, name: avp, display: avp, directorate: d, parent: vp,
            }))
          )
        )
      );
  }
}

// Group a level's units under their Direktorat (for the accordion).
export function unitsByDirektorat(level: PlanLevel): { directorate: string; units: PlanUnit[] }[] {
  const map = new Map<string, PlanUnit[]>();
  for (const u of unitsForLevel(level)) {
    if (!map.has(u.directorate)) map.set(u.directorate, []);
    map.get(u.directorate)!.push(u);
  }
  return [...map.entries()].map(([directorate, units]) => ({ directorate, units }));
}

// ---- Stores (localStorage via useLocalState → keys get the "nexus-" prefix) ----
export const PLAN_OWNERS_KEY = "planning-owners";
export const PLAN_UNIT_KPIS_KEY = "planning-unit-kpis";

export interface KpiOwner { name: string; npk: string }
export type OwnerMap = Record<string, KpiOwner>; // unitKey → owner
export type UnitKpiMap = Record<string, PlanningKpi[]>; // unitKey → its KPIs

export const ownerLabel = (o?: KpiOwner) =>
  o && o.name ? (o.npk ? `${o.name} – ${o.npk}` : o.name) : "";
