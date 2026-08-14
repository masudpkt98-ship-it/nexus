"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { CrudModal, RowActions, modalInputCls, modalLabelCls } from "@/components/CrudModal";
import { useLocalState } from "@/lib/useLocalState";
import { apiListCompass, apiSaveCompass, apiDeleteCompass, compassOnErr } from "@/lib/api";
import { useApiAuthed } from "@/lib/auth";
import { assessmentSeed, type AssessmentRecord, type AssessStatus, type AssessMethod } from "@/lib/compassSeed";
import { useI18n } from "@/lib/i18n";

const statusTone = (s: AssessStatus): "gray" | "amber" | "green" | "red" =>
  s === "Lulus" ? "green" : s === "Tidak Lulus" ? "red" : s === "Dinilai" ? "amber" : "gray";
const METHODS = ["Quiz", "Praktik", "Wawancara", "Observasi", "Studi Kasus", "Simulasi"];

const STATUSES: AssessStatus[] = ["Dijadwalkan", "Dinilai", "Lulus", "Tidak Lulus"];

let seq = 0;
const newId = () => {
  try {
    return `as-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `as-${++seq}-${Date.now()}`;
  }
};

type Form = { open: boolean; id: string | null; employee: string; competency: string; method: AssessMethod; assessor: string; score: string; status: AssessStatus; date: string };
const empty: Form = { open: false, id: null, employee: "", competency: "", method: "Quiz", assessor: "", score: "", status: "Dijadwalkan", date: "" };

export default function AssessmentPage() {
  const { t } = useI18n();
  const [recs, setRecs] = useLocalState<AssessmentRecord[]>("compass-assessments", assessmentSeed);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Form>(empty);
  const authed = useApiAuthed();

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    apiListCompass<AssessmentRecord>("assessment-records")
      .then((d) => { if (alive && d.length) setRecs(d); })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const openCreate = () => setForm({ ...empty, open: true, date: new Date().toISOString().slice(0, 10) });
  const openEdit = (r: AssessmentRecord) =>
    setForm({ open: true, id: r.id, employee: r.employee, competency: r.competency, method: r.method, assessor: r.assessor, score: r.score == null ? "" : String(r.score), status: r.status, date: r.date });

  const save = () => {
    const employee = form.employee.trim();
    if (!employee) return;
    const trimmed = form.score.trim();
    const full: AssessmentRecord = {
      id: form.id ?? newId(),
      employee,
      competency: form.competency.trim(),
      method: form.method,
      assessor: form.assessor.trim(),
      // Blank means "not graded yet" — kept as null, which the table shows as "—".
      score: trimmed === "" ? null : Math.max(0, Math.min(100, Number(trimmed) || 0)),
      status: form.status,
      date: form.date,
    };
    setRecs((r) => (r.some((x) => x.id === full.id) ? r.map((x) => (x.id === full.id ? full : x)) : [full, ...r]));
    if (authed) apiSaveCompass("assessment-records", full).catch(compassOnErr);
    setForm(empty);
  };

  const remove = (r: AssessmentRecord) => {
    if (!confirm(`${t("Delete")} “${r.employee} · ${r.competency}”?`)) return;
    setRecs((x) => x.filter((y) => y.id !== r.id));
    if (authed) apiDeleteCompass("assessment-records", r.id).catch(compassOnErr);
  };
  const rows = recs.filter((r) => !q.trim() || `${r.employee} ${r.competency} ${r.assessor}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader
        title="Assessment"
        subtitle="COMPASS · Pembuktian kompetensi · Quiz · Praktik · Observasi · Simulasi"
        actions={<Btn variant="primary" onClick={openCreate}><Icon.plus className="h-4 w-4" /> {t("Add")}</Btn>}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {METHODS.map((m) => (<span key={m} className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--muted)] dark:bg-white/10">{m}</span>))}
        </div>
        <div className="relative ml-auto min-w-[200px] flex-1">
          <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search employee, competency, assessor…")} className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500" />
        </div>
      </div>

      <div className="glass card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">{t("Employee")}</th>
              <th className="px-4 py-3 font-medium">{t("Competency")}</th>
              <th className="px-4 py-3 font-medium">{t("Method")}</th>
              <th className="px-4 py-3 font-medium">{t("Assessor")}</th>
              <th className="px-4 py-3 font-medium text-center">{t("Score")}</th>
              <th className="px-4 py-3 font-medium">{t("Status")}</th>
              <th className="px-4 py-3 font-medium">{t("Date")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="group border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                <td className="px-4 py-2.5 text-[13px]">{r.employee}</td>
                <td className="px-4 py-2.5 text-[13px]">{r.competency}</td>
                <td className="px-4 py-2.5"><Badge tone="gray">{r.method}</Badge></td>
                <td className="px-4 py-2.5 text-[12px] text-[var(--muted)]">{r.assessor}</td>
                <td className="px-4 py-2.5 text-center font-semibold">{r.score ?? "—"}</td>
                <td className="px-4 py-2.5"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                <td className="px-4 py-2.5 text-[12px] text-[var(--muted)]">{r.date}</td>
                <td className="px-4 py-2.5 text-right"><RowActions onEdit={() => openEdit(r)} onDelete={() => remove(r)} label={`${r.employee} ${r.competency}`} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">{t("No records yet.")}</td></tr>}
          </tbody>
        </table>
      </div>

      {form.open && (
        <CrudModal
          title={form.id == null ? t("New Assessment") : t("Edit Assessment")}
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
              {t("Competency")}
              <input className={modalInputCls} value={form.competency} onChange={(e) => setForm((f) => ({ ...f, competency: e.target.value }))} placeholder="e.g. Data Analysis" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={modalLabelCls}>
              {t("Method")}
              <select className={modalInputCls} value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as AssessMethod }))}>
                {METHODS.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
            </label>
            <label className={modalLabelCls}>
              {t("Assessor")}
              <input className={modalInputCls} value={form.assessor} onChange={(e) => setForm((f) => ({ ...f, assessor: e.target.value }))} placeholder="e.g. Sinta L." />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className={modalLabelCls}>
              {t("Score")}
              <input className={modalInputCls} value={form.score} onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))} placeholder="0–100" inputMode="numeric" />
            </label>
            <label className={modalLabelCls}>
              {t("Status")}
              <select className={modalInputCls} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AssessStatus }))}>
                {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </label>
            <label className={modalLabelCls}>
              {t("Date")}
              <input type="date" className={modalInputCls} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </label>
          </div>
          <p className="text-[11px] text-[var(--muted)]">{t("Leave the score blank while the assessment is not graded yet.")}</p>
        </CrudModal>
      )}
    </>
  );
}
