"use client";
// Which KPI names are already used in Performance Planning / Mapping — so the
// Job Profile can mark KPIs that have been picked. Matched by normalized name
// (that's the field carried over when a KPI is picked from the Job Profile).

const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

function read(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}

/** Set of normalized KPI names present in Planning (recap + per-unit) and Mapping. */
export function usedKpiNames(): Set<string> {
  const set = new Set<string>();
  const add = (name: unknown) => { const n = norm(String(name ?? "")); if (n) set.add(n); };

  const recap = read("planning-kpis");
  if (Array.isArray(recap)) for (const k of recap) add((k as { name?: string })?.name);

  const unit = read("planning-unit-kpis");
  if (unit && typeof unit === "object") {
    for (const list of Object.values(unit as Record<string, unknown>)) {
      if (Array.isArray(list)) for (const k of list) add((k as { name?: string })?.name);
    }
  }

  const mapping = read("perf-mapping") as { kpis?: unknown } | null;
  if (mapping && Array.isArray(mapping.kpis)) for (const k of mapping.kpis) add((k as { kpi?: string })?.kpi);

  return set;
}

export const isKpiUsed = (used: Set<string>, name: string) => used.has(norm(name));
