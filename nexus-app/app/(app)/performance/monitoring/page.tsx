"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icons";
import { RealisasiTable } from "@/components/monitoring/RealisasiTable";
import { RealisasiModal } from "@/components/monitoring/RealisasiModal";
import { PeriodControls } from "@/components/monitoring/PeriodControls";
import { ExportMenu } from "@/components/ExportMenu";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { getStoredUser, apiListRealizations, apiSaveRealization } from "@/lib/api";
import { useApiAuthed } from "@/lib/auth";
import { planningKpis as seedPlanning, type PlanningKpi } from "@/lib/data";
import {
  REALIZATION_KEY, type RealizationMap, type RealizationEntry, type PeriodSel,
  defaultPeriod, realizationKey, realizationMapKey, slotKey, entryFromRow, periodLabel, MONITOR_LEVELS,
} from "@/lib/perfRealization";
import { exportMonitoring, PERUSAHAAN, type ExportKind } from "@/lib/perfExport";

export default function PerformanceMonitoringPage() {
  const { t } = useI18n();
  const [kpis] = useLocalState<PlanningKpi[]>("planning-kpis", seedPlanning);
  const [realizations, setRealizations] = useLocalState<RealizationMap>(REALIZATION_KEY, {});
  const [sel, setSel] = useState<PeriodSel>(() => defaultPeriod("2026"));
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ kpi: PlanningKpi } | null>(null);

  const authed = useApiAuthed();
  const rows = kpis.filter((k) => k.period === sel.year && (!search.trim() || `${k.name} ${k.unit}`.toLowerCase().includes(search.trim().toLowerCase())));

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    apiListRealizations(sel.year).then((list) => {
      if (!alive || !list.length) return;
      setRealizations((m) => { const next = { ...m }; for (const r of list) next[realizationMapKey(r.kpi_id, r.slot)] = entryFromRow(r); return next; });
    }).catch(() => { /* offline → keep local cache */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, sel.year]);

  const saveEntry = (kpi: PlanningKpi, entry: RealizationEntry) => {
    setRealizations((m) => ({ ...m, [realizationKey(kpi.id, sel)]: entry }));
    if (!authed) return;
    apiSaveRealization({
      kpi_id: kpi.id, slot: slotKey(sel), year: sel.year, unit_key: "recap",
      value: entry.value, evidence_type: entry.evidenceType ?? null,
      evidence: entry.evidence ?? null, evidence_name: entry.evidenceName ?? null, note: entry.note ?? null,
    }).catch((e: { status?: number }) => { if (e?.status === 403) alert("Ditolak server: hanya admin yang dapat mengisi Realisasi di halaman rekap."); });
  };
  const createdBy = () => { try { return getStoredUser<{ name?: string }>()?.name; } catch { return undefined; } };
  const onExport = (kind: ExportKind) => exportMonitoring(kind, "PERFORMANCE MONITORING", `nexus-monitoring-${sel.year}`, [
    { info: [["Perusahaan", PERUSAHAAN], ["Periode", `Tahun ${sel.year} · ${periodLabel(sel)}`], ["Status", "—"]], kpis: rows },
  ], sel, realizations);

  return (
    <>
      <Link href="/performance" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Performance Management")}
      </Link>
      <PageHeader
        title="Performance Monitoring"
        subtitle="Rekap Realisasi KPI · Bulanan · Triwulanan · Semesteran · Tahunan"
        actions={<><PeriodControls sel={sel} onChange={setSel} /><ExportMenu onSelect={onExport} /></>}
      />

      {/* Per-level entry points (identical structure to Planning) */}
      <div className="mb-4 flex flex-wrap gap-2">
        {MONITOR_LEVELS.map((lv) => (
          <Link key={lv.key} href={lv.href} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium text-[var(--text)] transition hover:border-royal-500/50 hover:text-royal-400">
            <Icon.target className="h-3.5 w-3.5 text-royal-400" /> {lv.label}
          </Link>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search KPI…" className="ml-auto w-56 rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[12px] text-[var(--text)] outline-none focus:border-royal-500" />
      </div>

      <RealisasiTable kpis={rows} sel={sel} realizations={realizations} onEdit={(kpi) => setModal({ kpi })} />

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
