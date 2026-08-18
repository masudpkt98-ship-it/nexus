"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, Avatar, ProgressBar, SectionTitle, BarChart, cn } from "@/components/ui";
import { levelTone } from "@/lib/compass";
import { Icon } from "@/components/Icons";
import { EmployeePicker } from "@/components/EmployeePicker";
import {
  technicalCompetencyLevels as seedLevels,
  type DictionaryCompetency,
  type CompetencyLevelDef,
  type CompetencyStandards,
  type CompetencyAssessments,
  type MatrixEmployee,
} from "@/lib/data";
import { competencyDictionarySeed as seedComps } from "@/lib/competencyDictionarySeed";
import { useLocalState } from "@/lib/useLocalState";
import {
  apiListCompetencyDictionary,
  apiListCompetencyLevels,
  apiGetCompetencyMatrix,
  apiSaveCompetencyStandard,
  apiSaveCompetencyAssessment,
  apiDeleteCompetencyAssessment,
} from "@/lib/api";
import { useApiAuthed } from "@/lib/auth";
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

type Tab = "Standar" | "Matriks" | "Rekap";

/** Readiness bands used by the distribution chart. */
const BANDS = [
  { label: "0–25%", min: 0, max: 25 },
  { label: "26–50%", min: 26, max: 50 },
  { label: "51–75%", min: 51, max: 75 },
  { label: "76–100%", min: 76, max: 100 },
];

export default function CompetencyMatrixPage() {
  const { t } = useI18n();
  const [comps, setComps] = useLocalState<DictionaryCompetency[]>("competency-dictionary", seedComps);
  const [levels, setLevels] = useLocalState<CompetencyLevelDef[]>("technical-competency-levels", seedLevels);
  const [standards, setStandards] = useLocalState<CompetencyStandards>("competency-standards", {});
  const [assessments, setAssessments] = useLocalState<CompetencyAssessments>("competency-assessments", {});
  const authed = useApiAuthed();

  // Standards and assessments are server-backed, and the catalogue they are keyed
  // against comes from the same Kamus the Dictionary page writes — so both are
  // pulled here rather than trusting whatever this browser happens to cache.
  useEffect(() => {
    if (!authed) return;
    let alive = true;
    apiListCompetencyDictionary().then((d) => { if (alive && d.length) setComps(d); }).catch(() => {});
    apiListCompetencyLevels().then((d) => { if (alive && d.length) setLevels(d); }).catch(() => {});
    apiGetCompetencyMatrix()
      .then((d) => {
        if (!alive) return;
        if (Object.keys(d.standards).length) setStandards(d.standards);
        if (Object.keys(d.assessments).length) setAssessments(d.assessments);
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);
  const mOnErr = (e: { status?: number }) =>
    alert(
      e?.status === 403
        ? "Ditolak server: hanya peran dengan competency.manage yang dapat mengubah matriks kompetensi."
        : "Gagal menyimpan ke server; perubahan tersimpan lokal saja."
    );

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
  const setRequired = (compId: string, level: number) => {
    setStandards((s) => ({ ...s, [activeGroup]: { ...(s[activeGroup] ?? {}), [compId]: level } }));
    if (authed) apiSaveCompetencyStandard(activeGroup, compId, level).catch(mOnErr);
  };

  // --- assessment ---
  // Each write sends the employee's whole level map: the server stores one row
  // per (group, employee), so a full-row upsert stays idempotent and two cells
  // edited in quick succession can't race each other.
  const addEmployee = (name: string, npk?: string) => {
    const nm = name.trim();
    if (!nm) return;
    const id = npk || nm;
    if (groupEmps.some((e) => e.npk === id)) return setAddName(""); // no duplicates
    const emp: MatrixEmployee = { npk: id, name: nm, levels: {} };
    setAssessments((a) => {
      const list = a[activeGroup] ?? [];
      if (list.some((e) => e.npk === id)) return a;
      return { ...a, [activeGroup]: [...list, emp] };
    });
    if (authed) apiSaveCompetencyAssessment(activeGroup, emp).catch(mOnErr);
    setAddName("");
  };
  const removeEmployee = (npk: string) => {
    setAssessments((a) => ({ ...a, [activeGroup]: (a[activeGroup] ?? []).filter((e) => e.npk !== npk) }));
    if (authed) apiDeleteCompetencyAssessment(activeGroup, npk).catch(mOnErr);
  };
  const setActual = (npk: string, compId: string, level: number) => {
    const emp = groupEmps.find((e) => e.npk === npk);
    setAssessments((a) => ({
      ...a,
      [activeGroup]: (a[activeGroup] ?? []).map((e) => (e.npk === npk ? { ...e, levels: { ...e.levels, [compId]: level } } : e)),
    }));
    if (authed && emp) apiSaveCompetencyAssessment(activeGroup, { ...emp, levels: { ...emp.levels, [compId]: level } }).catch(mOnErr);
  };

  // readiness = % of standard-bearing competencies where actual >= required
  const readiness = (e: MatrixEmployee) => {
    const req = groupComps.filter((c) => (groupStd[c.id] ?? 0) > 0);
    if (req.length === 0) return null;
    const met = req.filter((c) => (e.levels[c.id] ?? 0) >= groupStd[c.id]).length;
    return Math.round((met / req.length) * 100);
  };

  const stdCount = groupComps.filter((c) => (groupStd[c.id] ?? 0) > 0).length;

  // --- Rekap: everything below is derived from the standards and assessments
  // already on screen. No new storage — this is the same data, aggregated.
  const rekap = useMemo(() => {
    const stdComps = groupComps.filter((c) => (groupStd[c.id] ?? 0) > 0);

    // Per competency: who falls short of its standard, and by how much.
    const perComp = stdComps.map((c) => {
      const required = groupStd[c.id];
      const assessed = groupEmps.filter((e) => (e.levels[c.id] ?? 0) > 0);
      const below = assessed.filter((e) => e.levels[c.id] < required);
      const unassessed = groupEmps.length - assessed.length;
      const totalGap = below.reduce((s, e) => s + (required - e.levels[c.id]), 0);
      return {
        comp: c,
        required,
        assessedCount: assessed.length,
        belowCount: below.length,
        unassessed,
        totalGap,
        avgGap: below.length ? Math.round((totalGap / below.length) * 10) / 10 : 0,
        // Share of assessed people meeting the standard; null when nobody is assessed.
        metPct: assessed.length ? Math.round(((assessed.length - below.length) / assessed.length) * 100) : null,
      };
    });

    // Biggest problems first: most people short, then deepest shortfall.
    const ranked = [...perComp].sort((a, b) => b.belowCount - a.belowCount || b.totalGap - a.totalGap);

    // Someone with no level recorded against any standard-bearing competency has
    // not really been assessed, however many rows exist for them.
    const notAssessed = groupEmps.filter((e) => stdComps.every((c) => (e.levels[c.id] ?? 0) === 0));

    const readinessValues = groupEmps.map((e) => readiness(e)).filter((r): r is number => r !== null);
    const avgReadiness = readinessValues.length
      ? Math.round(readinessValues.reduce((s, r) => s + r, 0) / readinessValues.length)
      : null;

    const distribution = BANDS.map((b) => ({
      label: b.label,
      a: readinessValues.filter((r) => r >= b.min && r <= b.max).length,
    }));

    return {
      stdComps,
      ranked,
      notAssessed,
      avgReadiness,
      distribution,
      totalGap: perComp.reduce((s, p) => s + p.totalGap, 0),
      // Cells still to fill in: assessed people × standard competencies, minus what is filled.
      openCells: stdComps.length * groupEmps.length - groupEmps.reduce((s, e) => s + stdComps.filter((c) => (e.levels[c.id] ?? 0) > 0).length, 0),
    };
  }, [groupComps, groupStd, groupEmps]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Average readiness per group, so the worst-off Job Family is visible at a glance. */
  const familySummary = useMemo(() => {
    return groups
      .map((g) => {
        const gComps = comps.filter((c) => groupOf(c) === g);
        const std = standards[g] ?? {};
        const emps = assessments[g] ?? [];
        const stdList = gComps.filter((c) => (std[c.id] ?? 0) > 0);
        if (stdList.length === 0 || emps.length === 0) return { group: g, readiness: null, gap: 0, emps: emps.length };
        const gap = emps.reduce(
          (s, e) => s + stdList.reduce((t, c) => t + Math.max(0, std[c.id] - (e.levels[c.id] ?? 0)), 0),
          0
        );
        const met = emps.reduce((s, e) => s + stdList.filter((c) => (e.levels[c.id] ?? 0) >= std[c.id]).length, 0);
        return { group: g, readiness: Math.round((met / (stdList.length * emps.length)) * 100), gap, emps: emps.length };
      })
      .sort((a, b) => (a.readiness ?? 101) - (b.readiness ?? 101));
  }, [groups, comps, standards, assessments]);

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
              {(["Standar", "Matriks", "Rekap"] as Tab[]).map((v) => (
                <button key={v} onClick={() => setTab(v)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition", tab === v ? "bg-royal-500 text-white" : "text-[var(--muted)] hover:text-[var(--text)]")}>
                  {v === "Standar" ? t("Standard") : v === "Matriks" ? t("Assessment Matrix") : t("Rekap Gap")}
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

          {/* ---- Rekap: where the gaps actually are ---- */}
          {tab === "Rekap" && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card>
                  <div className="text-xs text-[var(--muted)]">{t("Rata-rata Readiness")}</div>
                  <div className="mt-1 text-2xl font-bold gold-gradient">{rekap.avgReadiness === null ? "—" : `${rekap.avgReadiness}%`}</div>
                  {rekap.avgReadiness !== null && <ProgressBar value={rekap.avgReadiness} tone="gold" className="mt-2" />}
                </Card>
                <Card>
                  <div className="text-xs text-[var(--muted)]">{t("Total Gap")}</div>
                  <div className="mt-1 text-2xl font-bold text-rose-400">{rekap.totalGap}</div>
                  <div className="mt-1 text-[11px] text-[var(--muted)]">{t("level di bawah standar")}</div>
                </Card>
                <Card>
                  <div className="text-xs text-[var(--muted)]">{t("Belum Dinilai")}</div>
                  <div className="mt-1 text-2xl font-bold">{rekap.notAssessed.length}</div>
                  <div className="mt-1 text-[11px] text-[var(--muted)]">{t("dari")} {groupEmps.length} {t("orang")}</div>
                </Card>
                <Card>
                  <div className="text-xs text-[var(--muted)]">{t("Penilaian Kosong")}</div>
                  <div className="mt-1 text-2xl font-bold">{rekap.openCells}</div>
                  <div className="mt-1 text-[11px] text-[var(--muted)]">{t("sel belum diisi")}</div>
                </Card>
              </div>

              {rekap.stdComps.length === 0 ? (
                <Card className="flex min-h-[160px] items-center justify-center text-center text-[13px] text-[var(--muted)]">
                  {t("Belum ada standar untuk grup ini — tetapkan di tab Standard lebih dulu.")}
                </Card>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="glass card overflow-hidden lg:col-span-2">
                    <div className="border-b px-4 py-3">
                      <div className="text-sm font-semibold">{t("Kompetensi dengan gap terbesar")}</div>
                      <div className="text-[11px] text-[var(--muted)]">{t("Diurutkan dari yang paling banyak orang di bawah standar")}</div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b text-left text-xs text-[var(--muted)]">
                          <tr>
                            <th className="px-4 py-2.5 font-medium">{t("Competency")}</th>
                            <th className="px-3 py-2.5 text-center font-medium">{t("Req")}</th>
                            <th className="px-3 py-2.5 text-center font-medium">{t("Di bawah")}</th>
                            <th className="px-3 py-2.5 text-center font-medium">{t("Rata gap")}</th>
                            <th className="px-4 py-2.5 font-medium">{t("Memenuhi")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rekap.ranked.map((r) => (
                            <tr key={r.comp.id} className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <Badge tone="blue">{r.comp.code}</Badge>
                                  <span className="text-[13px]">{r.comp.name}</span>
                                </div>
                                {r.unassessed > 0 && (
                                  <div className="mt-0.5 text-[10px] text-amber-500">{r.unassessed} {t("belum dinilai")}</div>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center"><Badge tone={levelTone(r.required)}>L{r.required}</Badge></td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={cn("font-semibold", r.belowCount === 0 ? "text-emerald-500" : "text-rose-400")}>{r.belowCount}</span>
                                <span className="text-[11px] text-[var(--muted)]">/{r.assessedCount}</span>
                              </td>
                              <td className="px-3 py-2.5 text-center text-[13px]">{r.avgGap || "—"}</td>
                              <td className="px-4 py-2.5">
                                {r.metPct === null ? (
                                  <span className="text-[11px] text-[var(--muted)]">{t("belum dinilai")}</span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="w-9 text-[12px] font-semibold">{r.metPct}%</span>
                                    <div className="w-20"><ProgressBar value={r.metPct} tone={r.metPct >= 80 ? "green" : r.metPct >= 50 ? "gold" : "red"} /></div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card>
                      <SectionTitle title="Sebaran Readiness" subtitle={`${groupEmps.length} ${t("orang dinilai")}`} />
                      <div className="mt-3"><BarChart data={rekap.distribution} height={140} /></div>
                    </Card>

                    {rekap.notAssessed.length > 0 && (
                      <Card>
                        <SectionTitle title="Belum Dinilai" subtitle={t("Tidak punya satu pun level tercatat")} />
                        <div className="mt-2 space-y-1.5">
                          {rekap.notAssessed.slice(0, 8).map((e) => (
                            <div key={e.npk} className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5">
                              <Avatar initials={initials(e.name)} />
                              <span className="truncate text-[12px]">{e.name}</span>
                              <span className="ml-auto shrink-0 text-[10px] text-[var(--muted)]">{e.npk}</span>
                            </div>
                          ))}
                          {rekap.notAssessed.length > 8 && (
                            <div className="text-[11px] text-[var(--muted)]">+{rekap.notAssessed.length - 8} {t("lainnya")}</div>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Which Job Family needs attention first. */}
              <Card className="mt-4">
                <SectionTitle title="Perbandingan Job Family" subtitle={t("Diurutkan dari readiness terendah")} />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b text-left text-xs text-[var(--muted)]">
                      <tr>
                        <th className="px-3 py-2 font-medium">{t("Job Family")}</th>
                        <th className="px-3 py-2 text-center font-medium">{t("Dinilai")}</th>
                        <th className="px-3 py-2 text-center font-medium">{t("Total Gap")}</th>
                        <th className="px-3 py-2 font-medium">{t("Readiness")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {familySummary.map((f) => (
                        <tr
                          key={f.group}
                          onClick={() => setGroup(f.group)}
                          className={cn("cursor-pointer border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5", f.group === activeGroup && "bg-royal-500/5")}
                        >
                          <td className="px-3 py-2 text-[13px]">{f.group}</td>
                          <td className="px-3 py-2 text-center text-[13px]">{f.emps}</td>
                          <td className="px-3 py-2 text-center text-[13px]">{f.gap || "—"}</td>
                          <td className="px-3 py-2">
                            {f.readiness === null ? (
                              <span className="text-[11px] text-[var(--muted)]">{t("belum ada standar/penilaian")}</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="w-9 text-[12px] font-semibold">{f.readiness}%</span>
                                <div className="w-24"><ProgressBar value={f.readiness} tone={f.readiness >= 80 ? "green" : f.readiness >= 50 ? "gold" : "red"} /></div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}
