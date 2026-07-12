"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, Avatar, LineChart, Gauge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeePicker } from "@/components/EmployeePicker";
import { performanceKpis as mockPerformanceKpis, kpiTrend, topPerformers as mockTop, corporateKpis as seedCorporateKpis, type CorporateKpi } from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { apiGet, apiSend, apiDownload, getToken } from "@/lib/api";
import { LiveBadge } from "@/components/LiveBadge";
import { useI18n } from "@/lib/i18n";

const levelTone: Record<string, "purple" | "blue" | "green"> = {
  Corporate: "purple",
  Department: "blue",
  Individual: "green",
};

type Kpi = { id: string; name: string; level: string; weight: number; target: number; actual: number; unit: string; sourceCode?: string; sourceKpiId?: string };
type Perf = { id: string; name: string; avatar: string; role: string; score: number };

const inputCls =
  "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const initials = (name: string) => name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

let seq = 0;
const newId = (p: string) => {
  try {
    return `${p}-${crypto.randomUUID().slice(0, 6)}`;
  } catch {
    return `${p}-${++seq}-${Date.now()}`;
  }
};

function Modal({ icon, title, onClose, onSave, saveLabel, children }: { icon: React.ReactNode; title: string; onClose: () => void; onSave: () => void; saveLabel: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass card shadow-glass animate-fade-up">
        <div className="flex items-center gap-2 border-b p-4">
          {icon}
          <div className="text-sm font-semibold">{title}</div>
          <button onClick={onClose} className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="space-y-3 p-5">{children}</div>
        <div className="flex justify-end gap-2 border-t p-3">
          <Btn variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Btn>
          <Btn variant="primary" onClick={onSave}>
            {saveLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}

const emptyKpi = { open: false, id: null as string | null, name: "", level: "Department", weight: 10, target: 100, actual: 0, unit: "%", sourceCode: "", sourceKpiId: "" };
const emptyPerf = { open: false, id: null as string | null, name: "", role: "", score: 90 };

export default function PerformancePage() {
  const { t } = useI18n();
  const [rows, setRows] = useLocalState<Kpi[]>("performance-kpis", mockPerformanceKpis.map((k, i) => ({ ...k, id: String(k.id ?? i + 1) })));
  const [corporateKpis] = useLocalState<CorporateKpi[]>("corporate-kpis", seedCorporateKpis);
  const [perfs, setPerfs] = useLocalState<Perf[]>("appraisals", mockTop.map((p, i) => ({ id: `ap-${i + 1}`, ...p })));
  const [live, setLive] = useState(false);
  const [form, setForm] = useState(emptyKpi);
  const [pf, setPf] = useState(emptyPerf);
  const [coaching, setCoaching] = useState(false);

  // Hybrid: seed from localStorage, prefer live API when signed in.
  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    apiGet<Kpi[]>("/performance-kpis")
      .then((res) => {
        if (active && Array.isArray(res)) {
          setRows(res.map((k, i) => ({ ...k, id: String(k.id ?? i + 1) })));
          setLive(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = (method: "POST" | "PUT" | "DELETE", path: string, body?: unknown) => {
    if (getToken()) apiSend(method, path, body).catch(() => {});
  };

  // --- KPI CRUD ---
  const openCreate = () => setForm({ ...emptyKpi, open: true });
  const openEdit = (k: Kpi) => setForm({ open: true, id: k.id, name: k.name, level: k.level, weight: k.weight, target: k.target, actual: k.actual, unit: k.unit, sourceCode: k.sourceCode ?? "", sourceKpiId: k.sourceKpiId ?? "" });
  // Adopt a Corporate KPI: prefill name/unit/target and record the cascade source.
  const adoptCorporate = (id: string) => {
    if (!id) { setForm((f) => ({ ...f, sourceKpiId: "", sourceCode: "" })); return; }
    const ck = corporateKpis.find((c) => c.id === id);
    if (!ck) return;
    setForm((f) => ({ ...f, sourceKpiId: ck.id, sourceCode: ck.code, name: ck.name, unit: ck.unit || f.unit, target: Number(ck.target) || f.target }));
  };
  const saveForm = () => {
    const body = { name: form.name.trim(), level: form.level, weight: form.weight, target: form.target, actual: form.actual, unit: form.unit.trim(), sourceCode: form.sourceCode || undefined, sourceKpiId: form.sourceKpiId || undefined };
    if (!body.name) return;
    if (form.id == null) {
      const k: Kpi = { id: newId("kpi"), ...body };
      setRows((r) => [...r, k]);
      sync("POST", "/performance-kpis", k);
    } else {
      setRows((r) => r.map((x) => (x.id === form.id ? { ...x, ...body } : x)));
      sync("PUT", `/performance-kpis/${form.id}`, body);
    }
    setForm(emptyKpi);
  };
  const removeRow = (k: Kpi) => {
    setRows((r) => r.filter((x) => x.id !== k.id));
    sync("DELETE", `/performance-kpis/${k.id}`);
  };

  // --- appraisal CRUD ---
  const openPfCreate = () => setPf({ ...emptyPerf, open: true });
  const openPfEdit = (p: Perf) => setPf({ open: true, id: p.id, name: p.name, role: p.role, score: p.score });
  const savePf = () => {
    const name = pf.name.trim();
    if (!name) return;
    const body = { name, avatar: initials(name), role: pf.role.trim() || "—", score: clamp(pf.score, 0, 100) };
    if (pf.id == null) setPerfs((r) => [...r, { id: newId("ap"), ...body }]);
    else setPerfs((r) => r.map((x) => (x.id === pf.id ? { ...x, ...body } : x)));
    setPf(emptyPerf);
  };
  const removePf = (p: Perf) => setPerfs((r) => r.filter((x) => x.id !== p.id));

  const weighted = rows.reduce((s, k) => s + Math.min(1.1, k.target ? k.actual / k.target : 0) * k.weight, 0);
  const score = Math.round(weighted);
  const ranked = [...perfs].sort((a, b) => b.score - a.score);
  const bottom = ranked[ranked.length - 1];

  return (
    <>
      <PageHeader
        title="Performance Management"
        subtitle="Corporate · Department · Individual KPI · SMART · Weight · Auto Score · Appraisal · STAR"
        actions={
          <>
            <LiveBadge live={live} />
            {getToken() && (
              <>
                <Btn onClick={() => apiDownload("/exports/kpis", undefined, "nexus-kpis.xlsx", "GET")}>
                  <Icon.document className="h-4 w-4" /> {t("Excel")}
                </Btn>
                <Btn onClick={() => apiDownload("/exports/report", undefined, "nexus-executive-overview.pptx", "GET")}>
                  <Icon.document className="h-4 w-4" /> {t("Deck")}
                </Btn>
              </>
            )}
            <Btn variant="primary" onClick={openCreate}>
              <Icon.plus className="h-4 w-4" /> {t("New KPI")}
            </Btn>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Link href="/performance/dictionary" className="flex items-center gap-3 rounded-xl border border-royal-500/30 bg-royal-500/5 px-4 py-3 transition hover:border-royal-500/50 hover:bg-royal-500/10">
          <Icon.knowledge className="h-5 w-5 shrink-0 text-royal-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{t("Performance Dictionary")}</div>
            <div className="text-[11px] text-[var(--muted)]">{t("Corporate KPI · Strategic Goal · Alignment & Cascading · Job Profile")}</div>
          </div>
          <Icon.chevron className="h-4 w-4 shrink-0 text-[var(--muted)]" />
        </Link>
        <Link href="/performance/planning" className="flex items-center gap-3 rounded-xl border border-royal-500/30 bg-royal-500/5 px-4 py-3 transition hover:border-royal-500/50 hover:bg-royal-500/10">
          <Icon.performance className="h-5 w-5 shrink-0 text-royal-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{t("Performance Planning")}</div>
            <div className="text-[11px] text-[var(--muted)]">{t("Perencanaan & rekap KPI individu · target bulanan")}</div>
          </div>
          <Icon.chevron className="h-4 w-4 shrink-0 text-[var(--muted)]" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center">
          <SectionTitle title="Weighted Performance Score" />
          <Gauge value={score} size={180} />
          <Badge tone={score >= 90 ? "green" : score >= 75 ? "amber" : "red"} className="mt-2">
            {score >= 90 ? t("Exceeds") : score >= 75 ? t("Meets") : t("Below")} {t("Target")}
          </Badge>
          <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
            {t("Auto-calculated from")} {rows.length} {t("weighted KPI")}
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle title="KPI Scorecard" subtitle="SMART KPI with weight, target & achievement" />
          <div className="space-y-3">
            {rows.map((k) => {
              const pct = k.target ? (k.actual / k.target) * 100 : 0;
              return (
                <div key={k.id} dir="auto" className="group flex items-center gap-4 rounded-xl border p-3">
                  <div className="min-w-[180px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium">{k.name}</span>
                      <Badge tone={levelTone[k.level]}>{t(k.level)}</Badge>
                      {k.sourceCode && <span className="inline-flex items-center gap-1 rounded bg-royal-500/10 px-1.5 py-0.5 text-[10px] text-royal-400" title={t("Cascaded from Corporate KPI")}><Icon.knowledge className="h-2.5 w-2.5" /> {k.sourceCode}</span>}
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar value={Math.min(100, pct)} tone={pct >= 100 ? "green" : pct >= 90 ? "gold" : "red"} />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-[var(--muted)]">{t("Weight")}</div>
                    <div className="text-sm font-semibold">{k.weight}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-[var(--muted)]">{t("Target")}</div>
                    <div className="text-sm font-semibold">
                      {k.target}
                      {k.unit}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-[var(--muted)]">{t("Actual")}</div>
                    <div className={`text-sm font-bold ${pct >= 100 ? "text-emerald-500" : pct >= 90 ? "text-gold-500" : "text-rose-500"}`}>
                      {k.actual}
                      {k.unit}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <button onClick={() => openEdit(k)} className="font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100" aria-label={`Edit ${k.name}`} title={t("Edit")}>
                      {t("Edit")}
                    </button>
                    <button onClick={() => removeRow(k)} className="text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100" aria-label={`Delete ${k.name}`} title={t("Delete")}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && <p className="py-3 text-center text-[12px] text-[var(--muted)]">{t("Auto-calculated from")} 0 {t("weighted KPI")}</p>}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="Performance Trend" subtitle="Quarterly review — department index" action={<Badge tone="green">+15 pts YTD</Badge>} />
          <LineChart data={kpiTrend.map((d) => d.v)} labels={kpiTrend.map((d) => d.m)} min={60} max={100} tone="gold" />
        </Card>

        <Card>
          <SectionTitle
            title="Appraisal Ranking"
            subtitle="STAR method scores"
            action={
              <button onClick={openPfCreate} className="text-royal-400 transition hover:text-royal-300" aria-label="Add appraisal" title={t("Add")}>
                <Icon.plus className="h-4 w-4" />
              </button>
            }
          />
          <div className="space-y-3">
            {ranked.map((p, i) => (
              <div key={p.id} dir="auto" className="group flex items-center gap-3">
                <span className={`w-4 text-center text-xs font-bold ${i === 0 ? "text-gold-400" : "text-[var(--muted)]"}`}>{i + 1}</span>
                <Avatar initials={p.avatar} tone={i === 0 ? "gold" : "blue"} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{p.name}</div>
                  <div className="text-[10px] text-[var(--muted)]">{p.role}</div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button onClick={() => openPfEdit(p)} className="font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100" title={t("Edit")}>
                    {t("Edit")}
                  </button>
                  <button onClick={() => removePf(p)} className="text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100" title={t("Delete")}>
                    ✕
                  </button>
                </div>
                <span className="text-sm font-bold gold-gradient">{p.score}</span>
              </div>
            ))}
            {ranked.length === 0 && <p className="py-3 text-center text-[12px] text-[var(--muted)]">{t("No appraisals yet. Add one.")}</p>}
          </div>
          <button onClick={() => setCoaching(true)} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium text-royal-400 hover:bg-royal-500/5">
            <Icon.spark className="h-3.5 w-3.5" /> {t("Generate Coaching Plan")}
          </button>
        </Card>
      </div>

      {form.open && (
        <Modal icon={<Icon.performance className="h-4 w-4 shrink-0 text-royal-400" />} title={form.id == null ? t("New KPI") : t("Edit KPI")} onClose={() => setForm(emptyKpi)} onSave={saveForm} saveLabel={form.id == null ? t("Create") : t("Save")}>
          {corporateKpis.length > 0 && (
            <label className="block rounded-lg border border-royal-500/30 bg-royal-500/5 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-royal-400">
                <Icon.knowledge className="h-3.5 w-3.5" /> {t("Adopt from Corporate KPI")}
              </div>
              <select value={form.sourceKpiId} onChange={(e) => adoptCorporate(e.target.value)} className={`${inputCls} text-[var(--text)]`}>
                <option value="">{t("— none (manual KPI)")}</option>
                {corporateKpis.map((c) => (<option key={c.id} value={c.id}>{c.code} · {c.name}{c.target ? ` (${c.target}${c.unit ? ` ${c.unit}` : ""})` : ""}</option>))}
              </select>
              <div className="mt-1 text-[10px] text-[var(--muted)]">{t("Cascades the corporate KPI down as this individual/department KPI.")}</div>
            </label>
          )}
          <label className={labelCls}>
            {t("Name")}
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, sourceKpiId: f.sourceKpiId, sourceCode: f.sourceCode }))} placeholder={t("e.g. Revenue Growth")} className={inputCls} />
            {form.sourceCode && <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-royal-400"><Icon.knowledge className="h-3 w-3" /> {t("Cascaded from")} {form.sourceCode}</span>}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Level")}
              <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className={`${inputCls} text-[var(--text)]`}>
                <option value="Corporate">{t("Corporate")}</option>
                <option value="Department">{t("Department")}</option>
                <option value="Individual">{t("Individual")}</option>
              </select>
            </label>
            <label className={labelCls}>
              {t("Weight (%)")}
              <input type="number" min={0} max={100} value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: Number(e.target.value) }))} className={inputCls} />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className={labelCls}>
              {t("Target")}
              <input type="number" min={0} value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: Number(e.target.value) }))} className={inputCls} />
            </label>
            <label className={labelCls}>
              {t("Actual")}
              <input type="number" min={0} value={form.actual} onChange={(e) => setForm((f) => ({ ...f, actual: Number(e.target.value) }))} className={inputCls} />
            </label>
            <label className={labelCls}>
              {t("Unit")}
              <input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder={t("% or /5")} className={inputCls} />
            </label>
          </div>
        </Modal>
      )}

      {pf.open && (
        <Modal icon={<Icon.performance className="h-4 w-4 shrink-0 text-royal-400" />} title={pf.id == null ? t("New Appraisal") : t("Edit Appraisal")} onClose={() => setPf(emptyPerf)} onSave={savePf} saveLabel={pf.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Name")}
            <EmployeePicker
              value={pf.name}
              onChange={(v) => setPf((f) => ({ ...f, name: v }))}
              onPick={(emp) => setPf((f) => ({ ...f, role: f.role.trim() ? f.role : emp.position || f.role }))}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Role")}
              <input value={pf.role} onChange={(e) => setPf((f) => ({ ...f, role: e.target.value }))} placeholder={t("e.g. Competency Analyst")} className={inputCls} />
            </label>
            <label className={labelCls}>
              {t("Score")} (0–100)
              <input type="number" min={0} max={100} value={pf.score} onChange={(e) => setPf((f) => ({ ...f, score: Number(e.target.value) }))} className={inputCls} />
            </label>
          </div>
        </Modal>
      )}

      {coaching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCoaching(false)} />
          <div className="relative z-10 w-full max-w-md glass card shadow-glass animate-fade-up">
            <div className="flex items-center gap-2 border-b p-4">
              <Icon.spark className="h-4 w-4 shrink-0 text-gold-400" />
              <div className="text-sm font-semibold">{t("Coaching Plan")}</div>
              <button onClick={() => setCoaching(false)} className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400" aria-label="Close">
                ✕
              </button>
            </div>
            <div className="space-y-3 p-5">
              {bottom ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar initials={bottom.avatar} />
                    <div>
                      <div className="text-[13px] font-semibold">{bottom.name}</div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {bottom.role} · {bottom.score}
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                    {t("Bi-weekly 1:1s, 3 measurable STAR goals, and a 6-week progress review — focused on the lowest-weighted KPIs.")}
                  </p>
                </>
              ) : (
                <p className="text-center text-[12px] text-[var(--muted)]">{t("No appraisals yet. Add one.")}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t p-3">
              <Btn variant="primary" onClick={() => setCoaching(false)}>
                {t("Save")}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
