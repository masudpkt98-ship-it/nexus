"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { employees as employeeSeed, type Employee } from "@/lib/data";
import { EXCLUSION_KEY, type Exclusions, isNik9 } from "@/lib/kpiEligibility";
import { useAuth, scopeAllows, scopeLabel } from "@/lib/auth";
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
import { buildProgress, metricStatuses } from "@/lib/perfProgress";
import { ProgressUnitView } from "@/components/progress/ProgressUnitView";
import { ProgressIndividuView } from "@/components/progress/ProgressIndividuView";
import { type IndividuPerson } from "@/components/progress/IndividuStatusCard";
import { PIN_KEY, type PinMap, provisionAll, getPin } from "@/lib/progressPins";
import { type MetricKey, type MetricStatus } from "@/lib/perfProgress";
import { apiPublishProgress } from "@/lib/api";

const KINDS: DatasetKind[] = ["planning", "appraisal", "coaching"];
const YEARS = [2024, 2025, 2026, 2027];
const GRAN_RANK: Record<Gran, number> = { Tahunan: 0, Semesteran: 1, Triwulanan: 2, Bulanan: 3 };
const fmt = (n: number) => n.toLocaleString("id-ID");
const pct = (n: number) => `${n.toFixed(0)}%`;
const nowISO = () => new Date().toISOString();

type View = "unit" | "individu" | "data";

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
function computeViews(snap: Snapshot, exclusions: Exclusions, allow: (dir: string, unit: string) => boolean) {
  const period: Period = { gran: snap.gran, value: snap.value };
  const excl = exclusions ?? {};
  const wajib: WajibEmp[] = [];
  const validNiks = new Set<string>();
  let poolSize = 0;
  for (const e of snap.directory) {
    const n = String(e.npk ?? "").trim();
    if (!n || isNik9(n)) continue;
    if (!allow(String(e.directorate ?? "").trim(), String(e.unit ?? "").trim())) continue; // RBAC scope
    poolSize++;
    if (excl[n]) continue;
    validNiks.add(n);
    wajib.push({
      npk: n,
      directorate: String(e.directorate ?? "").trim(),
      compartment: String(e.compartment ?? "").trim(),
      unit: String(e.unit ?? "").trim(),
    });
  }
  const excluded = poolSize - validNiks.size;
  const inDir = (kind: DatasetKind, rows: Row[]) => rows.filter((r) => validNiks.has(nikOf(kind, r)));
  const cPlanning = snap.planning ? inDir("planning", cleanRows("planning", snap.planning)) : [];
  const cAppraisal = snap.appraisal ? inDir("appraisal", cleanRows("appraisal", snap.appraisal)) : [];
  const cCoaching = snap.coaching ? inDir("coaching", cleanRows("coaching", snap.coaching)) : [];
  const pIdx = buildIndex("planning", cPlanning);
  const aIdx = buildIndex("appraisal", cAppraisal);
  const cIdx = buildIndex("coaching", cCoaching);
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

  const [directory] = useLocalState<Employee[]>("employees", employeeSeed);
  const [liveExclusions] = useLocalState<Exclusions>(EXCLUSION_KEY, {});
  const [pins, setPins] = useLocalState<PinMap>(PIN_KEY, {});
  const { session } = useAuth();
  const isAdmin = session.role === "Admin";
  const allow = useMemo(() => (dir: string, unit: string) => scopeAllows(session, dir, unit), [session]);
  const [index, setIndex] = useLocalState<SnapshotMeta[]>("perf-snapshot-index", []);

  const [view, setView] = useState<View>("unit");
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

  // A non-admin must never land on the admin Data tab.
  useEffect(() => { if (view === "data" && !isAdmin) setView("unit"); }, [view, isAdmin]);

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
      const frozenDir = existing?.directory ?? directory;
      const base: Snapshot = existing ?? {
        id, year, gran, value, label: labelOf(year, gran, value),
        importedAt: nowISO(), directoryCount: 0,
        directory: frozenDir, exclusions: liveExclusions, planning: null, appraisal: null, coaching: null,
        datasets: {}, summary: { population: 0, excluded: 0, planningPct: 0, appraisalPct: 0, coachingPct: 0 },
      };
      base[kind] = rows;
      base.importedAt = nowISO();

      const views = computeViews(base, liveExclusions, allow);
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
    const views = computeViews(base, liveExclusions, allow);
    base.summary = summaryOf(views);
    await putSnapshot(base);
    setIndex((prev) => [...prev.filter((m) => m.id !== id), metaOf(base)]);
    setSnap(base);
  };

  const views = useMemo(() => (snap ? computeViews(snap, liveExclusions, allow) : null), [snap, liveExclusions, allow]);
  const orgRows = useMemo(() => (views ? byOrg(views.wajib, views.pIdx, views.aIdx, views.period, orgLevel) : []), [views, orgLevel]);
  const progress = useMemo(() => (views ? buildProgress(views.wajib, views.pIdx, views.aIdx, views.period) : null), [views]);

  // People for Progress Individu (frozen Directory, restricted to the wajib set /
  // the session scope). Names/positions come from the frozen Directory.
  const people = useMemo<IndividuPerson[]>(() => {
    if (!snap || !views) return [];
    return snap.directory
      .filter((e) => views.validNiks.has(String(e.npk ?? "").trim()))
      .map((e) => ({
        npk: String(e.npk ?? "").trim(),
        name: String(e.name ?? "").trim() || "—",
        position: String(e.position ?? "").trim(),
        unit: String(e.unit ?? "").trim(),
        directorate: String(e.directorate ?? "").trim(),
        compartment: String(e.compartment ?? "").trim(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [snap, views]);

  const statusFor = useMemo(
    () => (npk: string) => metricStatuses(views?.pIdx.get(npk), views?.aIdx.get(npk), views?.period ?? { gran, value }),
    [views, gran, value]
  );

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

  const hasData = !!(snap && (snap.planning || snap.appraisal || snap.coaching));
  const sortedIndex = useMemo(
    () => [...index].sort((a, b) => a.year - b.year || GRAN_RANK[a.gran] - GRAN_RANK[b.gran] || a.value - b.value),
    [index]
  );
  const periodText = labelOf(year, gran, value);
  const scopeNote = !session.scope.all ? scopeLabel(session) : undefined;

  const TABS: { key: View; label: string; icon: keyof typeof Icon; show: boolean }[] = [
    { key: "unit", label: "Progress Unit", icon: "users", show: true },
    { key: "individu", label: "Progress Individu", icon: "target", show: true },
    { key: "data", label: "Data & Riwayat", icon: "dashboard", show: isAdmin },
  ];

  return (
    <>
      {/* ---- Premium hero ---- */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-royal-700 via-royal-600 to-gold-600 px-6 py-6 text-white shadow-glow">
        <Rosette className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 opacity-15" />
        <Rosette className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 opacity-10" />
        <div className="relative">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">Bagian Manajemen Kompetensi &amp; Kinerja Dept. MPSDM</div>
          <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">Performance Management</h1>
          <div className="text-[13px] font-medium text-white/80">Monitoring Board</div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {TABS.filter((tb) => tb.show).map((tb) => {
              const IconCmp = Icon[tb.icon];
              const active = view === tb.key;
              return (
                <button
                  key={tb.key}
                  onClick={() => setView(tb.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition",
                    active ? "bg-white text-royal-700 shadow-lg" : "bg-white/15 text-white hover:bg-white/25"
                  )}
                >
                  <IconCmp className="h-4 w-4" /> {tb.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-[11px] text-white/70">
            {snap ? <>Updated: {new Date(snap.importedAt).toLocaleString("id-ID")} · </> : null}
            Periode: <span className="font-semibold text-white">{periodText}</span>
            {scopeNote && <> · Scope: <span className="font-semibold text-white">{scopeNote}</span></>}
          </div>
        </div>
      </div>

      {/* ---- Period bar (drives every view) ---- */}
      <Card className="mt-4">
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
          {isAdmin && (
            <div className="ml-auto flex items-center gap-2">
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); }} />
              <Btn variant="primary" onClick={() => fileRef.current?.click()}>
                <Icon.plus className="h-4 w-4" /> {busy ? t("Importing…") : t("Import Database")}
              </Btn>
            </div>
          )}
        </div>
      </Card>

      {note && <div className="mt-4 rounded-lg border border-royal-500/30 bg-royal-500/5 px-3 py-2 text-[13px]">{note}</div>}

      {loading && <Card className="mt-4 text-center text-[13px] text-[var(--muted)]">{t("Loading…")}</Card>}

      {/* ---- No data ---- */}
      {!loading && !hasData && view !== "data" && (
        <Card className="mt-4 text-center">
          <Icon.dashboard className="mx-auto h-10 w-10 text-[var(--muted)]" />
          <p className="mt-2 text-[14px] font-medium">Belum ada data untuk {periodText}</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] text-[var(--muted)]">
            {isAdmin ? "Gunakan “Import Database” untuk memuat export Planning, Appraisal, dan Coaching ke periode ini." : "Data periode ini belum diimpor oleh admin."}
          </p>
        </Card>
      )}

      {/* ---- Progress Unit (all roles) ---- */}
      {!loading && hasData && view === "unit" && progress && (
        <div className="mt-4">
          <ProgressUnitView model={progress} periodText={periodText} />
        </div>
      )}

      {/* ---- Progress Individu (Atasan / KPI Partner / Admin — scoped) ---- */}
      {!loading && hasData && view === "individu" && (
        <div className="mt-4">
          <div className="mb-4 rounded-lg border border-royal-500/25 bg-royal-500/5 px-3 py-2 text-[12px] text-[var(--muted)]">
            <Icon.alert className="mr-1 inline h-3.5 w-3.5 text-royal-400" />
            Karyawan dapat membuka progress-nya sendiri tanpa login di halaman <span className="font-semibold text-[var(--text)]">/progress</span> (NPK + PIN).
          </div>
          <ProgressIndividuView people={people} statusFor={statusFor} scopeNote={scopeNote} />
        </div>
      )}

      {/* ---- Data & Riwayat (Admin) ---- */}
      {view === "data" && isAdmin && (
        <div className="mt-4 space-y-4">
          <PinManager people={people} pins={pins} setPins={setPins} statusFor={statusFor} period={{ id, year, gran, value, label: periodText }} />

          {/* Import status */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {KINDS.map((kind) => {
              const dm = snap?.datasets[kind];
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

          {/* Frozen Directory banner */}
          <div className={cn("flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-[12px]", snap ? "border-royal-500/25 bg-royal-500/5" : "border-amber-500/30 bg-amber-500/5")}>
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

          {!hasData && (
            <Card className="text-center">
              <Icon.dashboard className="mx-auto h-10 w-10 text-[var(--muted)]" />
              <p className="mt-2 text-[14px] font-medium">{t("No snapshot for")} {periodText}</p>
              <p className="mx-auto mt-1 max-w-md text-[12px] text-[var(--muted)]">
                {t("Use “Import Database” to load the Planning, Appraisal, and Coaching exports into this period. It freezes the current Employee Directory and never changes other periods.")}
              </p>
            </Card>
          )}

          {hasData && views && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 md:grid-cols-2">
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
                      </div>
                    </>
                  ) : <Empty t={t} />}
                </Card>
                <Card>
                  <SectionTitle title="Form STAR" subtitle="Situation · Task · Action · Result" />
                  <Empty t={t} label={t("Import a STAR export to monitor it here.")} />
                </Card>
              </div>

              {(snap!.planning || snap!.appraisal) && (
                <Card>
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

              <AuditTable snap={snap!} validNiks={views.validNiks} />
            </>
          )}

          {sortedIndex.length > 0 && (
            <Card>
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
        </div>
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

// A subtle batik-style rosette used in the hero (pure SVG).
function Rosette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="1">
      {Array.from({ length: 12 }).map((_, i) => (
        <ellipse key={i} cx="50" cy="50" rx="12" ry="46" transform={`rotate(${i * 15} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="10" />
    </svg>
  );
}

// ---- PIN manager: provision employee self-service access ----------------------
function PinManager({ people, pins, setPins, statusFor, period }: {
  people: IndividuPerson[];
  pins: PinMap;
  setPins: React.Dispatch<React.SetStateAction<PinMap>>;
  statusFor: (npk: string) => Record<MetricKey, MetricStatus>;
  period: { id: string; year: number; gran: Gran; value: number; label: string };
}) {
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [pubMsg, setPubMsg] = useState<string | null>(null);
  const provisioned = people.filter((p) => pins[p.npk]).length;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const match = people.find((p) => q.trim() && `${p.name} ${p.npk}`.toLowerCase().includes(q.trim().toLowerCase()));

  const provision = () => setPins((prev) => provisionAll(prev, people.map((p) => p.npk)));

  // Full self-service link WITH the PIN embedded (for the QR / bulk export).
  const linkFor = (npk: string) => `${origin}/progress?npk=${encodeURIComponent(npk)}&pin=${encodeURIComponent(getPin(pins, npk) ?? "")}`;

  // Export NPK · Nama · Unit · Direktorat · PIN · Link to Excel for bulk hand-out.
  const exportList = async () => {
    const XLSX = await import("xlsx");
    const rows = people.map((p) => ({
      NPK: p.npk, Nama: p.name, "Unit Kerja": p.unit, Direktorat: p.directorate,
      PIN: getPin(pins, p.npk) ?? "", "Link Akses (berisi PIN)": getPin(pins, p.npk) ? linkFor(p.npk) : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 28 }, { wch: 30 }, { wch: 24 }, { wch: 8 }, { wch: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Akses Progress");
    XLSX.writeFile(wb, "Akses-Progress-Karyawan.xlsx");
  };

  // Push this period's per-employee progress + PINs to the Laravel backend so
  // employees can open /progress from any device (not just this browser).
  const publish = async () => {
    setPublishing(true);
    setPubMsg(null);
    try {
      const records = people.map((p) => ({
        npk: p.npk, name: p.name, position: p.position, unit: p.unit,
        directorate: p.directorate, compartment: p.compartment, metrics: statusFor(p.npk),
      }));
      const res = await apiPublishProgress({ period, records, pins });
      setPubMsg(`Terpublikasi: ${fmt(res.records)} progress · ${fmt(res.pins)} PIN → ${period.label}. Karyawan dapat akses lintas perangkat.`);
    } catch (e) {
      const msg = (e as { status?: number })?.status === 401
        ? "Harus login API sebagai admin dulu (halaman Login) untuk mempublikasikan."
        : "Gagal publish — pastikan server API (nexus-api) berjalan di :8000.";
      setPubMsg(msg);
    } finally {
      setPublishing(false);
    }
  };
  const copyLink = (npk: string) => {
    navigator.clipboard?.writeText(linkFor(npk)).then(() => { setCopied(npk); setTimeout(() => setCopied(""), 1500); }).catch(() => {});
  };

  return (
    <Card>
      <SectionTitle title="Akses Karyawan (Progress Individu)" subtitle="Provision NPK + PIN untuk akses mandiri tanpa login di /progress" />
      <div className="flex flex-wrap items-center gap-2">
        <Btn variant="primary" onClick={provision}><Icon.spark className="h-4 w-4" /> Generate PIN untuk semua</Btn>
        <Badge tone="green">{fmt(provisioned)} / {fmt(people.length)} ter-provision</Badge>
        <Btn variant="ghost" onClick={publish}><Icon.check className="h-4 w-4" /> {publishing ? "Mempublikasikan…" : "Publish ke server (lintas perangkat)"}</Btn>
        <Btn variant="ghost" onClick={exportList}><Icon.document className="h-4 w-4" /> Export daftar (Excel)</Btn>
      </div>
      {pubMsg && <div className="mt-2 rounded-lg border border-royal-500/30 bg-royal-500/5 px-3 py-2 text-[12px]">{pubMsg}</div>}
      <div className="relative mt-3">
        <Icon.search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari karyawan untuk melihat PIN & link akses…" className="w-full rounded-xl border bg-[rgb(var(--surface))] py-2 pl-10 pr-3 text-[13px] outline-none focus:border-royal-500" />
      </div>
      {match && (
        <div className="mt-2 flex flex-wrap items-center gap-4 rounded-xl border bg-[rgb(var(--surface))] px-3 py-3">
          {getPin(pins, match.npk) && <QrImage text={linkFor(match.npk)} size={128} />}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold">{match.name}</div>
            <div className="truncate text-[11px] text-[var(--muted)]">{match.npk} · {match.unit}</div>
            <div className="mt-2 flex items-center gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">PIN</div>
                <div className="font-mono text-[20px] font-bold tabular-nums gold-gradient">{getPin(pins, match.npk) ?? "— (generate dulu)"}</div>
              </div>
              <Btn variant="ghost" onClick={() => copyLink(match.npk)}>
                <Icon.check className={cn("h-4 w-4", copied === match.npk ? "text-emerald-500" : "")} /> {copied === match.npk ? "Tersalin" : "Salin link (+PIN)"}
              </Btn>
            </div>
            <div className="mt-1.5 text-[10px] text-[var(--muted)]">Karyawan cukup scan QR — NPK &amp; PIN terisi otomatis di HP.</div>
          </div>
        </div>
      )}
      <p className="mt-2 text-[11px] text-[var(--muted)]">Link &amp; QR memuat PIN. Untuk akses lintas perangkat (HP), klik <span className="font-medium text-[var(--text)]">Publish ke server</span> dulu. Export/QR hanya dibuat lokal (tidak diunggah).</p>
    </Card>
  );
}

// ---- QR image (self-contained; qrcode lib loaded on demand) -------------------
function QrImage({ text, size = 128 }: { text: string; size?: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let live = true;
    import("qrcode").then((Q) => Q.toDataURL(text, { margin: 1, width: size * 2, errorCorrectionLevel: "M" }))
      .then((u) => { if (live) setUrl(u); }).catch(() => {});
    return () => { live = false; };
  }, [text, size]);
  return url
    ? <img src={url} width={size} height={size} alt="QR akses" className="shrink-0 rounded-lg bg-white p-1.5" />
    : <div style={{ width: size, height: size }} className="shrink-0 animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />;
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
    <Card>
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
