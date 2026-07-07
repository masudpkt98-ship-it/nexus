"use client";

import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, LineChart, BarChart, DonutChart, Sparkline } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { LiveBadge } from "@/components/LiveBadge";
import { useApiData } from "@/lib/useApi";
import { useI18n } from "@/lib/i18n";
import {
  kpiTrend as mockKpiTrend,
  satisfactionTrend as mockSatisfactionTrend,
  workloadByTeam as mockWorkloadByTeam,
  satisfactionByService as mockSatisfactionByService,
} from "@/lib/data";

const fallbackIndices = [
  { label: "Productivity Score", value: 84, delta: 4, trend: [70, 74, 76, 78, 80, 82, 84] },
  { label: "Competency Index", value: 78, delta: -1, trend: [80, 79, 79, 78, 77, 78, 78] },
  { label: "Training Index", value: 88, delta: 3, trend: [79, 81, 83, 84, 86, 87, 88] },
  { label: "SLA Compliance", value: 93, delta: 2, trend: [88, 89, 90, 91, 92, 92, 93] },
];

const exportFormats = ["PDF", "Excel", "PowerPoint", "CSV"];

export default function AnalyticsPage() {
  const { t } = useI18n();
  const { data, live } = useApiData("/analytics", {
    indices: fallbackIndices,
    taskCompletion: { done: 68, active: 22, overdue: 10, completionPct: 68 },
    kpiTrend: mockKpiTrend,
    satisfactionTrend: mockSatisfactionTrend,
    workloadByTeam: mockWorkloadByTeam,
    satisfactionByService: mockSatisfactionByService,
  });
  const indices = data.indices;
  const kpiTrend = data.kpiTrend;
  const satisfactionTrend = data.satisfactionTrend;
  const workloadByTeam = data.workloadByTeam;
  const satisfactionByService = data.satisfactionByService;

  const tc = data.taskCompletion;
  const tcTotal = tc.done + tc.active + tc.overdue || 1;
  const pct = (n: number) => Math.round((n / tcTotal) * 100);

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Productivity · Department Performance · Competency · Training · SLA · Executive Dashboard"
        actions={
          <>
            <LiveBadge live={live} />
            {exportFormats.map((f) => (
              <Btn key={f} variant="ghost">{f}</Btn>
            ))}
          </>
        }
      />

      {/* Index cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {indices.map((idx) => (
          <Card key={idx.label}>
            <div className="flex items-start justify-between">
              <div className="text-xs text-[var(--muted)]">{idx.label}</div>
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
                { value: tc.done, color: "#2f6bff", label: t("Done") },
                { value: tc.active, color: "#e5aa26", label: t("In Progress") },
                { value: tc.overdue, color: "#f43f5e", label: t("Overdue") },
              ]}
              center={
                <div className="text-center">
                  <div className="text-2xl font-bold">{tc.completionPct}%</div>
                  <div className="text-[10px] text-[var(--muted)]">{t("completed")}</div>
                </div>
              }
            />
            <div className="mt-3 grid w-full grid-cols-3 gap-2 text-center text-[10px]">
              <div><span className="mx-auto mb-1 block h-2 w-2 rounded-full bg-royal-500" />{t("Done")} {pct(tc.done)}%</div>
              <div><span className="mx-auto mb-1 block h-2 w-2 rounded-full bg-gold-400" />{t("Active")} {pct(tc.active)}%</div>
              <div><span className="mx-auto mb-1 block h-2 w-2 rounded-full bg-rose-500" />{t("Overdue")} {pct(tc.overdue)}%</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <SectionTitle title="Workload Distribution" subtitle="Open vs completed by team" />
          <BarChart data={workloadByTeam.map((t) => ({ label: t.team, a: t.open, b: t.done }))} height={170} />
        </Card>

        <Card>
          <SectionTitle title="Satisfaction Trend" subtitle="CSAT over time" />
          <LineChart data={satisfactionTrend.map((d) => d.v)} labels={satisfactionTrend.map((d) => d.m)} min={3.5} max={5} tone="gold" height={170} />
        </Card>

        <Card>
          <SectionTitle title="Service Quality Index" subtitle="By service line" />
          <div className="space-y-3 pt-1">
            {satisfactionByService.map((s) => (
              <div key={s.service}>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--muted)]">{s.service}</span>
                  <span className="font-medium">{s.score.toFixed(1)}</span>
                </div>
                <ProgressBar value={(s.score / 5) * 100} tone="gold" className="mt-1" />
              </div>
            ))}
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
        <Btn variant="gold"><Icon.spark className="h-4 w-4" /> {t("Generate with AI")}</Btn>
      </Card>
    </>
  );
}
