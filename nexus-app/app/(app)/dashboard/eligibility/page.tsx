"use client";

import React, { useMemo, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { employees as employeeSeed, type Employee } from "@/lib/data";
import { EXCLUSION_KEY, EXCLUSION_REASONS, type Exclusions, isNik9, reasonCounts } from "@/lib/kpiEligibility";
import { useAuth, scopeAllows } from "@/lib/auth";

const fmt = (n: number) => n.toLocaleString("id-ID");
const nowISO = () => new Date().toISOString();
const selCls = "rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500";

const uniq = (rows: Employee[], key: keyof Employee) =>
  [...new Set(rows.map((e) => String(e[key] ?? "").trim()).filter(Boolean))].sort();

export default function EligibilityPage() {
  const { t } = useI18n();
  const [directory] = useLocalState<Employee[]>("employees", employeeSeed);
  const [exclusions, setExclusions] = useLocalState<Exclusions>(EXCLUSION_KEY, {});
  const { session } = useAuth();

  // Eligible pool = Directory minus NIK-9, within the session's unit-kerja scope.
  const pool = useMemo(
    () => directory.filter((e) => !isNik9(e.npk) && scopeAllows(session, e.directorate, e.unit)),
    [directory, session]
  );

  const [q, setQ] = useState("");
  const [fDir, setFDir] = useState("");
  const [fUnit, setFUnit] = useState("");
  const [fGrade, setFGrade] = useState("");
  const [fGender, setFGender] = useState("");
  const [fSF, setFSF] = useState("");
  const [fStream, setFStream] = useState("");
  const [fStatus, setFStatus] = useState<"" | "wajib" | "excluded">("");
  const [bulkReason, setBulkReason] = useState<string>(EXCLUSION_REASONS[0]);

  const isExcluded = (npk: string) => !!exclusions[npk];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return pool.filter((e) => {
      if (fDir && e.directorate !== fDir) return false;
      if (fUnit && e.unit !== fUnit) return false;
      if (fGrade && e.pg !== fGrade) return false;
      if (fGender && e.gender !== fGender) return false;
      if (fSF && e.sf !== fSF) return false;
      if (fStream && e.stream !== fStream) return false;
      if (fStatus === "wajib" && isExcluded(e.npk)) return false;
      if (fStatus === "excluded" && !isExcluded(e.npk)) return false;
      if (needle && !`${e.name} ${e.npk} ${e.position} ${e.unit}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [pool, q, fDir, fUnit, fGrade, fGender, fSF, fStream, fStatus, exclusions]);

  const excludedInPool = useMemo(() => pool.filter((e) => isExcluded(e.npk)).map((e) => e.npk), [pool, exclusions]);
  const reasonBreak = useMemo(() => reasonCounts(exclusions, excludedInPool), [exclusions, excludedInPool]);
  const wajib = pool.length - excludedInPool.length;

  // ---- exclusion mutations ----
  const exclude = (npk: string, reason: string, note?: string) =>
    setExclusions((prev) => ({ ...prev, [npk]: { reason, note, at: nowISO() } }));
  const include = (npk: string) =>
    setExclusions((prev) => { const n = { ...prev }; delete n[npk]; return n; });
  const setReason = (npk: string, reason: string) =>
    setExclusions((prev) => (prev[npk] ? { ...prev, [npk]: { ...prev[npk], reason } } : prev));
  const bulkExclude = () =>
    setExclusions((prev) => {
      const n = { ...prev };
      for (const e of filtered) if (!n[e.npk]) n[e.npk] = { reason: bulkReason, at: nowISO() };
      return n;
    });
  const bulkInclude = () =>
    setExclusions((prev) => {
      const n = { ...prev };
      for (const e of filtered) delete n[e.npk];
      return n;
    });

  const resetPage = () => {}; // all rows shown (no pagination)

  const genderLabel = (g: string) => (g === "L" ? t("Male") : g === "P" ? t("Female") : g || "—");

  return (
    <>
      <PageHeader
        title="KPI Eligibility"
        subtitle="Wajib KPI — mark employees excluded from the KPI obligation (manual, with reason)"
      />

      {/* ---- Summary ---- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><div className="text-xs text-[var(--muted)]">{t("Total (NIK 9 excluded)")}</div><div className="mt-1 text-2xl font-bold">{fmt(pool.length)}</div></Card>
        <Card><div className="text-xs text-[var(--muted)]">{t("Total Wajib KPI")}</div><div className="mt-1 text-2xl font-bold text-emerald-500">{fmt(wajib)}</div></Card>
        <Card><div className="text-xs text-[var(--muted)]">{t("Excluded")}</div><div className="mt-1 text-2xl font-bold text-amber-500">{fmt(excludedInPool.length)}</div></Card>
        <Card>
          <div className="text-xs text-[var(--muted)]">{t("By reason")}</div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {Object.entries(reasonBreak).length ? Object.entries(reasonBreak).map(([r, n]) => <Badge key={r} tone="amber">{t(r)} {n}</Badge>) : <span className="text-[12px] text-[var(--muted)]">—</span>}
          </div>
        </Card>
      </div>

      {pool.length === 0 && (
        <Card className="mt-4 text-center text-[13px] text-[var(--muted)]">
          {t("No employees. Import DataKaryawan.xlsx in Employee Directory first.")}
        </Card>
      )}

      {/* ---- Filters ---- */}
      <Card className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
            <input value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} placeholder={t("Search name, NPK, position…")} className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500" />
          </div>
          <select value={fDir} onChange={(e) => { setFDir(e.target.value); resetPage(); }} className={selCls}><option value="">{t("All directorates")}</option>{uniq(pool, "directorate").map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <select value={fUnit} onChange={(e) => { setFUnit(e.target.value); resetPage(); }} className={selCls}><option value="">{t("All units")}</option>{uniq(pool, "unit").map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <select value={fGrade} onChange={(e) => { setFGrade(e.target.value); resetPage(); }} className={selCls}><option value="">{t("All grades")}</option>{uniq(pool, "pg").map((v) => <option key={v} value={v}>PG {v}</option>)}</select>
          <select value={fGender} onChange={(e) => { setFGender(e.target.value); resetPage(); }} className={selCls}><option value="">{t("All genders")}</option><option value="L">{t("Male")}</option><option value="P">{t("Female")}</option></select>
          <select value={fSF} onChange={(e) => { setFSF(e.target.value); resetPage(); }} className={selCls}><option value="">S/F</option>{uniq(pool, "sf").map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <select value={fStream} onChange={(e) => { setFStream(e.target.value); resetPage(); }} className={selCls}><option value="">{t("All streams")}</option>{uniq(pool, "stream").map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <select value={fStatus} onChange={(e) => { setFStatus(e.target.value as typeof fStatus); resetPage(); }} className={selCls}><option value="">{t("All status")}</option><option value="wajib">{t("Wajib KPI")}</option><option value="excluded">{t("Excluded")}</option></select>
        </div>

        {/* ---- Bulk action on the filtered set ---- */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3 text-[12px]">
          <span className="text-[var(--muted)]">{fmt(filtered.length)} {t("shown")} —</span>
          <span>{t("Bulk on filtered")}:</span>
          <select value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} className={selCls}>{EXCLUSION_REASONS.map((r) => <option key={r} value={r}>{t(r)}</option>)}</select>
          <Btn variant="ghost" onClick={bulkExclude}><Icon.alert className="h-3.5 w-3.5" /> {t("Exclude filtered")}</Btn>
          <Btn variant="ghost" onClick={bulkInclude}><Icon.check className="h-3.5 w-3.5" /> {t("Include filtered")}</Btn>
        </div>
      </Card>

      {/* ---- Table: all employees, scrollable (no pagination) ---- */}
      <Card className="mt-4">
        <div className="mb-2 text-[11px] text-[var(--muted)]">{fmt(filtered.length)} {t("employees shown")}</div>
        <div className="max-h-[72vh] overflow-auto">
          <table className="w-full min-w-[900px] text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {[t("Wajib?"), t("Name"), "NPK", t("Position"), t("Unit"), t("Directorate"), "PG/JG", t("Gender"), "S/F", t("Reason")].map((h, i) => (
                  <th key={i} className="sticky top-0 z-10 border-b bg-[rgb(var(--surface))] px-2 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const excl = isExcluded(e.npk);
                return (
                  <tr key={e.npk} className={cn("border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5", excl && "bg-amber-500/5")}>
                    <td className="px-2 py-1.5">
                      <input type="checkbox" checked={!excl} onChange={() => (excl ? include(e.npk) : exclude(e.npk, bulkReason))} className="accent-royal-500" title={excl ? t("Excluded — click to include") : t("Wajib KPI — click to exclude")} />
                    </td>
                    <td className="px-2 py-1.5 font-medium">{e.name}</td>
                    <td className="px-2 py-1.5 tabular-nums text-[var(--muted)]">{e.npk}</td>
                    <td className="px-2 py-1.5">{e.position}</td>
                    <td className="px-2 py-1.5">{e.unit}</td>
                    <td className="px-2 py-1.5">{e.directorate}</td>
                    <td className="px-2 py-1.5 tabular-nums">{e.pg}/{e.jg}</td>
                    <td className="px-2 py-1.5">{genderLabel(e.gender)}</td>
                    <td className="px-2 py-1.5">{e.sf}</td>
                    <td className="px-2 py-1.5">
                      {excl ? (
                        <select value={exclusions[e.npk].reason} onChange={(ev) => setReason(e.npk, ev.target.value)} className="rounded border bg-[rgb(var(--surface))] px-1.5 py-1 text-[11px] outline-none focus:border-royal-500">
                          {EXCLUSION_REASONS.map((r) => <option key={r} value={r}>{t(r)}</option>)}
                        </select>
                      ) : <span className="text-[var(--muted)]">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-3 text-[11px] text-[var(--muted)]">
        {t("Exclusions are applied to the Performance Dashboard’s “Total Wajib KPI”. Import (or Sync) a period there to freeze the current exclusions into that period’s snapshot.")}
      </p>
    </>
  );
}
