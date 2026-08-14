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
import { certificationSeed, type CertificationRecord, type CertStatus } from "@/lib/compassSeed";
import { useI18n } from "@/lib/i18n";

const statusTone = (s: CertStatus): "green" | "amber" | "red" => (s === "Competent" ? "green" : s === "Expired" ? "red" : "amber");
const STATUSES: CertStatus[] = ["Competent", "In Progress", "Expired"];

let seq = 0;
const newId = () => {
  try {
    return `cert-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `cert-${++seq}-${Date.now()}`;
  }
};

type Form = { open: boolean; id: string | null; employee: string; title: string; level: string; status: CertStatus; issued: string; expires: string };
const empty: Form = { open: false, id: null, employee: "", title: "", level: "", status: "In Progress", issued: "", expires: "" };

export default function CertificationPage() {
  const { t } = useI18n();
  const [certs, setCerts] = useLocalState<CertificationRecord[]>("compass-certifications", certificationSeed);
  const [form, setForm] = useState<Form>(empty);
  const authed = useApiAuthed();

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    apiListCompass<CertificationRecord>("certifications")
      .then((d) => { if (alive && d.length) setCerts(d); })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const openCreate = () => setForm({ ...empty, open: true, issued: new Date().toISOString().slice(0, 10) });
  const openEdit = (c: CertificationRecord) =>
    setForm({ open: true, id: c.id, employee: c.employee, title: c.title, level: c.level, status: c.status, issued: c.issued, expires: c.expires ?? "" });

  const save = () => {
    const title = form.title.trim();
    const employee = form.employee.trim();
    if (!title || !employee) return;
    const full: CertificationRecord = {
      id: form.id ?? newId(),
      employee,
      title,
      level: form.level.trim(),
      status: form.status,
      issued: form.issued,
      // Optional: an in-progress certification has no expiry yet.
      expires: form.expires || undefined,
    };
    setCerts((r) => (r.some((x) => x.id === full.id) ? r.map((x) => (x.id === full.id ? full : x)) : [full, ...r]));
    if (authed) apiSaveCompass("certifications", full).catch(compassOnErr);
    setForm(empty);
  };

  const remove = (c: CertificationRecord) => {
    if (!confirm(`${t("Delete")} “${c.title}”?`)) return;
    setCerts((r) => r.filter((x) => x.id !== c.id));
    if (authed) apiDeleteCompass("certifications", c.id).catch(compassOnErr);
  };

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader
        title="Certification"
        subtitle="COMPASS · Sertifikasi kompetensi · sertifikat digital"
        actions={<Btn variant="primary" onClick={openCreate}><Icon.plus className="h-4 w-4" /> {t("Add")}</Btn>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {certs.map((c) => (
          <Card key={c.id} className="group relative overflow-hidden">
            <div className="absolute right-3 top-3"><Icon.competency className="h-6 w-6 text-gold-400/60" /></div>
            <Badge tone={statusTone(c.status)}>{c.status}</Badge>
            <div className="mt-2 text-[15px] font-semibold leading-snug">{c.title}</div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">{c.employee}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-2.5 text-[12px]">
              <div><div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{t("Level")}</div><div>{c.level || "—"}</div></div>
              <div><div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{t("Issued")}</div><div>{c.issued || "—"}</div></div>
              {c.expires && <div><div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{t("Expires")}</div><div>{c.expires}</div></div>}
            </div>
            <div className="mt-2 flex justify-end"><RowActions onEdit={() => openEdit(c)} onDelete={() => remove(c)} label={c.title} /></div>
          </Card>
        ))}
        {certs.length === 0 && <Card className="col-span-full text-center text-[13px] text-[var(--muted)]">{t("No records yet.")}</Card>}
      </div>

      {form.open && (
        <CrudModal
          title={form.id == null ? t("New Certification") : t("Edit Certification")}
          onClose={() => setForm(empty)}
          onSave={save}
          saveLabel={form.id == null ? t("Create") : t("Save")}
        >
          <label className={modalLabelCls}>
            {t("Employee")}
            <input className={modalInputCls} value={form.employee} onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))} placeholder="e.g. Rani Kusuma" />
          </label>
          <label className={modalLabelCls}>
            {t("Title")}
            <input className={modalInputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Operator Ammonia Level 2" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={modalLabelCls}>
              {t("Level")}
              <input className={modalInputCls} value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} placeholder="e.g. Level 2" />
            </label>
            <label className={modalLabelCls}>
              {t("Status")}
              <select className={modalInputCls} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CertStatus }))}>
                {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={modalLabelCls}>
              {t("Issued")}
              <input type="date" className={modalInputCls} value={form.issued} onChange={(e) => setForm((f) => ({ ...f, issued: e.target.value }))} />
            </label>
            <label className={modalLabelCls}>
              {t("Expires")}
              <input type="date" className={modalInputCls} value={form.expires} onChange={(e) => setForm((f) => ({ ...f, expires: e.target.value }))} />
            </label>
          </div>
        </CrudModal>
      )}
    </>
  );
}
