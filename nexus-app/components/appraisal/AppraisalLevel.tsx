"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { AppraisalTable, CriteriaLegend } from "@/components/appraisal/AppraisalTable";
import { PbiTable } from "@/components/appraisal/PbiTable";
import { RealisasiModal } from "@/components/monitoring/RealisasiModal";
import { PeriodControls } from "@/components/monitoring/PeriodControls";
import { useLocalState } from "@/lib/useLocalState";
import { getStoredUser } from "@/lib/api";
import { type PlanningKpi } from "@/lib/data";
import {
  type PlanLevel, isAccordionLevel, unitsForLevel, unitsByDirektorat,
  PLAN_OWNERS_KEY, PLAN_UNIT_KPIS_KEY, type OwnerMap, type UnitKpiMap, ownerLabel,
} from "@/lib/perfPlanning";
import {
  REALIZATION_KEY, type RealizationMap, type RealizationEntry, type PeriodSel,
  defaultPeriod, realizationKey,
} from "@/lib/perfRealization";
import {
  APPRAISAL_STATUS_KEY, type AppraisalStatusMap, defaultStatus,
  APPRAISAL_PBI_KEY, type PbiScoreMap, type PbiScore, pbiKey,
  appraisalTotals, appraisalLevelLabel,
} from "@/lib/perfAppraisal";

export function AppraisalLevel({ level }: { level: PlanLevel }) {
  const [owners] = useLocalState<OwnerMap>(PLAN_OWNERS_KEY, {});
  const [kpiMap] = useLocalState<UnitKpiMap>(PLAN_UNIT_KPIS_KEY, {});
  const [realizations, setRealizations] = useLocalState<RealizationMap>(REALIZATION_KEY, {});
  const [statusMap, setStatusMap] = useLocalState<AppraisalStatusMap>(APPRAISAL_STATUS_KEY, {});
  const [pbi, setPbi] = useLocalState<PbiScoreMap>(APPRAISAL_PBI_KEY, {});
  const [sel, setSel] = useState<PeriodSel>(() => defaultPeriod("2026"));
  const [modal, setModal] = useState<{ kpi: PlanningKpi } | null>(null);

  const groups = useMemo(
    () => (isAccordionLevel(level) ? unitsByDirektorat(level) : [{ directorate: "", units: unitsForLevel(level) }]),
    [level]
  );
  const [openDir, setOpenDir] = useState<Record<string, boolean>>(() => (groups.length ? { [groups[0].directorate]: true } : {}));
  const [openUnit, setOpenUnit] = useState<string | null>(null);

  const unitKpis = (key: string) => (kpiMap[key] ?? []).filter((k) => k.period === sel.year);
  const saveEntry = (kpi: PlanningKpi, entry: RealizationEntry) => setRealizations((m) => ({ ...m, [realizationKey(kpi.id, sel)]: entry }));
  const createdBy = () => { try { return getStoredUser<{ name?: string }>()?.name; } catch { return undefined; } };

  const status = (key: string) => statusMap[key] ?? defaultStatus();
  const approve = (key: string) => setStatusMap((m) => ({ ...m, [key]: { status: "Approved", version: (m[key]?.version ?? 0) + 1 } }));
  const reverse = (key: string) => setStatusMap((m) => ({ ...m, [key]: { status: "Drafted", version: m[key]?.version ?? 1 } }));

  const setPbiScore = (unitKey: string, pbiId: string, field: keyof PbiScore, value: number) =>
    setPbi((m) => ({ ...m, [pbiKey(unitKey, pbiId)]: { ...m[pbiKey(unitKey, pbiId)], [field]: value } }));

  return (
    <>
      <Link href="/performance/appraisal" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> Performance Appraisal
      </Link>
      <PageHeader
        title={`Penilaian — ${appraisalLevelLabel(level)}`}
        subtitle="Penilaian KPI (Bobot × Pencapaian) + PBI · Bulanan · Triwulanan · Semesteran · Tahunan"
        actions={
          <>
            <PeriodControls sel={sel} onChange={setSel} />
            <Link href={`/performance/monitoring/${level}`} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium text-[var(--text)] transition hover:border-royal-500/50 hover:text-royal-400">
              <Icon.chevron className="h-3.5 w-3.5" /> Pencapaian
            </Link>
          </>
        }
      />

      <div className="space-y-3">
        {groups.map((g) => {
          const accordion = isAccordionLevel(level);
          const open = accordion ? !!openDir[g.directorate] : true;
          return (
            <Card key={g.directorate || "flat"} className="overflow-hidden p-0">
              {accordion && (
                <button
                  onClick={() => setOpenDir((s) => ({ ...s, [g.directorate]: !s[g.directorate] }))}
                  className="flex w-full items-center gap-2 bg-gradient-to-r from-royal-700 to-royal-600 px-4 py-2.5 text-left text-white"
                >
                  <span className="flex-1 text-[13px] font-semibold">{g.directorate}</span>
                  <Badge tone="blue" className="!bg-white/15 !text-white !border-white/20">{g.units.length}</Badge>
                  <Icon.chevron className={cn("h-4 w-4 transition-transform", open ? "rotate-90" : "")} />
                </button>
              )}
              {open && (
                <div className="divide-y">
                  {g.units.map((u) => {
                    const owner = owners[u.key];
                    const kpis = unitKpis(u.key);
                    const expanded = openUnit === u.key;
                    const st = status(u.key);
                    const totals = appraisalTotals(kpis, sel, realizations);
                    return (
                      <div key={u.key}>
                        <div className="flex items-center gap-3 px-4 py-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-royal-500/12 text-royal-400"><Icon.users className="h-4 w-4" /></span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold">{u.display}</div>
                            {owner?.name ? (
                              <div className="mt-0.5 leading-tight">
                                <span className="text-[12px] text-[var(--muted)]">KPI Owner: <span className="font-medium text-[var(--text)]">{owner.jabatan || u.name}</span></span>
                                <span className="block text-[12px] font-medium text-[var(--text)]">{ownerLabel(owner)}</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-[var(--muted)]">{u.parent || "Belum ada KPI Owner"}</div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[11px] text-[var(--muted)]">Status Pencapaian</span>
                            <Badge tone={st.status === "Approved" ? "green" : "amber"}>{st.status} (V {st.version}.0)</Badge>
                          </div>
                          <div className="ml-1 hidden text-right sm:block">
                            <div className="text-[11px] text-[var(--muted)]">Skor KPI</div>
                            <div className="text-[15px] font-bold text-royal-500">{totals.pencapaianPct.toLocaleString("id-ID")}%</div>
                          </div>
                          <button onClick={() => setOpenUnit(expanded ? null : u.key)} title="Lihat penilaian"
                            className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition", expanded ? "bg-royal-500" : "bg-emerald-500 hover:bg-emerald-600")}>
                            <Icon.chevron className={cn("h-5 w-5 transition-transform", expanded ? "rotate-90" : "")} />
                          </button>
                        </div>

                        {expanded && (
                          <div className="space-y-4 border-t bg-black/[0.02] px-4 py-3 dark:bg-white/[0.02]">
                            <div className="flex flex-wrap items-center gap-2">
                              {st.status === "Approved"
                                ? <Btn variant="ghost" onClick={() => reverse(u.key)}><Icon.chevron className="h-4 w-4 rotate-180" /> Reverse</Btn>
                                : <Btn variant="primary" onClick={() => approve(u.key)}><Icon.check className="h-4 w-4" /> Approval</Btn>}
                            </div>
                            <AppraisalTable kpis={kpis} sel={sel} realizations={realizations} onEdit={(kpi) => setModal({ kpi })} />
                            <div>
                              <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--muted)]">PBI · {u.name}</div>
                              <PbiTable unitKey={u.key} scores={pbi} onChange={(id, f, v) => setPbiScore(u.key, id, f, v)} finalPct={totals.pencapaianPct} />
                            </div>
                            <CriteriaLegend />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

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
