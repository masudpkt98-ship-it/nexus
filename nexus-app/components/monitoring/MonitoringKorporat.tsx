"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { RealisasiTable } from "@/components/monitoring/RealisasiTable";
import { RealisasiModal } from "@/components/monitoring/RealisasiModal";
import { PeriodControls } from "@/components/monitoring/PeriodControls";
import { ExportMenu } from "@/components/ExportMenu";
import { exportMonitoring, PERUSAHAAN, type ExportKind } from "@/lib/perfExport";
import { useLocalState } from "@/lib/useLocalState";
import { getStoredUser } from "@/lib/api";
import { type PlanningKpi } from "@/lib/data";
import {
  PLAN_UNIT_KPIS_KEY, type UnitKpiMap, KORPORAT_UNIT_KEY as UNIT,
  KORPORAT_OWNER_JABATAN, KORPORAT_OWNER_NAME, KORPORAT_OWNER_NPK, ownerLabel,
} from "@/lib/perfPlanning";
import {
  REALIZATION_KEY, type RealizationMap, type RealizationEntry, type PeriodSel,
  defaultPeriod, realizationKey, isActivePeriod, periodLabel,
} from "@/lib/perfRealization";

// Monitoring · Korporat — fill Realisasi for the corporate KPIs owned by the
// Direktur Utama. Reads the planned Korporat KPIs (kept in sync by Planning).
export function MonitoringKorporat() {
  const [kpiMap] = useLocalState<UnitKpiMap>(PLAN_UNIT_KPIS_KEY, {});
  const [realizations, setRealizations] = useLocalState<RealizationMap>(REALIZATION_KEY, {});
  const [sel, setSel] = useState<PeriodSel>(() => defaultPeriod("2026"));
  const [modal, setModal] = useState<{ kpi: PlanningKpi } | null>(null);

  const kpis = (kpiMap[UNIT] ?? []).filter((k) => k.period === sel.year);
  const filled = kpis.filter((k) => isActivePeriod(k, sel) && realizations[realizationKey(k.id, sel)]).length;
  const active = kpis.filter((k) => isActivePeriod(k, sel)).length;

  const saveEntry = (kpi: PlanningKpi, entry: RealizationEntry) =>
    setRealizations((m) => ({ ...m, [realizationKey(kpi.id, sel)]: entry }));
  const createdBy = () => { try { return getStoredUser<{ name?: string }>()?.name; } catch { return undefined; } };
  const onExport = (kind: ExportKind) => exportMonitoring(kind, "PERFORMANCE MONITORING", `nexus-monitoring-korporat-${sel.year}`, [
    { info: [["Perusahaan", PERUSAHAAN], ["Direktorat", "Utama"], ["Kompartemen", "KPI Korporat"], ["Periode", `Tahun ${sel.year} · ${periodLabel(sel)}`], ["Status", "—"]], kpis },
  ], sel, realizations);

  return (
    <>
      <Link href="/performance/monitoring" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> Performance Monitoring
      </Link>
      <PageHeader
        title="Pencapaian — Korporat"
        subtitle="Realisasi KPI Korporat (Owner: Direktur Utama) · Bulanan · Triwulanan · Semesteran · Tahunan"
        actions={
          <>
            <PeriodControls sel={sel} onChange={setSel} />
            <ExportMenu onSelect={onExport} />
            <Link href="/performance/planning/korporat" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium text-[var(--text)] transition hover:border-royal-500/50 hover:text-royal-400">
              <Icon.chevron className="h-3.5 w-3.5" /> Perencanaan
            </Link>
          </>
        }
      />

      {/* Owner banner */}
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-royal-500/25 bg-royal-500/5 px-4 py-2.5 text-[13px]">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-royal-500/15 text-royal-400"><Icon.users className="h-4 w-4" /></span>
        <div className="leading-tight">
          <div className="text-[var(--muted)]">KPI Owner: <span className="font-semibold text-[var(--text)]">{KORPORAT_OWNER_JABATAN}</span></div>
          <div className="text-[12px] font-medium">{ownerLabel({ name: KORPORAT_OWNER_NAME, npk: KORPORAT_OWNER_NPK })}</div>
        </div>
        <Badge tone={active > 0 && filled >= active ? "green" : filled > 0 ? "amber" : "gray"} className="ml-auto">Pencapaian: {filled}/{active} terisi</Badge>
      </div>

      {kpis.length === 0 ? (
        <Card className="text-center">
          <Icon.strategy className="mx-auto h-10 w-10 text-[var(--muted)]" />
          <p className="mt-2 text-[14px] font-medium">Belum ada KPI Korporat</p>
          <p className="mx-auto mt-1 max-w-lg text-[12px] text-[var(--muted)]">
            Lengkapi KPI Korporat di <Link href="/performance/planning/korporat" className="font-medium text-royal-400 hover:underline">Perencanaan — Korporat</Link> terlebih dulu; daftarnya akan muncul di sini untuk diisi realisasinya.
          </p>
        </Card>
      ) : (
        <RealisasiTable kpis={kpis} sel={sel} realizations={realizations} onEdit={(kpi) => setModal({ kpi })} />
      )}

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
