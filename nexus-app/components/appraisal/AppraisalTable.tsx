"use client";

import React from "react";
import { Icon } from "@/components/Icons";
import { cn } from "@/components/ui";
import { kpiPerspectives, type PlanningKpi } from "@/lib/data";
import {
  type PeriodSel, type RealizationMap, periodLabel, periodTarget, realizationKey, isActivePeriod,
} from "@/lib/perfRealization";
import {
  rowRatio, displayPct, kpiSkor, appraisalTotals, kpiCriteria, CRITERIA_LEGEND, type Criteria,
} from "@/lib/perfAppraisal";

const num = (v: number) => (v || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });

const barBg: Record<Criteria["tone"], string> = { red: "bg-rose-500", amber: "bg-amber-500", gold: "bg-yellow-400", green: "bg-emerald-500" };
const textTone: Record<Criteria["tone"], string> = { red: "text-rose-500", amber: "text-amber-500", gold: "text-yellow-500", green: "text-emerald-500" };

function Pencapaian({ kpi, ratio }: { kpi: PlanningKpi; ratio: number }) {
  const { pct, raw } = displayPct(kpi, ratio);
  const crit = kpiCriteria(pct);
  return (
    <div className="min-w-[130px]">
      <div className={cn("text-[12px] font-semibold", textTone[crit.tone])}>
        {pct}% <span className="font-normal text-[var(--muted)]">(A: {raw}%)</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className={cn("h-full rounded-full transition-all", barBg[crit.tone])} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

export function AppraisalTable({
  kpis, sel, realizations, onEdit,
}: {
  kpis: PlanningKpi[];
  sel: PeriodSel;
  realizations: RealizationMap;
  onEdit: (kpi: PlanningKpi) => void;
}) {
  const chips = (k: PlanningKpi) => [k.validity, k.cascadeType, k.type, k.polarity, k.consolidation, k.frequency].filter(Boolean);
  const totals = appraisalTotals(kpis, sel, realizations);
  const crit = kpiCriteria(totals.pencapaianPct);

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[1080px] text-[12.5px]">
        <thead>
          <tr className="bg-gradient-to-r from-royal-700 to-royal-600 text-left text-white">
            <th className="px-3 py-3 font-semibold">Perspektif</th>
            <th className="px-3 py-3 font-semibold">No</th>
            <th className="px-3 py-3 font-semibold">KPI</th>
            <th className="px-3 py-3 font-semibold">Satuan</th>
            <th className="px-3 py-3 text-right font-semibold">Target Tahunan</th>
            <th className="px-3 py-3 text-right font-semibold">Realisasi</th>
            <th className="px-3 py-2 text-center font-semibold" colSpan={2}>
              <div>s.d {periodLabel(sel)}</div>
              <div className="mt-1 grid grid-cols-2 gap-2 border-t border-white/20 pt-1 text-[11px] font-medium"><span>Target</span><span>Pencapaian</span></div>
            </th>
            <th className="px-3 py-3 text-right font-semibold">Bobot</th>
            <th className="px-3 py-3 text-right font-semibold">Skor</th>
            <th className="px-3 py-3 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {kpiPerspectives.map((persp) => {
            const rows = kpis.filter((k) => k.perspective === persp);
            if (!rows.length) return null;
            let subBobot = 0, subSkor = 0;
            const body = rows.map((k, i) => {
              const ratio = rowRatio(k, sel, realizations);
              const active = ratio !== null;
              const entry = realizations[realizationKey(k.id, sel)];
              const target = periodTarget(k, sel);
              const skor = active ? kpiSkor(k, ratio) : 0;
              if (active) { subBobot += k.weight || 0; subSkor += skor; }
              return (
                <tr key={k.id} className="group border-b align-top hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                  {i === 0 && <td rowSpan={rows.length} className="border-r px-3 py-3 font-semibold">{persp}</td>}
                  <td className="px-3 py-3 text-[var(--muted)]">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="font-semibold">{k.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {chips(k).map((c, j) => <span key={j} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[10px] text-royal-400">{c}</span>)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[var(--muted)]">{active ? k.unit : ""}</td>
                  <td className="px-3 py-3 text-right font-medium">{active ? num(k.annualTarget) : ""}</td>
                  <td className="px-3 py-3 text-right">{active ? (entry ? num(entry.value) : "—") : ""}</td>
                  {active ? (
                    <>
                      <td className="px-3 py-3 text-center font-medium">{num(target)}</td>
                      <td className="px-3 py-3"><Pencapaian kpi={k} ratio={ratio} /></td>
                    </>
                  ) : (
                    <td colSpan={2} className="px-3 py-3">
                      <div className="flex flex-col items-center gap-0.5 text-amber-500"><Icon.alert className="h-4 w-4" /><span className="text-[11px] font-semibold">Inactive</span></div>
                    </td>
                  )}
                  <td className="px-3 py-3 text-right font-semibold">{active ? num(k.weight) : ""}</td>
                  <td className="px-3 py-3 text-right font-bold">{active ? num(skor) : ""}</td>
                  <td className="px-3 py-3 text-center">
                    <button onClick={() => onEdit(k)} disabled={!active} title={active ? "Input Data / lihat" : "Tidak aktif pada periode ini"}
                      className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg transition", active ? "text-royal-400 hover:bg-royal-500/10" : "cursor-not-allowed text-[var(--muted)] opacity-40")}>
                      <Icon.performance className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            });
            return (
              <React.Fragment key={persp}>
                {body}
                <tr className="border-b bg-royal-500/10 font-semibold">
                  <td className="px-3 py-1.5 text-right text-[12px] text-[var(--muted)]" colSpan={8}>Subtotal</td>
                  <td className="px-3 py-1.5 text-right">{num(subBobot)}</td>
                  <td className="px-3 py-1.5 text-right">{num(subSkor)}</td>
                  <td />
                </tr>
              </React.Fragment>
            );
          })}
          {kpis.length === 0 && (
            <tr><td colSpan={11} className="px-3 py-10 text-center text-[13px] text-[var(--muted)]">Belum ada KPI pada unit/periode ini.</td></tr>
          )}
        </tbody>
        {kpis.length > 0 && (
          <tfoot>
            <tr className="bg-royal-600 text-white">
              <td className="px-3 py-2 text-right text-[13px] font-semibold" colSpan={8}>Total Bobot dan Skor</td>
              <td className="px-3 py-2 text-right text-[13px] font-bold">{num(totals.totalBobot)}</td>
              <td className="px-3 py-2 text-right text-[13px] font-bold">{num(totals.totalSkor)}</td>
              <td />
            </tr>
            <tr className="bg-royal-700 text-white">
              <td className="px-3 py-2 text-right text-[13px] font-semibold" colSpan={9}>Pencapaian Skor KPI (%)</td>
              <td className="px-3 py-2 text-right" colSpan={2}>
                <span className={cn("inline-block rounded-md px-2 py-0.5 text-[13px] font-bold", barBg[crit.tone], "text-white")}>{num(totals.pencapaianPct)}</span>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export function CriteriaLegend() {
  const swatch: Record<Criteria["tone"], string> = { red: "bg-rose-500", amber: "bg-amber-500", gold: "bg-yellow-400", green: "bg-emerald-500" };
  return (
    <div className="mt-4 inline-block overflow-hidden rounded-xl border">
      <table className="text-[12px]">
        <thead>
          <tr className="bg-royal-600 text-white">
            <th className="px-3 py-2 text-left font-semibold">Pencapaian (%)</th>
            <th className="px-3 py-2 text-left font-semibold">Kriteria Penilaian KPI</th>
          </tr>
        </thead>
        <tbody>
          {CRITERIA_LEGEND.map((r) => (
            <tr key={r.range} className="border-b last:border-0">
              <td className="border-r px-3 py-1.5 font-medium">{r.range}</td>
              <td className={cn("px-3 py-1.5 font-semibold text-white", swatch[r.c.tone])}>{r.c.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
