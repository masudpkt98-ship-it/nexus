"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import {
  meetings as mockMeetings,
  meetingAgenda as mockAgenda,
  meetingActions as mockActions,
  type Meeting,
  type AgendaItem,
  type ActionItem,
  type ActionStatus,
} from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { apiGet, apiSend, getToken } from "@/lib/api";
import { LiveBadge } from "@/components/LiveBadge";

const inputCls =
  "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";
const initials = (name: string) => name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

let seq = 0;
const nextId = (p: string) => {
  try {
    return `${p}-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `${p}-${++seq}-${Date.now()}`;
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
          <Icon.meeting className="h-4 w-4 shrink-0 text-royal-400" />
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

// ---------------------------------------------------------------------------
// Meetings — hybrid CRUD (localStorage + best-effort Laravel API).
// ---------------------------------------------------------------------------
type MForm = { open: boolean; id: string | null; title: string; time: string; attendees: number; actionItems: number };
const emptyMeeting: MForm = { open: false, id: null, title: "", time: "", attendees: 1, actionItems: 0 };

function Meetings() {
  const { t } = useI18n();
  const [rows, setRows] = useLocalState<Meeting[]>("meetings", mockMeetings);
  const [live, setLive] = useState(false);
  const [form, setForm] = useState<MForm>(emptyMeeting);

  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    apiGet<Meeting[]>("/meetings")
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

  const openCreate = () => setForm({ ...emptyMeeting, open: true });
  const openEdit = (m: Meeting) => setForm({ open: true, id: m.id, title: m.title, time: m.time, attendees: m.attendees, actionItems: m.actionItems });
  const close = () => setForm(emptyMeeting);
  const save = () => {
    const title = form.title.trim();
    if (!title) return;
    const body = { title, time: form.time.trim() || "TBD", attendees: form.attendees, actionItems: form.actionItems };
    if (form.id == null) {
      const m: Meeting = { id: nextId("mtg"), ...body };
      setRows((r) => [...r, m]);
      sync("POST", "/meetings", m);
    } else {
      setRows((r) => r.map((x) => (x.id === form.id ? { ...x, ...body } : x)));
      sync("PUT", `/meetings/${form.id}`, body);
    }
    close();
  };
  const remove = (m: Meeting) => {
    setRows((r) => r.filter((x) => x.id !== m.id));
    sync("DELETE", `/meetings/${m.id}`);
  };

  return (
    <>
      <PageHeader
        title="Meeting Management"
        subtitle="Agenda · Minutes · Attendance · Action Items · Task Creation"
        actions={
          <>
            <LiveBadge live={live} />
            <Btn variant="primary" onClick={openCreate}>
              <Icon.plus className="h-4 w-4" /> {t("Schedule Meeting")}
            </Btn>
          </>
        }
      />

      <SectionTitle title="Upcoming Meetings" subtitle="Scheduled sessions & action item load" />
      <div className="grid gap-4 md:grid-cols-3">
        {rows.map((m) => (
          <Card key={m.id} dir="auto" className="group hover:border-royal-500/40 transition">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-royal-500/12 text-royal-400">
                <Icon.meeting className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold leading-tight">{m.title}</div>
                  <RowActions onEdit={() => openEdit(m)} onDelete={() => remove(m)} label={m.title} />
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                  <Icon.clock className="h-3.5 w-3.5" />
                  {m.time}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-[11px] text-[var(--muted)] dark:border-white/5">
              <span className="inline-flex items-center gap-1.5">
                <Icon.users className="h-3.5 w-3.5" />
                {m.attendees} {t("attendees")}
              </span>
              <Badge tone="amber">
                {m.actionItems} {t("action items")}
              </Badge>
            </div>
          </Card>
        ))}
        {rows.length === 0 && (
          <Card className="col-span-full text-center text-[12px] text-[var(--muted)]">{t("No meetings yet. Add one.")}</Card>
        )}
      </div>

      {form.open && (
        <Modal title={form.id == null ? t("Schedule Meeting") : t("Edit Meeting")} onClose={close} onSave={save} saveLabel={form.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Title")}
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t("e.g. Quarterly Performance Review")}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            {t("Time")}
            <input
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              placeholder={t("e.g. Today · 14:00")}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Attendees")}
              <input
                type="number"
                min={0}
                value={form.attendees}
                onChange={(e) => setForm((f) => ({ ...f, attendees: Number(e.target.value) }))}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              {t("Action item")}
              <input
                type="number"
                min={0}
                value={form.actionItems}
                onChange={(e) => setForm((f) => ({ ...f, actionItems: Number(e.target.value) }))}
                className={inputCls}
              />
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Agenda — numbered CRUD list.
// ---------------------------------------------------------------------------
const emptyAgenda = { open: false, id: null as string | null, text: "" };

function Agenda() {
  const { t } = useI18n();
  const [rows, setRows] = useLocalState<AgendaItem[]>("meeting-agenda", mockAgenda);
  const [form, setForm] = useState(emptyAgenda);

  const openCreate = () => setForm({ ...emptyAgenda, open: true });
  const openEdit = (a: AgendaItem) => setForm({ open: true, id: a.id, text: a.text });
  const close = () => setForm(emptyAgenda);
  const save = () => {
    const text = form.text.trim();
    if (!text) return;
    if (form.id == null) setRows((r) => [...r, { id: nextId("ag"), text }]);
    else setRows((r) => r.map((x) => (x.id === form.id ? { ...x, text } : x)));
    close();
  };
  const remove = (a: AgendaItem) => setRows((r) => r.filter((x) => x.id !== a.id));

  return (
    <Card>
      <SectionTitle
        title="Agenda"
        subtitle="Quarterly Performance Review · Today · 14:00"
        action={
          <button onClick={openCreate} className="text-royal-400 transition hover:text-royal-300" aria-label="Add agenda item" title={t("Add")}>
            <Icon.plus className="h-4 w-4" />
          </button>
        }
      />
      <ul className="space-y-2.5">
        {rows.map((a, i) => (
          <li key={a.id} dir="auto" className="group flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-royal-500/12 text-[11px] font-semibold text-royal-400">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">{t(a.text)}</span>
            <RowActions onEdit={() => openEdit(a)} onDelete={() => remove(a)} label={a.text} />
          </li>
        ))}
        {rows.length === 0 && <li className="py-3 text-center text-[12px] text-[var(--muted)]">{t("No agenda items yet. Add one.")}</li>}
      </ul>

      {form.open && (
        <Modal title={form.id == null ? t("New Agenda Item") : t("Edit Agenda Item")} onClose={close} onSave={save} saveLabel={form.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Agenda item")}
            <textarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              rows={3}
              placeholder={t("Review Q3 KPI achievement vs. target")}
              className={inputCls}
            />
          </label>
        </Modal>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Action Items — CRUD list with assignee + status toggle.
// ---------------------------------------------------------------------------
const emptyAction = { open: false, id: null as string | null, assignee: "", text: "", status: "Open" as ActionStatus };

function ActionItems() {
  const { t } = useI18n();
  const [rows, setRows] = useLocalState<ActionItem[]>("meeting-actions", mockActions);
  const [form, setForm] = useState(emptyAction);

  const openCreate = () => setForm({ ...emptyAction, open: true });
  const openEdit = (a: ActionItem) => setForm({ open: true, id: a.id, assignee: a.assignee, text: a.text, status: a.status });
  const close = () => setForm(emptyAction);
  const save = () => {
    const text = form.text.trim();
    if (!text) return;
    const body = { assignee: initials(form.assignee.trim()) || "?", text, status: form.status };
    if (form.id == null) setRows((r) => [...r, { id: nextId("ac"), ...body }]);
    else setRows((r) => r.map((x) => (x.id === form.id ? { ...x, ...body } : x)));
    close();
  };
  const toggle = (a: ActionItem) => setRows((r) => r.map((x) => (x.id === a.id ? { ...x, status: x.status === "Done" ? "Open" : "Done" } : x)));
  const remove = (a: ActionItem) => setRows((r) => r.filter((x) => x.id !== a.id));

  return (
    <Card>
      <SectionTitle
        title="Minutes & Action Items"
        subtitle="Assigned follow-ups from this meeting"
        action={
          <button onClick={openCreate} className="text-royal-400 transition hover:text-royal-300" aria-label="Add action item" title={t("Add")}>
            <Icon.plus className="h-4 w-4" />
          </button>
        }
      />
      <div className="space-y-3">
        {rows.map((a) => (
          <div key={a.id} dir="auto" className="group flex items-center gap-3">
            <Avatar initials={a.assignee} />
            <span className="min-w-0 flex-1 text-sm">{t(a.text)}</span>
            <button onClick={() => toggle(a)} title={t("Status")} className="shrink-0">
              <Badge tone={a.status === "Done" ? "green" : "gray"}>
                {a.status === "Done" ? (
                  <>
                    <Icon.check className="h-3 w-3" /> {t("Done")}
                  </>
                ) : (
                  t("Open")
                )}
              </Badge>
            </button>
            <RowActions onEdit={() => openEdit(a)} onDelete={() => remove(a)} label={a.text} />
          </div>
        ))}
        {rows.length === 0 && <p className="py-3 text-center text-[12px] text-[var(--muted)]">{t("No action items yet. Add one.")}</p>}
      </div>

      {form.open && (
        <Modal title={form.id == null ? t("New Action Item") : t("Edit Action Item")} onClose={close} onSave={save} saveLabel={form.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Action item")}
            <textarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              rows={3}
              placeholder={t("e.g. Finalize Q3 KPI cascade")}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Assignee")}
              <input
                value={form.assignee}
                onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                placeholder={t("e.g. AW")}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              {t("Status")}
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ActionStatus }))}
                className={`${inputCls} text-[var(--text)]`}
              >
                <option value="Open">{t("Open")}</option>
                <option value="Done">{t("Done")}</option>
              </select>
            </label>
          </div>
        </Modal>
      )}
    </Card>
  );
}

export default function MeetingsPage() {
  return (
    <>
      <Meetings />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Agenda />
        <ActionItems />
      </div>
    </>
  );
}
