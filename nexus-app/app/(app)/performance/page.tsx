"use client";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, Avatar, LineChart, Gauge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { performanceKpis as mockPerformanceKpis, kpiTrend, topPerformers } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { LiveBadge } from "@/components/LiveBadge";

const levelTone: Record<string, "purple" | "blue" | "green"> = {
  Corporate: "purple",
  Department: "blue",
  Individual: "green",
};

export default function PerformancePage() {
  const { data: performanceKpis, live } = useApiData("/performance-kpis", mockPerformanceKpis);
  const weighted = performanceKpis.reduce((s, k) => {
    const ratio = k.unit === "/5" ? k.actual / k.target : k.actual / k.target;
    return s + Math.min(1.1, ratio) * k.weight;
  }, 0);
  const score = Math.round(weighted);

  return (
    <>
      <PageHeader
        title="Performance Management"
        subtitle="Corporate · Department · Individual KPI · SMART · Weight · Auto Score · Appraisal · STAR"
        actions={<><LiveBadge live={live} /><Btn variant="primary"><Icon.plus className="h-4 w-4" /> New KPI</Btn></>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Auto score */}
        <Card className="flex flex-col items-center justify-center">
          <SectionTitle title="Weighted Performance Score" />
          <Gauge value={score} size={180} />
          <Badge tone={score >= 90 ? "green" : score >= 75 ? "amber" : "red"} className="mt-2">
            {score >= 90 ? "Exceeds" : score >= 75 ? "Meets" : "Below"} Target
          </Badge>
          <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
            Auto-calculated from {performanceKpis.length} weighted KPI
          </p>
        </Card>

        {/* KPI table */}
        <Card className="lg:col-span-2">
          <SectionTitle title="KPI Scorecard" subtitle="SMART KPI with weight, target & achievement" />
          <div className="space-y-3">
            {performanceKpis.map((k) => {
              const pct = k.unit === "/5" ? (k.actual / k.target) * 100 : (k.actual / k.target) * 100;
              return (
                <div key={k.id} className="flex items-center gap-4 rounded-xl border p-3">
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
                    <div className="text-[10px] text-[var(--muted)]">Weight</div>
                    <div className="text-sm font-semibold">{k.weight}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-[var(--muted)]">Target</div>
                    <div className="text-sm font-semibold">{k.target}{k.unit}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-[var(--muted)]">Actual</div>
                    <div className={`text-sm font-bold ${pct >= 100 ? "text-emerald-500" : pct >= 90 ? "text-gold-500" : "text-rose-500"}`}>
                      {k.actual}{k.unit}
                    </div>
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
            <Icon.spark className="h-3.5 w-3.5" /> Generate Coaching Plan
          </button>
        </Card>
      </div>
    </>
  );
}
