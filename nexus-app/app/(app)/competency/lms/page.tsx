"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { CrudModal, RowActions, modalInputCls, modalLabelCls } from "@/components/CrudModal";
import { useLocalState } from "@/lib/useLocalState";
import { apiListCompass, apiSaveCompass, apiDeleteCompass, compassOnErr } from "@/lib/api";
import { useApiAuthed } from "@/lib/auth";
import { lmsSeed, type LmsModule, type LmsType } from "@/lib/compassSeed";
import { levelTone } from "@/lib/compass";
import { useI18n } from "@/lib/i18n";

const TYPES: LmsType[] = ["Video", "PDF", "Animasi", "eBook", "Quiz", "SOP"];
const typeTone = (t: LmsType): "blue" | "amber" | "green" | "purple" | "gray" | "red" =>
  ({ Video: "red", PDF: "gray", Animasi: "purple", eBook: "blue", Quiz: "amber", SOP: "green" } as const)[t];

let seq = 0;
const newId = () => {
  try {
    return `lms-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `lms-${++seq}-${Date.now()}`;
  }
};

type Form = { open: boolean; id: string | null; title: string; competency: string; type: LmsType; duration: string; level: number };
const empty: Form = { open: false, id: null, title: "", competency: "", type: "Video", duration: "", level: 1 };

export default function LmsPage() {
  const { t } = useI18n();
  const [mods, setMods] = useLocalState<LmsModule[]>("compass-lms", lmsSeed);
  const [type, setType] = useState<LmsType | "">("");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Form>(empty);
  const authed = useApiAuthed();

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    apiListCompass<LmsModule>("lms-modules")
      .then((d) => { if (alive && d.length) setMods(d); })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const openCreate = () => setForm({ ...empty, open: true });
  const openEdit = (m: LmsModule) =>
    setForm({ open: true, id: m.id, title: m.title, competency: m.competency, type: m.type, duration: m.duration, level: m.level });

  const save = () => {
    const title = form.title.trim();
    if (!title) return;
    const full: LmsModule = {
      id: form.id ?? newId(),
      title,
      competency: form.competency.trim(),
      type: form.type,
      duration: form.duration.trim(),
      level: Math.max(1, Math.min(5, Number(form.level) || 1)),
    };
    setMods((r) => (r.some((x) => x.id === full.id) ? r.map((x) => (x.id === full.id ? full : x)) : [full, ...r]));
    if (authed) apiSaveCompass("lms-modules", full).catch(compassOnErr);
    setForm(empty);
  };

  const remove = (m: LmsModule) => {
    if (!confirm(`${t("Delete")} “${m.title}”?`)) return;
    setMods((r) => r.filter((x) => x.id !== m.id));
    if (authed) apiDeleteCompass("lms-modules", m.id).catch(compassOnErr);
  };

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return mods.filter((m) => (!type || m.type === type) && (!n || `${m.title} ${m.competency}`.toLowerCase().includes(n)));
  }, [mods, type, q]);

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader
        title="Learning Modules (LMS)"
        subtitle="COMPASS · Katalog materi pembelajaran"
        actions={<Btn variant="primary" onClick={openCreate}><Icon.plus className="h-4 w-4" /> {t("Add")}</Btn>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setType("")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition", !type ? "bg-royal-500 text-white" : "glass text-[var(--muted)] hover:text-[var(--text)]")}>{t("All")}</button>
        {TYPES.map((ty) => (
          <button key={ty} onClick={() => setType(ty)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition", type === ty ? "bg-royal-500 text-white" : "glass text-[var(--muted)] hover:text-[var(--text)]")}>{ty}</button>
        ))}
        <div className="relative ml-auto min-w-[200px] flex-1">
          <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search title or competency…")} className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((m) => (
          <Card key={m.id} className="group flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Badge tone={typeTone(m.type)}>{m.type}</Badge>
              <div className="flex items-center gap-2">
                <RowActions onEdit={() => openEdit(m)} onDelete={() => remove(m)} label={m.title} />
                <Badge tone={levelTone(m.level)}>L{m.level}</Badge>
              </div>
            </div>
            <div className="text-[14px] font-semibold leading-snug">{m.title}</div>
            <div className="mt-auto flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span className="inline-flex items-center gap-1"><Icon.knowledge className="h-3.5 w-3.5" /> {m.competency}</span>
              <span>{m.duration}</span>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <Card className="col-span-full text-center text-[13px] text-[var(--muted)]">{t("No modules match.")}</Card>}
      </div>

      {form.open && (
        <CrudModal
          title={form.id == null ? t("New Module") : t("Edit Module")}
          icon="knowledge"
          onClose={() => setForm(empty)}
          onSave={save}
          saveLabel={form.id == null ? t("Create") : t("Save")}
        >
          <label className={modalLabelCls}>
            {t("Title")}
            <input className={modalInputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Dasar Analisis Data" />
          </label>
          <label className={modalLabelCls}>
            {t("Competency")}
            <input className={modalInputCls} value={form.competency} onChange={(e) => setForm((f) => ({ ...f, competency: e.target.value }))} placeholder="e.g. Data Analysis" />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className={modalLabelCls}>
              {t("Type")}
              <select className={modalInputCls} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LmsType }))}>
                {TYPES.map((ty) => (<option key={ty} value={ty}>{ty}</option>))}
              </select>
            </label>
            <label className={modalLabelCls}>
              {t("Duration")}
              <input className={modalInputCls} value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="15 menit" />
            </label>
            <label className={modalLabelCls}>
              {t("Level")}
              <select className={modalInputCls} value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: Number(e.target.value) }))}>
                {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>L{n}</option>))}
              </select>
            </label>
          </div>
        </CrudModal>
      )}
    </>
  );
}
