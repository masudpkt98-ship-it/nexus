"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeePicker } from "@/components/EmployeePicker";
import {
  planningKpis as seedPlanning,
  strategicGoals as seedGoals,
  kpiPerspectives, kpiGroups, kpiTypes, kpiMeasurements, kpiPolarities, kpiFrequencies,
  kpiCascadeTypes, kpiConsolidations, kpiUnits, kpiValidities, esgCriteriaOptions, kpiMonths,
  type PlanningKpi, type KpiConversion, type StrategicGoal,
} from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";

const inputCls = "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const selCls = `${inputCls} text-[var(--text)]`;
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";
const sectionCls = "text-[11px] font-semibold uppercase tracking-wide text-royal-400";
let seq = 0;
const newId = () => { try { return `pk-${crypto.randomUUID().slice(0, 6)}`; } catch { return `pk-${++seq}${Math.round(performance.now())}`; } };

type Form = Omit<PlanningKpi, "id"> & { open: boolean; id: string | null };
const emptyForm = (period: string): Form => ({
  open: false, id: null, group: "KPI Direktorat", perspective: "Financial", strategicGoalId: "", name: "", definition: "", purpose: "",
  type: "Spesifik", weight: 0, formula: "", hasConversion: false, conversions: [], measurement: "Exact", polarity: "Maximize",
  frequency: "Monthly", cascadeType: "Fully Cascade A", consolidation: "Take Last Known", monthlyTargets: {}, annualTarget: 0,
  dataSource: "", unit: "Persen", esgCriteria: [], validity: "Exact", proxyMax: undefined, supportingFile: "", pic: "", dataManager: "", period,
});

export default function PerformancePlanningPage() {
  const { t } = useI18n();
  const [kpis, setKpis] = useLocalState<PlanningKpi[]>("planning-kpis", seedPlanning);
  const [goals] = useLocalState<StrategicGoal[]>("strategy-goals-2026", seedGoals);
  const [period, setPeriod] = useState("2026");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Form>(emptyForm("2026"));

  const goalTitle = (id?: string) => goals.find((g) => g.id === id)?.title;
  const periods = useMemo(() => Array.from(new Set([period, "2026", "2027", ...kpis.map((k) => k.period)])).sort().reverse(), [kpis, period]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return kpis.filter((k) => k.period === period && (!q || `${k.name} ${k.unit} ${goalTitle(k.strategicGoalId) ?? ""}`.toLowerCase().includes(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpis, period, search]);
  const totalWeight = rows.reduce((s, k) => s + (k.weight || 0), 0);

  // --- CRUD ---
  const openCreate = () => setForm({ ...emptyForm(period), open: true });
  const openEdit = (k: PlanningKpi) => setForm({ ...k, open: true });
  const close = () => setForm((f) => ({ ...f, open: false }));
  const save = () => {
    const name = form.name.trim();
    if (!name) return;
    const { open, id, ...rest } = form;
    const body: PlanningKpi = { id: id ?? newId(), ...rest, name, strategicGoalId: form.strategicGoalId || undefined };
    setKpis((l) => (id == null ? [...l, body] : l.map((x) => (x.id === id ? body : x))));
    close();
  };
  const remove = (k: PlanningKpi) => { if (confirm(`${t("Delete")} “${k.name}”?`)) setKpis((l) => l.filter((x) => x.id !== k.id)); };

  const setF = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setMonthly = (m: string, v: number) => setForm((f) => ({ ...f, monthlyTargets: { ...f.monthlyTargets, [m]: v } }));
  const sumMonthly = () => Object.values(form.monthlyTargets).reduce((s, n) => s + (Number(n) || 0), 0);
  const toggleEsg = (c: string) => setForm((f) => ({ ...f, esgCriteria: f.esgCriteria.includes(c) ? f.esgCriteria.filter((x) => x !== c) : [...f.esgCriteria, c] }));
  const addConv = () => setForm((f) => ({ ...f, conversions: [...f.conversions, { from: "", to: "", value: "" }] }));
  const setConv = (i: number, key: keyof KpiConversion, v: string) => setForm((f) => ({ ...f, conversions: f.conversions.map((c, j) => (j === i ? { ...c, [key]: v } : c)) }));
  const removeConv = (i: number) => setForm((f) => ({ ...f, conversions: f.conversions.filter((_, j) => j !== i) }));

  const onExport = async () => {
    const XLSX = await import("xlsx");
    const aoa: (string | number)[][] = [[t("Group"), t("Perspective"), t("Strategic Goal"), "KPI", t("Unit"), t("Target"), t("Weight (%)"), t("Measurement"), t("Polarity"), t("Frequency"), t("Cascade type"), "PIC"]];
    kpis.filter((k) => k.period === period).forEach((k) => aoa.push([k.group, k.perspective, goalTitle(k.strategicGoalId) ?? "", k.name, k.unit, k.annualTarget, k.weight, k.measurement, k.polarity, k.frequency, k.cascadeType, k.pic]));
    aoa.push([]); aoa.push(["", "", "", "", "", "", totalWeight, "", "", "", "", ""]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "KPI");
    XLSX.writeFile(wb, `nexus-kpi-planning-${period}.xlsx`);
  };

  const chips = (k: PlanningKpi) => [k.measurement, k.cascadeType, k.polarity, k.consolidation, k.frequency, k.type].filter(Boolean);

  return (
    <>
      <Link href="/performance" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Performance Management")}
      </Link>
      <PageHeader
        title="Performance Planning"
        subtitle="Perencanaan KPI Individu · Balanced Scorecard · Cascading · Target Bulanan"
        actions={
          <>
            <label className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">{t("Period")}
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border bg-[rgb(var(--surface))] px-2 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
                {periods.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
            </label>
            <Btn variant="ghost" onClick={onExport}><Icon.document className="h-4 w-4" /> {t("Export Excel")}</Btn>
            <Btn variant="primary" onClick={openCreate}><Icon.plus className="h-4 w-4" /> {t("Add KPI")}</Btn>
          </>
        }
      />

      {/* total weight banner */}
      <div className={cn("mb-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px]", totalWeight === 100 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-amber-500/30 bg-amber-500/10 text-amber-500")}>
        <Icon.performance className="h-4 w-4" />
        {t("Total weight")}: <span className="font-bold">{totalWeight}</span> / 100
        {totalWeight !== 100 && <span className="text-[var(--muted)]">· {t("weights should total 100")}</span>}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search KPI…")} className="ml-auto w-56 rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1 text-[12px] text-[var(--text)] outline-none focus:border-royal-500" />
      </div>

      {/* recap grouped by kpiGroup */}
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
                          {goalTitle(k.strategicGoalId) && <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-violet-400"><Icon.strategy className="h-2.5 w-2.5" /> {goalTitle(k.strategicGoalId)}</div>}
                          <div className="mt-1 flex flex-wrap gap-1">
                            {chips(k).map((c, j) => <span key={j} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[10px] text-royal-400">{c}</span>)}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-[var(--muted)]">{k.unit}</td>
                        <td className="px-4 py-3 text-right align-top font-medium">{k.annualTarget?.toLocaleString("id")}</td>
                        <td className="px-4 py-3 text-right align-top font-semibold">{k.weight}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center justify-end gap-2 text-[11px] opacity-0 transition group-hover:opacity-100">
                            <button onClick={() => openEdit(k)} title={t("Edit")} className="font-medium text-[var(--muted)] hover:text-royal-400">{t("Edit")}</button>
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

      {/* ---- Add / Edit KPI modal ---- */}
      {form.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col glass card shadow-glass animate-fade-up">
            <div className="flex items-center gap-2 border-b p-4">
              <Icon.performance className="h-4 w-4 shrink-0 text-royal-400" />
              <div className="text-sm font-semibold">{form.id == null ? t("Add KPI") : t("Edit KPI")}</div>
              <Badge tone="gray">{t("Period")} {form.period}</Badge>
              <button onClick={close} className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400" aria-label="Close">✕</button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* identity */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelCls}>{t("BSC Perspective")}
                  <select value={form.perspective} onChange={(e) => setF("perspective", e.target.value)} className={selCls}>{kpiPerspectives.map((p) => <option key={p}>{p}</option>)}</select>
                </label>
                <label className={labelCls}>{t("KPI Group")}
                  <select value={form.group} onChange={(e) => setF("group", e.target.value)} className={selCls}>{kpiGroups.map((g) => <option key={g}>{g}</option>)}</select>
                </label>
              </div>
              <label className={labelCls}>{t("Strategic Objective")}
                <select value={form.strategicGoalId} onChange={(e) => setF("strategicGoalId", e.target.value)} className={selCls}>
                  <option value="">{t("— pick a Strategic Goal")}</option>
                  {goals.map((g) => <option key={g.id} value={g.id}>{g.code ? `${g.code} — ${g.title}` : g.title}</option>)}
                </select>
                <span className="mt-1 block text-[10px] text-[var(--muted)]">{t("Pulled from Strategic Planning.")}</span>
              </label>
              <label className={labelCls}>{t("KPI Name")}<input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="% Excess of ROIC - WACC" className={inputCls} /></label>
              <label className={labelCls}>{t("Definition")}<textarea value={form.definition} onChange={(e) => setF("definition", e.target.value)} rows={2} className={inputCls} /></label>
              <label className={labelCls}>{t("KPI Purpose")}<input value={form.purpose} onChange={(e) => setF("purpose", e.target.value)} className={inputCls} /></label>

              {/* classification */}
              <div className="border-t pt-3"><div className={sectionCls}>{t("Classification")}</div></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label className={labelCls}>{t("KPI Type")}<select value={form.type} onChange={(e) => setF("type", e.target.value)} className={selCls}>{kpiTypes.map((x) => <option key={x}>{x}</option>)}</select></label>
                <label className={labelCls}>{t("Weight (%)")}<input type="number" min={0} max={100} value={form.weight} onChange={(e) => setF("weight", Number(e.target.value))} className={inputCls} /></label>
                <label className={labelCls}>{t("Measurement")}<select value={form.measurement} onChange={(e) => setF("measurement", e.target.value)} className={selCls}>{kpiMeasurements.map((x) => <option key={x}>{x}</option>)}</select></label>
                <label className={labelCls}>{t("Polarity")}<select value={form.polarity} onChange={(e) => setF("polarity", e.target.value)} className={selCls}>{kpiPolarities.map((x) => <option key={x}>{x}</option>)}</select></label>
                <label className={labelCls}>{t("Frequency")}<select value={form.frequency} onChange={(e) => setF("frequency", e.target.value)} className={selCls}>{kpiFrequencies.map((x) => <option key={x}>{x}</option>)}</select></label>
                <label className={labelCls}>{t("Cascade type")}<select value={form.cascadeType} onChange={(e) => setF("cascadeType", e.target.value)} className={selCls}>{kpiCascadeTypes.map((x) => <option key={x}>{x}</option>)}</select></label>
                <label className={labelCls}>{t("Consolidation")}<select value={form.consolidation} onChange={(e) => setF("consolidation", e.target.value)} className={selCls}>{kpiConsolidations.map((x) => <option key={x}>{x}</option>)}</select></label>
                <label className={labelCls}>{t("Unit")}<select value={form.unit} onChange={(e) => setF("unit", e.target.value)} className={selCls}>{kpiUnits.map((x) => <option key={x}>{x}</option>)}</select></label>
              </div>

              <label className={labelCls}>{t("Scoring formula")}<textarea value={form.formula} onChange={(e) => setF("formula", e.target.value)} rows={2} className={inputCls} /></label>

              {/* conversion */}
              <div className="border-t pt-3">
                <label className="flex items-center gap-2 text-[12px] font-medium"><input type="checkbox" checked={form.hasConversion} onChange={(e) => setF("hasConversion", e.target.checked)} className="accent-royal-500" /> {t("Has achievement conversion")}</label>
                {form.hasConversion && (
                  <div className="mt-2 space-y-2">
                    {form.conversions.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input value={c.from} onChange={(e) => setConv(i, "from", e.target.value)} placeholder={t("From")} className={inputCls} />
                        <input value={c.to} onChange={(e) => setConv(i, "to", e.target.value)} placeholder={t("To")} className={inputCls} />
                        <input value={c.value} onChange={(e) => setConv(i, "value", e.target.value)} placeholder={t("Value")} className={inputCls} />
                        <button onClick={() => removeConv(i)} className="shrink-0 text-[var(--muted)] hover:text-rose-400" title={t("Delete")}>✕</button>
                      </div>
                    ))}
                    <Btn variant="ghost" onClick={addConv}><Icon.plus className="h-3.5 w-3.5" /> {t("Add row")}</Btn>
                  </div>
                )}
              </div>

              {/* monthly targets */}
              <div className="border-t pt-3"><div className={sectionCls}>{t("Monthly targets")}</div></div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {kpiMonths.map((m) => (
                  <label key={m} className="block text-[11px] text-[var(--muted)]">{m}
                    <input type="number" value={form.monthlyTargets[m] ?? ""} onChange={(e) => setMonthly(m, Number(e.target.value))} placeholder="0" className={inputCls} />
                  </label>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <label className={cn(labelCls, "flex-1")}>{t("Annual target")}<input type="number" value={form.annualTarget} onChange={(e) => setF("annualTarget", Number(e.target.value))} className={inputCls} /></label>
                <Btn variant="ghost" onClick={() => setF("annualTarget", sumMonthly())}>{t("Sum months")} = {sumMonthly().toLocaleString("id")}</Btn>
              </div>

              {/* data & validity */}
              <div className="border-t pt-3"><div className={sectionCls}>{t("Data & validity")}</div></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelCls}>{t("Data source")}<input value={form.dataSource} onChange={(e) => setF("dataSource", e.target.value)} className={inputCls} /></label>
                <label className={labelCls}>{t("Validity")}<select value={form.validity} onChange={(e) => setF("validity", e.target.value)} className={selCls}>{kpiValidities.map((x) => <option key={x}>{x}</option>)}</select></label>
                {form.validity === "Proxy" && <label className={labelCls}>{t("Proxy max (100–105)")}<input type="number" value={form.proxyMax ?? ""} onChange={(e) => setF("proxyMax", Number(e.target.value))} placeholder="105" className={inputCls} /></label>}
                <label className={labelCls}>{t("Supporting file / link")}<input value={form.supportingFile} onChange={(e) => setF("supportingFile", e.target.value)} placeholder="https://…" className={inputCls} /></label>
              </div>
              <div>
                <div className={labelCls}>{t("ESG criteria")}</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {esgCriteriaOptions.map((c) => (
                    <button key={c} type="button" onClick={() => toggleEsg(c)} className={cn("rounded-lg border px-2.5 py-1 text-[12px] transition", form.esgCriteria.includes(c) ? "border-royal-500 bg-royal-500/15 text-royal-400" : "text-[var(--muted)] hover:border-royal-500/40")}>{c}</button>
                  ))}
                </div>
              </div>

              {/* responsibility */}
              <div className="border-t pt-3"><div className={sectionCls}>{t("Responsibility")}</div></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelCls}>{t("KPI owner (PIC)")}<EmployeePicker value={form.pic} onChange={(v) => setF("pic", v)} className={inputCls} /></label>
                <label className={labelCls}>{t("KPI data manager")}<EmployeePicker value={form.dataManager} onChange={(v) => setF("dataManager", v)} className={inputCls} /></label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t p-3">
              <Btn variant="ghost" onClick={close}>{t("Cancel")}</Btn>
              <Btn variant="primary" onClick={save}>{form.id == null ? t("Submit KPI") : t("Save")}</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
