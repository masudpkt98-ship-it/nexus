"use client";
import { useEffect, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, Avatar, LineChart, Gauge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { performanceKpis as mockPerformanceKpis, kpiTrend, topPerformers } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { apiSend, apiDownload, getToken } from "@/lib/api";
import { LiveBadge } from "@/components/LiveBadge";
import { useI18n } from "@/lib/i18n";

const levelTone: Record<string, "purple" | "blue" | "green"> = {
  Corporate: "purple",
  Department: "blue",
  Individual: "green",
};

type Kpi = { id: string; name: string; level: string; weight: number; target: number; actual: number; unit: string };

export default function PerformancePage() {
  const { t } = useI18n();
  const { data: apiKpis, live } = useApiData("/performance-kpis", mockPerformanceKpis);

  const [rows, setRows] = useState<Kpi[]>([]);
  useEffect(() => {
    setRows(
      (apiKpis ?? []).map((k: Partial<Kpi>) => ({
        id: String(k.id),
        name: k.name ?? "",
        level: k.level ?? "Department",
        weight: Number(k.weight ?? 0),
        target: Number(k.target ?? 0),
        actual: Number(k.actual ?? 0),
        unit: k.unit ?? "",
      }))
    );
  }, [apiKpis]);

  const empty = {
    open: false,
    id: null as string | null,
    name: "",
    level: "Department",
    weight: 10,
    target: 100,
    actual: 0,
    unit: "%",
  };
  const [form, setForm] = useState(empty);
  const openCreate = () => setForm({ ...empty, open: true });
  const openEdit = (k: Kpi) =>
    setForm({ open: true, id: k.id, name: k.name, level: k.level, weight: k.weight, target: k.target, actual: k.actual, unit: k.unit });

  const saveForm = async () => {
    const body = {
      name: form.name.trim(),
      level: form.level,
      weight: form.weight,
      target: form.target,
      actual: form.actual,
      unit: form.unit.trim(),
    };
    if (!body.name) return;
    if (getToken()) {
      try {
        if (form.id == null) {
          const created = await apiSend<Kpi>("POST", "/performance-kpis", body);
          setRows((r) => [...r, created]);
        } else {
          const updated = await apiSend<Kpi>("PUT", `/performance-kpis/${form.id}`, body);
          setRows((r) => r.map((x) => (x.id === form.id ? updated : x)));
        }
      } catch {
        return;
      }
    } else if (form.id == null) {
      setRows((r) => [...r, { id: "NEW-" + r.length, ...body }]);
    } else {
      setRows((r) => r.map((x) => (x.id === form.id ? { ...x, ...body } : x)));
    }
    setForm(empty);
  };

  const removeRow = async (k: Kpi) => {
    setRows((r) => r.filter((x) => x.id !== k.id));
    if (getToken()) {
      try {
        await apiSend("DELETE", `/performance-kpis/${k.id}`);
      } catch {
        /* ignore */
      }
    }
  };

  const weighted = rows.reduce((s, k) => s + Math.min(1.1, k.target ? k.actual / k.target : 0) * k.weight, 0);
  const score = Math.round(weighted);

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Auto score */}
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

        {/* KPI table */}
        <Card className="lg:col-span-2">
          <SectionTitle title="KPI Scorecard" subtitle="SMART KPI with weight, target & achievement" />
          <div className="space-y-3">
            {rows.map((k) => {
              const pct = k.target ? (k.actual / k.target) * 100 : 0;
              return (
                <div key={k.id} className="group flex items-center gap-4 rounded-xl border p-3">
                  <div className="min-w-[180px] flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">{k.name}</span>
                      <Badge tone={levelTone[k.level]}>{k.level}</Badge>
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
                    <div className="text-sm font-semibold">{k.target}{k.unit}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-[var(--muted)]">{t("Actual")}</div>
                    <div className={`text-sm font-bold ${pct >= 100 ? "text-emerald-500" : pct >= 90 ? "text-gold-500" : "text-rose-500"}`}>
                      {k.actual}{k.unit}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <button
                      onClick={() => openEdit(k)}
                      className="font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100"
                      aria-label={`Edit ${k.name}`}
                      title="Edit"
                    >
                      {t("Edit")}
                    </button>
                    <button
                      onClick={() => removeRow(k)}
                      className="text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                      aria-label={`Delete ${k.name}`}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="Performance Trend" subtitle="Quarterly review — department index" action={<Badge tone="green">+15 pts YTD</Badge>} />
          <LineChart data={kpiTrend.map((d) => d.v)} labels={kpiTrend.map((d) => d.m)} min={60} max={100} tone="gold" />
        </Card>

        <Card>
          <SectionTitle title="Appraisal Ranking" subtitle="STAR method scores" />
          <div className="space-y-3">
            {topPerformers.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className={`w-4 text-center text-xs font-bold ${i === 0 ? "text-gold-400" : "text-[var(--muted)]"}`}>{i + 1}</span>
                <Avatar initials={p.avatar} tone={i === 0 ? "gold" : "blue"} />
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{p.name}</div>
                  <div className="text-[10px] text-[var(--muted)]">{p.role}</div>
                </div>
                <span className="text-sm font-bold gold-gradient">{p.score}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium text-royal-400 hover:bg-royal-500/5">
            <Icon.spark className="h-3.5 w-3.5" /> {t("Generate Coaching Plan")}
          </button>
        </Card>
      </div>

      {form.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setForm(empty)} />
          <div className="relative z-10 w-full max-w-md glass card shadow-glass animate-fade-up">
            <div className="flex items-center gap-2 border-b p-4">
              <Icon.performance className="h-4 w-4 shrink-0 text-royal-400" />
              <div className="text-sm font-semibold">{form.id == null ? t("New KPI") : t("Edit KPI")}</div>
              <button
                onClick={() => setForm(empty)}
                className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 p-5">
              <label className="block text-[11px] font-medium text-[var(--muted)]">
                {t("Name")}
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("e.g. Revenue Growth")}
                  className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[11px] font-medium text-[var(--muted)]">
                  {t("Level")}
                  <select
                    value={form.level}
                    onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                    className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500"
                  >
                    <option value="Corporate">{t("Corporate")}</option>
                    <option value="Department">{t("Department")}</option>
                    <option value="Individual">{t("Individual")}</option>
                  </select>
                </label>
                <label className="block text-[11px] font-medium text-[var(--muted)]">
                  {t("Weight (%)")}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.weight}
                    onChange={(e) => setForm((f) => ({ ...f, weight: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500"
                  />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-[11px] font-medium text-[var(--muted)]">
                  {t("Target")}
                  <input
                    type="number"
                    min={0}
                    value={form.target}
                    onChange={(e) => setForm((f) => ({ ...f, target: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500"
                  />
                </label>
                <label className="block text-[11px] font-medium text-[var(--muted)]">
                  {t("Actual")}
                  <input
                    type="number"
                    min={0}
                    value={form.actual}
                    onChange={(e) => setForm((f) => ({ ...f, actual: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500"
                  />
                </label>
                <label className="block text-[11px] font-medium text-[var(--muted)]">
                  {t("Unit")}
                  <input
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder={t("% or /5")}
                    className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500"
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t p-3">
              <Btn variant="ghost" onClick={() => setForm(empty)}>
                {t("Cancel")}
              </Btn>
              <Btn variant="primary" onClick={saveForm}>
                {form.id == null ? t("Create") : t("Save")}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
