"use client";

import React from "react";
import { GRANS, subPeriods, type PeriodSel, type Gran } from "@/lib/perfRealization";

const selCls = "rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500";

// Year + Granularity + sub-period pickers for the Realisasi views.
export function PeriodControls({
  sel, onChange, years = ["2026", "2027"],
}: {
  sel: PeriodSel;
  onChange: (s: PeriodSel) => void;
  years?: string[];
}) {
  const subs = subPeriods(sel.gran);
  const setGran = (gran: Gran) => {
    const first = subPeriods(gran)[0]?.idx ?? 0;
    // keep the current index when still valid (e.g. month 6 → same), else first.
    const stillValid = subPeriods(gran).some((s) => s.idx === sel.idx);
    onChange({ ...sel, gran, idx: stillValid ? sel.idx : first });
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[12px] text-[var(--muted)]">Periode KPI</span>
      <select value={sel.year} onChange={(e) => onChange({ ...sel, year: e.target.value })} className={selCls}>
        {years.map((y) => <option key={y} value={y}>Tahun {y}</option>)}
      </select>
      <select value={sel.gran} onChange={(e) => setGran(e.target.value as Gran)} className={selCls}>
        {GRANS.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
      {sel.gran !== "Tahunan" && (
        <select value={sel.idx} onChange={(e) => onChange({ ...sel, idx: Number(e.target.value) })} className={selCls}>
          {subs.map((s) => <option key={s.idx} value={s.idx}>{s.label}</option>)}
        </select>
      )}
    </div>
  );
}
