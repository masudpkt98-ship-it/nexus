"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { serviceRequests as mockServiceRequests, type ServiceRequest } from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { apiGet, apiSend, getToken } from "@/lib/api";
import { LiveBadge } from "@/components/LiveBadge";

type Priority = ServiceRequest["priority"];
type Sla = ServiceRequest["sla"];
type Status = ServiceRequest["status"];

const priorityTone: Record<Priority, "red" | "amber" | "blue" | "gray"> = {
  Critical: "red",
  High: "amber",
  Medium: "blue",
  Low: "gray",
};
const slaTone: Record<Sla, "green" | "amber" | "red"> = { "Within SLA": "green", "At Risk": "amber", Breached: "red" };
const statusTone: Record<Status, "blue" | "amber" | "green" | "gray"> = {
  New: "blue",
  "In Progress": "amber",
  "Waiting Approval": "gray",
  Resolved: "green",
};
const PRIORITIES: Priority[] = ["Critical", "High", "Medium", "Low"];
const SLAS: Sla[] = ["Within SLA", "At Risk", "Breached"];
const STATUSES: Status[] = ["New", "In Progress", "Waiting Approval", "Resolved"];

const inputCls =
  "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";

function initials(name: string) {
  return name.replace(/\./g, "").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
}

let seq = 0;
const nextId = () => {
  try {
    return `SR-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  } catch {
    return `SR-${++seq}${Date.now().toString().slice(-3)}`;
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
      <div className="relative z-10 w-full max-w-md glass card shadow-glass animate-fade-up">
        <div className="flex items-center gap-2 border-b p-4">
          <Icon.request className="h-4 w-4 shrink-0 text-royal-400" />
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

type Form = {
  open: boolean;
  id: string | null;
  title: string;
  requester: string;
  priority: Priority;
  sla: Sla;
  status: Status;
  pic: string;
  created: string;
};
const emptyForm: Form = { open: false, id: null, title: "", requester: "", priority: "Medium", sla: "Within SLA", status: "New", pic: "", created: "" };

export default function RequestsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useLocalState<ServiceRequest[]>("service-requests", mockServiceRequests);
  const [live, setLive] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);

  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    apiGet<ServiceRequest[]>("/service-requests")
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

  const summary = [
    { label: "New", value: rows.filter((r) => r.status === "New").length, tone: "blue" },
    { label: "In Progress", value: rows.filter((r) => r.status === "In Progress").length, tone: "blue" },
    { label: "Waiting Approval", value: rows.filter((r) => r.status === "Waiting Approval").length, tone: "gold" },
    { label: "Breached SLA", value: rows.filter((r) => r.sla === "Breached").length, tone: "red" },
  ] as const;

  const openCreate = () => setForm({ ...emptyForm, open: true });
  const openEdit = (r: ServiceRequest) =>
    setForm({ open: true, id: r.id, title: r.title, requester: r.requester, priority: r.priority, sla: r.sla, status: r.status, pic: r.pic, created: r.created });
  const close = () => setForm(emptyForm);
  const save = () => {
    const title = form.title.trim();
    if (!title) return;
    const body = {
      title,
      requester: form.requester.trim() || "—",
      priority: form.priority,
      sla: form.sla,
      status: form.status,
      pic: form.pic.trim() || "—",
      created: form.created || new Date().toISOString().slice(0, 10),
    };
    if (form.id == null) {
      const r: ServiceRequest = { id: nextId(), ...body };
      setRows((x) => [r, ...x]);
      sync("POST", "/service-requests", r);
    } else {
      setRows((x) => x.map((y) => (y.id === form.id ? { ...y, ...body } : y)));
      sync("PUT", `/service-requests/${form.id}`, body);
    }
    close();
  };
  const remove = (r: ServiceRequest) => {
    setRows((x) => x.filter((y) => y.id !== r.id));
    sync("DELETE", `/service-requests/${r.id}`);
  };

  return (
    <>
      <PageHeader
        title="Customer Request"
        subtitle="Internal Service Request · Ticket · SLA · PIC · Approval"
        actions={
          <>
            <LiveBadge live={live} />
            <Btn variant="primary" onClick={openCreate}>
              <Icon.plus className="h-4 w-4" /> {t("New Request")}
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-[var(--muted)]">{t(s.label)}</div>
            <div className={`mt-1 text-2xl font-bold ${s.tone === "red" ? "text-rose-500" : s.tone === "gold" ? "gold-gradient" : ""}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-[11px] uppercase tracking-wide text-[var(--muted)] dark:border-white/10">
                <th className="px-5 py-3 font-medium">{t("Ticket")}</th>
                <th className="px-5 py-3 font-medium">{t("Requester")}</th>
                <th className="px-5 py-3 font-medium">{t("Priority")}</th>
                <th className="px-5 py-3 font-medium">SLA</th>
                <th className="px-5 py-3 font-medium">{t("Status")}</th>
                <th className="px-5 py-3 font-medium">PIC</th>
                <th className="px-5 py-3 font-medium">{t("Created")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="group border-b border-black/5 transition last:border-0 hover:bg-black/[0.03] dark:border-white/5 dark:hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <div dir="auto" className="font-medium">{r.title}</div>
                    <div className="text-[11px] text-[var(--muted)]">{r.id}</div>
                  </td>
                  <td className="px-5 py-3 text-[var(--muted)]">{t(r.requester)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={priorityTone[r.priority]}>{t(r.priority)}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={slaTone[r.sla]}>{t(r.sla)}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone[r.status]}>{t(r.status)}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar initials={initials(r.pic)} />
                      <span className="text-[12px] text-[var(--muted)]">{t(r.pic)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-[var(--muted)]">
                    {new Date(r.created).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2 text-[11px] opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => openEdit(r)} className="font-medium text-[var(--muted)] transition hover:text-royal-400" title={t("Edit")}>
                        {t("Edit")}
                      </button>
                      <button onClick={() => remove(r)} className="text-[var(--muted)] transition hover:text-rose-400" title={t("Delete")}>
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-[12px] text-[var(--muted)]">
                    {t("No requests yet. Add one.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {form.open && (
        <Modal title={form.id == null ? t("New Request") : t("Edit Request")} onClose={close} onSave={save} saveLabel={form.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Title")}
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t("e.g. Access to performance data warehouse")} className={inputCls} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Requester")}
              <input value={form.requester} onChange={(e) => setForm((f) => ({ ...f, requester: e.target.value }))} placeholder={t("e.g. Ops Dept.")} className={inputCls} />
            </label>
            <label className={labelCls}>
              PIC
              <input value={form.pic} onChange={(e) => setForm((f) => ({ ...f, pic: e.target.value }))} placeholder={t("e.g. Rani K.")} className={inputCls} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Priority")}
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))} className={`${inputCls} text-[var(--text)]`}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {t(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              SLA
              <select value={form.sla} onChange={(e) => setForm((f) => ({ ...f, sla: e.target.value as Sla }))} className={`${inputCls} text-[var(--text)]`}>
                {SLAS.map((s) => (
                  <option key={s} value={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <label className={labelCls}>
              {t("Created")}
              <input type="date" value={form.created} onChange={(e) => setForm((f) => ({ ...f, created: e.target.value }))} className={`${inputCls} text-[var(--text)]`} />
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}
