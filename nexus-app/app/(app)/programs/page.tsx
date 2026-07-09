"use client";

import React, { useEffect, useState } from "react";
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
  type MilestoneStatus,
  type Task,
} from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { apiGet, apiSend, getToken } from "@/lib/api";
import { LiveBadge } from "@/components/LiveBadge";
import { milestoneProgress, milestoneStatus, programProgress, programStatus, programMilestonesDone } from "@/lib/rollup";

type Status = Program["status"];
type Risk = Program["risk"];

const statusTone: Record<Status, "green" | "amber" | "red" | "blue"> = { "On Track": "green", Completed: "blue", "At Risk": "amber", Delayed: "red" };
const riskTone: Record<Risk, "green" | "amber" | "red"> = { Low: "green", Medium: "amber", High: "red" };
const mstTone: Record<MilestoneStatus, "gray" | "amber" | "red" | "green"> = { Planned: "gray", "In Progress": "amber", "At Risk": "red", Done: "green" };
const STATUSES: Status[] = ["On Track", "At Risk", "Delayed", "Completed"];
const RISKS: Risk[] = ["Low", "Medium", "High"];
const MST_STATUSES: MilestoneStatus[] = ["Planned", "In Progress", "At Risk", "Done"];

const inputCls = "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

let seq = 0;
const newId = (p: string) => {
  try {
    return `${p}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
  } catch {
    return `${p}-${++seq}${Date.now().toString().slice(-3)}`;
  }
};

function Modal({ title, onClose, onSave, saveLabel, children }: { title: string; onClose: () => void; onSave: () => void; saveLabel: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg glass card shadow-glass animate-fade-up">
        <div className="flex items-center gap-2 border-b p-4">
          <Icon.program className="h-4 w-4 shrink-0 text-royal-400" />
          <div className="text-sm font-semibold">{title}</div>
          <button onClick={onClose} className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">{children}</div>
        <div className="flex justify-end gap-2 border-t p-3">
          <Btn variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Btn>
          <Btn variant="primary" onClick={onSave}>
            {saveLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <button onClick={onEdit} title={t("Edit")} className="text-[11px] font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100">
        {t("Edit")}
      </button>
      <button onClick={onDelete} title={t("Delete")} className="text-[11px] text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

type PForm = { open: boolean; id: string | null; name: string; owner: string; status: Status; risk: Risk; progress: number; budget: number; spent: number; start: string; end: string; goalIds: string[]; okrIds: string[] };
const emptyProgram: PForm = { open: false, id: null, name: "", owner: "", status: "On Track", risk: "Low", progress: 0, budget: 0, spent: 0, start: "", end: "", goalIds: [], okrIds: [] };
type MForm = { open: boolean; id: string | null; programId: string; name: string; due: string; status: MilestoneStatus; progress: number };
const emptyMilestone: MForm = { open: false, id: null, programId: "", name: "", due: "", status: "Planned", progress: 0 };

export default function ProgramsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useLocalState<Program[]>("programs", mockPrograms);
  const [miles, setMiles] = useLocalState<Milestone[]>("milestones", mockMilestones);
  const [taskList] = useLocalState<Task[]>("tasks", mockTasks);
  const [live, setLive] = useState(false);
  const [form, setForm] = useState<PForm>(emptyProgram);
  const [mForm, setMForm] = useState<MForm>(emptyMilestone);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    apiGet<Program[]>("/programs")
      .then((res) => {
        if (active && Array.isArray(res)) {
          setRows(res);
          setLive(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = (method: "POST" | "PUT" | "DELETE", path: string, body?: unknown) => {
    if (getToken()) apiSend(method, path, body).catch(() => {});
  };

  const milesOf = (pid: string) => miles.filter((m) => m.programId === pid);
  const taskCount = (mid: string) => taskList.filter((tk) => tk.milestoneId === mid).length;
  const goalTitle = (id: string) => strategicGoals.find((g) => g.id === id)?.title ?? id;
  const okrTitle = (id: string) => objectives.find((o) => o.id === id)?.title ?? id;

  const totalBudget = rows.reduce((s, p) => s + p.budget, 0);
  const totalSpent = rows.reduce((s, p) => s + p.spent, 0);
  const effStatus = (p: Program) => programStatus(p, miles, taskList);
  const summary = [
    { label: "Active Programs", value: rows.filter((p) => effStatus(p) !== "Completed").length, tone: "blue" },
    { label: "On Track", value: rows.filter((p) => effStatus(p) === "On Track").length, tone: "green" },
    { label: "At Risk / Delayed", value: rows.filter((p) => effStatus(p) === "At Risk" || effStatus(p) === "Delayed").length, tone: "red" },
    { label: "Budget Utilization", value: `${totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0}%`, tone: "gold" },
  ] as const;

  // --- program CRUD ---
  const openCreate = () => setForm({ ...emptyProgram, open: true });
  const openEdit = (p: Program) =>
    setForm({ open: true, id: p.id, name: p.name, owner: p.owner, status: p.status, risk: p.risk, progress: p.progress, budget: p.budget, spent: p.spent, start: p.start, end: p.end, goalIds: p.goalIds ?? [], okrIds: p.okrIds ?? [] });
  const closeForm = () => setForm(emptyProgram);
  const saveForm = () => {
    const name = form.name.trim();
    if (!name) return;
    const today = new Date().toISOString().slice(0, 10);
    const body = { name, owner: form.owner.trim() || "You", status: form.status, risk: form.risk, progress: form.progress, budget: form.budget, spent: form.spent, start: form.start || today, end: form.end || today, milestones: 0, milestonesDone: 0, goalIds: form.goalIds, okrIds: form.okrIds };
    if (form.id == null) {
      const p: Program = { id: newId("PRG"), ...body };
      setRows((r) => [...r, p]);
      sync("POST", "/programs", p);
    } else {
      setRows((r) => r.map((x) => (x.id === form.id ? { ...x, ...body } : x)));
      sync("PUT", `/programs/${form.id}`, body);
    }
    closeForm();
  };
  const removeProgram = (p: Program) => {
    setRows((r) => r.filter((x) => x.id !== p.id));
    setMiles((m) => m.filter((x) => x.programId !== p.id)); // cascade delete milestones
    sync("DELETE", `/programs/${p.id}`);
  };
  const toggleLink = (key: "goalIds" | "okrIds", id: string) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id] }));

  // --- milestone CRUD ---
  const openMCreate = (pid: string) => setMForm({ ...emptyMilestone, open: true, programId: pid });
  const openMEdit = (m: Milestone) => setMForm({ open: true, id: m.id, programId: m.programId, name: m.name, due: m.due, status: m.status, progress: m.progress });
  const saveM = () => {
    const name = mForm.name.trim();
    if (!name) return;
    const body = { programId: mForm.programId, name, due: mForm.due || new Date().toISOString().slice(0, 10), status: mForm.status, progress: clamp(mForm.progress, 0, 100) };
    if (mForm.id == null) setMiles((m) => [...m, { id: newId("mst"), ...body }]);
    else setMiles((m) => m.map((x) => (x.id === mForm.id ? { ...x, ...body } : x)));
    setMForm(emptyMilestone);
  };
  const removeM = (m: Milestone) => setMiles((r) => r.filter((x) => x.id !== m.id));

  const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("en", { month: "short", year: "2-digit" }) : "—");
  const fmtDay = (d: string) => (d ? new Date(d).toLocaleDateString("en", { day: "numeric", month: "short" }) : "—");

  return (
    <>
      <PageHeader
        title="Program Management"
        subtitle="Program · Project · Milestone · Deliverables · Budget · Risk · Dependency"
        actions={
          <>
            <LiveBadge live={live} />
            <Btn variant="primary" onClick={openCreate}>
              <Icon.plus className="h-4 w-4" /> {t("New Program")}
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-[var(--muted)]">{t(s.label)}</div>
            <div className={`mt-1 text-2xl font-bold ${s.tone === "green" ? "text-emerald-500" : s.tone === "red" ? "text-rose-500" : s.tone === "gold" ? "gold-gradient" : ""}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((p) => {
          const pm = milesOf(p.id);
          const mDone = programMilestonesDone(p, miles, taskList);
          const pProgress = programProgress(p, miles, taskList);
          const pStatus = programStatus(p, miles, taskList);
          const isOpen = expanded[p.id] ?? true;
          return (
            <Card key={p.id} dir="auto" className="group">
              <div className="flex flex-wrap items-center gap-4">
                <button onClick={() => setExpanded((e) => ({ ...e, [p.id]: e[p.id] === undefined ? false : !e[p.id] }))} className="shrink-0 text-[var(--muted)] transition hover:text-royal-400" aria-label="Toggle milestones">
                  <Icon.chevron className={`h-4 w-4 transition ${isOpen ? "rotate-90" : ""}`} />
                </button>
                <div className="min-w-[220px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{p.name}</span>
                    <Badge tone={statusTone[pStatus]}>{t(pStatus)}</Badge>
                    {(p.goalIds ?? []).map((g) => (
                      <span key={g} title={goalTitle(g)}>
                        <Badge tone="purple">
                          <Icon.strategy className="h-3 w-3" /> {goalTitle(g).slice(0, 22)}
                        </Badge>
                      </span>
                    ))}
                    {(p.okrIds ?? []).map((o) => (
                      <span key={o} title={okrTitle(o)}>
                        <Badge tone="gold">OKR</Badge>
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                    <Avatar initials={p.owner.split(" ").map((s) => s[0]).join("").slice(0, 2)} />
                    {p.id} · {t(p.owner)}
                  </div>
                </div>

                <div className="w-40">
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-[var(--muted)]">{t("Progress")}</span>
                    <span className="font-semibold">{pProgress}%</span>
                  </div>
                  <ProgressBar value={pProgress} tone={pProgress === 100 ? "green" : riskTone[p.risk] === "red" ? "red" : riskTone[p.risk] === "amber" ? "gold" : "blue"} />
                </div>

                <button onClick={() => setExpanded((e) => ({ ...e, [p.id]: true }))} className="text-center transition hover:text-royal-400">
                  <div className="text-[10px] text-[var(--muted)]">{t("Milestones")}</div>
                  <div className="text-sm font-semibold">
                    {mDone}/{pm.length}
                  </div>
                </button>

                <div className="text-center">
                  <div className="text-[10px] text-[var(--muted)]">{t("Budget")}</div>
                  <div className="text-sm font-semibold">
                    ${p.spent}k / ${p.budget}k
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-[10px] text-[var(--muted)]">{t("Risk")}</div>
                  <Badge tone={riskTone[p.risk]}>{t(p.risk)}</Badge>
                </div>

                <div className="text-right text-[11px] text-[var(--muted)]">
                  <div>{fmtDate(p.start)}</div>
                  <div>→ {fmtDate(p.end)}</div>
                </div>

                <RowActions onEdit={() => openEdit(p)} onDelete={() => removeProgram(p)} />
              </div>

              {isOpen && (
                <div className="mt-3 border-t pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Milestones")}</span>
                    <button onClick={() => openMCreate(p.id)} className="inline-flex items-center gap-1 text-[11px] font-medium text-royal-400 transition hover:text-royal-300">
                      <Icon.plus className="h-3.5 w-3.5" /> {t("New Milestone")}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {pm.map((m) => {
                      const ms = milestoneStatus(m, taskList);
                      const mp = milestoneProgress(m, taskList);
                      const mt = taskCount(m.id);
                      const mtDone = taskList.filter((tk) => tk.milestoneId === m.id && tk.status === "Done").length;
                      return (
                      <div key={m.id} className="group/m flex flex-wrap items-center gap-3 rounded-lg border p-2.5">
                        <Badge tone={mstTone[ms]}>{t(ms)}</Badge>
                        <span className="min-w-[160px] flex-1 text-[13px] font-medium">{m.name}</span>
                        <div className="w-28">
                          <ProgressBar value={mp} tone={ms === "Done" ? "green" : ms === "At Risk" ? "red" : "gold"} />
                        </div>
                        <span className="w-9 text-right text-[11px] font-semibold">{mp}%</span>
                        <span className="text-[11px] text-[var(--muted)]">{fmtDay(m.due)}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
                          <Icon.task className="h-3.5 w-3.5" /> {mtDone}/{mt} {t("tasks")}
                        </span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openMEdit(m)} title={t("Edit")} className="text-[11px] font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover/m:opacity-100">
                            {t("Edit")}
                          </button>
                          <button onClick={() => removeM(m)} title={t("Delete")} className="text-[11px] text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover/m:opacity-100">
                            ✕
                          </button>
                        </div>
                      </div>
                      );
                    })}
                    {pm.length === 0 && <p className="py-2 text-center text-[12px] text-[var(--muted)]">{t("No milestones yet. Add one.")}</p>}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {rows.length === 0 && <Card className="text-center text-[12px] text-[var(--muted)]">{t("No programs yet. Add one.")}</Card>}
      </div>

      {form.open && (
        <Modal title={form.id == null ? t("New Program") : t("Edit Program")} onClose={closeForm} onSave={saveForm} saveLabel={form.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Name")}
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t("e.g. Competency Digital Transformation")} className={inputCls} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Owner")}
              <input value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} placeholder={t("e.g. Arif Wibowo")} className={inputCls} />
            </label>
            <label className={labelCls}>
              {t("Status")}
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))} className={`${inputCls} text-[var(--text)]`}>
                {STATUSES.map((s) => (<option key={s} value={s}>{t(s)}</option>))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Risk")}
              <select value={form.risk} onChange={(e) => setForm((f) => ({ ...f, risk: e.target.value as Risk }))} className={`${inputCls} text-[var(--text)]`}>
                {RISKS.map((r) => (<option key={r} value={r}>{t(r)}</option>))}
              </select>
            </label>
            <label className={labelCls}>
              {t("Progress (%)")}
              <input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))} className={inputCls} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Budget")} ($k)
              <input type="number" min={0} value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: Number(e.target.value) }))} className={inputCls} />
            </label>
            <label className={labelCls}>
              {t("Spent")} ($k)
              <input type="number" min={0} value={form.spent} onChange={(e) => setForm((f) => ({ ...f, spent: Number(e.target.value) }))} className={inputCls} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Start")}
              <input type="date" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} className={`${inputCls} text-[var(--text)]`} />
            </label>
            <label className={labelCls}>
              {t("End")}
              <input type="date" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} className={`${inputCls} text-[var(--text)]`} />
            </label>
          </div>
          <div>
            <div className={labelCls}>{t("Linked Goals")}</div>
            <div className="mt-1 space-y-1">
              {strategicGoals.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-[12px]">
                  <input type="checkbox" checked={form.goalIds.includes(g.id)} onChange={() => toggleLink("goalIds", g.id)} className="accent-royal-500" />
                  {g.title}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className={labelCls}>{t("Linked OKR")}</div>
            <div className="mt-1 space-y-1">
              {objectives.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-[12px]">
                  <input type="checkbox" checked={form.okrIds.includes(o.id)} onChange={() => toggleLink("okrIds", o.id)} className="accent-royal-500" />
                  {o.title}
                </label>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {mForm.open && (
        <Modal title={mForm.id == null ? t("New Milestone") : t("Edit Milestone")} onClose={() => setMForm(emptyMilestone)} onSave={saveM} saveLabel={mForm.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Name")}
            <input value={mForm.name} onChange={(e) => setMForm((f) => ({ ...f, name: e.target.value }))} placeholder={t("e.g. KPI cascade automation")} className={inputCls} />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className={labelCls}>
              {t("Status")}
              <select value={mForm.status} onChange={(e) => setMForm((f) => ({ ...f, status: e.target.value as MilestoneStatus }))} className={`${inputCls} text-[var(--text)]`}>
                {MST_STATUSES.map((s) => (<option key={s} value={s}>{t(s)}</option>))}
              </select>
            </label>
            <label className={labelCls}>
              {t("Progress (%)")}
              <input type="number" min={0} max={100} value={mForm.progress} onChange={(e) => setMForm((f) => ({ ...f, progress: Number(e.target.value) }))} className={inputCls} />
            </label>
            <label className={labelCls}>
              {t("Due")}
              <input type="date" value={mForm.due} onChange={(e) => setMForm((f) => ({ ...f, due: e.target.value }))} className={`${inputCls} text-[var(--text)]`} />
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}
