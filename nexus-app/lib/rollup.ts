// Progress rollup: Task → Milestone → Program.
// A milestone's progress is driven by its linked tasks; a program's progress is
// driven by its milestones. Manual values are used only as a fallback when there
// are no children to roll up from.
import type { Task, Milestone, Program, MilestoneStatus } from "./data";

/** Effective milestone progress (%): derived from child tasks when any exist, else the stored value. */
export function milestoneProgress(m: Milestone, tasks: Task[]): number {
  const mt = tasks.filter((t) => t.milestoneId === m.id);
  if (mt.length === 0) return m.progress;
  const done = mt.filter((t) => t.status === "Done").length;
  return Math.round((done / mt.length) * 100);
}

/** Effective milestone status: "Done" at 100%, otherwise reflects task activity (risk flag preserved). */
export function milestoneStatus(m: Milestone, tasks: Task[]): MilestoneStatus {
  const mt = tasks.filter((t) => t.milestoneId === m.id);
  if (mt.length === 0) return m.status;
  const p = milestoneProgress(m, tasks);
  if (p === 100) return "Done";
  if (m.status === "At Risk") return "At Risk";
  return p > 0 ? "In Progress" : "Planned";
}

/** Effective program progress (%): average of its milestones' effective progress, else the stored value. */
export function programProgress(p: Program, milestones: Milestone[], tasks: Task[]): number {
  const pm = milestones.filter((m) => m.programId === p.id);
  if (pm.length === 0) return p.progress;
  const sum = pm.reduce((s, m) => s + milestoneProgress(m, tasks), 0);
  return Math.round(sum / pm.length);
}

/** Count of a program's milestones that are effectively Done. */
export function programMilestonesDone(p: Program, milestones: Milestone[], tasks: Task[]): number {
  return milestones.filter((m) => m.programId === p.id && milestoneStatus(m, tasks) === "Done").length;
}

/** Effective program status: "Completed" once every milestone is done, otherwise the stored value. */
export function programStatus(p: Program, milestones: Milestone[], tasks: Task[]): Program["status"] {
  const pm = milestones.filter((m) => m.programId === p.id);
  if (pm.length === 0) return p.status;
  return programProgress(p, milestones, tasks) === 100 ? "Completed" : p.status;
}
