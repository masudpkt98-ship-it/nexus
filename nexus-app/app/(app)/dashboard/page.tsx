"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import {
  Card,
  SectionTitle,
  Badge,
  ProgressBar,
  Avatar,
  TrafficLight,
  LineChart,
  BarChart,
  Sparkline,
  Gauge,
} from "@/components/ui";
import { Icon } from "@/components/Icons";
import {
  executiveKpis as mockKpis,
  kpiTrend as mockTrend,
  workloadByTeam as mockWorkload,
  competencyHeatmap as mockHeatmap,
  recentActivity as mockActivity,
  topPerformers as mockPerformers,
  meetings as mockMeetings,
  programs as mockPrograms,
  milestones as mockMilestones,
  tasks as mockTasks,
  currentUser,
  type Milestone,
  type Task,
} from "@/lib/data";
import { apiGet, getStoredUser, getToken } from "@/lib/api";
import { useLocalState } from "@/lib/useLocalState";
import { programProgress, programStatus, programMilestonesDone } from "@/lib/rollup";
import { useI18n } from "@/lib/i18n";

const defaultWidgets = [
  { label: "Open Tasks", value: 34, icon: "task", tone: "blue", trend: [20, 24, 22, 28, 30, 32, 34] },
  { label: "Overdue", value: 5, icon: "alert", tone: "red", trend: [9, 8, 7, 6, 6, 5, 5] },
  { label: "Approvals Pending", value: 8, icon: "check", tone: "gold", trend: [3, 5, 4, 6, 7, 8, 8] },
  { label: "Customer Requests", value: 12, icon: "request", tone: "blue", trend: [15, 14, 13, 12, 12, 12, 12] },
] as const;

function heatColor(v: number) {
  if (v >= 85) return "bg-emerald-500/80";
  if (v >= 75) return "bg-royal-500/70";
  if (v >= 65) return "bg-gold-400/70";
  return "bg-rose-500/60";
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [kpis, setKpis] = useState<any[]>(mockKpis as any);
  const [widgets, setWidgets] = useState(defaultWidgets.map((w) => ({ ...w })));
  const [health, setHealth] = useState({ onTrack: 9, atRisk: 3, delayed: 1 });
  const [overallKpi, setOverallKpi] = useState(87);
  const [trend, setTrend] = useState(mockTrend as any[]);
  const [workload, setWorkload] = useState(mockWorkload as any[]);
  const [heatmap, setHeatmap] = useState<any>(mockHeatmap);
  const [performers, setPerformers] = useState(mockPerformers as any[]);
  const [activity, setActivity] = useState(mockActivity as any[]);
  const [meets, setMeets] = useState(mockMeetings as any[]);
  const [progs, setProgs] = useState(mockPrograms as any[]);
  // shared stores so program cards roll up task → milestone → program progress
  const [milestones] = useLocalState<Milestone[]>("milestones", mockMilestones);
  const [taskList] = useLocalState<Task[]>("tasks", mockTasks);
  const [live, setLive] = useState(false);

  const storedName = getStoredUser<any>()?.name ?? currentUser.name;

  useEffect(() => {
    if (!getToken()) return;
    (async () => {
      try {
        const d = await apiGet<any>("/dashboard");
        setKpis(d.executiveKpis);
        setWidgets(defaultWidgets.map((w, i) => ({ ...w, value: d.widgets[i]?.value ?? w.value })));
        setHealth(d.health);
        setOverallKpi(d.overallKpi);
        setTrend(d.kpiTrend);
        setWorkload(d.workloadByTeam);
        setHeatmap(d.competencyHeatmap);
        setPerformers(d.topPerformers);
        setActivity(d.recentActivity);
        setMeets(d.meetings);
        setProgs(d.programs);
        setLive(true);
      } catch {
        /* API offline → keep mock data */
      }
    })();
  }, []);

  return (
    <>
      <PageHeader
        title={`${t("Good morning")}, ${String(storedName).split(" ")[0]} 👋`}
        subtitle="Executive Dashboard · Everything connected — People → Competency → Execution → Performance → Value"
        actions={
          <>
            <Btn variant="ghost">
              <Icon.filter className="h-4 w-4" /> {t("This Quarter")}
            </Btn>
            <Btn variant="primary">
              <Icon.plus className="h-4 w-4" /> {t("New")}
            </Btn>
          </>
        }
      />

      <div className="mb-4">
        {live ? (
          <Badge tone="green">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t("Live data · Laravel API + SQLite")}
          </Badge>
        ) : (
          <Badge tone="amber">{t("Demo data · sign in to load live metrics from the API")}</Badge>
        )}
      </div>

      {/* KPI hero row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="text-xs text-[var(--muted)]">{k.label}</div>
              <TrafficLight status={k.status} />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">{k.value}</span>
              <span className="text-sm text-[var(--muted)]">{k.unit}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className={k.delta >= 0 ? "text-emerald-500" : "text-rose-500"}>
                {k.delta >= 0 ? "▲" : "▼"} {Math.abs(k.delta)}
              </span>
              <span className="text-[var(--muted)]">{t("vs target")} {k.target}{k.unit}</span>
            </div>
            <div className="mt-3">
              <ProgressBar
                value={k.unit === "/5" ? (k.value / 5) * 100 : k.value}
                tone={k.status === "green" ? "green" : k.status === "amber" ? "gold" : "red"}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Widgets */}
      <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {widgets.map((w) => {
          const IconCmp = Icon[w.icon as keyof typeof Icon];
          return (
            <Card key={w.label} className="flex items-center gap-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  w.tone === "red"
                    ? "bg-rose-500/15 text-rose-500"
                    : w.tone === "gold"
                    ? "bg-gold-400/15 text-gold-500"
                    : "bg-royal-500/15 text-royal-400"
                }`}
              >
                <IconCmp className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold">{w.value}</div>
                <div className="text-xs text-[var(--muted)]">{t(w.label)}</div>
              </div>
              <div className="h-8 w-16">
                <Sparkline data={w.trend as unknown as number[]} tone={w.tone === "gold" ? "gold" : "blue"} className="h-full w-full" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle
            title="Overall KPI Trend"
            subtitle="Department performance index — last 7 months"
            action={<Badge tone="green">{t("On upward trend")}</Badge>}
          />
          <LineChart data={trend.map((d) => d.v)} labels={trend.map((d) => d.m)} min={60} max={100} />
        </Card>

        <Card>
          <SectionTitle title="Quarter Health" subtitle="Traffic-light status" />
          <div className="flex flex-col items-center py-2">
            <Gauge value={overallKpi} size={160} />
            <div className="mt-3 grid w-full grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-emerald-500/10 py-2">
                <div className="font-bold text-emerald-500">{health.onTrack}</div>
                <div className="text-[10px] text-[var(--muted)]">{t("On Track")}</div>
              </div>
              <div className="rounded-lg bg-gold-400/10 py-2">
                <div className="font-bold text-gold-500">{health.atRisk}</div>
                <div className="text-[10px] text-[var(--muted)]">{t("At Risk")}</div>
              </div>
              <div className="rounded-lg bg-rose-500/10 py-2">
                <div className="font-bold text-rose-500">{health.delayed}</div>
                <div className="text-[10px] text-[var(--muted)]">{t("Delayed")}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <SectionTitle title="Workload by Team" subtitle="Open vs completed" />
          <BarChart data={workload.map((t) => ({ label: t.team, a: t.open, b: t.done }))} height={180} />
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-gradient-to-t from-royal-700 to-royal-400" /> {t("Completed")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-gradient-to-t from-gold-500 to-gold-300" /> {t("Open")}
            </span>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Competency Heatmap" subtitle="Proficiency by team" />
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-[10px]">
              <thead>
                <tr>
                  <th />
                  {heatmap.teams.map((t: string) => (
                    <th key={t} className="pb-1 font-medium text-[var(--muted)]">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.competencies.map((c: string, i: number) => (
                  <tr key={c}>
                    <td className="whitespace-nowrap pr-2 text-right text-[var(--muted)]">{c}</td>
                    {heatmap.matrix[i].map((v: number, j: number) => (
                      <td key={j}>
                        <div
                          className={`flex h-7 w-full items-center justify-center rounded ${heatColor(v)} font-semibold text-white/90`}
                          title={`${v}%`}
                        >
                          {v}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Recent Activity"
            action={<Link href="/notifications" className="text-[11px] text-royal-400">{t("All")}</Link>}
          />
          <div className="space-y-3">
            {activity.slice(0, 6).map((a) => (
              <div key={a.id} className="flex gap-3 text-xs">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-royal-400" />
                <div className="flex-1">
                  <p className="leading-snug">
                    <span className="font-semibold">{a.user}</span>{" "}
                    <span className="text-[var(--muted)]">{a.action}</span>{" "}
                    <span className="font-medium text-royal-400">{a.target}</span>
                  </p>
                  <span className="text-[10px] text-[var(--muted)]">{a.time} {t("ago")}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Programs + performers + meetings */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle
            title="Active Programs"
            subtitle="Program → Project → Milestone → Task"
            action={<Link href="/programs" className="text-[11px] text-royal-400">{t("View all")}</Link>}
          />
          <div className="space-y-3">
            {progs.slice(0, 4).map((p) => {
              const pmTotal = milestones.filter((m) => m.programId === p.id).length;
              const prog = programProgress(p, milestones, taskList);
              const stat = programStatus(p, milestones, taskList);
              const mDone = pmTotal > 0 ? programMilestonesDone(p, milestones, taskList) : p.milestonesDone;
              return (
              <div key={p.id} className="flex items-center gap-4 rounded-xl border p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.name}</span>
                    <Badge
                      tone={
                        stat === "On Track" || stat === "Completed"
                          ? "green"
                          : stat === "At Risk"
                          ? "amber"
                          : "red"
                      }
                    >
                      {stat}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--muted)]">
                    {p.id} · {p.owner} · {mDone}/{pmTotal || p.milestones} milestones
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={prog} tone={prog === 100 ? "green" : p.risk === "High" ? "red" : p.risk === "Medium" ? "gold" : "blue"} />
                  </div>
                </div>
                <div className="w-10 text-right text-sm font-semibold">{prog}%</div>
              </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle title="Top Performers" />
            <div className="space-y-3">
              {performers.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className={`w-4 text-center text-xs font-bold ${i === 0 ? "text-gold-400" : "text-[var(--muted)]"}`}>
                    {i + 1}
                  </span>
                  <Avatar initials={p.avatar} tone={i === 0 ? "gold" : "blue"} />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium">{p.name}</div>
                    <div className="text-[10px] text-[var(--muted)]">{p.role}</div>
                  </div>
                  <span className="text-sm font-bold gold-gradient">{p.score}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Upcoming" subtitle="Calendar" />
            <div className="space-y-2">
              {meets.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                  <Icon.meeting className="h-4 w-4 text-royal-400" />
                  <div className="flex-1">
                    <div className="text-[12px] font-medium">{m.title}</div>
                    <div className="text-[10px] text-[var(--muted)]">{m.time} · {m.attendees} attendees</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
