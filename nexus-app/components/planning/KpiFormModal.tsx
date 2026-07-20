"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Btn } from "@/components/PageHeader";
import { Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { UnitPicker } from "@/components/UnitPicker";
import { StrategicPicker } from "@/components/planning/StrategicPicker";
import {
  kpiPerspectives, kpiGroups, kpiTypes, kpiPolarities, kpiFrequencies,
  kpiCascadeTypes, kpiConsolidations, kpiUnits, kpiValidities, esgCriteriaOptions, kpiMonths,
  type PlanningKpi, type KpiConversion, type FormulaDetail, type FormulaBlock, type StrategicGoal,
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
  type: "Strategis", weight: 0, formula: "", hasConversion: false, conversions: [], hasFormulaDetail: false, formulaBlocks: [], measurement: "Exact", polarity: "Maximize",
  frequency: "Monthly", cascadeType: "Fully A", consolidation: "Take Last Known", monthlyTargets: {}, annualTarget: 0,
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

// Evaluate "Rumus Perhitungan" by substituting each symbol with its numeric
// Value. Returns null if any referenced symbol lacks a value or the expression
// isn't pure arithmetic (safe: no eval on raw input — only sanitized arithmetic).
function evalComputation(expr: string, details: FormulaDetail[]): number | null {
  const e = (expr ?? "").trim();
  if (!e) return null;
  let s = e;
  const syms = details
    .map((d) => ({ sym: (d.symbol ?? "").trim(), val: (d.value ?? "").trim() }))
    .filter((d) => d.sym)
    .sort((a, b) => b.sym.length - a.sym.length); // longest first to avoid partial hits
  for (const { sym, val } of syms) {
    if (val === "" || Number.isNaN(Number(val))) return null; // value not yet known
    const re = new RegExp(sym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    s = s.replace(re, `(${Number(val)})`);
  }
  if (!/^[0-9.+\-*/()%\s]*$/.test(s)) return null; // only arithmetic survives
  try {
    const r = Function(`"use strict";return (${s})`)();
    return Number.isFinite(r) ? Math.round(r * 10000) / 10000 : null;
  } catch {
    return null;
  }
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
  const [form, setForm] = useState<Form>(() => {
    if (!initial) return emptyForm(period, defaultGroup);
    // Migrate legacy single-block (formulaDetails + computationFormula) → formulaBlocks.
    const legacyRows = initial.formulaDetails ?? [];
    const blocks: FormulaBlock[] = initial.formulaBlocks?.length
      ? initial.formulaBlocks
      : legacyRows.length || (initial.computationFormula ?? "").trim()
        ? [{ label: "", rows: legacyRows.length ? legacyRows : [{ symbol: "", definition: "", value: "" }], formula: initial.computationFormula ?? "" }]
        : [];
    const { formulaDetails: _fd, computationFormula: _cf, ...rest } = initial;
    return { ...rest, hasFormulaDetail: initial.hasFormulaDetail ?? false, formulaBlocks: blocks };
  });
  // Render through a portal to <body> so an ancestor's transform (e.g. the page's
  // animate-fade-up wrapper) can't become the fixed-positioning containing block —
  // which mis-placed the modal and made its body impossible to scroll.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // KPI names submitted from Performance Mapping (KPI Direksi) — recallable here.
  const [submitted] = useLocalState<SubmittedMap>(MAPPING_SUBMIT_KEY, {});
  const kpiNameOptions = useMemo(() => submittedKpiNames(submitted), [submitted]);

  // Supporting File: Share Link (URL) or Upload File (stored as a data URL).
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileMode, setFileMode] = useState<"link" | "upload">(() => ((initial?.supportingFile ?? "").startsWith("data:") ? "upload" : "link"));
  const switchFileMode = (m: "link" | "upload") => { setFileMode(m); setForm((f) => ({ ...f, supportingFile: "", supportingFileName: undefined })); };
  const onFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) { alert("File terlalu besar (maks 2MB). Untuk file besar gunakan Share Link."); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, supportingFile: String(reader.result), supportingFileName: file.name }));
    reader.readAsDataURL(file);
  };

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
  // Detail Formula — multiple blocks; each block has its own components + formula.
  const mapBlocks = (f: Form, fn: (b: FormulaBlock, i: number) => FormulaBlock) => ({ ...f, formulaBlocks: (f.formulaBlocks ?? []).map(fn) });
  const addBlock = () => setForm((f) => ({ ...f, formulaBlocks: [...(f.formulaBlocks ?? []), { label: "", rows: [{ symbol: "", definition: "", value: "" }], formula: "" }] }));
  const removeBlock = (bi: number) => setForm((f) => ({ ...f, formulaBlocks: (f.formulaBlocks ?? []).filter((_, j) => j !== bi) }));
  const setBlockField = (bi: number, key: "label" | "formula", v: string) => setForm((f) => mapBlocks(f, (b, j) => (j === bi ? { ...b, [key]: v } : b)));
  const addRow = (bi: number) => setForm((f) => mapBlocks(f, (b, j) => (j === bi ? { ...b, rows: [...b.rows, { symbol: "", definition: "", value: "" }] } : b)));
  const setRow = (bi: number, ri: number, key: keyof FormulaDetail, v: string) => setForm((f) => mapBlocks(f, (b, j) => (j === bi ? { ...b, rows: b.rows.map((d, k) => (k === ri ? { ...d, [key]: v } : d)) } : b)));
  const removeRow = (bi: number, ri: number) => setForm((f) => mapBlocks(f, (b, j) => (j === bi ? { ...b, rows: b.rows.filter((_, k) => k !== ri) } : b)));

  const [nameError, setNameError] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const save = () => {
    const name = form.name.trim();
    if (!name) {
      setNameError(true);
      nameRef.current?.focus();
      nameRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
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
            <StrategicPicker
              goals={goals}
              goalId={form.strategicGoalId ?? ""}
              manualText={form.strategicGoalText}
              onPick={(id) => setForm((f) => ({ ...f, strategicGoalId: id, strategicGoalText: undefined }))}
              onManual={(text) => setForm((f) => ({ ...f, strategicGoalId: "", strategicGoalText: text }))}
              onClear={() => setForm((f) => ({ ...f, strategicGoalId: "", strategicGoalText: undefined }))}
              className={inputCls}
            />
            <span className="mt-1 block text-[10px] text-[var(--muted)]">Ketik untuk cari cepat; bila tak ada yang cocok, langsung isi manual.</span>
          </label>
          <label className={labelCls}>{t("KPI Name")} <span className="text-rose-400">*</span>
            <input
              ref={nameRef}
              value={form.name}
              onChange={(e) => {
                const v = e.target.value;
                if (v.trim()) setNameError(false);
                const hit = findSubmittedKpi(submitted, v);
                setForm((f) => ({ ...f, name: v, ...(hit ? { unit: hit.satuan || f.unit, polarity: hit.polaritas || f.polarity, frequency: hit.frekuensi || f.frequency } : {}) }));
              }}
              placeholder="% Excess of ROIC - WACC"
              list={kpiNameOptions.length ? "kpi-name-recall" : undefined}
              autoComplete="off"
              className={cn(inputCls, nameError && "border-rose-400 focus:border-rose-400")}
            />
            {nameError && <span className="mt-1 block text-[10px] font-medium text-rose-400">Nama KPI wajib diisi sebelum menyimpan.</span>}
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
            <label className={labelCls}>{t("Polarity")}<select value={form.polarity} onChange={(e) => setF("polarity", e.target.value)} className={selCls}>{kpiPolarities.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className={labelCls}>{t("Frequency")}<select value={form.frequency} onChange={(e) => setF("frequency", e.target.value)} className={selCls}>{kpiFrequencies.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className={labelCls}>{t("Cascade type")}<select value={form.cascadeType} onChange={(e) => setF("cascadeType", e.target.value)} className={selCls}>{kpiCascadeTypes.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className={labelCls}>{t("Consolidation")}<select value={form.consolidation} onChange={(e) => setF("consolidation", e.target.value)} className={selCls}>{kpiConsolidations.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className={labelCls}>{t("Unit")}<select value={form.unit} onChange={(e) => setF("unit", e.target.value)} className={selCls}>{kpiUnits.map((x) => <option key={x}>{x}</option>)}</select></label>
          </div>

          <label className={labelCls}>{t("Scoring formula")}<textarea value={form.formula} onChange={(e) => setF("formula", e.target.value)} rows={2} className={inputCls} /></label>

          {/* Detail Formula — expandable formula components (used at KPI realization). */}
          <div className="border-t pt-3">
            <label className="flex items-center gap-2 text-[12px] font-medium"><input type="checkbox" checked={!!form.hasFormulaDetail} onChange={(e) => { const on = e.target.checked; setForm((f) => ({ ...f, hasFormulaDetail: on, formulaBlocks: on && !(f.formulaBlocks ?? []).length ? [{ label: "", rows: [{ symbol: "", definition: "", value: "" }], formula: "" }] : (f.formulaBlocks ?? []) })); }} className="accent-royal-500" /> Detail Formula</label>
            <span className="mt-0.5 block text-[10px] text-[var(--muted)]">Komponen rumus (Simbol · Definisi · Value) + Rumus Perhitungan — dipakai saat Realisasi KPI. Bisa lebih dari satu perhitungan.</span>
            {form.hasFormulaDetail && (
              <div className="mt-2 space-y-3">
                {(form.formulaBlocks ?? []).map((blk, bi) => {
                  const syms = blk.rows.map((d) => d.symbol.trim()).filter(Boolean);
                  const result = evalComputation(blk.formula, blk.rows);
                  return (
                    <div key={bi} className="rounded-xl border border-dashed p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-royal-500/15 text-[11px] font-semibold text-royal-400">{bi + 1}</span>
                        <input value={blk.label ?? ""} onChange={(e) => setBlockField(bi, "label", e.target.value)} placeholder={`Nama perhitungan (opsional), mis. Perhitungan ${bi + 1}`} className="flex-1 rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1 text-[12px] font-medium outline-none focus:border-royal-500" />
                        <button onClick={() => removeBlock(bi)} className="shrink-0 text-[var(--muted)] hover:text-rose-400" title={t("Delete")}>✕</button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                          <span className="w-14 shrink-0 text-center">Simbol</span>
                          <span className="flex-1">Definisi</span>
                          <span className="w-24 shrink-0">Value</span>
                          <span className="w-4 shrink-0" />
                        </div>
                        {blk.rows.map((d, ri) => (
                          <div key={ri} className="flex items-center gap-2">
                            <input value={d.symbol} onChange={(e) => setRow(bi, ri, "symbol", e.target.value)} placeholder="a" className="w-14 shrink-0 rounded-lg border bg-[rgb(var(--surface))] px-2 py-1.5 text-center text-[13px] font-semibold text-royal-400 outline-none focus:border-royal-500" />
                            <input value={d.definition} onChange={(e) => setRow(bi, ri, "definition", e.target.value)} placeholder="Definisi" className="flex-1 rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500" />
                            <input value={d.value ?? ""} onChange={(e) => setRow(bi, ri, "value", e.target.value)} inputMode="decimal" placeholder="—" className="w-24 shrink-0 rounded-lg border bg-[rgb(var(--surface))] px-2 py-1.5 text-right text-[13px] outline-none focus:border-royal-500" />
                            <button onClick={() => removeRow(bi, ri)} className="w-4 shrink-0 text-[var(--muted)] hover:text-rose-400" title={t("Delete")}>✕</button>
                          </div>
                        ))}
                        <Btn variant="ghost" onClick={() => addRow(bi)}><Icon.plus className="h-3.5 w-3.5" /> {t("Add row")}</Btn>
                        <label className="mt-1 block text-[11px] font-medium text-[var(--muted)]">Rumus Perhitungan
                          <input value={blk.formula} onChange={(e) => setBlockField(bi, "formula", e.target.value)} placeholder="mis. (a / b) * 100" className={`${inputCls} font-mono`} />
                        </label>
                        {syms.length > 0 && (
                          <div className="space-y-1">
                            <span className="block text-[10px] text-[var(--muted)]">Gunakan simbol: {syms.map((s) => <code key={s} className="mx-0.5 rounded bg-royal-500/12 px-1 font-semibold text-royal-400">{s}</code>)} — Value kosong diisi saat Realisasi KPI.</span>
                            {blk.formula.trim() && (
                              result !== null ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/12 px-2 py-1 text-[12px] font-semibold text-emerald-500">= {result.toLocaleString("id-ID")}</span>
                              ) : (
                                <span className="block text-[10px] text-amber-500">Hasil muncul otomatis bila semua Value terisi angka.</span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <Btn variant="ghost" onClick={addBlock}><Icon.plus className="h-3.5 w-3.5" /> Add Detail Formula</Btn>
              </div>
            )}
          </div>

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
            <div className="sm:col-span-2">
              <div className={labelCls}>Supporting File</div>
              <div className="mt-1 flex items-center gap-1">
                {(["link", "upload"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => switchFileMode(m)}
                    className={cn("rounded-lg px-3 py-1 text-[12px] font-medium transition", fileMode === m ? "bg-royal-500/15 text-royal-400" : "glass hover:bg-black/5 dark:hover:bg-white/5")}>
                    {m === "link" ? "Share Link" : "Upload File"}
                  </button>
                ))}
              </div>
              {fileMode === "link" ? (
                <input value={form.supportingFile.startsWith("data:") ? "" : form.supportingFile} onChange={(e) => setF("supportingFile", e.target.value)} placeholder="https://…" className={cn(inputCls, "mt-1.5")} />
              ) : (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); if (fileRef.current) fileRef.current.value = ""; }} />
                  <Btn variant="ghost" onClick={() => fileRef.current?.click()}><Icon.document className="h-4 w-4" /> Pilih file</Btn>
                  {form.supportingFileName ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px]">
                      <Icon.document className="h-3.5 w-3.5 text-royal-400" /> {form.supportingFileName}
                      <button type="button" onClick={() => setForm((f) => ({ ...f, supportingFile: "", supportingFileName: undefined }))} className="text-[var(--muted)] hover:text-rose-400" aria-label="Hapus file">✕</button>
                    </span>
                  ) : <span className="text-[11px] text-[var(--muted)]">Belum ada file (maks 2MB). File besar → pakai Share Link.</span>}
                </div>
              )}
            </div>
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
            <label className={labelCls}>{t("KPI owner (PIC)")} — Unit Kerja<UnitPicker value={form.pic} onChange={(v) => setF("pic", v)} className={inputCls} /></label>
            <label className={labelCls}>{t("KPI data manager")} — Unit Kerja<UnitPicker value={form.dataManager} onChange={(v) => setF("dataManager", v)} className={inputCls} /></label>
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
