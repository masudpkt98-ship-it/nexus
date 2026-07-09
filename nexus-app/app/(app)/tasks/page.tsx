"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Badge, Avatar, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { tasks as seed, taskColumns, programs as mockPrograms, milestones as mockMilestones, type Task, type TaskStatus, type Priority, type Program, type Milestone } from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { apiGet, apiSend, getToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

const priorityTone: Record<Priority, "gray" | "blue" | "amber" | "red"> = { Low: "gray", Medium: "blue", High: "amber", Critical: "red" };
const statusTone: Record<TaskStatus, "gray" | "amber" | "blue" | "green"> = { Backlog: "gray", "In Progress": "amber", Review: "blue", Done: "green" };
const views = ["Kanban", "List", "Calendar", "Gantt"] as const;
const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Critical"];

const inputCls = "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";

let seq = 0;
const newId = () => {
  try {
    return `T-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  } catch {
    return `T-${900 + ++seq}`;
  }
};

function Modal({ title, onClose, onSave, saveLabel, children }: { title: string; onClose: () => void; onSave: () => void; saveLabel: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass card shadow-glass animate-fade-up">
        <div className="flex items-center gap-2 border-b p-4">
          <Icon.task className="h-4 w-4 shrink-0 text-royal-400" />
          <div className="text-sm font-semibold">{title}</div>
          <button onClick={onClose} className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="space-y-3 p-5">{children}</div>
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

type Form = { open: boolean; id: string | null; title: string; status: TaskStatus; priority: Priority; assignee: string; program: string; milestoneId: string; due: string; tags: string };
const emptyForm: Form = { open: false, id: null, title: "", status: "Backlog", priority: "Medium", assignee: "", program: "", milestoneId: "", due: "", tags: "" };

export default function TasksPage() {
  const { t } = useI18n();
  const [items, setItems] = useLocalState<Task[]>("tasks", seed);
  const [programs] = useLocalState<Program[]>("programs", mockPrograms);
  const [miles] = useLocalState<Milestone[]>("milestones", mockMilestones);
  const [view, setView] = useState<(typeof views)[number]>("Kanban");
  const [dragId, setDragId] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);

  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    apiGet<Task[]>("/tasks")
      .then((data) => {
        if (active && Array.isArray(data)) {
          setItems(data);
          setLive(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = (method: "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown) => {
    if (getToken()) apiSend(method, path, body).catch(() => {});
  };

  const milestoneName = (id?: string) => (id ? miles.find((m) => m.id === id)?.name : undefined);

  const move = (id: string, status: TaskStatus) => {
    const task = items.find((x) => x.id === id);
    if (!task || task.status === status) return;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    sync("PATCH", `/tasks/${id}/status`, { status });
  };

  const openCreate = () => setForm({ ...emptyForm, open: true, program: programs[0]?.id ?? "" });
  const openEdit = (x: Task) => setForm({ open: true, id: x.id, title: x.title, status: x.status, priority: x.priority, assignee: x.assignee, program: x.program, milestoneId: x.milestoneId ?? "", due: x.due, tags: x.tags.join(", ") });
  const close = () => setForm(emptyForm);
  const save = () => {
    const title = form.title.trim();
    if (!title) return;
    const assignee = form.assignee.trim() || "You";
    const body: Omit<Task, "id"> = {
      title,
      status: form.status,
      priority: form.priority,
      assignee,
      avatar: assignee.replace(/\./g, "").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase(),
      due: form.due || new Date().toISOString().slice(0, 10),
      program: form.program,
      milestoneId: form.milestoneId || undefined,
      checklist: { total: 0, done: 0 },
      comments: 0,
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
    };
    if (form.id == null) {
      const task: Task = { id: newId(), ...body };
      setItems((prev) => [task, ...prev]);
      sync("POST", "/tasks", task);
    } else {
      const prev = items.find((x) => x.id === form.id);
      setItems((p) => p.map((x) => (x.id === form.id ? { ...x, ...body } : x)));
      sync("PUT", `/tasks/${form.id}`, body);
      void prev;
    }
    close();
  };
  const remove = (x: Task) => {
    setItems((prev) => prev.filter((y) => y.id !== x.id));
    sync("DELETE", `/tasks/${x.id}`);
  };

  const columnMeta: Record<TaskStatus, { tone: string }> = {
    Backlog: { tone: "bg-slate-400" },
    "In Progress": { tone: "bg-royal-500" },
    Review: { tone: "bg-gold-400" },
    Done: { tone: "bg-emerald-500" },
  };

  const programMilestones = form.program ? miles.filter((m) => m.programId === form.program) : [];

  return (
    <>
      <PageHeader
        title="Task Management"
        subtitle="Task · Sub-task · Checklist · Approval — Kanban, List, Calendar & Gantt views"
        actions={
          <>
            <div className="flex rounded-xl glass p-0.5">
              {views.map((v) => (
                <button key={v} onClick={() => setView(v)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition", view === v ? "bg-royal-500 text-white" : "text-[var(--muted)] hover:text-[var(--text)]")}>
                  {t(v)}
                </button>
              ))}
            </div>
            <Btn variant="primary" onClick={openCreate}>
              <Icon.plus className="h-4 w-4" /> {t("New Task")}
            </Btn>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-2 text-[11px]">
        {live ? (
          <Badge tone="green">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t("Live · Laravel API")}
          </Badge>
        ) : (
          <Badge tone="amber">{t("Demo data (sign in to connect the API)")}</Badge>
        )}
      </div>

      {view === "Kanban" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {taskColumns.map((col) => {
            const colItems = items.filter((x) => x.status === col);
            return (
              <div key={col} onDragOver={(e) => e.preventDefault()} onDrop={() => dragId && move(dragId, col)} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <span className={cn("h-2.5 w-2.5 rounded-full", columnMeta[col].tone)} />
                  <span className="text-sm font-semibold">{t(col)}</span>
                  <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--muted)] dark:bg-white/10">{colItems.length}</span>
                </div>
                <div className="flex min-h-[120px] flex-col gap-3 rounded-xl border border-dashed p-2">
                  {colItems.map((tk) => (
                    <div key={tk.id} draggable onDragStart={() => setDragId(tk.id)} onDragEnd={() => setDragId(null)} dir="auto" className="group glass card cursor-grab p-3 shadow-glass transition hover:-translate-y-0.5 active:cursor-grabbing">
                      <div className="flex items-center justify-between">
                        <Badge tone={priorityTone[tk.priority]}>{t(tk.priority)}</Badge>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
                          <button onClick={() => openEdit(tk)} title={t("Edit")} className="opacity-0 transition hover:text-royal-400 group-hover:opacity-100">
                            {t("Edit")}
                          </button>
                          <button onClick={() => remove(tk)} title={t("Delete")} className="opacity-0 transition hover:text-rose-400 group-hover:opacity-100">
                            ✕
                          </button>
                          <span>{tk.id}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-[13px] font-medium leading-snug">{tk.title}</p>
                      {milestoneName(tk.milestoneId) && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-violet-500/12 px-1.5 py-0.5 text-[10px] text-violet-400">
                          <Icon.target className="h-2.5 w-2.5" /> {milestoneName(tk.milestoneId)}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tk.tags.map((tag) => (
                          <span key={tag} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[10px] text-royal-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-[11px] text-[var(--muted)]">
                        <span className="flex items-center gap-1">
                          <Icon.check className="h-3.5 w-3.5" />
                          {tk.checklist.done}/{tk.checklist.total}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon.clock className="h-3.5 w-3.5" />
                          {tk.due ? new Date(tk.due).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—"}
                        </span>
                        {tk.avatar && <Avatar initials={tk.avatar} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "List" && (
        <div className="glass card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">{t("Task")}</th>
                <th className="px-4 py-3 font-medium">{t("Status")}</th>
                <th className="px-4 py-3 font-medium">{t("Priority")}</th>
                <th className="px-4 py-3 font-medium">{t("Assignee")}</th>
                <th className="px-4 py-3 font-medium">{t("Program")}</th>
                <th className="px-4 py-3 font-medium">{t("Milestone")}</th>
                <th className="px-4 py-3 font-medium">{t("Due")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((tk) => (
                <tr key={tk.id} className="group border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div dir="auto" className="font-medium">{tk.title}</div>
                    <div className="text-[11px] text-[var(--muted)]">{tk.id}</div>
                  </td>
                  <td className="px-4 py-3"><Badge tone={statusTone[tk.status]}>{t(tk.status)}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={priorityTone[tk.priority]}>{t(tk.priority)}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {tk.avatar && <Avatar initials={tk.avatar} />} <span className="text-xs">{tk.assignee}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">{tk.program}</td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">{milestoneName(tk.milestoneId) ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">{tk.due ? new Date(tk.due).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 text-[11px] opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => openEdit(tk)} title={t("Edit")} className="font-medium text-[var(--muted)] hover:text-royal-400">
                        {t("Edit")}
                      </button>
                      <button onClick={() => remove(tk)} title={t("Delete")} className="text-[var(--muted)] hover:text-rose-400">
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(view === "Calendar" || view === "Gantt") && (
        <div className="glass card flex flex-col items-center justify-center py-20 text-center">
          {view === "Calendar" ? <Icon.meeting className="h-10 w-10 text-royal-400" /> : <Icon.analytics className="h-10 w-10 text-royal-400" />}
          <p className="mt-4 text-sm font-medium">
            {t(view)} {t("view")}
          </p>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted)]">
            {t(view)} {t("visualization renders the same connected task data on a timeline. Switch to Kanban or List to interact with tasks.")}
          </p>
        </div>
      )}

      {form.open && (
        <Modal title={form.id == null ? t("New Task") : t("Edit Task")} onClose={close} onSave={save} saveLabel={form.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Task")}
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t("e.g. Draft Q3 KPI cascade")} className={inputCls} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Status")}
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))} className={`${inputCls} text-[var(--text)]`}>
                {taskColumns.map((s) => (<option key={s} value={s}>{t(s)}</option>))}
              </select>
            </label>
            <label className={labelCls}>
              {t("Priority")}
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))} className={`${inputCls} text-[var(--text)]`}>
                {PRIORITIES.map((p) => (<option key={p} value={p}>{t(p)}</option>))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Assignee")}
              <input value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} placeholder={t("e.g. Rani K.")} className={inputCls} />
            </label>
            <label className={labelCls}>
              {t("Due")}
              <input type="date" value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))} className={`${inputCls} text-[var(--text)]`} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Program")}
              <select value={form.program} onChange={(e) => setForm((f) => ({ ...f, program: e.target.value, milestoneId: "" }))} className={`${inputCls} text-[var(--text)]`}>
                {programs.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </label>
            <label className={labelCls}>
              {t("Milestone")}
              <select value={form.milestoneId} onChange={(e) => setForm((f) => ({ ...f, milestoneId: e.target.value }))} className={`${inputCls} text-[var(--text)]`}>
                <option value="">{t("None")}</option>
                {programMilestones.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
              </select>
            </label>
          </div>
          <label className={labelCls}>
            {t("Tags")}
            <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder={t("e.g. KPI, Q3")} className={inputCls} />
          </label>
        </Modal>
      )}
    </>
  );
}
