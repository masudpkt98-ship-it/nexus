"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeeSearch } from "@/components/EmployeeSearch";
import { matchJabatan, resolveTech, behByName, tierTone, levelTone } from "@/lib/compass";
import { useLocalState } from "@/lib/useLocalState";
import { type Employee, type JabatanCompetencyProfile } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

// Editable job-description fields, stored per jabatan (the competency parts are derived).
interface JobDesc { purpose: string; responsibilities: string; qualifications: string; certifications: string; risks: string; kpi: string }
const emptyDesc: JobDesc = { purpose: "", responsibilities: "", qualifications: "", certifications: "", risks: "", kpi: "" };
const areaCls = "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const lblCls = "block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]";

export default function JobProfilePage() {
  const { t } = useI18n();
  const [descs, setDescs] = useLocalState<Record<string, JobDesc>>("compass-job-desc", {});
  const [sel, setSel] = useState<JabatanCompetencyProfile | null>(null);
  const [emp, setEmp] = useState<Employee | null>(null);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<JobDesc>(emptyDesc);

  const pick = (e: Employee) => {
    const m = matchJabatan(e.position || "");
    setEmp(e); setSel(m); setEdit(false);
  };
  const desc = sel ? (descs[sel.key] ?? emptyDesc) : emptyDesc;
  const tech = useMemo(() => (sel ? resolveTech(sel) : []), [sel]);

  const startEdit = () => { setDraft(desc); setEdit(true); };
  const save = () => { if (sel) setDescs((m) => ({ ...m, [sel.key]: draft })); setEdit(false); };

  const field = (label: string, key: keyof JobDesc, rows = 2) => (
    <div>
      <div className={lblCls}>{label}</div>
      {edit ? (
        <textarea value={draft[key]} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} rows={rows} className={areaCls} />
      ) : (
        <p className="mt-1 whitespace-pre-line text-[13px]">{desc[key] || <span className="text-[var(--muted)]">—</span>}</p>
      )}
    </div>
  );

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader title="Job Profile" subtitle="COMPASS · Informasi lengkap jabatan sebagai dasar pengembangan kompetensi" />

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-[11px] font-medium text-[var(--muted)]">
            {t("Find by employee")}
            <div className="mt-1"><EmployeeSearch onSelect={pick} /></div>
          </label>
        </div>
      </Card>

      {!sel ? (
        <Card className="flex min-h-[160px] items-center justify-center text-center text-[13px] text-[var(--muted)]">
          {emp ? t("No competency profile found for this employee's position.") : t("Search an employee to view the job profile.")}
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                {emp && <div className="text-[12px] text-[var(--muted)]">{emp.name}{emp.npk ? ` · ${emp.npk}` : ""}</div>}
                <div className="text-lg font-semibold">{sel.jabatan}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[var(--muted)]">
                  {sel.band && <Badge tone="blue">{sel.band}</Badge>}
                  {sel.sf && <Badge tone="gray">{sel.sf}</Badge>}
                  {sel.jobStream && <span>· {sel.jobStream}</span>}
                  {emp?.unit && <span>· {emp.unit}</span>}
                </div>
              </div>
              {edit ? (
                <div className="flex gap-2">
                  <button onClick={() => setEdit(false)} className="rounded-lg px-3 py-1.5 text-[12px] text-[var(--muted)] hover:text-rose-400">{t("Cancel")}</button>
                  <button onClick={save} className="rounded-lg bg-royal-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-royal-600">{t("Save")}</button>
                </div>
              ) : (
                <button onClick={startEdit} className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--muted)] hover:text-royal-400">{t("Edit")}</button>
              )}
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {field(t("Job Purpose"), "purpose", 2)}
              {field("KPI", "kpi", 2)}
              {field(t("Responsibilities"), "responsibilities", 3)}
              {field(t("Qualifications"), "qualifications", 3)}
              {field(t("Certifications"), "certifications", 2)}
              {field(t("Job Risks"), "risks", 2)}
            </div>
          </Card>

          {/* Required competencies (derived) */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className={lblCls}>{t("Kompetensi Teknis")}</div>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--muted)] dark:bg-white/10">{tech.length}</span>
              </div>
              <div className="glass card divide-y">
                {tech.map((c) => (
                  <div key={c.code} className="flex items-center gap-2 px-3 py-2">
                    <Badge tone="blue">{c.code}</Badge>
                    <span className="min-w-0 flex-1 truncate text-[13px]">{c.name}</span>
                    <Badge tone={levelTone(c.level)}>L{c.level}</Badge>
                  </div>
                ))}
                {tech.length === 0 && <div className="px-3 py-4 text-center text-[12px] text-[var(--muted)]">—</div>}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className={lblCls}>{t("Kompetensi Perilaku")}</div>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--muted)] dark:bg-white/10">{sel.beh.length}</span>
              </div>
              <div className="glass card divide-y">
                {sel.beh.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-[13px]">{behByName(b.n)?.name ?? b.n}</span>
                    <Badge tone={tierTone(b.t)}>{b.t}</Badge>
                  </div>
                ))}
                {sel.beh.length === 0 && <div className="px-3 py-4 text-center text-[12px] text-[var(--muted)]">—</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
