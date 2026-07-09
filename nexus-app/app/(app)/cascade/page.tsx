"use client";

import React, { useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, ProgressBar, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import {
  programs as mockPrograms,
  milestones as mockMilestones,
  tasks as mockTasks,
  strategicGoals,
  objectives,
  type Program,
  type Milestone,
  type Task,
  type MilestoneStatus,
} from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";

const mstTone: Record<MilestoneStatus, "gray" | "amber" | "red" | "green"> = { Planned: "gray", "In Progress": "amber", "At Risk": "red", Done: "green" };
const progStatusTone: Record<Program["status"], "green" | "amber" | "red" | "blue"> = { "On Track": "green", Completed: "blue", "At Risk": "amber", Delayed: "red" };
const taskTone: Record<Task["status"], "gray" | "amber" | "blue" | "green"> = { Backlog: "gray", "In Progress": "amber", Review: "blue", Done: "green" };

function Chevron({ open }: { open: boolean }) {
  return <Icon.chevron className={`h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition ${open ? "rotate-90" : ""}`} />;
}

export default function CascadePage() {
  const { t } = useI18n();
  const [programs] = useLocalState<Program[]>("programs", mockPrograms);
  const [milestones] = useLocalState<Milestone[]>("milestones", mockMilestones);
  const [tasks] = useLocalState<Task[]>("tasks", mockTasks);
  const programsFor = (kind: "goal" | "okr", id: string) => programs.filter((p) => (kind === "goal" ? p.goalIds ?? [] : p.okrIds ?? []).includes(id));
  const additionalPrograms = programs.filter((p) => (p.goalIds ?? []).length === 0 && (p.okrIds ?? []).length === 0);
  const milestonesOf = (pid: string) => milestones.filter((m) => m.programId === pid);
  const tasksOfMilestone = (mid: string) => tasks.filter((tk) => tk.milestoneId === mid);
  const additionalTasksOf = (pid: string) => tasks.filter((tk) => tk.program === pid && !tk.milestoneId);

  // Every expandable node key (root → program → milestone) so we can expand/collapse the whole tree.
  const allKeys = (() => {
    const roots: { id: string; progs: Program[] }[] = [
      ...strategicGoals.map((g) => ({ id: g.id, progs: programsFor("goal", g.id) })),
      ...objectives.map((o) => ({ id: o.id, progs: programsFor("okr", o.id) })),
      { id: "__additional__", progs: additionalPrograms },
    ];
    const keys: string[] = [];
    for (const r of roots) {
      keys.push(r.id);
      for (const p of r.progs) {
        const pPath = `${r.id}/${p.id}`;
        keys.push(pPath);
        for (const m of milestonesOf(p.id)) keys.push(`${pPath}/${m.id}`);
      }
    }
    return keys;
  })();

  // expand state by composite path key (e.g. "sg-1/PRG-01/mst-101"); default: the whole tree is open.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: o[k] === undefined ? false : !o[k] }));
  const setAll = (v: boolean) => setOpen(Object.fromEntries(allKeys.map((k) => [k, v])));

  // --- renderers ---
  const renderTask = (tk: Task, path: string) => (
    <div key={path} className="flex items-center gap-2 py-1.5 pl-8 text-[12px]">
      <Icon.task className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
      <span className="min-w-0 flex-1 truncate">{tk.title}</span>
      <Badge tone={taskTone[tk.status]}>{t(tk.status)}</Badge>
      <Avatar initials={tk.avatar} />
    </div>
  );

  const renderMilestone = (m: Milestone, parent: string) => {
    const path = `${parent}/${m.id}`;
    const mtasks = tasksOfMilestone(m.id);
    const isOpen = open[path] ?? true;
    return (
      <div key={path} className="pl-5">
        <button onClick={() => toggle(path)} className="flex w-full items-center gap-2 py-1.5 text-left text-[12px]">
          {mtasks.length > 0 ? <Chevron open={isOpen} /> : <span className="w-3.5 shrink-0" />}
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: m.status === "Done" ? "#10b981" : m.status === "At Risk" ? "#f43f5e" : m.status === "In Progress" ? "#e5aa26" : "#94a3b8" }} />
          <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
          <Badge tone={mstTone[m.status]}>{t(m.status)}</Badge>
          <span className="w-16 shrink-0"><ProgressBar value={m.progress} tone={m.status === "Done" ? "green" : m.status === "At Risk" ? "red" : "gold"} /></span>
          <span className="shrink-0 text-[10px] text-[var(--muted)]">{mtasks.length} {t("tasks")}</span>
        </button>
        {isOpen && mtasks.map((tk) => renderTask(tk, `${path}/${tk.id}`))}
      </div>
    );
  };

  const renderProgram = (p: Program, parent: string) => {
    const path = `${parent}/${p.id}`;
    const pm = milestonesOf(p.id);
    const addTasks = additionalTasksOf(p.id);
    const isOpen = open[path] ?? true;
    return (
      <div key={path} className="pl-2">
        <button onClick={() => toggle(path)} className="flex w-full items-center gap-2 py-2 text-left text-[13px]">
          <Chevron open={isOpen} />
          <Icon.program className="h-4 w-4 shrink-0 text-royal-400" />
          <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
          <Badge tone={progStatusTone[p.status]}>{t(p.status)}</Badge>
          <span className="shrink-0 text-[10px] text-[var(--muted)]">
            {pm.filter((m) => m.status === "Done").length}/{pm.length} {t("Milestones")}
          </span>
        </button>
        {isOpen && (
          <div>
            {pm.map((m) => renderMilestone(m, path))}
            {addTasks.length > 0 && (
              <div className="pl-5">
                <div className="py-1 pl-6 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Additional tasks")}</div>
                {addTasks.map((tk) => renderTask(tk, `${path}/add/${tk.id}`))}
              </div>
            )}
            {pm.length === 0 && addTasks.length === 0 && <div className="py-1.5 pl-8 text-[11px] text-[var(--muted)]">{t("No milestones yet. Add one.")}</div>}
          </div>
        )}
      </div>
    );
  };

  const renderRoot = (id: string, icon: React.ReactNode, title: string, sub: string, tone: "purple" | "gold" | "gray", progs: Program[]) => {
    const isOpen = open[id] ?? true;
    return (
      <Card key={id} dir="auto">
        <button onClick={() => toggle(id)} className="flex w-full items-center gap-2 text-left">
          <Chevron open={isOpen} />
          {icon}
          <div className="min-w-0 flex-1">
            <div className="font-semibold leading-tight">{title}</div>
            <div className="text-[11px] text-[var(--muted)]">{sub}</div>
          </div>
          <Badge tone={tone}>
            {progs.length} {t("Programs")}
          </Badge>
        </button>
        {isOpen && (
          <div className="mt-2 border-t pt-2">
            {progs.map((p) => renderProgram(p, id))}
            {progs.length === 0 && <div className="py-2 pl-8 text-[11px] text-[var(--muted)]">{t("No linked programs")}</div>}
          </div>
        )}
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        title="Cascade"
        subtitle="Strategic Goal → Program → Milestone → Task"
        actions={
          <>
            <Btn variant="ghost" onClick={() => setAll(true)}>
              <Icon.chevron className="h-4 w-4 rotate-90" /> {t("Expand all")}
            </Btn>
            <Btn variant="ghost" onClick={() => setAll(false)}>
              <Icon.chevron className="h-4 w-4" /> {t("Collapse all")}
            </Btn>
          </>
        }
      />

      <div className="space-y-3">
        {strategicGoals.map((g) => renderRoot(g.id, <Icon.strategy className="h-5 w-5 shrink-0 text-violet-400" />, g.title, t("Strategic Goals"), "purple", programsFor("goal", g.id)))}
        {objectives.map((o) => renderRoot(o.id, <Icon.target className="h-5 w-5 shrink-0 text-gold-400" />, o.title, `OKR · ${o.quarter}`, "gold", programsFor("okr", o.id)))}
        {renderRoot("__additional__", <Icon.program className="h-5 w-5 shrink-0 text-[var(--muted)]" />, t("Additional Programs"), t("No linked programs"), "gray", additionalPrograms)}
      </div>
    </>
  );
}
