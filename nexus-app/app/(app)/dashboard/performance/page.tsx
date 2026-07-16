"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { employees as employeeSeed, type Employee } from "@/lib/data";
import { EXCLUSION_KEY, type Exclusions, isNik9 } from "@/lib/kpiEligibility";
import {
  type Row,
  type DatasetKind,
  type Period,
  type Gran,
  KIND_LABEL,
  GRANS,
  ROMAN,
  MONTHS,
  detectKind,
  cleanRows,
  nikOf,
  buildIndex,
  periodLabel,
  planningStats,
  appraisalStats,
  coachingStats,
  byOrg,
  ORG_LEVELS,
  type WajibEmp,
  type OrgLevel,
} from "@/lib/perfMonitor";
import {
  type Snapshot,
  type SnapshotMeta,
  periodId,
  getSnapshot,
  putSnapshot,
  deleteSnapshot,
} from "@/lib/snapshotStore";

const KINDS: DatasetKind[] = ["planning", "appraisal", "coaching"];
const YEARS = [2024, 2025, 2026, 2027];
const GRAN_RANK: Record<Gran, number> = { Tahunan: 0, Semesteran: 1, Triwulanan: 2, Bulanan: 3 };
const fmt = (n: number) => n.toLocaleString("id-ID");
const pct = (n: number) => `${n.toFixed(0)}%`;
const nowISO = () => new Date().toISOString();

const statusTone = (s: string): "green" | "amber" | "red" | "blue" | "gray" => {
  const x = s.toLowerCase();
  if (x.includes("approv")) return "green";
  if (x.includes("wait") || x.includes("submit")) return "amber";
  if (x.includes("draft")) return "blue";
  if (x.includes("belum")) return "red";
  return "gray";
};

const valuesFor = (g: Gran) =>
  g === "Tahunan" ? [0] : g === "Semesteran" ? [1, 2] : g === "Triwulanan" ? [1, 2, 3, 4] : Array.from({ length: 12 }, (_, i) => i + 1);
const valueLabel = (g: Gran, v: number) =>
  g === "Triwulanan" ? `Triwulan ${ROMAN[v - 1]}` : g === "Semesteran" ? `Semester ${v}` : g === "Bulanan" ? MONTHS[v - 1] : "Tahunan";
const labelOf = (year: number, gran: Gran, value: number) => `${year} · ${periodLabel({ gran, value })}`;

// ---- Compile a snapshot's frozen data into monitoring views --------------------
// Wajib KPI = frozen Directory − NIK 9 − employees excluded (frozen exclusions).
function computeViews(snap: Snapshot, exclusions: Exclusions) {
  const period: Period = { gran: snap.gran, value: snap.value };
  const excl = exclusions ?? {};
  // Wajib-KPI employee set from the frozen Directory (NIK 9 + exclusions removed).
  const wajib: WajibEmp[] = [];
  const validNiks = new Set<string>();
  let poolSize = 0;
  for (const e of snap.directory) {
    const n = String(e.npk ?? "").trim();
    if (!n || isNik9(n)) continue;
    poolSize++; // eligible pool (NIK 9 already out)
    if (excl[n]) continue; // excluded from Wajib KPI
    validNiks.add(n);
    wajib.push({
      npk: n,
      directorate: String(e.directorate ?? "").trim(),
      compartment: String(e.compartment ?? "").trim(),
      unit: String(e.unit ?? "").trim(),
    });
  }
  const excluded = poolSize - validNiks.size;
  // Clean each dataset (rules) → restrict to Wajib set → index by NIK.
  const inDir = (kind: DatasetKind, rows: Row[]) => rows.filter((r) => validNiks.has(nikOf(kind, r)));
  const cPlanning = snap.planning ? inDir("planning", cleanRows("planning", snap.planning)) : [];
  const cAppraisal = snap.appraisal ? inDir("appraisal", cleanRows("appraisal", snap.appraisal)) : [];
  const cCoaching = snap.coaching ? inDir("coaching", cleanRows("coaching", snap.coaching)) : [];
  const pIdx = buildIndex("planning", cPlanning);
  const aIdx = buildIndex("appraisal", cAppraisal);
  const cIdx = buildIndex("coaching", cCoaching);
  // All metrics use the Wajib-KPI base as the denominator.
  const pStats = planningStats(wajib, pIdx);
  const aStats = appraisalStats(wajib, aIdx, period);
  const cStats = coachingStats(wajib, cIdx);
  const population = wajib.length || 1;
  const coachingCoverage = cStats.coverage;
  return { validNiks, cPlanning, cAppraisal, cCoaching, pStats, aStats, cStats, wajib, pIdx, aIdx, period, population, coachingCoverage, poolSize, excluded };
}

const metaOf = (s: Snapshot): SnapshotMeta => ({
  id: s.id, year: s.year, gran: s.gran, value: s.value, label: s.label,
  importedAt: s.importedAt, directoryCount: s.directoryCount, datasets: s.datasets, summary: s.summary,
});

export default function PerformanceDashboardPage() {
  const { t } = useI18n();

  // Live Directory + exclusions (frozen into a snapshot on import / sync).
  const [directory] = useLocalState<Employee[]>("employees", employeeSeed);
  const [liveExclusions] = useLocalState<Exclusions>(EXCLUSION_KEY, {});
  // Lightweight index of all period snapshots (heavy rows live in IndexedDB).
  const [index, setIndex] = useLocalState<SnapshotMeta[]>("perf-snapshot-index", []);

  const [year, setYear] = useState(2026);
  const [gran, setGran] = useState<Gran>("Triwulanan");
  const [value, setValue] = useState(1);
  const [orgLevel, setOrgLevel] = useState<OrgLevel>("Direktorat");
  const id = periodId(year, gran, value);

  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load the selected period's frozen snapshot.
  useEffect(() => {
    let live = true;
    setLoading(true);
    getSnapshot(id).then((s) => { if (live) { setSnap(s); setLoading(false); } }).catch(() => { if (live) { setSnap(null); setLoading(false); } });
    return () => { live = false; };
  }, [id]);

  const liveDirCount = useMemo(
    () => directory.filter((e) => { const n = String(e.npk ?? "").trim(); return n && !n.startsWith("9"); }).length,
    [directory]
  );

  // ---- Import a file into the SELECTED period's snapshot (freeze directory) ----
  const onImport = async (file: File) => {
    setBusy(true);
    setNote(null);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      let kind: DatasetKind | null = null;
      let rows: Row[] = [];
      let sheetName = "";
      for (const sheet of wb.SheetNames) {
        const r = XLSX.utils.sheet_to_json<Row>(wb.Sheets[sheet], { defval: "" });
        if (!r.length) continue;
        const k = detectKind(Object.keys(r[0]));
        if (k) { kind = k; rows = r; sheetName = sheet; break; }
      }
      if (!kind) { setNote(t("Unrecognized file. Expected a Planning, Appraisal, or Coaching export.")); return; }

      const existing = await getSnapshot(id);
      // Freeze the CURRENT Directory + exclusions only when the snapshot is created.
      const frozenDir = existing?.directory ?? directory;
      const base: Snapshot = existing ?? {
        id, year, gran, value, label: labelOf(year, gran, value),
        importedAt: nowISO(), directoryCount: 0,
        directory: frozenDir, exclusions: liveExclusions, planning: null, appraisal: null, coaching: null,
        datasets: {}, summary: { population: 0, excluded: 0, planningPct: 0, appraisalPct: 0, coachingPct: 0 },
      };
      base[kind] = rows;
      base.importedAt = nowISO();

      const views = computeViews(base, liveExclusions);
      const counted = kind === "planning" ? views.cPlanning.length : kind === "appraisal" ? views.cAppraisal.length : views.cCoaching.length;
      base.datasets = { ...base.datasets, [kind]: { fileName: file.name, sheet: sheetName, rows: rows.length, counted, importedAt: nowISO() } };
      base.directoryCount = views.poolSize;
      base.summary = {
        population: views.population,
        excluded: views.excluded,
        planningPct: views.pStats.pctIndividuApproved,
        appraisalPct: views.aStats.pctApproved,
        coachingPct: views.coachingCoverage,
      };

      await putSnapshot(base);
      setIndex((prev) => [...prev.filter((m) => m.id !== id), metaOf(base)]);
      setSnap(base);
      setNote(`${t("Imported")} “${file.name}” → ${t(KIND_LABEL[kind])} · ${base.label}`);
    } catch {
      setNote(t("Could not read the file. Make sure it is a valid .xlsx."));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeSnapshot = async (sid: string) => {
    if (!confirm(t("Delete this period snapshot? Its history will be removed."))) return;
    await deleteSnapshot(sid);
    setIndex((prev) => prev.filter((m) => m.id !== sid));
    if (sid === id) setSnap(null);
  };

  const summaryOf = (v: ReturnType<typeof computeViews>) => ({
    population: v.population, excluded: v.excluded,
    planningPct: v.pStats.pctIndividuApproved, appraisalPct: v.aStats.pctApproved, coachingPct: v.coachingCoverage,
  });

  const clearDataset = async (kind: DatasetKind) => {
    if (!snap) return;
    const base: Snapshot = { ...snap, [kind]: null, datasets: { ...snap.datasets } };
    delete base.datasets[kind];
    const views = computeViews(base, liveExclusions);
    base.summary = summaryOf(views);
    await putSnapshot(base);
    setIndex((prev) => [...prev.filter((m) => m.id !== id), metaOf(base)]);
    setSnap(base);
  };

  const views = useMemo(() => (snap ? computeViews(snap, liveExclusions) : null), [snap, liveExclusions]);
  const orgRows = useMemo(() => (views ? byOrg(views.wajib, views.pIdx, views.aIdx, views.period, orgLevel) : []), [views, orgLevel]);

  // Live exclusions always apply. Persist them into the viewed period's snapshot
  // (and its History summary) whenever they diverge — so the whole dashboard,
  // including History, reflects the current KPI Eligibility with no manual step.
  useEffect(() => {
    if (!snap || !views) return;
    const s = snap.summary;
    const exKeys = Object.keys(liveExclusions);
    const sameExcl = snap.exclusions && Object.keys(snap.exclusions).length === exKeys.length && exKeys.every((k) => snap.exclusions[k]);
    if (sameExcl && s.population === views.population && s.excluded === views.excluded) return;
    const base: Snapshot = { ...snap, exclusions: liveExclusions, directoryCount: views.poolSize, summary: summaryOf(views) };
    putSnapshot(base).then(() => {
      setIndex((prev) => [...prev.filter((m) => m.id !== id), metaOf(base)]);
      setSnap(base);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, views, liveExclusions, id]);
  const hasData = snap && (snap.planning || snap.appraisal || snap.coaching);
  const sortedIndex = useMemo(
    () => [...index].sort((a, b) => a.year - b.year || GRAN_RANK[a.gran] - GRAN_RANK[b.gran] || a.value - b.value),
    [index]
  );

  return (
    <>
      <PageHeader
        title="Performance Dashboard"
        subtitle="Monitoring Performance Cycle — per-period snapshots (history preserved)"
        actions={
          <>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); }} />
            <Btn variant="primary" onClick={() => fileRef.current?.click()}>
              <Icon.plus className="h-4 w-4" /> {busy ? t("Importing…") : t("Import Database")}
            </Btn>
          </>
        }
      />

      {/* ---- Period selector (chooses which frozen snapshot to view / import into) ---- */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{t("Period")}</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex flex-wrap gap-1.5">
            {GRANS.map((g) => (
              <button key={g} onClick={() => { setGran(g); setValue(g === "Tahunan" ? 0 : 1); }}
                className={cn("rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition", gran === g ? "bg-gradient-to-r from-royal-500 to-royal-700 text-white shadow-glow" : "glass hover:bg-black/5 dark:hover:bg-white/5")}>
                {t(g)}
              </button>
            ))}
          </div>
          {gran !== "Tahunan" && (
            <select value={value} onChange={(e) => setValue(Number(e.target.value))} className="rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
              {valuesFor(gran).map((v) => <option key={v} value={v}>{valueLabel(gran, v)}</option>)}
            </select>
          )}
          <Badge tone="blue">{t("Viewing")}: {labelOf(year, gran, value)}</Badge>
          <span className="ml-auto text-[11px] text-[var(--muted)]">{t("Import goes to")}: <span className="font-medium text-[var(--text)]">{labelOf(year, gran, value)}</span></span>
        </div>
      </Card>

      {note && <div className="mt-4 rounded-lg border border-royal-500/30 bg-royal-500/5 px-3 py-2 text-[13px]">{note}</div>}

      {/* ---- Import status for the selected period ---- */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {KINDS.map((kind) => {
          const dm = snap?.datasets[kind];
          // "counted" is LIVE (Wajib-KPI base), not the frozen import-time number.
          const liveCounted = views ? (kind === "planning" ? views.cPlanning.length : kind === "appraisal" ? views.cAppraisal.length : views.cCoaching.length) : dm?.counted ?? 0;
          return (
            <Card key={kind} className="group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold">{t(KIND_LABEL[kind])}</div>
                  <div className="mt-0.5 truncate text-[11px] text-[var(--muted)]" title={dm?.fileName}>{dm ? dm.fileName : t("Not imported yet")}</div>
                </div>
                {dm ? <Badge tone="green">{t("Loaded")}</Badge> : <Badge tone="gray">{t("Empty")}</Badge>}
              </div>
              {dm && (
                <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted)]">
                  <span>{fmt(liveCounted)} {t("counted (Wajib KPI)")} · {fmt(dm.rows)} {t("in file")}</span>
                  <button onClick={() => clearDataset(kind)} className="opacity-0 transition hover:text-rose-400 group-hover:opacity-100">{t("Clear")}</button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ---- Frozen Directory + Wajib KPI banner ---- */}
      <div className={cn("mt-3 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-[12px]", snap ? "border-royal-500/25 bg-royal-500/5" : "border-amber-500/30 bg-amber-500/5")}>
        <Icon.users className="h-4 w-4 text-royal-400" />
        {snap ? (
          <>
            <span className="font-medium">{t("Frozen Directory")}</span>
            <span className="text-[var(--muted)]">— {fmt(views?.poolSize ?? snap.directoryCount)} {t("employees (NIK 9 excluded)")}</span>
            <Badge tone="green">{t("Total Wajib KPI")}: {fmt(views?.population ?? snap.summary?.population ?? 0)}</Badge>
            <Badge tone="amber">{t("Excluded")}: {fmt(views?.excluded ?? snap.summary?.excluded ?? 0)}</Badge>
            <span className="text-[var(--muted)]">· {t("captured")} {new Date(snap.importedAt).toLocaleDateString("id-ID")}</span>
          </>
        ) : (
          <span className="text-[var(--muted)]">{t("On first import this period will freeze the current Directory")} ({fmt(liveDirCount)} {t("employees")}).</span>
        )}
      </div>

      {loading && <Card className="mt-4 text-center text-[13px] text-[var(--muted)]">{t("Loading…")}</Card>}

      {!loading && !hasData && (
        <Card className="mt-4 text-center">
          <Icon.dashboard className="mx-auto h-10 w-10 text-[var(--muted)]" />
          <p className="mt-2 text-[14px] font-medium">{t("No snapshot for")} {labelOf(year, gran, value)}</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] text-[var(--muted)]">
            {t("Use “Import Database” to load the Planning, Appraisal, and Coaching exports into this period. It freezes the current Employee Directory and never changes other periods.")}
          </p>
          <p className="mt-2 text-[11px] text-[var(--muted)]">{t("Rule: NIK starting with 9 is excluded; duplicate NIK + Nama is counted once; source is the Employee Directory.")}</p>
        </Card>
      )}

      {!loading && hasData && views && (
        <>
          {/* ---- Stage cards ---- */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4 md:grid-cols-2">
            <Card>
              <SectionTitle title="Performance Planning" subtitle="KPI Individu · KPI Unit" />
              {snap!.planning ? (
                <>
                  <div className="text-3xl font-bold gold-gradient">{pct(views.pStats.pctIndividuApproved)}</div>
                  <div className="text-[11px] text-[var(--muted)]">{t("KPI Individu Approved")}</div>
                  <ProgressBar value={views.pStats.pctIndividuApproved} tone="gold" className="mt-2" />
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.entries(views.pStats.individu).map(([s, n]) => <Badge key={s} tone={statusTone(s)}>{t(s)} {fmt(n)}</Badge>)}
                  </div>
                  <div className="mt-3 border-t pt-2 text-[11px] text-[var(--muted)]">{t("KPI Unit")}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {Object.entries(views.pStats.unit).map(([s, n]) => <Badge key={s} tone={statusTone(s)}>{t(s)} {fmt(n)}</Badge>)}
                  </div>
                </>
              ) : <Empty t={t} />}
            </Card>

            <Card>
              <SectionTitle title="Performance Appraisal" subtitle={periodLabel({ gran, value })} />
              {snap!.appraisal ? (
                <>
                  <div className="text-3xl font-bold gold-gradient">{pct(views.aStats.pctApproved)}</div>
                  <div className="text-[11px] text-[var(--muted)]">{t("Approved")} · {t("Avg score")} {views.aStats.avgScore.toFixed(1)}</div>
                  <ProgressBar value={views.aStats.pctApproved} tone="gold" className="mt-2" />
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone="green">{t("Approved")} {fmt(views.aStats.approved)}</Badge>
                    <Badge tone="amber">{t("Waiting")} {fmt(views.aStats.waiting)}</Badge>
                    <Badge tone="red">{t("Not submitted")} {fmt(views.aStats.notSubmitted)}</Badge>
                  </div>
                </>
              ) : <Empty t={t} />}
            </Card>

            <Card>
              <SectionTitle title="Performance Coaching" subtitle="Coverage & sessions" />
              {snap!.coaching ? (
                <>
                  <div className="text-3xl font-bold gold-gradient">{pct(views.coachingCoverage)}</div>
                  <div className="text-[11px] text-[var(--muted)]">{t("Employees coached")}</div>
                  <ProgressBar value={views.coachingCoverage} tone="gold" className="mt-2" />
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone="green">{fmt(views.cStats.employees)} {t("coached")}</Badge>
                    <Badge tone="blue">{fmt(views.cStats.totalSessions)} {t("sessions")}</Badge>
                    <Badge tone="gold">{t("Avg")} {views.cStats.avgPresentase.toFixed(0)}%</Badge>
                  </div>
                </>
              ) : <Empty t={t} />}
            </Card>

            <Card>
              <SectionTitle title="Form STAR" subtitle="Situation · Task · Action · Result" />
              <Empty t={t} label={t("Import a STAR export to monitor it here.")} />
            </Card>
          </div>

          {/* ---- Org breakdown (Direktorat / Kompartemen / Departemen / Unit Kerja) ---- */}
          {(snap!.planning || snap!.appraisal) && (
            <Card className="mt-4">
              <SectionTitle
                title="Breakdown"
                subtitle={`Planning · Appraisal approval — Wajib KPI base · ${periodLabel({ gran, value })}`}
                action={
                  <div className="flex gap-1">
                    {ORG_LEVELS.map((lv) => (
                      <button key={lv} onClick={() => setOrgLevel(lv)}
                        className={cn("rounded-lg px-2.5 py-1 text-[12px] font-medium transition", orgLevel === lv ? "bg-royal-500/15 text-royal-400" : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/5")}>
                        {t(lv)}
                      </button>
                    ))}
                  </div>
                }
              />
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-[560px] text-[12.5px]">
                  <thead>
                    <tr className="border-b text-left text-[11px] uppercase tracking-wider text-[var(--muted)]">
                      <th className="sticky top-0 bg-[rgb(var(--surface))] py-2 pr-2">{t(orgLevel)}</th>
                      <th className="sticky top-0 bg-[rgb(var(--surface))] px-2 text-right">{t("Wajib")}</th>
                      <th className="sticky top-0 bg-[rgb(var(--surface))] px-2 text-right">{t("Planning")}</th>
                      <th className="sticky top-0 bg-[rgb(var(--surface))] px-2 text-right">{t("Appraisal")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgRows.map((d) => {
                      const pp = d.planningTotal ? (d.planningApproved / d.planningTotal) * 100 : 0;
                      const ap = d.appraisalTotal ? (d.appraisalApproved / d.appraisalTotal) * 100 : 0;
                      return (
                        <tr key={d.key} className="border-b last:border-0">
                          <td className="py-2 pr-2">{d.key}</td>
                          <td className="px-2 text-right tabular-nums text-[var(--muted)]">{fmt(d.planningTotal)}</td>
                          <td className="px-2"><div className="flex items-center justify-end gap-2"><span className="tabular-nums text-[var(--muted)]">{fmt(d.planningApproved)}/{fmt(d.planningTotal)}</span><div className="w-20"><ProgressBar value={pp} tone="gold" /></div><span className="w-9 text-right tabular-nums">{pct(pp)}</span></div></td>
                          <td className="px-2"><div className="flex items-center justify-end gap-2"><span className="tabular-nums text-[var(--muted)]">{fmt(d.appraisalApproved)}/{fmt(d.appraisalTotal)}</span><div className="w-20"><ProgressBar value={ap} tone="blue" /></div><span className="w-9 text-right tabular-nums">{pct(ap)}</span></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ---- Audit ---- */}
          <AuditTable snap={snap!} validNiks={views.validNiks} />
        </>
      )}

      {/* ---- History / trend across all period snapshots ---- */}
      {sortedIndex.length > 0 && (
        <Card className="mt-4">
          <SectionTitle title="History & Trend" subtitle="Every frozen period — immutable, audit-ready" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[12.5px]">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  <th className="py-2 pr-2">{t("Period")}</th>
                  <th className="px-2 text-right">{t("Employees")}</th>
                  <th className="px-2 text-right">{t("Planning")}</th>
                  <th className="px-2 text-right">{t("Appraisal")}</th>
                  <th className="px-2 text-right">{t("Coaching")}</th>
                  <th className="px-2 text-right">{t("Imported")}</th>
                  <th className="px-2"></th>
                </tr>
              </thead>
              <tbody>
                {sortedIndex.map((m) => {
                  const active = m.id === id;
                  return (
                    <tr key={m.id} className={cn("group border-b last:border-0", active && "bg-royal-500/5")}>
                      <td className="py-2 pr-2">
                        <button onClick={() => { setYear(m.year); setGran(m.gran); setValue(m.value); }} className={cn("font-medium hover:text-royal-400", active && "text-royal-400")}>{m.label}</button>
                      </td>
                      <td className="px-2 text-right tabular-nums">{fmt(m.directoryCount)}</td>
                      <td className="px-2 text-right tabular-nums">{m.datasets.planning ? pct(m.summary.planningPct) : "—"}</td>
                      <td className="px-2 text-right tabular-nums">{m.datasets.appraisal ? pct(m.summary.appraisalPct) : "—"}</td>
                      <td className="px-2 text-right tabular-nums">{m.datasets.coaching ? pct(m.summary.coachingPct) : "—"}</td>
                      <td className="px-2 text-right text-[var(--muted)]">{new Date(m.importedAt).toLocaleDateString("id-ID")}</td>
                      <td className="px-2 text-right"><button onClick={() => removeSnapshot(m.id)} className="text-[11px] text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100">{t("Delete")}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

function Empty({ t, label }: { t: (k: string) => string; label?: string }) {
  return (
    <div className="flex h-full min-h-[120px] flex-col items-center justify-center text-center">
      <Icon.alert className="h-6 w-6 text-[var(--muted)]" />
      <p className="mt-1.5 text-[12px] text-[var(--muted)]">{label ?? t("Not imported yet")}</p>
    </div>
  );
}

// ---- Audit table — every counted row, all raw columns, searchable + paginated --
const PAGE_SIZE = 20;
function AuditTable({ snap, validNiks }: { snap: Snapshot; validNiks: Set<string> }) {
  const { t } = useI18n();
  const available = KINDS.filter((k) => snap[k]);
  const [tab, setTab] = useState<DatasetKind>(available[0] ?? "planning");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const active = snap[tab] ? tab : available[0];
  const rowsRaw = active ? (snap[active] as Row[] | null) : null;

  const rows = useMemo(
    () => (rowsRaw && active ? cleanRows(active, rowsRaw).filter((r) => validNiks.has(nikOf(active, r))) : []),
    [rowsRaw, active, validNiks]
  );
  const needle = q.trim().toLowerCase();
  const filtered = useMemo(() => (needle ? rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(needle))) : rows), [rows, needle]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pageCount - 1);
  const shown = filtered.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE);
  const cols = active && snap.datasets[active] ? Object.keys((snap[active] as Row[])[0] ?? {}) : [];

  if (!available.length || !active) return null;

  return (
    <Card className="mt-4">
      <SectionTitle title="Audit Records" subtitle="Every counted row · searchable across all columns" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {available.map((k) => (
            <button key={k} onClick={() => { setTab(k); setPage(0); }} className={cn("rounded-lg px-3 py-1.5 text-[12px] font-medium transition", active === k ? "bg-royal-500/15 text-royal-400" : "glass hover:bg-black/5 dark:hover:bg-white/5")}>
              {t(KIND_LABEL[k])}
            </button>
          ))}
        </div>
        <div className="relative ml-auto min-w-[200px] flex-1">
          <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder={t("Search all fields…")} className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500" />
        </div>
        <span className="text-[11px] text-[var(--muted)]">{fmt(filtered.length)} {t("records")}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="border-b text-left uppercase tracking-wider text-[10px] text-[var(--muted)]">
              {cols.map((c) => <th key={c} className="whitespace-nowrap px-2 py-2">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                {cols.map((c) => <td key={c} className="whitespace-nowrap px-2 py-1.5">{String(r[c] ?? "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px] text-[var(--muted)]">
        <span>{t("Page")} {cur + 1} / {pageCount}</span>
        <div className="flex gap-1.5">
          <Btn variant="ghost" onClick={() => setPage((p) => Math.max(0, p - 1))}>{t("Prev")}</Btn>
          <Btn variant="ghost" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>{t("Next")}</Btn>
        </div>
      </div>
    </Card>
  );
}
