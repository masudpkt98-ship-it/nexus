"use client";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { objectives as mockObjectives } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { LiveBadge } from "@/components/LiveBadge";

const flow = ["Vision", "Mission", "Goals", "Annual Program (RKAP)", "Initiatives", "OKR", "Milestones"];

export default function StrategyPage() {
  const { data: objectives, live } = useApiData("/objectives", mockObjectives);
  return (
    <>
      <PageHeader
        title="Strategic Planning"
        subtitle="Vision · Mission · Department Goals · Annual Programs · OKR · RKAP"
        actions={<><LiveBadge live={live} /><Btn variant="primary"><Icon.plus className="h-4 w-4" /> New Objective</Btn></>}
      />

      {/* Vision / Mission */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-8 -top-8 opacity-10">
            <Icon.strategy className="h-40 w-40" />
          </div>
          <Badge tone="gold">Vision</Badge>
          <p className="mt-3 text-xl font-semibold leading-snug">
            To become the intelligent digital ecosystem for{" "}
            <span className="gold-gradient">organizational excellence</span>.
          </p>
          <div className="mt-5">
            <Badge tone="blue">Mission</Badge>
            <p className="mt-2 text-sm text-[var(--muted)]">
              To empower organizations through integrated competency and performance management —
              connecting people, competency, execution, and value into one operating system.
            </p>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Strategy Cascade" subtitle="Everything connected" />
          <div className="space-y-1.5">
            {flow.map((f, i) => (
              <div key={f} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-royal-500/15 text-[11px] font-bold text-royal-400">
                  {i + 1}
                </div>
                <span className="text-[13px]">{f}</span>
                {i < flow.length - 1 && <Icon.chevron className="ml-auto h-4 w-4 rotate-90 text-[var(--muted)]" />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* OKR */}
      <div className="mt-4">
        <SectionTitle title="Objectives & Key Results (OKR)" subtitle="FY26 — Department strategic objectives" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {objectives.map((o) => (
            <Card key={o.id}>
              <div className="flex items-center justify-between">
                <Badge tone="blue">{o.quarter}</Badge>
                <span className="text-lg font-bold gold-gradient">{o.progress}%</span>
              </div>
              <h3 className="mt-2 text-[15px] font-semibold leading-snug">{o.title}</h3>
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
                <Avatar initials={o.owner.split(" ").map((s) => s[0]).join("")} />
                {o.owner}
              </div>
              <ProgressBar value={o.progress} tone="gold" className="mt-3" />
              <div className="mt-4 space-y-3 border-t pt-3">
                {o.keyResults.map((kr) => (
                  <div key={kr.title}>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[var(--muted)]">{kr.title}</span>
                      <span className="font-medium">{kr.progress}%</span>
                    </div>
                    <ProgressBar value={kr.progress} className="mt-1" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
