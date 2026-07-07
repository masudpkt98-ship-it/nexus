"use client";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, ProgressBar, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { programs as mockPrograms } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { LiveBadge } from "@/components/LiveBadge";

const statusTone: Record<string, "green" | "amber" | "red" | "blue"> = {
  "On Track": "green",
  Completed: "blue",
  "At Risk": "amber",
  Delayed: "red",
};
const riskTone: Record<string, "green" | "amber" | "red"> = { Low: "green", Medium: "amber", High: "red" };

export default function ProgramsPage() {
  const { data: programs, live } = useApiData("/programs", mockPrograms);
  const totalBudget = programs.reduce((s, p) => s + p.budget, 0);
  const totalSpent = programs.reduce((s, p) => s + p.spent, 0);
  const summary = [
    { label: "Active Programs", value: programs.filter((p) => p.status !== "Completed").length, tone: "blue" },
    { label: "On Track", value: programs.filter((p) => p.status === "On Track").length, tone: "green" },
    { label: "At Risk / Delayed", value: programs.filter((p) => p.status === "At Risk" || p.status === "Delayed").length, tone: "red" },
    { label: "Budget Utilization", value: `${Math.round((totalSpent / totalBudget) * 100)}%`, tone: "gold" },
  ] as const;

  return (
    <>
      <PageHeader
        title="Program Management"
        subtitle="Program · Project · Milestone · Deliverables · Budget · Risk · Dependency"
        actions={<><LiveBadge live={live} /><Btn variant="primary"><Icon.plus className="h-4 w-4" /> New Program</Btn></>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-[var(--muted)]">{s.label}</div>
            <div
              className={`mt-1 text-2xl font-bold ${
                s.tone === "green" ? "text-emerald-500" : s.tone === "red" ? "text-rose-500" : s.tone === "gold" ? "gold-gradient" : ""
              }`}
            >
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {programs.map((p) => (
          <Card key={p.id} className="hover:border-royal-500/40 transition">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-[220px] flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.name}</span>
                  <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                  <Avatar initials={p.owner.split(" ").map((s) => s[0]).join("")} />
                  {p.id} · {p.owner}
                </div>
              </div>

              <div className="w-40">
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-[var(--muted)]">Progress</span>
                  <span className="font-semibold">{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} tone={riskTone[p.risk] === "red" ? "red" : riskTone[p.risk] === "amber" ? "gold" : "blue"} />
              </div>

              <div className="text-center">
                <div className="text-[10px] text-[var(--muted)]">Milestones</div>
                <div className="text-sm font-semibold">{p.milestonesDone}/{p.milestones}</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] text-[var(--muted)]">Budget</div>
                <div className="text-sm font-semibold">${p.spent}k / ${p.budget}k</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] text-[var(--muted)]">Risk</div>
                <Badge tone={riskTone[p.risk]}>{p.risk}</Badge>
              </div>

              <div className="text-right text-[11px] text-[var(--muted)]">
                <div>{new Date(p.start).toLocaleDateString("en", { month: "short", year: "2-digit" })}</div>
                <div>→ {new Date(p.end).toLocaleDateString("en", { month: "short", year: "2-digit" })}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
