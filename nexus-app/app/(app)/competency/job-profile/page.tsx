"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeeSearch } from "@/components/EmployeeSearch";
import { matchJabatan, resolveTech, behByName, norm, tierTone, levelTone } from "@/lib/compass";
import { importJobProfile } from "@/lib/importJobProfile";
import { downloadKpiTemplate, parseKpiExcel, exportJobKpiExcel, type Responsibility } from "@/lib/jobKpi";
import { usedKpiNames, isKpiUsed } from "@/lib/kpiUsage";
import { useLocalState } from "@/lib/useLocalState";
import { type Employee, type JabatanCompetencyProfile } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

interface JobDesc {
  jabatanName?: string;
  kodeJabatan?: string; direktorat?: string; kompartemen?: string; departemen?: string;
  purpose: string; responsibilities: Responsibility[]; dimensi?: string; authority?: string; relations?: string;
  qualifications: string; certifications: string; risks: string;
}
const emptyDesc: JobDesc = { purpose: "", responsibilities: [], qualifications: "", certifications: "", risks: "" };
const areaCls = "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const lblCls = "block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]";

// Old stored data may have responsibilities as a string — coerce to a list.
const respList = (d?: JobDesc): Responsibility[] => {
  const r = d?.responsibilities as unknown;
  if (Array.isArray(r)) return r as Responsibility[];
  if (typeof r === "string") return r.split("\n").map((s) => s.trim()).filter(Boolean).map((text) => ({ text, kpis: [] }));
  return [];
};

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
  const [busy, setBusy] = useState(false);
  const docxRef = useRef<HTMLInputElement>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);

  const showJabatan = (name: string, key: string) => {
    setEmp(null); setSel(matchJabatan(name)); setTitle(name); setDescKey(key); setEdit(false);
  };
  const pick = (e: Employee) => {
    const m = matchJabatan(e.position || "");
    setEmp(e); setSel(m); setTitle(m?.jabatan || e.position || ""); setDescKey(m?.key ?? norm(e.position || "")); setEdit(false); setNote(null);
  };

  // ---- .docx import (one or many) ----
  const onImportDocx = async (files: FileList) => {
    setNote(null); setBusy(true);
    const added: Record<string, JobDesc> = {};
    let ok = 0, matched = 0, failed = 0, lastKey = "", lastName = "";
    for (const file of Array.from(files)) {
      try {
        const p = await importJobProfile(file);
        if (!p.namaJabatan) { failed++; continue; }
        const m = matchJabatan(p.namaJabatan);
        const key = m?.key ?? norm(p.namaJabatan);
        const prev = descs[key];
        added[key] = {
          jabatanName: p.namaJabatan, kodeJabatan: p.kodeJabatan, direktorat: p.direktorat, kompartemen: p.kompartemen, departemen: p.departemen,
          purpose: p.purpose,
          responsibilities: p.responsibilities.split("\n").map((s) => s.trim()).filter(Boolean).map((text) => ({ text, kpis: [] })),
          dimensi: p.dimensi, authority: p.authority, relations: p.relations, qualifications: p.qualifications,
          certifications: prev?.certifications ?? "", risks: p.risks,
        };
        ok++; if (m) matched++; lastKey = key; lastName = p.namaJabatan;
      } catch { failed++; }
    }
    if (ok) { setDescs((mp) => ({ ...mp, ...added })); showJabatan(lastName, lastKey); }
    setNote(ok || failed ? [`${ok} ${t("job profiles imported")}`, `${matched} ${t("matched to competency profiles")}`, ...(failed ? [`${failed} ${t("failed")}`] : [])].join(" · ") : t("Could not read a job profile from this file."));
    setBusy(false); if (docxRef.current) docxRef.current.value = "";
  };

  // ---- KPI Excel import ----
  const onImportKpi = async (file: File) => {
    setNote(null); setBusy(true);
    try {
      const map = await parseKpiExcel(file);
      if (map.size === 0) { setNote(t("No KPI rows found. Use the template columns: Jabatan · Tanggung Jawab · KPI.")); setBusy(false); if (xlsxRef.current) xlsxRef.current.value = ""; return; }
      const upd: Record<string, JobDesc> = {}; let lastKey = "", lastName = "", nk = 0;
      for (const [jabatan, resps] of map) {
        const m = matchJabatan(jabatan); const key = m?.key ?? norm(jabatan);
        const prev = descs[key] ?? { ...emptyDesc };
        upd[key] = { ...prev, jabatanName: jabatan, responsibilities: resps };
        lastKey = key; lastName = jabatan; nk += resps.reduce((s, r) => s + r.kpis.length, 0);
      }
      setDescs((mp) => ({ ...mp, ...upd }));
      showJabatan(lastName, lastKey);
      setNote(`${map.size} ${t("jobs")} · ${nk} KPI ${t("imported")}`);
    } catch { setNote(t("Could not read the file. Make sure it is a valid .xlsx.")); }
    setBusy(false); if (xlsxRef.current) xlsxRef.current.value = "";
  };

  const doExportExcel = () => {
    if (!title) return;
    exportJobKpiExcel({ jabatan: title, kodeJabatan: desc.kodeJabatan, direktorat: desc.direktorat, kompartemen: desc.kompartemen, departemen: desc.departemen, responsibilities: resps });
  };

  const imported = useMemo(() => Object.entries(descs).filter(([, d]) => d.jabatanName).map(([key, d]) => ({ key, name: d.jabatanName! })).sort((a, b) => a.name.localeCompare(b.name)), [descs]);

  // KPIs already used in Planning / Mapping (matched by name) → marked "Terpakai".
  const [used, setUsed] = useState<Set<string>>(new Set());
  useEffect(() => {
    const refresh = () => setUsed(usedKpiNames());
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [descKey]);

  const desc = descKey ? (descs[descKey] ?? emptyDesc) : emptyDesc;
  const resps = respList(desc);
  const tech = useMemo(() => (sel ? resolveTech(sel) : []), [sel]);
  const totalKpi = resps.reduce((s, r) => s + r.kpis.length, 0);
  const usedKpi = resps.reduce((s, r) => s + r.kpis.filter((k) => isKpiUsed(used, k.name)).length, 0);

  const startEdit = () => { setDraft({ ...emptyDesc, ...desc, responsibilities: resps }); setEdit(true); };
  const save = () => { if (descKey) setDescs((m) => ({ ...m, [descKey]: draft })); setEdit(false); };
  const field = (label: string, key: "purpose" | "authority" | "relations" | "dimensi" | "qualifications" | "certifications" | "risks", rows = 3) => (
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
        subtitle="COMPASS · Informasi jabatan · Tanggung Jawab diterjemahkan menjadi KPI"
        actions={
          <>
            <input ref={docxRef} type="file" accept=".docx" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) onImportDocx(e.target.files); }} />
            <input ref={xlsxRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportKpi(f); }} />
            <Btn variant="ghost" onClick={() => docxRef.current?.click()}><Icon.document className="h-4 w-4" /> {busy ? t("Importing…") : t("Import .docx")}</Btn>
            <Btn variant="ghost" onClick={() => downloadKpiTemplate()}><Icon.document className="h-4 w-4" /> {t("KPI Template")}</Btn>
            <Btn variant="ghost" onClick={() => xlsxRef.current?.click()}><Icon.document className="h-4 w-4" /> {t("Import KPI (Excel)")}</Btn>
            <Btn variant="primary" onClick={doExportExcel}><Icon.document className="h-4 w-4" /> {t("Export Excel")}</Btn>
          </>
        }
      />

      {note && <div className="mb-4 rounded-xl border border-royal-500/30 bg-royal-500/10 px-4 py-2.5 text-[13px] text-royal-300">{note}</div>}

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block text-[11px] font-medium text-[var(--muted)]">
            {t("Find by employee")}
            <div className="mt-1"><EmployeeSearch onSelect={pick} /></div>
          </label>
          {imported.length > 0 && (
            <label className="block text-[11px] font-medium text-[var(--muted)]">
              {t("Imported job profiles")} ({imported.length})
              <select value={descKey && imported.some((i) => i.key === descKey) ? descKey : ""} onChange={(e) => { if (e.target.value) { const it = imported.find((i) => i.key === e.target.value); if (it) showJabatan(it.name, it.key); } }} className="mt-1 block w-64 rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
                <option value="">{t("— Select —")}</option>
                {imported.map((i) => (<option key={i.key} value={i.key}>{i.name}</option>))}
              </select>
            </label>
          )}
        </div>
        <p className="mt-2 text-[11px] text-[var(--muted)]">{t("Import PROFIL JABATAN (.docx) for the narrative, and the KPI Excel (from the template) to break each responsibility into KPIs.")}</p>
      </Card>

      {!title ? (
        <Card className="flex min-h-[160px] items-center justify-center text-center text-[13px] text-[var(--muted)]">
          {t("Search an employee, or import a job profile / KPI file.")}
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
            {(desc.purpose || edit) && <div className="mt-3">{field(t("Job Purpose"), "purpose", 3)}</div>}
          </Card>

          {/* Tanggung Jawab → KPI */}
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <div className={lblCls}>{t("Responsibilities")} → KPI</div>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--muted)] dark:bg-white/10">{resps.length} · {totalKpi} KPI</span>
              {usedKpi > 0 && <Badge tone="green">{usedKpi} {t("used")}</Badge>}
            </div>
            {resps.length === 0 ? (
              <p className="text-[13px] text-[var(--muted)]">{t("No responsibilities yet. Import the .docx and/or the KPI Excel template.")}</p>
            ) : (
              <div className="space-y-3">
                {resps.map((r, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="flex gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-royal-500/15 text-[11px] font-bold text-royal-400">{i + 1}</div>
                      <p className="flex-1 text-[13px] font-medium">{r.text}</p>
                    </div>
                    {r.kpis.length > 0 && (
                      <div className="mt-2 overflow-x-auto pl-8">
                        <table className="w-full text-[12px]">
                          <thead className="text-left text-[10px] uppercase tracking-wide text-[var(--muted)]">
                            <tr><th className="py-1 pr-2 font-medium">KPI</th><th className="py-1 pr-2 font-medium">{t("Unit")}</th><th className="py-1 pr-2 font-medium">Target</th><th className="py-1 pr-2 font-medium">{t("Weight")}</th><th className="py-1 pr-2 font-medium">{t("Perspective")}</th><th className="py-1 font-medium">{t("Status")}</th></tr>
                          </thead>
                          <tbody>
                            {r.kpis.map((k, j) => {
                              const inUse = isKpiUsed(used, k.name);
                              return (
                              <tr key={j} className="border-t">
                                <td className="py-1 pr-2">{k.name}</td>
                                <td className="py-1 pr-2 text-[var(--muted)]">{k.uom || "—"}</td>
                                <td className="py-1 pr-2 text-[var(--muted)]">{k.target || "—"}</td>
                                <td className="py-1 pr-2 text-[var(--muted)]">{k.weight ? `${k.weight}%` : "—"}</td>
                                <td className="py-1 pr-2"><span className="text-[var(--muted)]">{k.perspective || "—"}</span></td>
                                <td className="py-1">{inUse ? <Badge tone="green">✓ {t("Used")}</Badge> : <span className="text-[var(--muted)]">—</span>}</td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {r.kpis.length === 0 && <div className="mt-1 pl-8 text-[11px] text-[var(--muted)]">{t("No KPI yet — add via the KPI Excel template.")}</div>}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-[var(--muted)]">{t("These KPIs can be picked as KPI Items in Performance Planning.")}</p>
          </Card>

          {/* Other narrative fields */}
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
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
