"use client";

import { useEffect, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Badge, Avatar, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { tasks as seed, taskColumns, type Task, type TaskStatus } from "@/lib/data";
import { apiGet, apiSend, getToken } from "@/lib/api";

type LiveTask = Task & { dbId?: number };

const priorityTone: Record<string, "gray" | "blue" | "amber" | "red"> = {
  Low: "gray",
  Medium: "blue",
  High: "amber",
  Critical: "red",
};

const views = ["Kanban", "List", "Calendar", "Gantt"] as const;

export default function TasksPage() {
  const [items, setItems] = useState<LiveTask[]>(seed);
  const [view, setView] = useState<(typeof views)[number]>("Kanban");
  const [dragId, setDragId] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return; // demo mode — keep seed data
      }
      try {
        const data = await apiGet<LiveTask[]>("/tasks");
        if (active && Array.isArray(data)) {
          setItems(data);
          setLive(true);
        }
      } catch {
        /* API offline → keep seed */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const move = async (id: string, status: TaskStatus) => {
    const task = items.find((t) => t.id === id);
    if (!task || task.status === status) return;
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    if (live && task.dbId) {
      try {
        await apiSend("PATCH", `/tasks/${task.dbId}/status`, { status });
      } catch {
        /* revert on failure */
        setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status: task.status } : t)));
      }
    }
  };

  const addTask = async () => {
    const title = typeof window !== "undefined" ? window.prompt("New task title:") : null;
    if (!title) return;
    if (live) {
      try {
        const created = await apiSend<LiveTask>("POST", "/tasks", {
          title,
          status: "Backlog",
          priority: "Medium",
          tags: ["New"],
        });
        setItems((prev) => [created, ...prev]);
        return;
      } catch {
        /* fall through to local add */
      }
    }
    setItems((prev) => [
      {
        id: `T-${900 + prev.length}`,
        title,
        status: "Backlog",
        priority: "Medium",
        assignee: "You",
        avatar: "YO",
        due: new Date().toISOString().slice(0, 10),
        program: "PRG-03",
        checklist: { total: 0, done: 0 },
        comments: 0,
        tags: ["New"],
      },
      ...prev,
    ]);
  };

  const columnMeta: Record<TaskStatus, { tone: string }> = {
    Backlog: { tone: "bg-slate-400" },
    "In Progress": { tone: "bg-royal-500" },
    Review: { tone: "bg-gold-400" },
    Done: { tone: "bg-emerald-500" },
  };

  return (
    <>
      <PageHeader
        title="Task Management"
        subtitle="Task · Sub-task · Checklist · Approval — Kanban, List, Calendar & Gantt views"
        actions={
          <>
            <div className="flex rounded-xl glass p-0.5">
              {views.map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    view === v ? "bg-royal-500 text-white" : "text-[var(--muted)] hover:text-[var(--text)]"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <Btn variant="primary">
              <span onClick={addTask} className="flex items-center gap-1.5">
                <Icon.plus className="h-4 w-4" /> New Task
              </span>
            </Btn>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-2 text-[11px]">
        {live ? (
          <Badge tone="green">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live · Laravel API
          </Badge>
        ) : (
          <Badge tone="amber">Demo data (sign in to connect the API)</Badge>
        )}
        {loading && <span className="text-[var(--muted)]">loading…</span>}
      </div>

      {view === "Kanban" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {taskColumns.map((col) => {
            const colItems = items.filter((t) => t.status === col);
            return (
              <div
                key={col}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dragId && move(dragId, col)}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 px-1">
                  <span className={cn("h-2.5 w-2.5 rounded-full", columnMeta[col].tone)} />
                  <span className="text-sm font-semibold">{col}</span>
                  <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--muted)] dark:bg-white/10">
                    {colItems.length}
                  </span>
                </div>
                <div className="flex min-h-[120px] flex-col gap-3 rounded-xl border border-dashed p-2">
                  {colItems.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                      className="glass card cursor-grab p-3 shadow-glass transition hover:-translate-y-0.5 active:cursor-grabbing"
                    >
                      <div className="flex items-center justify-between">
                        <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                        <span className="text-[10px] text-[var(--muted)]">{t.id}</span>
                      </div>
                      <p className="mt-2 text-[13px] font-medium leading-snug">{t.title}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.tags.map((tag) => (
                          <span key={tag} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[10px] text-royal-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-[11px] text-[var(--muted)]">
                        <span className="flex items-center gap-1">
                          <Icon.check className="h-3.5 w-3.5" />
                          {t.checklist.done}/{t.checklist.total}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon.clock className="h-3.5 w-3.5" />
                          {t.due ? new Date(t.due).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—"}
                        </span>
                        {t.avatar && <Avatar initials={t.avatar} />}
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
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-[11px] text-[var(--muted)]">{t.id}</div>
                  </td>
                  <td className="px-4 py-3"><Badge tone="blue">{t.status}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={priorityTone[t.priority]}>{t.priority}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.avatar && <Avatar initials={t.avatar} />} <span className="text-xs">{t.assignee}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">{t.program}</td>
                  <td className="px-4 py-3 text-xs">
                    {t.checklist.total > 0 ? Math.round((t.checklist.done / t.checklist.total) * 100) : 0}%
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">
                    {t.due ? new Date(t.due).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(view === "Calendar" || view === "Gantt") && (
        <div className="glass card flex flex-col items-center justify-center py-20 text-center">
          {view === "Calendar" ? (
            <Icon.meeting className="h-10 w-10 text-royal-400" />
          ) : (
            <Icon.analytics className="h-10 w-10 text-royal-400" />
          )}
          <p className="mt-4 text-sm font-medium">{view} view</p>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted)]">
            {view} visualization renders the same connected task data on a timeline. Switch to Kanban or List to interact with tasks.
          </p>
        </div>
      )}
    </>
  );
}
