"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Icon } from "@/components/Icons";
import { cn } from "@/components/ui";
import { KpiFormModal } from "@/components/planning/KpiFormModal";
import {
  planningKpis as seedPlanning, strategicGoals as seedGoals, kpiGroups,
  type PlanningKpi, type StrategicGoal,
} from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { PLAN_LEVELS } from "@/lib/perfPlanning";
import { ExportMenu } from "@/components/ExportMenu";
import { exportPlanning, PERUSAHAAN, type ExportKind } from "@/lib/perfExport";

export default function PerformancePlanningPage() {
  const { t } = useI18n();
  const [kpis, setKpis] = useLocalState<PlanningKpi[]>("planning-kpis", seedPlanning);
  const [goals] = useLocalState<StrategicGoal[]>("strategy-goals-2026", seedGoals);
  const [period, setPeriod] = useState("2026");
  const [search, setSearch] = useState("");
  // undefined = closed · null = create · kpi = edit
  const [editing, setEditing] = useState<PlanningKpi | null | undefined>(undefined);

  const objectiveOf = (k: PlanningKpi) => goals.find((g) => g.id === k.strategicGoalId)?.title || k.strategicGoalText;
  const periods = useMemo(() => Array.from(new Set([period, "2026", "2027", ...kpis.map((k) => k.period)])).sort().reverse(), [kpis, period]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return kpis.filter((k) => k.period === period && (!q || `${k.name} ${k.unit} ${objectiveOf(k) ?? ""}`.toLowerCase().includes(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpis, period, search]);
  const totalWeight = rows.reduce((s, k) => s + (k.weight || 0), 0);

  const saveKpi = (k: PlanningKpi) => { setKpis((l) => (l.some((x) => x.id === k.id) ? l.map((x) => (x.id === k.id ? k : x)) : [...l, k])); setEditing(undefined); };
  const remove = (k: PlanningKpi) => { if (confirm(`${t("Delete")} “${k.name}”?`)) setKpis((l) => l.filter((x) => x.id !== k.id)); };

  const onExport = (kind: ExportKind) => {
    const list = kpis.filter((k) => k.period === period);
    exportPlanning(kind, "PERFORMANCE PLANNING", `nexus-planning-${period}`, [
      { info: [["Perusahaan", PERUSAHAAN], ["Periode", `Tahun ${period}`], ["Status", "—"]], kpis: list },
    ]);
  };

  const chips = (k: PlanningKpi) => [k.validity, k.cascadeType, k.polarity, k.consolidation, k.frequency, k.type].filter(Boolean);

  return (
    <>
      <Link href="/performance" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Performance Management")}
      </Link>
      <PageHeader
        title="Performance Planning"
        subtitle="Rekap KPI · Balanced Scorecard · Cascading · Target Bulanan"
        actions={
          <>
            <label className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">{t("Period")}
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border bg-[rgb(var(--surface))] px-2 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
                {periods.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
            </label>
            <ExportMenu onSelect={onExport} />
            <Btn variant="primary" onClick={() => setEditing(null)}><Icon.plus className="h-4 w-4" /> {t("Add KPI")}</Btn>
          </>
        }
      />

      {/* Per-level planning entry points */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PLAN_LEVELS.map((lv) => (
          <Link key={lv.key} href={lv.href} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium text-[var(--text)] transition hover:border-royal-500/50 hover:text-royal-400">
            <Icon.target className="h-3.5 w-3.5 text-royal-400" /> {lv.label}
          </Link>
        ))}
      </div>

      <div className={cn("mb-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px]", totalWeight === 100 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-amber-500/30 bg-amber-500/10 text-amber-500")}>
        <Icon.performance className="h-4 w-4" />
        {t("Total weight")}: <span className="font-bold">{totalWeight}</span> / 100
        {totalWeight !== 100 && <span className="text-[var(--muted)]">· {t("weights should total 100")}</span>}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search KPI…")} className="ml-auto w-56 rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1 text-[12px] text-[var(--text)] outline-none focus:border-royal-500" />
      </div>

      <div className="glass card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">No</th>
                <th className="px-4 py-3 font-medium">KPI</th>
                <th className="px-4 py-3 font-medium">{t("Unit")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("Target")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("Weight (%)")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {kpiGroups.map((grp) => {
                const gRows = rows.filter((k) => k.group === grp);
                if (gRows.length === 0) return null;
                const sub = gRows.reduce((s, k) => s + (k.weight || 0), 0);
                return (
                  <React.Fragment key={grp}>
                    <tr className="bg-royal-500/5"><td colSpan={6} className="px-4 py-2 text-[12px] font-semibold text-royal-400">{grp}</td></tr>
                    {gRows.map((k, i) => (
                      <tr key={k.id} dir="auto" className="group border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="px-4 py-3 align-top text-xs text-[var(--muted)]">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{k.name}</div>
                          {objectiveOf(k) && <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-violet-400"><Icon.strategy className="h-2.5 w-2.5" /> {objectiveOf(k)}</div>}
                          <div className="mt-1 flex flex-wrap gap-1">
                            {chips(k).map((c, j) => <span key={j} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[10px] text-royal-400">{c}</span>)}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-[var(--muted)]">{k.unit}</td>
                        <td className="px-4 py-3 text-right align-top font-medium">{k.annualTarget?.toLocaleString("id")}</td>
                        <td className="px-4 py-3 text-right align-top font-semibold">{k.weight}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center justify-end gap-2 text-[11px] opacity-0 transition group-hover:opacity-100">
                            <button onClick={() => setEditing(k)} title={t("Edit")} className="font-medium text-[var(--muted)] hover:text-royal-400">{t("Edit")}</button>
                            <button onClick={() => remove(k)} title={t("Delete")} className="text-[var(--muted)] hover:text-rose-400">✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b bg-black/[0.03] dark:bg-white/[0.03]"><td colSpan={4} className="px-4 py-1.5 text-right text-[12px] font-medium text-[var(--muted)]">{t("Subtotal")}</td><td className="px-4 py-1.5 text-right text-[12px] font-bold">{sub}</td><td /></tr>
                  </React.Fragment>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">{t("No KPIs yet. Add one.")}</td></tr>}
            </tbody>
            {rows.length > 0 && (
              <tfoot><tr className="bg-royal-500/10"><td colSpan={4} className="px-4 py-2 text-right text-[13px] font-semibold">{t("Total weight")}</td><td className="px-4 py-2 text-right text-[13px] font-bold">{totalWeight}</td><td /></tr></tfoot>
            )}
          </table>
        </div>
      </div>

      {editing !== undefined && (
        <KpiFormModal initial={editing} period={period} goals={goals} onSave={saveKpi} onClose={() => setEditing(undefined)} />
      )}
    </>
  );
}
