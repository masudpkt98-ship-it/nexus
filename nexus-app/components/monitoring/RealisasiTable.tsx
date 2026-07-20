"use client";

import React from "react";
import { Icon } from "@/components/Icons";
import { cn } from "@/components/ui";
import { kpiPerspectives, type PlanningKpi } from "@/lib/data";
import {
  type PeriodSel, type RealizationMap, periodLabel, periodTarget, achievementRatio,
  isActivePeriod, realizationKey,
} from "@/lib/perfRealization";

const num = (v: number) => (v || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });

function Achievement({ kpi, sel, realizations }: { kpi: PlanningKpi; sel: PeriodSel; realizations: RealizationMap }) {
  if (!isActivePeriod(kpi, sel)) {
    return (
      <div className="flex flex-col items-center gap-0.5 text-amber-500">
        <Icon.alert className="h-4 w-4" />
        <span className="text-[11px] font-semibold">Inactive</span>
      </div>
    );
  }
  const entry = realizations[realizationKey(kpi.id, sel)];
  const target = periodTarget(kpi, sel);
  const ratio = entry ? achievementRatio(entry.value, target, kpi.polarity || "Maximize") : 0;
  const pct = Math.round(ratio * 100);
  const capped = Math.max(0, Math.min(100, pct));
  const good = pct >= 100;
  return (
    <div className="min-w-[120px]">
      <div className={cn("text-[12px] font-semibold", good ? "text-emerald-500" : "text-[var(--muted)]")}>
        {pct}% <span className="font-normal text-[var(--muted)]">(A: {capped}%)</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className={cn("h-full rounded-full transition-all", good ? "bg-emerald-500" : "bg-royal-400/60")} style={{ width: `${capped}%` }} />
      </div>
    </div>
  );
}

export function RealisasiTable({
  kpis, sel, realizations, onEdit,
}: {
  kpis: PlanningKpi[];
  sel: PeriodSel;
  realizations: RealizationMap;
  onEdit: (kpi: PlanningKpi) => void;
}) {
  const chips = (k: PlanningKpi) => [k.validity, k.cascadeType, k.type, k.polarity, k.consolidation, k.frequency].filter(Boolean);
  const periodTitle = periodLabel(sel);

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[980px] text-[12.5px]">
        <thead>
          <tr className="bg-gradient-to-r from-royal-700 to-royal-600 text-left text-white">
            <th className="px-3 py-3 font-semibold">Perspektif</th>
            <th className="px-3 py-3 font-semibold">No</th>
            <th className="px-3 py-3 font-semibold">KPI</th>
            <th className="px-3 py-3 font-semibold">Satuan</th>
            <th className="px-3 py-3 text-right font-semibold">Target Tahunan</th>
            <th className="px-3 py-2 text-center font-semibold" colSpan={3}>
              <div className="text-center">Periode {periodTitle}</div>
              <div className="mt-1 grid grid-cols-3 gap-2 border-t border-white/20 pt-1 text-[11px] font-medium">
                <span>Realisasi</span><span>Target</span><span>Pencapaian</span>
              </div>
            </th>
            <th className="px-3 py-3 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {kpiPerspectives.map((persp) => {
            const rows = kpis.filter((k) => k.perspective === persp);
            if (!rows.length) return null;
            return (
              <React.Fragment key={persp}>
                {rows.map((k, i) => {
                  const active = isActivePeriod(k, sel);
                  const entry = realizations[realizationKey(k.id, sel)];
                  const target = periodTarget(k, sel);
                  return (
                    <tr key={k.id} className="group border-b last:border-0 align-top hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                      {i === 0 && (
                        <td rowSpan={rows.length} className="border-r px-3 py-3 font-semibold text-[var(--text)]">{persp}</td>
                      )}
                      <td className="px-3 py-3 text-[var(--muted)]">{i + 1}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold">{k.name}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {chips(k).map((c, j) => <span key={j} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[10px] text-royal-400">{c}</span>)}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-[var(--muted)]">{k.unit}</td>
                      <td className="px-3 py-3 text-right font-semibold">{num(k.annualTarget)}</td>
                      <td className="px-3 py-3 text-center font-semibold">{active ? (entry ? num(entry.value) : "—") : ""}</td>
                      <td className="px-3 py-3 text-center font-medium">{active ? num(target) : ""}</td>
                      <td className="px-3 py-3"><Achievement kpi={k} sel={sel} realizations={realizations} /></td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => onEdit(k)}
                          disabled={!active}
                          title={active ? "Isi Realisasi" : "Tidak aktif pada periode ini"}
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-lg transition",
                            active ? "text-royal-400 hover:bg-royal-500/10" : "cursor-not-allowed text-[var(--muted)] opacity-40"
                          )}
                        >
                          <Icon.filter className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
          {kpis.length === 0 && (
            <tr><td colSpan={9} className="px-3 py-10 text-center text-[13px] text-[var(--muted)]">Belum ada KPI pada unit/periode ini. Rencanakan dulu di Performance Planning.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
