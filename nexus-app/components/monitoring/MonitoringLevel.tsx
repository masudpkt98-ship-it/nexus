"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
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
  type PlanLevel, isAccordionLevel, unitsForLevel, unitsByDirektorat,
  PLAN_OWNERS_KEY, PLAN_UNIT_KPIS_KEY, type OwnerMap, type UnitKpiMap, ownerLabel,
} from "@/lib/perfPlanning";
import {
  REALIZATION_KEY, type RealizationMap, type RealizationEntry, type PeriodSel,
  defaultPeriod, monitorLevelLabel, realizationKey, isActivePeriod, periodLabel,
} from "@/lib/perfRealization";

export function MonitoringLevel({ level }: { level: PlanLevel }) {
  const [owners] = useLocalState<OwnerMap>(PLAN_OWNERS_KEY, {});
  const [kpiMap] = useLocalState<UnitKpiMap>(PLAN_UNIT_KPIS_KEY, {});
  const [realizations, setRealizations] = useLocalState<RealizationMap>(REALIZATION_KEY, {});
  const [sel, setSel] = useState<PeriodSel>(() => defaultPeriod("2026"));
  const [modal, setModal] = useState<{ kpi: PlanningKpi } | null>(null);

  const groups = useMemo(
    () => (isAccordionLevel(level) ? unitsByDirektorat(level) : [{ directorate: "", units: unitsForLevel(level) }]),
    [level]
  );
  const [openDir, setOpenDir] = useState<Record<string, boolean>>(() => (groups.length ? { [groups[0].directorate]: true } : {}));
  const [openUnit, setOpenUnit] = useState<string | null>(null);

  const unitKpis = (key: string) => (kpiMap[key] ?? []).filter((k) => k.period === sel.year);

  const saveEntry = (kpi: PlanningKpi, entry: RealizationEntry) =>
    setRealizations((m) => ({ ...m, [realizationKey(kpi.id, sel)]: entry }));

  const filledCount = (kpis: PlanningKpi[]) =>
    kpis.filter((k) => isActivePeriod(k, sel) && realizations[realizationKey(k.id, sel)]).length;
  const activeCount = (kpis: PlanningKpi[]) => kpis.filter((k) => isActivePeriod(k, sel)).length;

  const createdBy = () => { try { return getStoredUser<{ name?: string }>()?.name; } catch { return undefined; } };

  const onExport = (kind: ExportKind) => {
    const sections = unitsForLevel(level)
      .map((u) => ({ u, list: unitKpis(u.key) }))
      .filter((s) => s.list.length)
      .map(({ u, list }) => ({
        info: [["Perusahaan", PERUSAHAAN], ["Direktorat", u.directorate], [u.parent ? "Unit Kerja" : "Kompartemen", u.display], ["Periode", `Tahun ${sel.year} · ${periodLabel(sel)}`], ["Status", "—"]] as [string, string][],
        kpis: list,
      }));
    if (!sections.length) { alert("Belum ada KPI untuk diekspor pada level ini."); return; }
    exportMonitoring(kind, `PERFORMANCE MONITORING — ${monitorLevelLabel(level).toUpperCase()}`, `nexus-monitoring-${level}-${sel.year}`, sections, sel, realizations);
  };

  return (
    <>
      <Link href="/performance/monitoring" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> Performance Monitoring
      </Link>
      <PageHeader
        title={`Pencapaian — ${monitorLevelLabel(level)}`}
        subtitle="Pengisian Realisasi KPI per unit kerja · Bulanan · Triwulanan · Semesteran · Tahunan"
        actions={
          <>
            <PeriodControls sel={sel} onChange={setSel} />
            <ExportMenu onSelect={onExport} />
            <Link href={`/performance/planning/${level}`} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium text-[var(--text)] transition hover:border-royal-500/50 hover:text-royal-400">
              <Icon.chevron className="h-3.5 w-3.5" /> Perencanaan
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
                    const filled = filledCount(kpis);
                    const active = activeCount(kpis);
                    return (
                      <div key={u.key}>
                        <div className="flex items-center gap-3 px-4 py-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-royal-500/12 text-royal-400">
                            <Icon.users className="h-4 w-4" />
                          </span>
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
                            <Badge tone="gray">Perencanaan: {kpis.length} KPI</Badge>
                            <Badge tone={active > 0 && filled >= active ? "green" : filled > 0 ? "amber" : "gray"}>
                              Pencapaian: {filled}/{active} terisi
                            </Badge>
                          </div>
                          <button
                            onClick={() => setOpenUnit(expanded ? null : u.key)}
                            title="Isi / lihat Realisasi"
                            className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition", expanded ? "bg-royal-500" : "bg-emerald-500 hover:bg-emerald-600")}
                          >
                            <Icon.chevron className={cn("h-5 w-5 transition-transform", expanded ? "rotate-90" : "")} />
                          </button>
                        </div>

                        {expanded && (
                          <div className="border-t bg-black/[0.02] px-4 py-3 dark:bg-white/[0.02]">
                            <RealisasiTable kpis={kpis} sel={sel} realizations={realizations} onEdit={(kpi) => setModal({ kpi })} />
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
          onSave={(e) => { saveEntry(modal.kpi, e); }}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
