"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icons";
import { AppraisalTable, CriteriaLegend } from "@/components/appraisal/AppraisalTable";
import { RealisasiModal } from "@/components/monitoring/RealisasiModal";
import { PeriodControls } from "@/components/monitoring/PeriodControls";
import { ExportMenu } from "@/components/ExportMenu";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { getStoredUser } from "@/lib/api";
import { planningKpis as seedPlanning, type PlanningKpi } from "@/lib/data";
import {
  REALIZATION_KEY, type RealizationMap, type RealizationEntry, type PeriodSel,
  defaultPeriod, realizationKey, periodLabel,
} from "@/lib/perfRealization";
import { APPRAISAL_LEVELS } from "@/lib/perfAppraisal";
import { exportAppraisal, PERUSAHAAN, type ExportKind } from "@/lib/perfExport";

export default function PerformanceAppraisalPage() {
  const { t } = useI18n();
  const [kpis] = useLocalState<PlanningKpi[]>("planning-kpis", seedPlanning);
  const [realizations, setRealizations] = useLocalState<RealizationMap>(REALIZATION_KEY, {});
  const [sel, setSel] = useState<PeriodSel>(() => defaultPeriod("2026"));
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ kpi: PlanningKpi } | null>(null);

  const rows = kpis.filter((k) => k.period === sel.year && (!search.trim() || `${k.name} ${k.unit}`.toLowerCase().includes(search.trim().toLowerCase())));
  const saveEntry = (kpi: PlanningKpi, entry: RealizationEntry) => setRealizations((m) => ({ ...m, [realizationKey(kpi.id, sel)]: entry }));
  const createdBy = () => { try { return getStoredUser<{ name?: string }>()?.name; } catch { return undefined; } };
  const onExport = (kind: ExportKind) => exportAppraisal(kind, "PERFORMANCE APPRAISAL", `nexus-appraisal-${sel.year}`, [
    { info: [["Perusahaan", PERUSAHAAN], ["Periode", `Tahun ${sel.year} · ${periodLabel(sel)}`], ["Status", "—"]], kpis: rows },
  ], sel, realizations);

  return (
    <>
      <Link href="/performance" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Performance Management")}
      </Link>
      <PageHeader
        title="Performance Appraisal"
        subtitle="Penilaian KPI (Bobot × Pencapaian) + PBI · Bulanan · Triwulanan · Semesteran · Tahunan"
        actions={<><PeriodControls sel={sel} onChange={setSel} /><ExportMenu onSelect={onExport} /></>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {APPRAISAL_LEVELS.map((lv) => (
          <Link key={lv.key} href={lv.href} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium text-[var(--text)] transition hover:border-royal-500/50 hover:text-royal-400">
            <Icon.target className="h-3.5 w-3.5 text-royal-400" /> {lv.label}
          </Link>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search KPI…" className="ml-auto w-56 rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[12px] text-[var(--text)] outline-none focus:border-royal-500" />
      </div>

      <AppraisalTable kpis={rows} sel={sel} realizations={realizations} onEdit={(kpi) => setModal({ kpi })} />
      <CriteriaLegend />

      {modal && (
        <RealisasiModal
          kpi={modal.kpi}
          sel={sel}
          entry={realizations[realizationKey(modal.kpi.id, sel)]}
          createdByDefault={createdBy()}
          onSave={(e) => saveEntry(modal.kpi, e)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
