"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Btn } from "@/components/PageHeader";
import { Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeePicker } from "@/components/EmployeePicker";
import {
  kpiPerspectives, kpiGroups, kpiTypes, kpiMeasurements, kpiPolarities, kpiFrequencies,
  kpiCascadeTypes, kpiConsolidations, kpiUnits, kpiValidities, esgCriteriaOptions, kpiMonths,
  type PlanningKpi, type KpiConversion, type StrategicGoal,
} from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { useLocalState } from "@/lib/useLocalState";
import { MAPPING_SUBMIT_KEY, type SubmittedMap, submittedKpiNames, findSubmittedKpi } from "@/lib/mappingSubmit";

const inputCls = "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const selCls = `${inputCls} text-[var(--text)]`;
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";
const sectionCls = "text-[11px] font-semibold uppercase tracking-wide text-royal-400";

let seq = 0;
export const newKpiId = () => { try { return `pk-${crypto.randomUUID().slice(0, 6)}`; } catch { return `pk-${++seq}${Math.round(performance.now())}`; } };

type Form = Omit<PlanningKpi, "id"> & { id: string | null };
const emptyForm = (period: string, group: string): Form => ({
  id: null, group, perspective: "Financial", strategicGoalId: "", strategicGoalText: undefined, name: "", definition: "", purpose: "",
  type: "Spesifik", weight: 0, formula: "", hasConversion: false, conversions: [], measurement: "Exact", polarity: "Maximize",
  frequency: "Monthly", cascadeType: "Fully Cascade A", consolidation: "Take Last Known", monthlyTargets: {}, annualTarget: 0,
  dataSource: "", unit: "Persen", esgCriteria: [], validity: "Exact", proxyMax: undefined, supportingFile: "", pic: "", dataManager: "", period,
});

// Annual target derived from the Monthly Targets per the Consolidation rule:
//   Sum → Σ months · Average → mean · Take Last Known → last filled month.
function computeAnnual(monthly: Record<string, number>, consolidation: string, months: readonly string[]): number {
  const nums = months
    .map((m) => monthly[m])
    .filter((v) => v !== undefined && v !== null && String(v) !== "" && !Number.isNaN(Number(v)))
    .map((v) => Number(v) || 0);
  if (!nums.length) return 0;
  let out: number;
  if (consolidation === "Sum") out = nums.reduce((s, n) => s + n, 0);
  else if (consolidation === "Average") out = nums.reduce((s, n) => s + n, 0) / nums.length;
  else out = nums[nums.length - 1]; // Take Last Known
  return Math.round(out * 100) / 100;
}

// Extracted from the Performance Planning page so both the global recap and the
// per-unit level panels share one KPI editor.
export function KpiFormModal({
  initial, period, goals, defaultGroup = "KPI Direktorat", onSave, onClose,
}: {
  initial: PlanningKpi | null; // null = create
  period: string;
  goals: StrategicGoal[];
  defaultGroup?: string;
  onSave: (kpi: PlanningKpi) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<Form>(initial ? { ...initial } : emptyForm(period, defaultGroup));
  // Render through a portal to <body> so an ancestor's transform (e.g. the page's
  // animate-fade-up wrapper) can't become the fixed-positioning containing block —
  // which mis-placed the modal and made its body impossible to scroll.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // KPI names submitted from Performance Mapping (KPI Direksi) — recallable here.
  const [submitted] = useLocalState<SubmittedMap>(MAPPING_SUBMIT_KEY, {});
  const kpiNameOptions = useMemo(() => submittedKpiNames(submitted), [submitted]);

  // Annual target auto-fills from the Monthly Targets + Consolidation (read-only).
  useEffect(() => {
    const auto = computeAnnual(form.monthlyTargets, form.consolidation, kpiMonths);
    setForm((f) => (f.annualTarget === auto ? f : { ...f, annualTarget: auto }));
  }, [form.monthlyTargets, form.consolidation]);

  const setF = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setMonthly = (m: string, v: number) => setForm((f) => ({ ...f, monthlyTargets: { ...f.monthlyTargets, [m]: v } }));
  const toggleEsg = (c: string) => setForm((f) => ({ ...f, esgCriteria: f.esgCriteria.includes(c) ? f.esgCriteria.filter((x) => x !== c) : [...f.esgCriteria, c] }));
  const addConv = () => setForm((f) => ({ ...f, conversions: [...f.conversions, { from: "", to: "", value: "" }] }));
  const setConv = (i: number, key: keyof KpiConversion, v: string) => setForm((f) => ({ ...f, conversions: f.conversions.map((c, j) => (j === i ? { ...c, [key]: v } : c)) }));
  const removeConv = (i: number) => setForm((f) => ({ ...f, conversions: f.conversions.filter((_, j) => j !== i) }));

  const save = () => {
    const name = form.name.trim();
    if (!name) return;
    const { id, ...rest } = form;
    onSave({
      id: id ?? newKpiId(), ...rest, name,
      strategicGoalId: form.strategicGoalId || undefined,
      strategicGoalText: form.strategicGoalText?.trim() || undefined,
    });
  };

  const node = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col glass card shadow-glass animate-fade-up">
        <div className="flex items-center gap-2 border-b p-4">
          <Icon.performance className="h-4 w-4 shrink-0 text-royal-400" />
          <div className="text-sm font-semibold">{form.id == null ? t("Add KPI") : t("Edit KPI")}</div>
          <Badge tone="gray">{t("Period")} {form.period}</Badge>
          <button onClick={onClose} className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400" aria-label="Close">✕</button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelCls}>{t("BSC Perspective")}
              <select value={form.perspective} onChange={(e) => setF("perspective", e.target.value)} className={selCls}>{kpiPerspectives.map((p) => <option key={p}>{p}</option>)}</select>
            </label>
            <label className={labelCls}>{t("KPI Group")}
              <select value={form.group} onChange={(e) => setF("group", e.target.value)} className={selCls}>{kpiGroups.map((g) => <option key={g}>{g}</option>)}</select>
            </label>
          </div>
          <label className={labelCls}>{t("Strategic Objective")}
            <select
              value={form.strategicGoalText !== undefined ? "__manual__" : form.strategicGoalId}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__manual__") setForm((f) => ({ ...f, strategicGoalId: "", strategicGoalText: f.strategicGoalText ?? "" }));
                else setForm((f) => ({ ...f, strategicGoalId: v, strategicGoalText: undefined }));
              }}
              className={selCls}
            >
              <option value="">{t("— pick a Strategic Goal")}</option>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.code ? `${g.code} — ${g.title}` : g.title}</option>)}
              <option value="__manual__">✎ Isi manual (tidak ada yang sesuai)</option>
            </select>
            {form.strategicGoalText !== undefined ? (
              <input
                value={form.strategicGoalText}
                onChange={(e) => setF("strategicGoalText", e.target.value)}
                placeholder="Ketik Sasaran Strategis…"
                autoFocus
                className={cn(inputCls, "mt-1.5")}
              />
            ) : (
              <span className="mt-1 block text-[10px] text-[var(--muted)]">{t("Pulled from Strategic Planning.")} — pilih “Isi manual” bila tak ada yang sesuai.</span>
            )}
          </label>
          <label className={labelCls}>{t("KPI Name")}
            <input
              value={form.name}
              onChange={(e) => {
                const v = e.target.value;
                const hit = findSubmittedKpi(submitted, v);
                setForm((f) => ({ ...f, name: v, ...(hit ? { unit: hit.satuan || f.unit, polarity: hit.polaritas || f.polarity, frequency: hit.frekuensi || f.frequency } : {}) }));
              }}
              placeholder="% Excess of ROIC - WACC"
              list={kpiNameOptions.length ? "kpi-name-recall" : undefined}
              autoComplete="off"
              className={inputCls}
            />
            {kpiNameOptions.length > 0 && (
              <>
                <datalist id="kpi-name-recall">{kpiNameOptions.map((n) => <option key={n} value={n} />)}</datalist>
                <span className="mt-1 block text-[10px] text-[var(--muted)]">{kpiNameOptions.length} nama KPI dari Performance Mapping (KPI Direksi) — pilih untuk memanggil kembali.</span>
              </>
            )}
          </label>
          <label className={labelCls}>{t("Definition")}<textarea value={form.definition} onChange={(e) => setF("definition", e.target.value)} rows={2} className={inputCls} /></label>
          <label className={labelCls}>{t("KPI Purpose")}<input value={form.purpose} onChange={(e) => setF("purpose", e.target.value)} className={inputCls} /></label>

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

          <div className="border-t pt-3 flex flex-wrap items-center gap-2">
            <div className={sectionCls}>{t("Monthly targets")}</div>
            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted)]">
              <span className="h-2.5 w-2.5 rounded-sm bg-gold-500/25 ring-1 ring-gold-500/50" /> bulan akhir triwulan (dihitung)
            </span>
          </div>
          {/* One column per Triwulan → Mar · Jun · Sep · Des land on the bottom row, highlighted. */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[0, 1, 2, 3].map((qi) => {
              const label = ["Triwulan I", "Triwulan II", "Triwulan III", "Triwulan IV"][qi];
              const months = kpiMonths.slice(qi * 3, qi * 3 + 3);
              return (
                <div key={qi} className="rounded-xl border p-2">
                  <div className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-royal-400">{label}</div>
                  <div className="space-y-1.5">
                    {months.map((m, mi) => {
                      const end = mi === 2; // 3rd month of the quarter = Mar/Jun/Sep/Des
                      return (
                        <label key={m} className={cn("block rounded-lg px-1.5 pb-1 pt-0.5", end && "bg-gold-500/15 ring-1 ring-gold-500/40")}>
                          <span className={cn("flex items-center justify-between text-[11px]", end ? "font-semibold text-gold-600 dark:text-gold-300" : "text-[var(--muted)]")}>
                            {m}{end && <Icon.check className="h-3 w-3" />}
                          </span>
                          <input type="number" value={form.monthlyTargets[m] ?? ""} onChange={(e) => setMonthly(m, Number(e.target.value))} placeholder="0"
                            className={cn("mt-0.5 w-full rounded-lg border bg-[rgb(var(--surface))] px-2 py-1 text-[13px] outline-none focus:border-royal-500", end && "border-gold-500/50")} />
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <div className={labelCls}>{t("Annual target")}</div>
            <div className="mt-1 flex items-center gap-2">
              <input type="number" value={form.annualTarget} readOnly tabIndex={-1} aria-readonly
                className="w-full cursor-not-allowed rounded-lg border border-dashed bg-black/5 px-2.5 py-1.5 text-[14px] font-bold text-[var(--text)] outline-none dark:bg-white/5" />
              <span className="shrink-0 rounded-lg bg-royal-500/12 px-2.5 py-1.5 text-[11px] font-semibold text-royal-400">otomatis · {form.consolidation}</span>
            </div>
            <span className="mt-1 block text-[10px] text-[var(--muted)]">
              {form.consolidation === "Sum" ? "Penjumlahan Monthly Target." : form.consolidation === "Average" ? "Rata-rata Monthly Target." : "Nilai bulan terakhir yang terisi (Take Last Known)."} Terisi otomatis — tak perlu diisi manual.
            </span>
          </div>

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

          <div className="border-t pt-3"><div className={sectionCls}>{t("Responsibility")}</div></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelCls}>{t("KPI owner (PIC)")}<EmployeePicker value={form.pic} onChange={(v) => setF("pic", v)} className={inputCls} /></label>
            <label className={labelCls}>{t("KPI data manager")}<EmployeePicker value={form.dataManager} onChange={(v) => setF("dataManager", v)} className={inputCls} /></label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t p-3">
          <Btn variant="ghost" onClick={onClose}>{t("Cancel")}</Btn>
          <Btn variant="primary" onClick={save}>{form.id == null ? t("Submit KPI") : t("Save")}</Btn>
        </div>
      </div>
    </div>
  );
  return mounted ? createPortal(node, document.body) : null;
}
