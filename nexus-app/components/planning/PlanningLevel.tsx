"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeePicker } from "@/components/EmployeePicker";
import { KpiFormModal } from "@/components/planning/KpiFormModal";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { strategicGoals as seedGoals, type PlanningKpi, type StrategicGoal, type Employee } from "@/lib/data";
import {
  type PlanLevel, planLevelLabel, isAccordionLevel, unitsForLevel, unitsByDirektorat,
  PLAN_OWNERS_KEY, PLAN_UNIT_KPIS_KEY, type OwnerMap, type UnitKpiMap, type KpiOwner, ownerLabel,
} from "@/lib/perfPlanning";

const groupForLevel = (level: PlanLevel) =>
  level === "korporat" ? "KPI Bersama" : level === "direktorat" ? "KPI Direktorat" : "KPI Individu";

export function PlanningLevel({ level }: { level: PlanLevel }) {
  const { t } = useI18n();
  const [owners, setOwners] = useLocalState<OwnerMap>(PLAN_OWNERS_KEY, {});
  const [kpiMap, setKpiMap] = useLocalState<UnitKpiMap>(PLAN_UNIT_KPIS_KEY, {});
  const [goals] = useLocalState<StrategicGoal[]>("strategy-goals-2026", seedGoals);
  const [period, setPeriod] = useState("2026");

  const groups = useMemo(
    () => (isAccordionLevel(level) ? unitsByDirektorat(level) : [{ directorate: "", units: unitsForLevel(level) }]),
    [level]
  );
  const [openDir, setOpenDir] = useState<Record<string, boolean>>(() =>
    groups.length ? { [groups[0].directorate]: true } : {}
  );
  const [openUnit, setOpenUnit] = useState<string | null>(null);
  const [editOwner, setEditOwner] = useState<string | null>(null);
  const [ownerDraft, setOwnerDraft] = useState<KpiOwner>({ name: "", npk: "" });
  const [modal, setModal] = useState<{ unitKey: string; kpi: PlanningKpi | null } | null>(null);

  const periods = useMemo(() => {
    const all = new Set<string>([period, "2026", "2027"]);
    for (const list of Object.values(kpiMap)) for (const k of list) all.add(k.period);
    return [...all].sort().reverse();
  }, [kpiMap, period]);

  const unitKpis = (key: string) => (kpiMap[key] ?? []).filter((k) => k.period === period);
  const saveKpi = (unitKey: string, kpi: PlanningKpi) => setKpiMap((m) => {
    const list = m[unitKey] ?? [];
    const exists = list.some((k) => k.id === kpi.id);
    return { ...m, [unitKey]: exists ? list.map((k) => (k.id === kpi.id ? kpi : k)) : [...list, kpi] };
  });
  const deleteKpi = (unitKey: string, id: string) => {
    if (!confirm(t("Delete") + "?")) return;
    setKpiMap((m) => ({ ...m, [unitKey]: (m[unitKey] ?? []).filter((k) => k.id !== id) }));
  };

  const startOwner = (key: string) => { setEditOwner(key); setOwnerDraft(owners[key] ?? { name: "", npk: "" }); };
  const saveOwner = (key: string) => {
    setOwners((o) => ({ ...o, [key]: { name: ownerDraft.name.trim(), npk: ownerDraft.npk.trim() } }));
    setEditOwner(null);
  };

  const total = unitsForLevel(level).length;
  const withOwner = unitsForLevel(level).filter((u) => owners[u.key]?.name).length;

  return (
    <>
      <Link href="/performance" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Performance Management")}
      </Link>
      <PageHeader
        title={`Perencanaan — ${planLevelLabel(level)}`}
        subtitle="Perencanaan KPI per unit kerja · KPI Owner dari Employee Directory"
        actions={
          <>
            <Badge tone="blue">{withOwner}/{total} owner</Badge>
            <label className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">Periode KPI
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border bg-[rgb(var(--surface))] px-2 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
                {periods.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
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
                    const wsum = kpis.reduce((s, k) => s + (k.weight || 0), 0);
                    return (
                      <div key={u.key}>
                        <div className="flex items-center gap-3 px-4 py-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-royal-500/12 text-royal-400">
                            <Icon.users className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold">{u.display}</div>
                            {u.parent && <div className="text-[10px] text-[var(--muted)]">{u.parent}</div>}
                            {editOwner === u.key ? (
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <div className="w-56">
                                  <EmployeePicker
                                    value={ownerDraft.name}
                                    onChange={(name) => setOwnerDraft((d) => ({ ...d, name }))}
                                    onPick={(e: Employee) => setOwnerDraft({ name: e.name, npk: String(e.npk ?? "") })}
                                    className="w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1 text-[12px] outline-none focus:border-royal-500"
                                  />
                                </div>
                                <input
                                  value={ownerDraft.npk}
                                  onChange={(e) => setOwnerDraft((d) => ({ ...d, npk: e.target.value }))}
                                  placeholder="NPK"
                                  className="w-24 rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1 text-[12px] outline-none focus:border-royal-500"
                                />
                                <Btn variant="primary" onClick={() => saveOwner(u.key)}>{t("Save")}</Btn>
                                <button onClick={() => setEditOwner(null)} className="text-[12px] text-[var(--muted)] hover:text-rose-400">{t("Cancel")}</button>
                              </div>
                            ) : owner?.name ? (
                              <button onClick={() => startOwner(u.key)} className="mt-0.5 text-left text-[12px] text-[var(--muted)] hover:text-royal-400">
                                KPI Owner: <span className="font-medium text-[var(--text)]">{ownerLabel(owner)}</span>
                              </button>
                            ) : (
                              <button onClick={() => startOwner(u.key)} className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-medium text-royal-400 hover:underline">
                                <Icon.plus className="h-3 w-3" /> Tetapkan KPI Owner
                              </button>
                            )}
                          </div>
                          {kpis.length > 0 && <Badge tone={wsum === 100 ? "green" : "amber"}>{kpis.length} KPI · {wsum}%</Badge>}
                          <button
                            onClick={() => setOpenUnit(expanded ? null : u.key)}
                            title="Lihat / kelola KPI"
                            className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition", expanded ? "bg-royal-500" : "bg-emerald-500 hover:bg-emerald-600")}
                          >
                            <Icon.chevron className={cn("h-5 w-5 transition-transform", expanded ? "rotate-90" : "")} />
                          </button>
                        </div>

                        {expanded && (
                          <div className="border-t bg-black/[0.02] px-4 py-3 dark:bg-white/[0.02]">
                            <div className="mb-2 flex items-center gap-2">
                              <div className="text-[12px] font-semibold uppercase tracking-wide text-[var(--muted)]">KPI · {u.name}</div>
                              <div className="ml-auto"><Btn variant="primary" onClick={() => setModal({ unitKey: u.key, kpi: null })}><Icon.plus className="h-4 w-4" /> {t("Add KPI")}</Btn></div>
                            </div>
                            {kpis.length === 0 ? (
                              <div className="py-6 text-center text-[12px] text-[var(--muted)]">{t("No KPIs yet. Add one.")}</div>
                            ) : (
                              <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-[12.5px]">
                                  <thead>
                                    <tr className="border-b bg-[rgb(var(--surface))] text-left text-[10px] uppercase tracking-wider text-[var(--muted)]">
                                      <th className="px-3 py-2">No</th>
                                      <th className="px-3 py-2">KPI</th>
                                      <th className="px-3 py-2">{t("Unit")}</th>
                                      <th className="px-3 py-2 text-right">{t("Target")}</th>
                                      <th className="px-3 py-2 text-right">{t("Weight (%)")}</th>
                                      <th className="px-3 py-2" />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {kpis.map((k, i) => (
                                      <tr key={k.id} className="group border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                                        <td className="px-3 py-2 align-top text-[var(--muted)]">{i + 1}</td>
                                        <td className="px-3 py-2">
                                          <div className="font-medium">{k.name}</div>
                                          <div className="mt-0.5 flex flex-wrap gap-1">
                                            {[k.group, k.perspective, k.validity, k.polarity, k.frequency].filter(Boolean).map((c, j) => <span key={j} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[10px] text-royal-400">{c}</span>)}
                                          </div>
                                        </td>
                                        <td className="px-3 py-2 align-top text-[var(--muted)]">{k.unit}</td>
                                        <td className="px-3 py-2 text-right align-top">{k.annualTarget?.toLocaleString("id")}</td>
                                        <td className="px-3 py-2 text-right align-top font-semibold">{k.weight}</td>
                                        <td className="px-3 py-2 align-top">
                                          <div className="flex items-center justify-end gap-2 text-[11px] opacity-0 transition group-hover:opacity-100">
                                            <button onClick={() => setModal({ unitKey: u.key, kpi: k })} className="font-medium text-[var(--muted)] hover:text-royal-400">{t("Edit")}</button>
                                            <button onClick={() => deleteKpi(u.key, k.id)} className="text-[var(--muted)] hover:text-rose-400">✕</button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot><tr className="bg-royal-500/10"><td colSpan={4} className="px-3 py-1.5 text-right text-[12px] font-semibold">{t("Total weight")}</td><td className="px-3 py-1.5 text-right text-[12px] font-bold">{wsum}</td><td /></tr></tfoot>
                                </table>
                              </div>
                            )}
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
        <KpiFormModal
          initial={modal.kpi}
          period={period}
          goals={goals}
          defaultGroup={groupForLevel(level)}
          onSave={(k) => { saveKpi(modal.unitKey, k); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
