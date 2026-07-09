"use client";

import React, { useEffect, useRef, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Badge, Avatar, ProgressBar, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { tasks as seed, taskColumns, programs as mockPrograms, milestones as mockMilestones, type Task, type Subtask, type TaskStatus, type Priority, type Program, type Milestone } from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { apiGet, apiSend, getToken } from "@/lib/api";
import { taskProgress, subtaskProgress } from "@/lib/rollup";
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
const rid = (p: string) => {
  try {
    return `${p}-${crypto.randomUUID().slice(0, 6)}`;
  } catch {
    return `${p}-${++seq}${Math.round(performance.now())}`;
  }
};
const MAX_EVIDENCE_BYTES = 2_000_000; // keep attachments small so localStorage doesn't overflow

// rolled-up checklist / subtask counts for display
const checklistCounts = (t: Task) => {
  const subs = t.subtasks ?? [];
  let total = 0, done = 0;
  subs.forEach((s) => { total += s.checklist.length; done += s.checklist.filter((c) => c.done).length; });
  return { total, done };
};
const subtaskCounts = (t: Task) => {
  const subs = t.subtasks ?? [];
  return { total: subs.length, done: subs.filter((s) => subtaskProgress(s) >= 1).length };
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

type DetailProps = {
  task: Task;
  onAddSubtask: (title: string) => void;
  onToggleSubtask: (subId: string) => void;
  onRemoveSubtask: (subId: string) => void;
  onAddChecklist: (subId: string, text: string) => void;
  onToggleChecklist: (subId: string, itemId: string) => void;
  onRemoveChecklist: (subId: string, itemId: string) => void;
  onAddEvidenceLink: (name: string, url: string) => void;
  onAddEvidenceFile: (file: File) => void;
  onRemoveEvidence: (evId: string) => void;
};

function TaskDetail(p: DetailProps) {
  const { t } = useI18n();
  const { task } = p;
  const [newSub, setNewSub] = useState("");
  const [clInput, setClInput] = useState<Record<string, string>>({});
  const [evName, setEvName] = useState("");
  const [evUrl, setEvUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const subs = task.subtasks ?? [];
  const evidence = task.evidence ?? [];

  return (
    <div className="grid gap-4 border-t bg-black/[0.02] p-4 dark:bg-white/[0.02] lg:grid-cols-2">
      {/* Subtasks → Checklist */}
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Subtasks")}</div>
        <div className="space-y-2">
          {subs.map((s) => {
            const hasCl = s.checklist.length > 0;
            const done = subtaskProgress(s) >= 1;
            const clDone = s.checklist.filter((c) => c.done).length;
            return (
              <div key={s.id} className="rounded-lg border p-2.5">
                <div className="group/s flex items-center gap-2">
                  <button
                    onClick={() => !hasCl && p.onToggleSubtask(s.id)}
                    disabled={hasCl}
                    title={hasCl ? t("Completes when its checklist is done") : t("Toggle done")}
                    className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", done ? "border-emerald-500 bg-emerald-500 text-white" : "border-[var(--muted)]", hasCl ? "cursor-default opacity-80" : "cursor-pointer")}
                  >
                    {done && <Icon.check className="h-3 w-3" />}
                  </button>
                  <span className={cn("min-w-0 flex-1 truncate text-[13px] font-medium", done && "text-[var(--muted)] line-through")}>{s.title}</span>
                  {hasCl && <span className="shrink-0 text-[10px] text-[var(--muted)]">{clDone}/{s.checklist.length}</span>}
                  <button onClick={() => p.onRemoveSubtask(s.id)} title={t("Delete")} className="shrink-0 text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover/s:opacity-100">✕</button>
                </div>
                {/* checklist */}
                <div className="mt-1.5 space-y-1 pl-6">
                  {s.checklist.map((c) => (
                    <div key={c.id} className="group/c flex items-center gap-2">
                      <input type="checkbox" checked={c.done} onChange={() => p.onToggleChecklist(s.id, c.id)} className="h-3.5 w-3.5 accent-royal-500" />
                      <span className={cn("min-w-0 flex-1 truncate text-[12px]", c.done && "text-[var(--muted)] line-through")}>{c.text}</span>
                      <button onClick={() => p.onRemoveChecklist(s.id, c.id)} title={t("Delete")} className="shrink-0 text-[10px] text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover/c:opacity-100">✕</button>
                    </div>
                  ))}
                  <form
                    onSubmit={(e) => { e.preventDefault(); p.onAddChecklist(s.id, clInput[s.id] ?? ""); setClInput((m) => ({ ...m, [s.id]: "" })); }}
                    className="flex items-center gap-1.5 pt-0.5"
                  >
                    <Icon.plus className="h-3 w-3 shrink-0 text-[var(--muted)]" />
                    <input
                      value={clInput[s.id] ?? ""}
                      onChange={(e) => setClInput((m) => ({ ...m, [s.id]: e.target.value }))}
                      placeholder={t("Add checklist item…")}
                      className="w-full border-none bg-transparent text-[12px] outline-none placeholder:text-[var(--muted)]"
                    />
                  </form>
                </div>
              </div>
            );
          })}
          {subs.length === 0 && <p className="text-[12px] text-[var(--muted)]">{t("No subtasks yet. Add one.")}</p>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onAddSub(); }} className="mt-2 flex items-center gap-2">
          <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder={t("New subtask…")} className="w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[12px] outline-none focus:border-royal-500" />
          <Btn variant="ghost" onClick={onAddSub}><Icon.plus className="h-3.5 w-3.5" /> {t("Add")}</Btn>
        </form>
      </div>

      {/* Evidence */}
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Evidence")}</div>
        <div className="space-y-1.5">
          {evidence.map((ev) => (
            <div key={ev.id} className="group/e flex items-center gap-2 rounded-lg border p-2">
              <Icon.document className="h-3.5 w-3.5 shrink-0 text-royal-400" />
              <a href={ev.url} target="_blank" rel="noreferrer" download={ev.kind === "file" ? ev.name : undefined} className="min-w-0 flex-1 truncate text-[12px] hover:text-royal-400 hover:underline">{ev.name}</a>
              <Badge tone={ev.kind === "link" ? "blue" : "gray"}>{ev.kind === "link" ? t("Link") : t("File")}</Badge>
              <button onClick={() => p.onRemoveEvidence(ev.id)} title={t("Delete")} className="shrink-0 text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover/e:opacity-100">✕</button>
            </div>
          ))}
          {evidence.length === 0 && <p className="text-[12px] text-[var(--muted)]">{t("No evidence yet. Attach a file or link.")}</p>}
        </div>
        <div className="mt-2 space-y-2 rounded-lg border p-2.5">
          <form onSubmit={(e) => { e.preventDefault(); onAddLink(); }} className="space-y-1.5">
            <input value={evName} onChange={(e) => setEvName(e.target.value)} placeholder={t("Label (optional)")} className="w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[12px] outline-none focus:border-royal-500" />
            <div className="flex items-center gap-2">
              <input value={evUrl} onChange={(e) => setEvUrl(e.target.value)} placeholder={t("Paste a link (https://…)")} className="w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[12px] outline-none focus:border-royal-500" />
              <Btn variant="ghost" onClick={onAddLink}>{t("Add link")}</Btn>
            </div>
          </form>
          <div className="flex items-center gap-2 border-t pt-2">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) p.onAddEvidenceFile(f); if (fileRef.current) fileRef.current.value = ""; }}
            />
            <Btn variant="ghost" onClick={() => fileRef.current?.click()}><Icon.document className="h-3.5 w-3.5" /> {t("Attach file")}</Btn>
            <span className="text-[10px] text-[var(--muted)]">{t("Max 2 MB per file")}</span>
          </div>
        </div>
      </div>
    </div>
  );

  function onAddSub() { p.onAddSubtask(newSub); setNewSub(""); }
  function onAddLink() { p.onAddEvidenceLink(evName, evUrl); setEvName(""); setEvUrl(""); }
}

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

  // --- expandable rows + Task → Subtask → Checklist + Evidence CRUD ---
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpand = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));
  const updateTask = (id: string, fn: (t: Task) => Task) => setItems((prev) => prev.map((x) => (x.id === id ? fn(x) : x)));
  const mapSub = (subs: Subtask[] | undefined, subId: string, fn: (s: Subtask) => Subtask) => (subs ?? []).map((s) => (s.id === subId ? fn(s) : s));

  const addSubtask = (taskId: string, title: string) => {
    const tt = title.trim();
    if (!tt) return;
    updateTask(taskId, (t) => ({ ...t, subtasks: [...(t.subtasks ?? []), { id: rid("st"), title: tt, done: false, checklist: [] }] }));
  };
  const toggleSubtask = (taskId: string, subId: string) => updateTask(taskId, (t) => ({ ...t, subtasks: mapSub(t.subtasks, subId, (s) => ({ ...s, done: !s.done })) }));
  const removeSubtask = (taskId: string, subId: string) => updateTask(taskId, (t) => ({ ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subId) }));
  const addChecklistItem = (taskId: string, subId: string, text: string) => {
    const tt = text.trim();
    if (!tt) return;
    updateTask(taskId, (t) => ({ ...t, subtasks: mapSub(t.subtasks, subId, (s) => ({ ...s, checklist: [...s.checklist, { id: rid("cl"), text: tt, done: false }] })) }));
  };
  const toggleChecklistItem = (taskId: string, subId: string, itemId: string) =>
    updateTask(taskId, (t) => ({ ...t, subtasks: mapSub(t.subtasks, subId, (s) => ({ ...s, checklist: s.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)) })) }));
  const removeChecklistItem = (taskId: string, subId: string, itemId: string) =>
    updateTask(taskId, (t) => ({ ...t, subtasks: mapSub(t.subtasks, subId, (s) => ({ ...s, checklist: s.checklist.filter((c) => c.id !== itemId) })) }));

  const addEvidenceLink = (taskId: string, name: string, url: string) => {
    const u = url.trim();
    if (!u) return;
    const href = /^https?:\/\//i.test(u) ? u : `https://${u}`;
    updateTask(taskId, (t) => ({ ...t, evidence: [...(t.evidence ?? []), { id: rid("ev"), kind: "link", name: name.trim() || u, url: href }] }));
  };
  const addEvidenceFile = (taskId: string, file: File) => {
    if (file.size > MAX_EVIDENCE_BYTES) {
      alert(t("File too large (max 2 MB). Attach a link instead."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateTask(taskId, (t) => ({ ...t, evidence: [...(t.evidence ?? []), { id: rid("ev"), kind: "file", name: file.name, url: String(reader.result) }] }));
    reader.readAsDataURL(file);
  };
  const removeEvidence = (taskId: string, evId: string) => updateTask(taskId, (t) => ({ ...t, evidence: (t.evidence ?? []).filter((e) => e.id !== evId) }));

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
                      {(() => {
                        const cc = checklistCounts(tk);
                        const disp = cc.total > 0 ? cc : tk.checklist;
                        const prog = Math.round(taskProgress(tk) * 100);
                        const evCount = (tk.evidence ?? []).length;
                        return (
                          <>
                            {(tk.subtasks?.length || cc.total > 0) && (
                              <div className="mt-2.5 flex items-center gap-2">
                                <span className="flex-1"><ProgressBar value={prog} tone={prog === 100 ? "green" : "blue"} /></span>
                                <span className="text-[10px] font-semibold text-[var(--muted)]">{prog}%</span>
                              </div>
                            )}
                            <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-[11px] text-[var(--muted)]">
                              <span className="flex items-center gap-2">
                                <span className="flex items-center gap-1"><Icon.check className="h-3.5 w-3.5" />{disp.done}/{disp.total}</span>
                                {evCount > 0 && <span className="flex items-center gap-1 text-royal-400"><Icon.document className="h-3.5 w-3.5" />{evCount}</span>}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon.clock className="h-3.5 w-3.5" />
                                {tk.due ? new Date(tk.due).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—"}
                              </span>
                              {tk.avatar && <Avatar initials={tk.avatar} />}
                            </div>
                          </>
                        );
                      })()}
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
                <th className="px-4 py-3 font-medium">{t("Progress")}</th>
                <th className="px-4 py-3 font-medium">{t("Status")}</th>
                <th className="px-4 py-3 font-medium">{t("Priority")}</th>
                <th className="px-4 py-3 font-medium">{t("Assignee")}</th>
                <th className="px-4 py-3 font-medium">{t("Milestone")}</th>
                <th className="px-4 py-3 font-medium">{t("Due")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((tk) => {
                const isOpen = !!expanded[tk.id];
                const prog = Math.round(taskProgress(tk) * 100);
                const sc = subtaskCounts(tk);
                const cc = checklistCounts(tk);
                const evCount = (tk.evidence ?? []).length;
                return (
                <React.Fragment key={tk.id}>
                <tr className="group border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <button onClick={() => toggleExpand(tk.id)} className="mt-0.5 shrink-0 text-[var(--muted)] transition hover:text-royal-400" aria-label="Toggle detail">
                        <Icon.chevron className={cn("h-4 w-4 transition", isOpen && "rotate-90")} />
                      </button>
                      <div className="min-w-0">
                        <div dir="auto" className="font-medium">{tk.title}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
                          <span>{tk.id}</span>
                          {sc.total > 0 && <span className="inline-flex items-center gap-1"><Icon.task className="h-3 w-3" /> {sc.done}/{sc.total} {t("subtasks")}</span>}
                          {cc.total > 0 && <span className="inline-flex items-center gap-1"><Icon.check className="h-3 w-3" /> {cc.done}/{cc.total}</span>}
                          {evCount > 0 && <span className="inline-flex items-center gap-1 text-royal-400"><Icon.document className="h-3 w-3" /> {evCount}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-20"><ProgressBar value={prog} tone={prog === 100 ? "green" : "blue"} /></span>
                      <span className="w-8 text-[11px] font-semibold">{prog}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge tone={statusTone[tk.status]}>{t(tk.status)}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={priorityTone[tk.priority]}>{t(tk.priority)}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {tk.avatar && <Avatar initials={tk.avatar} />} <span className="text-xs">{tk.assignee}</span>
                    </div>
                  </td>
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
                {isOpen && (
                  <tr>
                    <td colSpan={8} className="p-0">
                      <TaskDetail
                        task={tk}
                        onAddSubtask={(title) => addSubtask(tk.id, title)}
                        onToggleSubtask={(subId) => toggleSubtask(tk.id, subId)}
                        onRemoveSubtask={(subId) => removeSubtask(tk.id, subId)}
                        onAddChecklist={(subId, text) => addChecklistItem(tk.id, subId, text)}
                        onToggleChecklist={(subId, itemId) => toggleChecklistItem(tk.id, subId, itemId)}
                        onRemoveChecklist={(subId, itemId) => removeChecklistItem(tk.id, subId, itemId)}
                        onAddEvidenceLink={(name, url) => addEvidenceLink(tk.id, name, url)}
                        onAddEvidenceFile={(file) => addEvidenceFile(tk.id, file)}
                        onRemoveEvidence={(evId) => removeEvidence(tk.id, evId)}
                      />
                    </td>
                  </tr>
                )}
                </React.Fragment>
                );
              })}
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
