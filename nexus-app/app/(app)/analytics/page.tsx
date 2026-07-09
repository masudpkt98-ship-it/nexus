"use client";

import React, { useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, LineChart, BarChart, DonutChart, Sparkline } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { LiveBadge } from "@/components/LiveBadge";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import {
  kpiTrend,
  satisfactionTrend,
  workloadByTeam,
  satisfactionByService as mockByService,
  tasks as mockTasks,
  programs as mockPrograms,
  competencies as mockCompetencies,
  type Task,
  type Program,
} from "@/lib/data";

type Service = { id: string; service: string; score: number };
type Comp = { name: string; category: string; current: number; required: number };

const download = (filename: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function AnalyticsPage() {
  const { t } = useI18n();
  // Live stores shared with the rest of the app.
  const [tasks] = useLocalState<Task[]>("tasks", mockTasks);
  const [programs] = useLocalState<Program[]>("programs", mockPrograms);
  const [services] = useLocalState<Service[]>("satisfaction-services", mockByService.map((s, i) => ({ id: `svc-${i + 1}`, ...s })));
  const [comps] = useLocalState<Comp[]>("competencies", mockCompetencies as Comp[]);
  const [report, setReport] = useState(false);

  // --- computed-from-live metrics ---
  const today = new Date().toISOString().slice(0, 10);
  const done = tasks.filter((tk) => tk.status === "Done").length;
  const overdue = tasks.filter((tk) => tk.status !== "Done" && tk.due && tk.due < today).length;
  const active = tasks.length - done - overdue;
  const tcTotal = Math.max(1, tasks.length);
  const completionPct = Math.round((done / tcTotal) * 100);
  const pct = (n: number) => Math.round((n / tcTotal) * 100);

  const avgReq = comps.reduce((s, c) => s + c.required, 0);
  const avgCur = comps.reduce((s, c) => s + c.current, 0);
  const competencyIndex = avgReq ? Math.round((avgCur / avgReq) * 100) : 0;
  const avgService = services.length ? services.reduce((s, x) => s + x.score, 0) / services.length : 0;

  const indices = [
    { label: "Productivity Score", value: 84, delta: 4, trend: [70, 74, 76, 78, 80, 82, 84] },
    { label: "Competency Index", value: competencyIndex, delta: competencyIndex - 79, trend: [80, 79, 79, 78, 77, 78, competencyIndex] },
    { label: "Training Index", value: 88, delta: 3, trend: [79, 81, 83, 84, 86, 87, 88] },
    { label: "SLA Compliance", value: 93, delta: 2, trend: [88, 89, 90, 91, 92, 92, 93] },
  ];

  // --- exports (real client-side downloads of the live snapshot) ---
  const csv = () => {
    const lines = [
      ["Metric", "Value"],
      ["Task completion %", String(completionPct)],
      ["Tasks done", String(done)],
      ["Tasks active", String(active)],
      ["Tasks overdue", String(overdue)],
      ["Competency index %", String(competencyIndex)],
      ["Avg service quality /5", avgService.toFixed(2)],
      ["Active programs", String(programs.filter((p) => p.status !== "Completed").length)],
      ...services.map((s) => [`Service: ${s.service}`, s.score.toFixed(1)]),
    ];
    return lines.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  };
  const markdown = () => {
    return [
      `# NEXUS — Executive Analytics Snapshot`,
      ``,
      `- **Task completion:** ${completionPct}%  (${done} done · ${active} active · ${overdue} overdue)`,
      `- **Competency index:** ${competencyIndex}%`,
      `- **Avg service quality:** ${avgService.toFixed(1)} / 5`,
      `- **Active programs:** ${programs.filter((p) => p.status !== "Completed").length}`,
      ``,
      `## Service quality by line`,
      ...services.map((s) => `- ${s.service}: ${s.score.toFixed(1)} / 5`),
    ].join("\n");
  };
  const doExport = (fmt: string) => {
    if (fmt === "CSV" || fmt === "Excel") download(`nexus-analytics.${fmt === "Excel" ? "csv" : "csv"}`, csv(), "text/csv");
    else download("nexus-analytics-report.md", markdown(), "text/markdown");
  };

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Productivity · Department Performance · Competency · Training · SLA · Executive Dashboard"
        actions={
          <>
            <LiveBadge live={false} />
            {["PDF", "Excel", "PowerPoint", "CSV"].map((f) => (
              <Btn key={f} variant="ghost" onClick={() => doExport(f)}>
                {f}
              </Btn>
            ))}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {indices.map((idx) => (
          <Card key={idx.label}>
            <div className="flex items-start justify-between">
              <div className="text-xs text-[var(--muted)]">{t(idx.label)}</div>
              <span className={`text-[11px] font-medium ${idx.delta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {idx.delta >= 0 ? "▲" : "▼"} {Math.abs(idx.delta)}
              </span>
            </div>
            <div className="mt-1 text-2xl font-bold">{idx.value}%</div>
            <div className="mt-2 h-8">
              <Sparkline data={idx.trend} className="h-full w-full" tone={idx.delta >= 0 ? "blue" : "gold"} />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="Department Performance Trend" subtitle="Composite KPI index vs satisfaction" action={<Badge tone="green">{t("Healthy")}</Badge>} />
          <LineChart data={kpiTrend.map((d) => d.v)} labels={kpiTrend.map((d) => d.m)} min={60} max={100} />
        </Card>

        <Card>
          <SectionTitle title="Task Completion" subtitle="This quarter" />
          <div className="flex flex-col items-center">
            <DonutChart
              size={170}
              segments={[
                { value: done, color: "#2f6bff", label: t("Done") },
                { value: active, color: "#e5aa26", label: t("In Progress") },
                { value: overdue, color: "#f43f5e", label: t("Overdue") },
              ]}
              center={
                <div className="text-center">
                  <div className="text-2xl font-bold">{completionPct}%</div>
                  <div className="text-[10px] text-[var(--muted)]">{t("completed")}</div>
                </div>
              }
            />
            <div className="mt-3 grid w-full grid-cols-3 gap-2 text-center text-[10px]">
              <div><span className="mx-auto mb-1 block h-2 w-2 rounded-full bg-royal-500" />{t("Done")} {pct(done)}%</div>
              <div><span className="mx-auto mb-1 block h-2 w-2 rounded-full bg-gold-400" />{t("Active")} {pct(active)}%</div>
              <div><span className="mx-auto mb-1 block h-2 w-2 rounded-full bg-rose-500" />{t("Overdue")} {pct(overdue)}%</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <SectionTitle title="Workload Distribution" subtitle="Open vs completed by team" />
          <BarChart data={workloadByTeam.map((w) => ({ label: w.team, a: w.open, b: w.done }))} height={170} />
        </Card>

        <Card>
          <SectionTitle title="Satisfaction Trend" subtitle="CSAT over time" />
          <LineChart data={satisfactionTrend.map((d) => d.v)} labels={satisfactionTrend.map((d) => d.m)} min={3.5} max={5} tone="gold" height={170} />
        </Card>

        <Card>
          <SectionTitle title="Service Quality Index" subtitle="By service line" />
          <div className="space-y-3 pt-1">
            {services.map((s) => (
              <div key={s.id} dir="auto">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--muted)]">{s.service}</span>
                  <span className="font-medium">{s.score.toFixed(1)}</span>
                </div>
                <ProgressBar value={(s.score / 5) * 100} tone="gold" className="mt-1" />
              </div>
            ))}
            {services.length === 0 && <p className="py-2 text-center text-[12px] text-[var(--muted)]">{t("No services yet. Add one.")}</p>}
          </div>
        </Card>
      </div>

      <Card className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon.spark className="h-5 w-5 text-gold-400" />
          <div>
            <div className="text-sm font-semibold">{t("Generate Executive Report")}</div>
            <div className="text-[11px] text-[var(--muted)]">{t("AI compiles a full narrative across all modules — export in any format.")}</div>
          </div>
        </div>
        <Btn variant="gold" onClick={() => setReport(true)}>
          <Icon.spark className="h-4 w-4" /> {t("Generate with AI")}
        </Btn>
      </Card>

      {report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReport(false)} />
          <div className="relative z-10 w-full max-w-lg glass card shadow-glass animate-fade-up">
            <div className="flex items-center gap-2 border-b p-4">
              <Icon.spark className="h-4 w-4 shrink-0 text-gold-400" />
              <div className="text-sm font-semibold">{t("Executive Report")}</div>
              <button onClick={() => setReport(false)} className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400" aria-label="Close">
                ✕
              </button>
            </div>
            <div className="space-y-2 p-5 text-[13px]">
              {[
                { k: t("Task Completion"), v: `${completionPct}%` },
                { k: t("Competency Index"), v: `${competencyIndex}%` },
                { k: t("Service Quality Index"), v: `${avgService.toFixed(1)} / 5` },
                { k: t("Active Programs"), v: String(programs.filter((p) => p.status !== "Completed").length) },
              ].map((row) => (
                <div key={row.k} className="flex items-center justify-between border-b border-black/5 pb-1.5 dark:border-white/5">
                  <span className="text-[var(--muted)]">{row.k}</span>
                  <span className="font-semibold">{row.v}</span>
                </div>
              ))}
              <p className="pt-1 text-[11px] text-[var(--muted)]">{t("AI compiles a full narrative across all modules — export in any format.")}</p>
            </div>
            <div className="flex justify-end gap-2 border-t p-3">
              <Btn variant="ghost" onClick={() => download("nexus-analytics-report.md", markdown(), "text/markdown")}>
                <Icon.document className="h-4 w-4" /> {t("Download .md")}
              </Btn>
              <Btn variant="primary" onClick={() => setReport(false)}>
                {t("Close")}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
