// Progress rollup: Task → Milestone → Program.
// A milestone's progress is driven by its linked tasks; a program's progress is
// driven by its milestones. Manual values are used only as a fallback when there
// are no children to roll up from.
import type { Task, Subtask, Milestone, Program, MilestoneStatus } from "./data";

/** Subtask completion (0..1): derived from its checklist when it has items, else its manual done flag. */
export function subtaskProgress(st: Subtask): number {
  const cl = st.checklist ?? [];
  if (cl.length === 0) return st.done ? 1 : 0;
  return cl.filter((c) => c.done).length / cl.length;
}

/** Task completion (0..1): averaged from its subtasks when any exist, else 1 when status is Done. */
export function taskProgress(t: Task): number {
  const subs = t.subtasks ?? [];
  if (subs.length === 0) return t.status === "Done" ? 1 : 0;
  return subs.reduce((s, st) => s + subtaskProgress(st), 0) / subs.length;
}

/** Whether a task counts as fully complete for rollup (all subtasks/checklist done, or status Done). */
export function taskComplete(t: Task): boolean {
  return taskProgress(t) >= 1;
}

/** Effective milestone progress (%): averaged from child task completion when any exist, else the stored value. */
export function milestoneProgress(m: Milestone, tasks: Task[]): number {
  const mt = tasks.filter((t) => t.milestoneId === m.id);
  if (mt.length === 0) return m.progress;
  const sum = mt.reduce((s, t) => s + taskProgress(t), 0);
  return Math.round((sum / mt.length) * 100);
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
