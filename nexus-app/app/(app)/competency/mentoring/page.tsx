"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { CrudModal, RowActions, modalInputCls, modalLabelCls } from "@/components/CrudModal";
import { useLocalState } from "@/lib/useLocalState";
import { apiListCompass, apiSaveCompass, apiDeleteCompass, compassOnErr } from "@/lib/api";
import { useApiAuthed } from "@/lib/auth";
import { mentoringSeed, type MentoringSession, type SessionKind } from "@/lib/compassSeed";
import { useI18n } from "@/lib/i18n";

const KINDS: SessionKind[] = ["Mentoring", "Coaching"];

let seq = 0;
const newId = () => {
  try {
    return `mt-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `mt-${++seq}-${Date.now()}`;
  }
};

type Form = { open: boolean; id: string | null; employee: string; mentor: string; kind: SessionKind; topic: string; notes: string; actionPlan: string; date: string };
const empty: Form = { open: false, id: null, employee: "", mentor: "", kind: "Mentoring", topic: "", notes: "", actionPlan: "", date: "" };

export default function MentoringPage() {
  const { t } = useI18n();
  const [sessions, setSessions] = useLocalState<MentoringSession[]>("compass-mentoring", mentoringSeed);
  const [form, setForm] = useState<Form>(empty);
  const authed = useApiAuthed();

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    apiListCompass<MentoringSession>("mentoring-sessions")
      .then((d) => { if (alive && d.length) setSessions(d); })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const openCreate = () => setForm({ ...empty, open: true, date: new Date().toISOString().slice(0, 10) });
  const openEdit = (s: MentoringSession) =>
    setForm({ open: true, id: s.id, employee: s.employee, mentor: s.mentor, kind: s.kind, topic: s.topic, notes: s.notes, actionPlan: s.actionPlan, date: s.date });

  const save = () => {
    const topic = form.topic.trim();
    const employee = form.employee.trim();
    if (!topic || !employee) return;
    const full: MentoringSession = {
      id: form.id ?? newId(),
      employee,
      mentor: form.mentor.trim(),
      kind: form.kind,
      topic,
      notes: form.notes.trim(),
      actionPlan: form.actionPlan.trim(),
      date: form.date,
    };
    setSessions((r) => (r.some((x) => x.id === full.id) ? r.map((x) => (x.id === full.id ? full : x)) : [full, ...r]));
    if (authed) apiSaveCompass("mentoring-sessions", full).catch(compassOnErr);
    setForm(empty);
  };

  const remove = (s: MentoringSession) => {
    if (!confirm(`${t("Delete")} “${s.topic}”?`)) return;
    setSessions((r) => r.filter((x) => x.id !== s.id));
    if (authed) apiDeleteCompass("mentoring-sessions", s.id).catch(compassOnErr);
  };

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader
        title="Mentoring & Coaching"
        subtitle="COMPASS · Pendampingan · transfer pengalaman & peningkatan performa"
        actions={<Btn variant="primary" onClick={openCreate}><Icon.plus className="h-4 w-4" /> {t("Add")}</Btn>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {sessions.map((s) => (
          <Card key={s.id} className="group">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold">{s.topic}</div>
                <div className="truncate text-[12px] text-[var(--muted)]">{s.employee} · {t("Mentor")}: {s.mentor}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <RowActions onEdit={() => openEdit(s)} onDelete={() => remove(s)} label={s.topic} />
                <Badge tone={s.kind === "Coaching" ? "amber" : "blue"}>{s.kind}</Badge>
              </div>
            </div>
            <div className="mt-3 space-y-2 text-[13px]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Notes")}</div>
                <p className="mt-0.5">{s.notes}</p>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Action Plan")}</div>
                <p className="mt-0.5">{s.actionPlan}</p>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-[var(--muted)]">{s.date}</div>
          </Card>
        ))}
        {sessions.length === 0 && <Card className="col-span-full text-center text-[13px] text-[var(--muted)]">{t("No records yet.")}</Card>}
      </div>

      {form.open && (
        <CrudModal
          title={form.id == null ? t("New Session") : t("Edit Session")}
          onClose={() => setForm(empty)}
          onSave={save}
          saveLabel={form.id == null ? t("Create") : t("Save")}
        >
          <div className="grid grid-cols-2 gap-3">
            <label className={modalLabelCls}>
              {t("Employee")}
              <input className={modalInputCls} value={form.employee} onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))} placeholder="e.g. Rani Kusuma" />
            </label>
            <label className={modalLabelCls}>
              {t("Mentor")}
              <input className={modalInputCls} value={form.mentor} onChange={(e) => setForm((f) => ({ ...f, mentor: e.target.value }))} placeholder="e.g. Sinta L." />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={modalLabelCls}>
              {t("Type")}
              <select className={modalInputCls} value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as SessionKind }))}>
                {KINDS.map((k) => (<option key={k} value={k}>{k}</option>))}
              </select>
            </label>
            <label className={modalLabelCls}>
              {t("Date")}
              <input type="date" className={modalInputCls} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </label>
          </div>
          <label className={modalLabelCls}>
            {t("Topic")}
            <input className={modalInputCls} value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} placeholder="e.g. Teknik analisis akar masalah" />
          </label>
          <label className={modalLabelCls}>
            {t("Notes")}
            <textarea rows={3} className={modalInputCls} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </label>
          <label className={modalLabelCls}>
            {t("Action Plan")}
            <textarea rows={3} className={modalInputCls} value={form.actionPlan} onChange={(e) => setForm((f) => ({ ...f, actionPlan: e.target.value }))} />
          </label>
        </CrudModal>
      )}
    </>
  );
}
