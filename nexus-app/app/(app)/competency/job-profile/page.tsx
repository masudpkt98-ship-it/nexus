"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeeSearch } from "@/components/EmployeeSearch";
import { matchJabatan, resolveTech, behByName, norm, tierTone, levelTone } from "@/lib/compass";
import { importJobProfile } from "@/lib/importJobProfile";
import { useLocalState } from "@/lib/useLocalState";
import { type Employee, type JabatanCompetencyProfile } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

interface JobDesc {
  kodeJabatan?: string; direktorat?: string; kompartemen?: string; departemen?: string;
  purpose: string; responsibilities: string; dimensi?: string; authority?: string; relations?: string;
  qualifications: string; certifications: string; risks: string; kpi: string;
}
const emptyDesc: JobDesc = { purpose: "", responsibilities: "", qualifications: "", certifications: "", risks: "", kpi: "" };
const areaCls = "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const lblCls = "block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]";

export default function JobProfilePage() {
  const { t } = useI18n();
  const [descs, setDescs] = useLocalState<Record<string, JobDesc>>("compass-job-desc", {});
  const [sel, setSel] = useState<JabatanCompetencyProfile | null>(null);
  const [title, setTitle] = useState("");
  const [descKey, setDescKey] = useState<string | null>(null);
  const [emp, setEmp] = useState<Employee | null>(null);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<JobDesc>(emptyDesc);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (e: Employee) => {
    const m = matchJabatan(e.position || "");
    setEmp(e); setSel(m); setTitle(m?.jabatan || e.position || ""); setDescKey(m?.key ?? norm(e.position || "")); setEdit(false); setNote(null);
  };

  const onImport = async (file: File) => {
    setNote(null);
    try {
      const p = await importJobProfile(file);
      if (!p.namaJabatan) { setNote(t("Could not read a job profile from this file.")); return; }
      const m = matchJabatan(p.namaJabatan);
      const key = m?.key ?? norm(p.namaJabatan);
      const desc: JobDesc = {
        kodeJabatan: p.kodeJabatan, direktorat: p.direktorat, kompartemen: p.kompartemen, departemen: p.departemen,
        purpose: p.purpose, responsibilities: p.responsibilities, dimensi: p.dimensi, authority: p.authority,
        relations: p.relations, qualifications: p.qualifications, certifications: "", risks: p.risks, kpi: "",
      };
      setDescs((mp) => ({ ...mp, [key]: desc }));
      setEmp(null); setSel(m); setTitle(p.namaJabatan); setDescKey(key); setEdit(false);
      setNote(`${t("Imported")}: ${p.namaJabatan}${m ? "" : ` · ${t("(competencies unavailable — no matching profile)")}`}`);
    } catch {
      setNote(t("Could not read the file. Make sure it is a valid .docx."));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const desc = descKey ? (descs[descKey] ?? emptyDesc) : emptyDesc;
  const tech = useMemo(() => (sel ? resolveTech(sel) : []), [sel]);
  const startEdit = () => { setDraft(desc); setEdit(true); };
  const save = () => { if (descKey) setDescs((m) => ({ ...m, [descKey]: draft })); setEdit(false); };

  const field = (label: string, key: keyof JobDesc, rows = 2) => (
    <div>
      <div className={lblCls}>{label}</div>
      {edit ? (
        <textarea value={draft[key] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} rows={rows} className={areaCls} />
      ) : (
        <p className="mt-1 whitespace-pre-line text-[13px]">{desc[key] || <span className="text-[var(--muted)]">—</span>}</p>
      )}
    </div>
  );
  const info = (label: string, value?: string) => (value ? <div><span className="text-[var(--muted)]">{label}:</span> {value}</div> : null);

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader
        title="Job Profile"
        subtitle="COMPASS · Informasi lengkap jabatan sebagai dasar pengembangan kompetensi"
        actions={
          <>
            <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); }} />
            <Btn variant="ghost" onClick={() => fileRef.current?.click()}><Icon.document className="h-4 w-4" /> {t("Import Job Profile (.docx)")}</Btn>
          </>
        }
      />

      {note && <div className="mb-4 rounded-xl border border-royal-500/30 bg-royal-500/10 px-4 py-2.5 text-[13px] text-royal-300">{note}</div>}

      <Card className="mb-4">
        <label className="block text-[11px] font-medium text-[var(--muted)]">
          {t("Find by employee")}
          <div className="mt-1"><EmployeeSearch onSelect={pick} /></div>
        </label>
        <p className="mt-2 text-[11px] text-[var(--muted)]">{t("…or import a PROFIL JABATAN (.docx) like VP.docx using the button above.")}</p>
      </Card>

      {!title ? (
        <Card className="flex min-h-[160px] items-center justify-center text-center text-[13px] text-[var(--muted)]">
          {t("Search an employee or import a job profile document.")}
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                {emp && <div className="text-[12px] text-[var(--muted)]">{emp.name}{emp.npk ? ` · ${emp.npk}` : ""}</div>}
                <div className="text-lg font-semibold">{title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[var(--muted)]">
                  {desc.kodeJabatan && <Badge tone="gray">{desc.kodeJabatan}</Badge>}
                  {sel?.band && <Badge tone="blue">{sel.band}</Badge>}
                  {sel?.sf && <Badge tone="gray">{sel.sf}</Badge>}
                  {sel?.jobStream && <span>· {sel.jobStream}</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px]">
                  {info(t("Direktorat"), desc.direktorat)}
                  {info(t("Kompartemen"), desc.kompartemen)}
                  {info(t("Departemen"), desc.departemen)}
                  {emp?.unit && !desc.departemen && info(t("Unit"), emp.unit)}
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
              {field(t("Job Purpose"), "purpose", 3)}
              {field("KPI", "kpi", 3)}
              {field(t("Responsibilities"), "responsibilities", 4)}
              {field(t("Job Authority"), "authority", 4)}
              {field(t("Work Relationships"), "relations", 3)}
              {field(t("Dimensions"), "dimensi", 3)}
              {field(t("Qualifications"), "qualifications", 3)}
              {field(t("Certifications"), "certifications", 2)}
              {field(t("Job Risks"), "risks", 3)}
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
                {tech.length === 0 && <div className="px-3 py-4 text-center text-[12px] text-[var(--muted)]">{sel ? "—" : t("No matching competency profile.")}</div>}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className={lblCls}>{t("Kompetensi Perilaku")}</div>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--muted)] dark:bg-white/10">{sel?.beh.length ?? 0}</span>
              </div>
              <div className="glass card divide-y">
                {(sel?.beh ?? []).map((b, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-[13px]">{behByName(b.n)?.name ?? b.n}</span>
                    <Badge tone={tierTone(b.t)}>{b.t}</Badge>
                  </div>
                ))}
                {!sel?.beh.length && <div className="px-3 py-4 text-center text-[12px] text-[var(--muted)]">{sel ? "—" : t("No matching competency profile.")}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
