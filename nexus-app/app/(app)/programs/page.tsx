"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, ProgressBar, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { programs as mockPrograms, type Program } from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { apiGet, apiSend, getToken } from "@/lib/api";
import { LiveBadge } from "@/components/LiveBadge";

type Status = Program["status"];
type Risk = Program["risk"];

const statusTone: Record<Status, "green" | "amber" | "red" | "blue"> = {
  "On Track": "green",
  Completed: "blue",
  "At Risk": "amber",
  Delayed: "red",
};
const riskTone: Record<Risk, "green" | "amber" | "red"> = { Low: "green", Medium: "amber", High: "red" };
const STATUSES: Status[] = ["On Track", "At Risk", "Delayed", "Completed"];
const RISKS: Risk[] = ["Low", "Medium", "High"];

const inputCls =
  "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";

let seq = 0;
const nextId = () => {
  try {
    return `PRG-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  } catch {
    return `PRG-${++seq}${Date.now().toString().slice(-3)}`;
  }
};

function Modal({
  title,
  onClose,
  onSave,
  saveLabel,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saveLabel: string;
  children: React.ReactNode;
}) {
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

function RowActions({ onEdit, onDelete, label }: { onEdit: () => void; onDelete: () => void; label: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <button onClick={onEdit} aria-label={`Edit ${label}`} title={t("Edit")} className="text-[11px] font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100">
        {t("Edit")}
      </button>
      <button onClick={onDelete} aria-label={`Delete ${label}`} title={t("Delete")} className="text-[11px] text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

type Form = {
  open: boolean;
  id: string | null;
  name: string;
  owner: string;
  status: Status;
  risk: Risk;
  progress: number;
  budget: number;
  spent: number;
  milestones: number;
  milestonesDone: number;
  start: string;
  end: string;
};
const emptyForm: Form = {
  open: false,
  id: null,
  name: "",
  owner: "",
  status: "On Track",
  risk: "Low",
  progress: 0,
  budget: 0,
  spent: 0,
  milestones: 0,
  milestonesDone: 0,
  start: "",
  end: "",
};

export default function ProgramsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useLocalState<Program[]>("programs", mockPrograms);
  const [live, setLive] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);

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

  const totalBudget = rows.reduce((s, p) => s + p.budget, 0);
  const totalSpent = rows.reduce((s, p) => s + p.spent, 0);
  const summary = [
    { label: "Active Programs", value: rows.filter((p) => p.status !== "Completed").length, tone: "blue" },
    { label: "On Track", value: rows.filter((p) => p.status === "On Track").length, tone: "green" },
    { label: "At Risk / Delayed", value: rows.filter((p) => p.status === "At Risk" || p.status === "Delayed").length, tone: "red" },
    { label: "Budget Utilization", value: `${totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0}%`, tone: "gold" },
  ] as const;

  const openCreate = () => setForm({ ...emptyForm, open: true });
  const openEdit = (p: Program) =>
    setForm({
      open: true,
      id: p.id,
      name: p.name,
      owner: p.owner,
      status: p.status,
      risk: p.risk,
      progress: p.progress,
      budget: p.budget,
      spent: p.spent,
      milestones: p.milestones,
      milestonesDone: p.milestonesDone,
      start: p.start,
      end: p.end,
    });
  const close = () => setForm(emptyForm);
  const save = () => {
    const name = form.name.trim();
    if (!name) return;
    const body = {
      name,
      owner: form.owner.trim() || "You",
      status: form.status,
      risk: form.risk,
      progress: form.progress,
      budget: form.budget,
      spent: form.spent,
      milestones: form.milestones,
      milestonesDone: form.milestonesDone,
      start: form.start || new Date().toISOString().slice(0, 10),
      end: form.end || new Date().toISOString().slice(0, 10),
    };
    if (form.id == null) {
      const p: Program = { id: nextId(), ...body };
      setRows((r) => [...r, p]);
      sync("POST", "/programs", p);
    } else {
      setRows((r) => r.map((x) => (x.id === form.id ? { ...x, ...body } : x)));
      sync("PUT", `/programs/${form.id}`, body);
    }
    close();
  };
  const remove = (p: Program) => {
    setRows((r) => r.filter((x) => x.id !== p.id));
    sync("DELETE", `/programs/${p.id}`);
  };

  const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("en", { month: "short", year: "2-digit" }) : "—");

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
        {rows.map((p) => (
          <Card key={p.id} dir="auto" className="group hover:border-royal-500/40 transition">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-[220px] flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.name}</span>
                  <Badge tone={statusTone[p.status]}>{t(p.status)}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                  <Avatar initials={p.owner.split(" ").map((s) => s[0]).join("").slice(0, 2)} />
                  {p.id} · {t(p.owner)}
                </div>
              </div>

              <div className="w-40">
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-[var(--muted)]">{t("Progress")}</span>
                  <span className="font-semibold">{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} tone={riskTone[p.risk] === "red" ? "red" : riskTone[p.risk] === "amber" ? "gold" : "blue"} />
              </div>

              <div className="text-center">
                <div className="text-[10px] text-[var(--muted)]">{t("Milestones")}</div>
                <div className="text-sm font-semibold">
                  {p.milestonesDone}/{p.milestones}
                </div>
              </div>

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

              <RowActions onEdit={() => openEdit(p)} onDelete={() => remove(p)} label={p.name} />
            </div>
          </Card>
        ))}
        {rows.length === 0 && (
          <Card className="text-center text-[12px] text-[var(--muted)]">{t("No programs yet. Add one.")}</Card>
        )}
      </div>

      {form.open && (
        <Modal title={form.id == null ? t("New Program") : t("Edit Program")} onClose={close} onSave={save} saveLabel={form.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Name")}
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("e.g. Competency Digital Transformation")}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Owner")}
              <input value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} placeholder={t("e.g. Arif Wibowo")} className={inputCls} />
            </label>
            <label className={labelCls}>
              {t("Status")}
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))} className={`${inputCls} text-[var(--text)]`}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Risk")}
              <select value={form.risk} onChange={(e) => setForm((f) => ({ ...f, risk: e.target.value as Risk }))} className={`${inputCls} text-[var(--text)]`}>
                {RISKS.map((r) => (
                  <option key={r} value={r}>
                    {t(r)}
                  </option>
                ))}
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
              {t("Milestones")}
              <input type="number" min={0} value={form.milestones} onChange={(e) => setForm((f) => ({ ...f, milestones: Number(e.target.value) }))} className={inputCls} />
            </label>
            <label className={labelCls}>
              {t("Milestones done")}
              <input type="number" min={0} value={form.milestonesDone} onChange={(e) => setForm((f) => ({ ...f, milestonesDone: Number(e.target.value) }))} className={inputCls} />
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
        </Modal>
      )}
    </>
  );
}
