"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { CrudModal, RowActions, modalInputCls, modalLabelCls } from "@/components/CrudModal";
import { useLocalState } from "@/lib/useLocalState";
import { apiListCompass, apiSaveCompass, apiDeleteCompass, compassOnErr } from "@/lib/api";
import { useApiAuthed } from "@/lib/auth";
import { journeySeed, type LearningJourney } from "@/lib/compassSeed";
import { useI18n } from "@/lib/i18n";

let seq = 0;
const newId = () => {
  try {
    return `jr-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `jr-${++seq}-${Date.now()}`;
  }
};

// One textarea per week; a non-empty line is one item. Same convention the Job
// Profile page uses for responsibilities.
type WeekDraft = { week: number; text: string };
type Form = { open: boolean; id: string | null; employee: string; role: string; progress: number; weeks: WeekDraft[] };
const empty: Form = { open: false, id: null, employee: "", role: "", progress: 0, weeks: [{ week: 1, text: "" }] };

export default function JourneyPage() {
  const { t } = useI18n();
  const [journeys, setJourneys] = useLocalState<LearningJourney[]>("compass-journeys", journeySeed);
  const [form, setForm] = useState<Form>(empty);
  const authed = useApiAuthed();

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    apiListCompass<LearningJourney>("learning-journeys")
      .then((d) => { if (alive && d.length) setJourneys(d); })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const openCreate = () => setForm({ ...empty, open: true, weeks: [{ week: 1, text: "" }] });
  const openEdit = (j: LearningJourney) =>
    setForm({
      open: true,
      id: j.id,
      employee: j.employee,
      role: j.role,
      progress: j.progress,
      weeks: j.weeks.map((w) => ({ week: w.week, text: w.items.join("\n") })),
    });

  const setWeekText = (week: number, text: string) =>
    setForm((f) => ({ ...f, weeks: f.weeks.map((w) => (w.week === week ? { ...w, text } : w)) }));
  const addWeek = () =>
    setForm((f) => ({ ...f, weeks: [...f.weeks, { week: f.weeks.length + 1, text: "" }] }));
  // Renumber after a removal so the weeks stay 1..n with no gaps.
  const removeWeek = (week: number) =>
    setForm((f) => ({ ...f, weeks: f.weeks.filter((w) => w.week !== week).map((w, i) => ({ ...w, week: i + 1 })) }));

  const save = () => {
    const employee = form.employee.trim();
    if (!employee) return;
    const weeks = form.weeks
      .map((w) => ({ week: w.week, items: w.text.split("\n").map((x) => x.trim()).filter(Boolean) }))
      .filter((w) => w.items.length > 0);
    const full: LearningJourney = {
      id: form.id ?? newId(),
      employee,
      role: form.role.trim(),
      weeks,
      progress: Math.max(0, Math.min(100, Number(form.progress) || 0)),
    };
    setJourneys((r) => (r.some((x) => x.id === full.id) ? r.map((x) => (x.id === full.id ? full : x)) : [full, ...r]));
    if (authed) apiSaveCompass("learning-journeys", full).catch(compassOnErr);
    setForm(empty);
  };

  const remove = (j: LearningJourney) => {
    if (!confirm(`${t("Delete")} “${j.employee}”?`)) return;
    setJourneys((r) => r.filter((x) => x.id !== j.id));
    if (authed) apiDeleteCompass("learning-journeys", j.id).catch(compassOnErr);
  };

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader
        title="Learning Journey"
        subtitle="COMPASS · Urutan pembelajaran tiap individu · progress mingguan"
        actions={<Btn variant="primary" onClick={openCreate}><Icon.plus className="h-4 w-4" /> {t("Add")}</Btn>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {journeys.map((j) => (
          <Card key={j.id} className="group">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[14px] font-semibold">{j.employee}</div>
                <div className="text-[12px] text-[var(--muted)]">{j.role}</div>
              </div>
              <div className="text-right">
                <div className="mb-1 flex justify-end"><RowActions onEdit={() => openEdit(j)} onDelete={() => remove(j)} label={j.employee} /></div>
                <div className="text-lg font-bold gold-gradient">{j.progress}%</div>
                <div className="w-24"><ProgressBar value={j.progress} tone={j.progress === 100 ? "green" : "gold"} /></div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {j.weeks.map((w) => {
                const done = (w.week / j.weeks.length) * 100 <= j.progress;
                return (
                  <div key={w.week} className="flex items-start gap-2 rounded-lg border p-2">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${done ? "bg-emerald-500 text-white" : "bg-royal-500/15 text-royal-400"}`}>
                      {done ? "✓" : w.week}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium text-[var(--muted)]">{t("Week")} {w.week}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {w.items.map((it) => (<span key={it} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[11px] text-royal-400">{it}</span>))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
        {journeys.length === 0 && <Card className="lg:col-span-2 text-center text-[13px] text-[var(--muted)]">{t("No records yet.")}</Card>}
      </div>

      {form.open && (
        <CrudModal
          title={form.id == null ? t("New Journey") : t("Edit Journey")}
          onClose={() => setForm(empty)}
          onSave={save}
          saveLabel={form.id == null ? t("Create") : t("Save")}
          wide
        >
          <div className="grid grid-cols-3 gap-3">
            <label className={modalLabelCls}>
              {t("Employee")}
              <input className={modalInputCls} value={form.employee} onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))} placeholder="e.g. Rani Kusuma" />
            </label>
            <label className={modalLabelCls}>
              {t("Role")}
              <input className={modalInputCls} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. Competency Analyst" />
            </label>
            <label className={modalLabelCls}>
              {t("Progress")} (%)
              <input className={modalInputCls} value={form.progress} onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))} inputMode="numeric" />
            </label>
          </div>

          <div className="space-y-2">
            {form.weeks.map((w) => (
              <div key={w.week} className="rounded-lg border p-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Week")} {w.week}</div>
                  <button
                    onClick={() => removeWeek(w.week)}
                    aria-label={`Remove week ${w.week}`}
                    className="rounded px-1.5 text-[12px] text-[var(--muted)] transition hover:text-rose-400"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  rows={3}
                  className={modalInputCls}
                  value={w.text}
                  onChange={(e) => setWeekText(w.week, e.target.value)}
                  placeholder={t("One item per line")}
                />
              </div>
            ))}
            <Btn variant="ghost" onClick={addWeek}><Icon.plus className="h-4 w-4" /> {t("Add Week")}</Btn>
          </div>
          <p className="text-[11px] text-[var(--muted)]">{t("One line = one learning item. Empty weeks are dropped on save.")}</p>
        </CrudModal>
      )}
    </>
  );
}
