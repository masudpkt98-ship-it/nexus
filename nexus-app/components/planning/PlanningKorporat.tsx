"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { KpiFormModal } from "@/components/planning/KpiFormModal";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { strategicGoals as seedGoals, type PlanningKpi, type StrategicGoal } from "@/lib/data";
import { MAPPING_KEY, emptyMapping, type MappingState } from "@/lib/perfMapping";
import {
  PLAN_UNIT_KPIS_KEY, PLAN_OWNERS_KEY, type UnitKpiMap, type OwnerMap,
  planningKpiFromMap, KORPORAT_UNIT_KEY as UNIT, KORPORAT_OWNER,
} from "@/lib/perfPlanning";

// Planning · Korporat — the KPI list mirrors Performance Mapping's KPI Korporat
// (same corporate KPIs, kept in sync), each editable via the Add-KPI form to
// complete its planning details. Owner is the Pejabat Direktur Utama.
export function PlanningKorporat() {
  const { t } = useI18n();
  const [mapping] = useLocalState<MappingState>(MAPPING_KEY, emptyMapping());
  const [kpiMap, setKpiMap] = useLocalState<UnitKpiMap>(PLAN_UNIT_KPIS_KEY, {});
  const [owners, setOwners] = useLocalState<OwnerMap>(PLAN_OWNERS_KEY, {});
  const [goals] = useLocalState<StrategicGoal[]>("strategy-goals-2026", seedGoals);
  const [period, setPeriod] = useState("2026");
  const [modal, setModal] = useState<PlanningKpi | null | undefined>(undefined);

  // Owner is fixed to the Direktur Utama official.
  useEffect(() => {
    if (owners[UNIT]?.name !== KORPORAT_OWNER) setOwners((o) => ({ ...o, [UNIT]: { name: KORPORAT_OWNER, npk: "" } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The corporate KPIs from Mapping (source "Korporat").
  const corp = useMemo(() => mapping.kpis.filter((k) => k.sources.includes("Korporat")), [mapping.kpis]);

  // Keep the Korporat planning list in sync with Mapping — add any corporate KPI
  // that doesn't have a planning entry yet (matched by the deterministic id).
  useEffect(() => {
    setKpiMap((m) => {
      const list = m[UNIT] ?? [];
      const have = new Set(list.map((k) => k.id));
      const additions = corp.filter((c) => !have.has(`korp-${c.id}`)).map((c) => planningKpiFromMap(c, period));
      return additions.length ? { ...m, [UNIT]: [...list, ...additions] } : m;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corp]);

  const periods = useMemo(() => {
    const all = new Set<string>([period, "2026", "2027"]);
    for (const k of kpiMap[UNIT] ?? []) all.add(k.period);
    return [...all].sort().reverse();
  }, [kpiMap, period]);

  const kpis = (kpiMap[UNIT] ?? []).filter((k) => k.period === period);
  const totalWeight = kpis.reduce((s, k) => s + (k.weight || 0), 0);
  const isComplete = (k: PlanningKpi) => (k.weight || 0) > 0 && (k.annualTarget || 0) !== 0 && (!!k.strategicGoalId || !!k.strategicGoalText);
  const doneCount = kpis.filter(isComplete).length;

  const saveKpi = (k: PlanningKpi) => {
    setKpiMap((m) => {
      const list = m[UNIT] ?? [];
      return { ...m, [UNIT]: list.some((x) => x.id === k.id) ? list.map((x) => (x.id === k.id ? k : x)) : [...list, k] };
    });
    setModal(undefined);
  };
  const remove = (k: PlanningKpi) => { if (confirm(`${t("Delete")} “${k.name}”?`)) setKpiMap((m) => ({ ...m, [UNIT]: (m[UNIT] ?? []).filter((x) => x.id !== k.id) })); };

  const objectiveOf = (k: PlanningKpi) => goals.find((g) => g.id === k.strategicGoalId)?.title || k.strategicGoalText;

  return (
    <>
      <Link href="/performance/planning" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> Performance Planning
      </Link>
      <PageHeader
        title="Perencanaan — Korporat"
        subtitle="KPI Korporat (sinkron dari Performance Mapping) — lengkapi detail perencanaan tiap KPI"
        actions={
          <>
            <Badge tone={totalWeight === 100 ? "green" : "amber"}>{t("Total weight")} {totalWeight}/100</Badge>
            <label className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">Periode KPI
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border bg-[rgb(var(--surface))] px-2 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
                {periods.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <Btn variant="primary" onClick={() => setModal(null)}><Icon.plus className="h-4 w-4" /> {t("Add KPI")}</Btn>
          </>
        }
      />

      {/* Owner banner */}
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-royal-500/25 bg-royal-500/5 px-4 py-2.5 text-[13px]">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-royal-500/15 text-royal-400"><Icon.users className="h-4 w-4" /></span>
        <span className="text-[var(--muted)]">KPI Owner:</span>
        <span className="font-semibold">{KORPORAT_OWNER}</span>
        <span className="ml-auto text-[11px] text-[var(--muted)]">{doneCount}/{kpis.length} KPI lengkap · sumber: <Link href="/performance/mapping" className="font-medium text-royal-400 hover:underline">Performance Mapping</Link></span>
      </div>

      {kpis.length === 0 ? (
        <Card className="text-center">
          <Icon.strategy className="mx-auto h-10 w-10 text-[var(--muted)]" />
          <p className="mt-2 text-[14px] font-medium">Belum ada KPI Korporat</p>
          <p className="mx-auto mt-1 max-w-lg text-[12px] text-[var(--muted)]">
            Impor KPI Korporat.xlsx di <Link href="/performance/mapping" className="font-medium text-royal-400 hover:underline">Performance Mapping</Link> — daftarnya otomatis muncul di sini untuk dilengkapi. Atau tambah manual dengan “{t("Add KPI")}”.
          </p>
        </Card>
      ) : (
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
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {kpis.map((k, i) => (
                  <tr key={k.id} className="group border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="px-4 py-3 align-top text-xs text-[var(--muted)]">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{k.name}</div>
                      {objectiveOf(k) && <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-violet-400"><Icon.strategy className="h-2.5 w-2.5" /> {objectiveOf(k)}</div>}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {[k.group, k.perspective, k.validity, k.polarity, k.frequency].filter(Boolean).map((c, j) => <span key={j} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[10px] text-royal-400">{c}</span>)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-[var(--muted)]">{k.unit}</td>
                    <td className="px-4 py-3 text-right align-top font-medium">{k.annualTarget?.toLocaleString("id")}</td>
                    <td className="px-4 py-3 text-right align-top font-semibold">{k.weight}</td>
                    <td className="px-4 py-3 align-top">
                      {isComplete(k)
                        ? <Badge tone="green">{t("Complete") || "Lengkap"}</Badge>
                        : <Badge tone="amber">Perlu dilengkapi</Badge>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-end gap-2 text-[11px]">
                        <button onClick={() => setModal(k)} className="font-medium text-royal-400 hover:underline">{isComplete(k) ? t("Edit") : "Lengkapi"}</button>
                        <button onClick={() => remove(k)} title={t("Delete")} className="text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-royal-500/10"><td colSpan={4} className="px-4 py-2 text-right text-[13px] font-semibold">{t("Total weight")}</td><td className="px-4 py-2 text-right text-[13px] font-bold">{totalWeight}</td><td colSpan={2} /></tr></tfoot>
            </table>
          </div>
        </div>
      )}

      {modal !== undefined && (
        <KpiFormModal initial={modal} period={period} goals={goals} defaultGroup="KPI Bersama" onSave={saveKpi} onClose={() => setModal(undefined)} />
      )}
    </>
  );
}
