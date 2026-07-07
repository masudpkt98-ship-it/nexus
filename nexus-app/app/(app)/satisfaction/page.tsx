"use client";

import { PageHeader } from "@/components/PageHeader";
import { Card, SectionTitle, ProgressBar, DonutChart, LineChart } from "@/components/ui";
import { LiveBadge } from "@/components/LiveBadge";
import { useApiData } from "@/lib/useApi";
import {
  npsData as mockNps,
  satisfactionByService as mockByService,
  satisfactionTrend as mockTrend,
} from "@/lib/data";

export default function SatisfactionPage() {
  const { data, live } = useApiData("/satisfaction", {
    nps: mockNps,
    byService: mockByService,
    trend: mockTrend,
  });
  const npsData = data.nps;
  const satisfactionByService = data.byService;
  const satisfactionTrend = data.trend;

  const distribution = [
    { label: "Promoters", value: npsData.promoters, color: "#10b981", tone: "text-emerald-500" },
    { label: "Passives", value: npsData.passives, color: "#e5aa26", tone: "gold-gradient" },
    { label: "Detractors", value: npsData.detractors, color: "#f43f5e", tone: "text-rose-500" },
  ];

  const segments = distribution.map((d) => ({ value: d.value, color: d.color, label: d.label }));

  return (
    <>
      <PageHeader
        title="Customer Satisfaction"
        subtitle="Survey · Rating · Net Promoter Score · Service Quality"
        actions={<LiveBadge live={live} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center">
          <SectionTitle title="Net Promoter Score" />
          <DonutChart
            segments={segments}
            size={180}
            thickness={20}
            center={
              <div className="text-center">
                <div className="text-4xl font-bold gold-gradient">+{npsData.nps}</div>
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">NPS</div>
              </div>
            }
          />
          <div className="mt-4 flex w-full justify-center gap-4 text-[11px]">
            {distribution.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-[var(--muted)]">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle title="CSAT Trend" subtitle="Average rating (out of 5) over the last 7 months" />
          <LineChart
            data={satisfactionTrend.map((d) => d.v)}
            labels={satisfactionTrend.map((d) => d.m)}
            min={3.5}
            max={5}
            tone="gold"
          />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {distribution.map((d) => (
          <Card key={d.label}>
            <div className="text-xs text-[var(--muted)]">{d.label}</div>
            <div className={`mt-1 text-2xl font-bold ${d.tone}`}>{d.value}%</div>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <Card>
          <SectionTitle title="Satisfaction by Service" subtitle="Mean score per service line" />
          <div className="space-y-4">
            {satisfactionByService.map((s) => (
              <div key={s.service} className="flex items-center gap-4">
                <div className="w-48 shrink-0 text-sm">{s.service}</div>
                <div className="flex-1">
                  <ProgressBar value={(s.score / 5) * 100} tone="gold" />
                </div>
                <div className="w-14 shrink-0 text-right text-sm font-semibold">{s.score.toFixed(1)}/5</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
