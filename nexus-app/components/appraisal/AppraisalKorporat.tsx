"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { AppraisalTable, CriteriaLegend } from "@/components/appraisal/AppraisalTable";
import { PbiTable } from "@/components/appraisal/PbiTable";
import { RealisasiModal } from "@/components/monitoring/RealisasiModal";
import { PeriodControls } from "@/components/monitoring/PeriodControls";
import { ExportMenu } from "@/components/ExportMenu";
import { exportAppraisal, PERUSAHAAN, type ExportKind } from "@/lib/perfExport";
import { useLocalState } from "@/lib/useLocalState";
import { getStoredUser } from "@/lib/api";
import { type PlanningKpi } from "@/lib/data";
import {
  PLAN_UNIT_KPIS_KEY, type UnitKpiMap, KORPORAT_UNIT_KEY as UNIT,
  KORPORAT_OWNER_JABATAN, KORPORAT_OWNER_NAME, KORPORAT_OWNER_NPK, ownerLabel,
} from "@/lib/perfPlanning";
import {
  REALIZATION_KEY, type RealizationMap, type RealizationEntry, type PeriodSel,
  defaultPeriod, realizationKey, periodLabel,
} from "@/lib/perfRealization";
import {
  APPRAISAL_STATUS_KEY, type AppraisalStatusMap, defaultStatus,
  APPRAISAL_PBI_KEY, type PbiScoreMap, type PbiScore, pbiKey, appraisalTotals,
} from "@/lib/perfAppraisal";

export function AppraisalKorporat() {
  const [kpiMap] = useLocalState<UnitKpiMap>(PLAN_UNIT_KPIS_KEY, {});
  const [realizations, setRealizations] = useLocalState<RealizationMap>(REALIZATION_KEY, {});
  const [statusMap, setStatusMap] = useLocalState<AppraisalStatusMap>(APPRAISAL_STATUS_KEY, {});
  const [pbi, setPbi] = useLocalState<PbiScoreMap>(APPRAISAL_PBI_KEY, {});
  const [sel, setSel] = useState<PeriodSel>(() => defaultPeriod("2026"));
  const [modal, setModal] = useState<{ kpi: PlanningKpi } | null>(null);

  const kpis = (kpiMap[UNIT] ?? []).filter((k) => k.period === sel.year);
  const totals = appraisalTotals(kpis, sel, realizations);
  const st = statusMap[UNIT] ?? defaultStatus();

  const saveEntry = (kpi: PlanningKpi, entry: RealizationEntry) => setRealizations((m) => ({ ...m, [realizationKey(kpi.id, sel)]: entry }));
  const createdBy = () => { try { return getStoredUser<{ name?: string }>()?.name; } catch { return undefined; } };
  const approve = () => setStatusMap((m) => ({ ...m, [UNIT]: { status: "Approved", version: (m[UNIT]?.version ?? 0) + 1 } }));
  const reverse = () => setStatusMap((m) => ({ ...m, [UNIT]: { status: "Drafted", version: m[UNIT]?.version ?? 1 } }));
  const setPbiScore = (pbiId: string, field: keyof PbiScore, value: number) =>
    setPbi((m) => ({ ...m, [pbiKey(UNIT, pbiId)]: { ...m[pbiKey(UNIT, pbiId)], [field]: value } }));
  const onExport = (kind: ExportKind) => exportAppraisal(kind, "PERFORMANCE APPRAISAL", `nexus-appraisal-korporat-${sel.year}`, [
    { info: [["Perusahaan", PERUSAHAAN], ["Direktorat", "Utama"], ["Kompartemen", "KPI Korporat"], ["Periode", `Tahun ${sel.year} · ${periodLabel(sel)}`], ["Status", st.status]], kpis },
  ], sel, realizations);

  return (
    <>
      <Link href="/performance/appraisal" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> Performance Appraisal
      </Link>
      <PageHeader
        title="Penilaian — Korporat"
        subtitle="Penilaian KPI Korporat (Owner: Direktur Utama) + PBI"
        actions={
          <>
            <PeriodControls sel={sel} onChange={setSel} />
            {st.status === "Approved"
              ? <Btn variant="ghost" onClick={reverse}><Icon.chevron className="h-4 w-4 rotate-180" /> Reverse</Btn>
              : <Btn variant="primary" onClick={approve}><Icon.check className="h-4 w-4" /> Approval</Btn>}
            <ExportMenu onSelect={onExport} />
            <Link href="/performance/monitoring/korporat" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium text-[var(--text)] transition hover:border-royal-500/50 hover:text-royal-400">
              <Icon.chevron className="h-3.5 w-3.5" /> Pencapaian
            </Link>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-royal-500/25 bg-royal-500/5 px-4 py-2.5 text-[13px]">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-royal-500/15 text-royal-400"><Icon.users className="h-4 w-4" /></span>
        <div className="leading-tight">
          <div className="text-[var(--muted)]">KPI Owner: <span className="font-semibold text-[var(--text)]">{KORPORAT_OWNER_JABATAN}</span></div>
          <div className="text-[12px] font-medium">{ownerLabel({ name: KORPORAT_OWNER_NAME, npk: KORPORAT_OWNER_NPK })}</div>
        </div>
        <span className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-[var(--muted)]">Status Pencapaian</span>
          <Badge tone={st.status === "Approved" ? "green" : "amber"}>{st.status} (V {st.version}.0)</Badge>
        </span>
      </div>

      {kpis.length === 0 ? (
        <Card className="text-center">
          <Icon.strategy className="mx-auto h-10 w-10 text-[var(--muted)]" />
          <p className="mt-2 text-[14px] font-medium">Belum ada KPI Korporat</p>
          <p className="mx-auto mt-1 max-w-lg text-[12px] text-[var(--muted)]">
            Lengkapi KPI di <Link href="/performance/planning/korporat" className="font-medium text-royal-400 hover:underline">Perencanaan — Korporat</Link> dan isi realisasinya di <Link href="/performance/monitoring/korporat" className="font-medium text-royal-400 hover:underline">Pencapaian — Korporat</Link>.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <AppraisalTable kpis={kpis} sel={sel} realizations={realizations} onEdit={(kpi) => setModal({ kpi })} />
          <div>
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--muted)]">PBI · Korporat</div>
            <PbiTable unitKey={UNIT} scores={pbi} onChange={setPbiScore} finalPct={totals.pencapaianPct} />
          </div>
          <CriteriaLegend />
        </div>
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
