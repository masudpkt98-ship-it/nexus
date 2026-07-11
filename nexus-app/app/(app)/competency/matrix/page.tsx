"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, Avatar, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeePicker } from "@/components/EmployeePicker";
import {
  technicalCompetencies as seedComps,
  technicalCompetencyLevels as seedLevels,
  type DictionaryCompetency,
  type CompetencyLevelDef,
  type CompetencyStandards,
  type CompetencyAssessments,
  type MatrixEmployee,
} from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?";
// A competency's group: its Job Family, else its category (so ungrouped competencies stay reachable).
const groupOf = (c: DictionaryCompetency) => c.jobFamilyName || c.category;

// Gap colour: how the actual level compares to the required standard.
function gapTone(actual: number, required: number): { cls: string; label: string } {
  if (!required) return { cls: "bg-black/5 dark:bg-white/10 text-[var(--muted)]", label: "no-standard" };
  if (!actual) return { cls: "bg-rose-500/15 text-rose-400", label: "unassessed" };
  const gap = actual - required;
  if (gap >= 0) return { cls: "bg-emerald-500/20 text-emerald-500", label: "meets" };
  if (gap === -1) return { cls: "bg-amber-500/20 text-amber-500", label: "near" };
  return { cls: "bg-rose-500/20 text-rose-500", label: "below" };
}

type Tab = "Standar" | "Matriks";

export default function CompetencyMatrixPage() {
  const { t } = useI18n();
  const [comps] = useLocalState<DictionaryCompetency[]>("technical-competencies", seedComps);
  const [levels] = useLocalState<CompetencyLevelDef[]>("technical-competency-levels", seedLevels);
  const [standards, setStandards] = useLocalState<CompetencyStandards>("competency-standards", {});
  const [assessments, setAssessments] = useLocalState<CompetencyAssessments>("competency-assessments", {});

  const groups = useMemo(() => Array.from(new Set(comps.map(groupOf))).sort(), [comps]);
  const [group, setGroup] = useState<string>("");
  const activeGroup = group || groups[0] || "";
  const [tab, setTab] = useState<Tab>("Standar");
  const [addName, setAddName] = useState("");

  const maxLevel = levels.length || 5;
  const groupComps = useMemo(() => comps.filter((c) => groupOf(c) === activeGroup), [comps, activeGroup]);
  const groupStd = standards[activeGroup] ?? {};
  const groupEmps = assessments[activeGroup] ?? [];

  // --- standards ---
  const setRequired = (compId: string, level: number) =>
    setStandards((s) => ({ ...s, [activeGroup]: { ...(s[activeGroup] ?? {}), [compId]: level } }));

  // --- assessment ---
  const addEmployee = (name: string, npk?: string) => {
    const nm = name.trim();
    if (!nm) return;
    const id = npk || nm;
    setAssessments((a) => {
      const list = a[activeGroup] ?? [];
      if (list.some((e) => e.npk === id)) return a; // no duplicates
      const emp: MatrixEmployee = { npk: id, name: nm, levels: {} };
      return { ...a, [activeGroup]: [...list, emp] };
    });
    setAddName("");
  };
  const removeEmployee = (npk: string) =>
    setAssessments((a) => ({ ...a, [activeGroup]: (a[activeGroup] ?? []).filter((e) => e.npk !== npk) }));
  const setActual = (npk: string, compId: string, level: number) =>
    setAssessments((a) => ({
      ...a,
      [activeGroup]: (a[activeGroup] ?? []).map((e) => (e.npk === npk ? { ...e, levels: { ...e.levels, [compId]: level } } : e)),
    }));

  // readiness = % of standard-bearing competencies where actual >= required
  const readiness = (e: MatrixEmployee) => {
    const req = groupComps.filter((c) => (groupStd[c.id] ?? 0) > 0);
    if (req.length === 0) return null;
    const met = req.filter((c) => (e.levels[c.id] ?? 0) >= groupStd[c.id]).length;
    return Math.round((met / req.length) * 100);
  };

  const stdCount = groupComps.filter((c) => (groupStd[c.id] ?? 0) > 0).length;

  // --- export the active group to a .xlsx (Standar / Penilaian / Gap sheets) ---
  const onExport = async () => {
    const XLSX = await import("xlsx");
    const codeHead = groupComps.map((c) => (groupStd[c.id] ? `${c.code} (${t("req")} ${groupStd[c.id]})` : c.code));

    const stdAoa: (string | number)[][] = [[t("Code"), t("Competency"), t("Function"), t("Required level"), t("Name")]];
    groupComps.forEach((c) => stdAoa.push([c.code, c.name, c.functionName ?? "", groupStd[c.id] ?? "", groupStd[c.id] ? levels.find((l) => l.level === groupStd[c.id])?.name ?? "" : ""]));

    const assessAoa: (string | number)[][] = [["NPK", t("Name"), ...codeHead, t("Ready") + " %"]];
    groupEmps.forEach((e) => {
      const r = readiness(e);
      assessAoa.push([e.npk, e.name, ...groupComps.map((c) => e.levels[c.id] ?? ""), r === null ? "" : r]);
    });

    const gapAoa: (string | number)[][] = [["NPK", t("Name"), ...groupComps.map((c) => c.code)]];
    groupEmps.forEach((e) => {
      gapAoa.push([e.npk, e.name, ...groupComps.map((c) => {
        const req = groupStd[c.id] ?? 0;
        const act = e.levels[c.id] ?? 0;
        return req && act ? act - req : "";
      })]);
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(stdAoa), "Standar");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(assessAoa), "Penilaian");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gapAoa), "Gap");
    const safe = (activeGroup || "matrix").replace(/[^\w]+/g, "-").slice(0, 24);
    XLSX.writeFile(wb, `nexus-competency-matrix-${safe}.xlsx`);
  };

  const LevelSelect = ({ value, onChange, none }: { value: number; onChange: (v: number) => void; none: string }) => (
    <select value={value || 0} onChange={(e) => onChange(Number(e.target.value))} className="rounded-md border bg-[rgb(var(--surface))] px-1.5 py-1 text-[12px] text-[var(--text)] outline-none focus:border-royal-500">
      <option value={0}>{none}</option>
      {Array.from({ length: maxLevel }, (_, i) => i + 1).map((n) => (<option key={n} value={n}>{n}</option>))}
    </select>
  );

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader
        title="Competency Matrix"
        subtitle="Manajemen Kompetensi · Standar & Penilaian Kompetensi"
        actions={groupComps.length > 0 ? <Btn variant="ghost" onClick={onExport}><Icon.document className="h-4 w-4" /> {t("Export Excel")}</Btn> : undefined}
      />

      {comps.length === 0 || groups.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Icon.competency className="h-10 w-10 text-royal-400" />
          <p className="mt-4 text-sm font-medium">{t("No competencies yet.")}</p>
          <p className="mt-1 max-w-md text-xs text-[var(--muted)]">{t("Add or import competencies in Kamus Kompetensi first, then build the matrix here.")}</p>
          <Link href="/competency/dictionary" className="mt-4 text-[13px] font-medium text-royal-400 hover:underline">{t("Go to Kamus Kompetensi")}</Link>
        </Card>
      ) : (
        <>
          {/* group selector + tabs */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
              {t("Group")}
              <select value={activeGroup} onChange={(e) => setGroup(e.target.value)} className="rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
                {groups.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </label>
            <span className="text-[12px] text-[var(--muted)]">{groupComps.length} {t("competencies")} · {stdCount} {t("with standard")} · {groupEmps.length} {t("assessed")}</span>
            <div className="ml-auto flex rounded-xl glass p-0.5">
              {(["Standar", "Matriks"] as Tab[]).map((v) => (
                <button key={v} onClick={() => setTab(v)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition", tab === v ? "bg-royal-500 text-white" : "text-[var(--muted)] hover:text-[var(--text)]")}>
                  {v === "Standar" ? t("Standard") : t("Assessment Matrix")}
                </button>
              ))}
            </div>
          </div>

          {/* ---- Standard: required level per competency ---- */}
          {tab === "Standar" && (
            <div className="glass card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-xs text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">{t("Code")}</th>
                      <th className="px-4 py-3 font-medium">{t("Competency")}</th>
                      <th className="px-4 py-3 font-medium">{t("Required level")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupComps.map((c) => (
                      <tr key={c.id} dir="auto" className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="px-4 py-3"><Badge tone="blue">{c.code}</Badge></td>
                        <td className="px-4 py-3"><div className="font-medium">{c.name}</div>{c.functionName && <div className="text-[11px] text-[var(--muted)]">{c.functionName}</div>}</td>
                        <td className="px-4 py-3">
                          <LevelSelect value={groupStd[c.id] ?? 0} onChange={(v) => setRequired(c.id, v)} none={t("— none")} />
                          {groupStd[c.id] ? <span className="ml-2 text-[11px] text-[var(--muted)]">{levels.find((l) => l.level === groupStd[c.id])?.name}</span> : null}
                        </td>
                      </tr>
                    ))}
                    {groupComps.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">{t("No competencies in this group.")}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---- Assessment Matrix: employees × competencies ---- */}
          {tab === "Matriks" && (
            <>
              <Card className="mb-4 flex flex-wrap items-end gap-3">
                <label className="min-w-[240px] flex-1">
                  <div className="text-[11px] font-medium text-[var(--muted)]">{t("Add employee to matrix")}</div>
                  <EmployeePicker value={addName} onChange={setAddName} className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500" />
                </label>
                <Btn variant="primary" onClick={() => addEmployee(addName)}><Icon.plus className="h-4 w-4" /> {t("Add")}</Btn>
                <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500/30" /> {t("Meets")}</span>
                  <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-500/30" /> {t("1 below")}</span>
                  <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rose-500/30" /> {t("Gap")}</span>
                </div>
              </Card>

              {groupEmps.length === 0 ? (
                <Card className="py-10 text-center text-[13px] text-[var(--muted)]">{t("No employees added yet. Add one above to start assessing.")}</Card>
              ) : (
                <div className="glass card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="text-sm">
                      <thead className="border-b text-xs text-[var(--muted)]">
                        <tr>
                          <th className="sticky left-0 z-10 min-w-[180px] bg-[rgb(var(--surface))] px-3 py-2 text-left font-medium">{t("Employee")}</th>
                          {groupComps.map((c) => (
                            <th key={c.id} className="px-2 py-2 text-center font-medium" title={`${c.name}${groupStd[c.id] ? ` · ${t("req")} ${groupStd[c.id]}` : ""}`}>
                              <div>{c.code}</div>
                              {groupStd[c.id] ? <div className="text-[9px] font-normal text-royal-400">{t("req")} {groupStd[c.id]}</div> : <div className="text-[9px] font-normal opacity-40">—</div>}
                            </th>
                          ))}
                          <th className="px-3 py-2 text-center font-medium">{t("Ready")}</th>
                          <th className="px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {groupEmps.map((e) => {
                          const r = readiness(e);
                          return (
                            <tr key={e.npk} className="group border-b last:border-0">
                              <td className="sticky left-0 z-10 bg-[rgb(var(--surface))] px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Avatar initials={initials(e.name)} />
                                  <div className="min-w-0"><div className="truncate text-[13px] font-medium">{e.name}</div><div className="text-[10px] text-[var(--muted)]">{e.npk}</div></div>
                                </div>
                              </td>
                              {groupComps.map((c) => {
                                const actual = e.levels[c.id] ?? 0;
                                const req = groupStd[c.id] ?? 0;
                                const tone = gapTone(actual, req);
                                return (
                                  <td key={c.id} className="px-1 py-1 text-center">
                                    <select
                                      value={actual}
                                      onChange={(ev) => setActual(e.npk, c.id, Number(ev.target.value))}
                                      className={cn("w-11 rounded-md border-0 px-1 py-1 text-center text-[12px] font-semibold outline-none", tone.cls)}
                                      title={req ? `${t("req")} ${req} · ${actual ? `${t("gap")} ${actual - req}` : t("unassessed")}` : t("no standard")}
                                    >
                                      <option value={0}>–</option>
                                      {Array.from({ length: maxLevel }, (_, i) => i + 1).map((n) => (<option key={n} value={n}>{n}</option>))}
                                    </select>
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2 text-center">{r === null ? <span className="text-[11px] text-[var(--muted)]">—</span> : <Badge tone={r >= 100 ? "green" : r >= 60 ? "amber" : "red"}>{r}%</Badge>}</td>
                              <td className="px-2 py-2 text-center">
                                <button onClick={() => removeEmployee(e.npk)} title={t("Delete")} className="text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100">✕</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
