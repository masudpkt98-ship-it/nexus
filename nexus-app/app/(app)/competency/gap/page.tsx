"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge, ProgressBar, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeeSearch } from "@/components/EmployeeSearch";
import { matchJabatan, resolveTech, levelTone } from "@/lib/compass";
import { useLocalState } from "@/lib/useLocalState";
import { type Employee, type JabatanCompetencyProfile } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

// current levels: key `${npk}|${code}` → level 0..5 (0 = not assessed)
export default function GapAnalysisPage() {
  const { t } = useI18n();
  const [current, setCurrent] = useLocalState<Record<string, number>>("compass-current-levels", {});
  const [emp, setEmp] = useState<Employee | null>(null);
  const [sel, setSel] = useState<JabatanCompetencyProfile | null>(null);

  const pick = (e: Employee) => { setEmp(e); setSel(matchJabatan(e.position || "")); };
  const npk = emp?.npk ? String(emp.npk) : "";
  const tech = useMemo(() => (sel ? resolveTech(sel) : []), [sel]);

  const rows = tech.map((c) => {
    const cur = current[`${npk}|${c.code}`] ?? 0;
    return { ...c, current: cur, gap: Math.max(0, c.level - cur) };
  });
  const totalGap = rows.reduce((s, r) => s + r.gap, 0);
  const met = rows.filter((r) => r.gap === 0 && r.current > 0).length;
  const readiness = rows.length ? Math.round((rows.reduce((s, r) => s + Math.min(r.current, r.level), 0) / rows.reduce((s, r) => s + r.level, 0)) * 100) : 0;
  const setCur = (code: string, v: number) => setCurrent((m) => ({ ...m, [`${npk}|${code}`]: v }));

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader title="Competency Gap Analysis" subtitle="COMPASS · Bandingkan kompetensi saat ini dengan yang dipersyaratkan" />

      <Card className="mb-4">
        <label className="block text-[11px] font-medium text-[var(--muted)]">
          {t("Find by employee")}
          <div className="mt-1"><EmployeeSearch onSelect={pick} /></div>
        </label>
      </Card>

      {!sel ? (
        <Card className="flex min-h-[160px] items-center justify-center text-center text-[13px] text-[var(--muted)]">
          {emp ? t("No competency profile found for this employee's position.") : t("Search an employee to run a gap analysis.")}
        </Card>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card><div className="text-xs text-[var(--muted)]">{t("Readiness")}</div><div className="mt-1 text-2xl font-bold gold-gradient">{readiness}%</div><ProgressBar value={readiness} tone="gold" className="mt-2" /></Card>
            <Card><div className="text-xs text-[var(--muted)]">{t("Competencies")}</div><div className="mt-1 text-2xl font-bold">{rows.length}</div></Card>
            <Card><div className="text-xs text-[var(--muted)]">{t("Met")}</div><div className="mt-1 text-2xl font-bold text-emerald-500">{met}</div></Card>
            <Card><div className="text-xs text-[var(--muted)]">{t("Total Gap")}</div><div className="mt-1 text-2xl font-bold text-rose-400">{totalGap}</div></Card>
          </div>

          <div className="glass card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("Competency")}</th>
                  <th className="px-4 py-3 font-medium text-center">{t("Required")}</th>
                  <th className="px-4 py-3 font-medium text-center">{t("Current")}</th>
                  <th className="px-4 py-3 font-medium text-center">{t("Gap")}</th>
                  <th className="px-4 py-3 font-medium">{t("Recommendation")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.code} className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Badge tone="blue">{r.code}</Badge><span className="text-[13px]">{r.name}</span></div></td>
                    <td className="px-4 py-2.5 text-center"><Badge tone={levelTone(r.level)}>L{r.level}</Badge></td>
                    <td className="px-4 py-2.5 text-center">
                      <select value={r.current} onChange={(e) => setCur(r.code, Number(e.target.value))} className="rounded-lg border bg-[rgb(var(--surface))] px-2 py-1 text-[12px] text-[var(--text)] outline-none focus:border-royal-500">
                        <option value={0}>—</option>
                        {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>L{n}</option>))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-center"><span className={cn("font-semibold", r.gap === 0 ? "text-emerald-500" : r.gap >= 2 ? "text-rose-400" : "text-amber-500")}>{r.gap}</span></td>
                    <td className="px-4 py-2.5 text-[12px] text-[var(--muted)]">{r.current === 0 ? t("Needs assessment") : r.gap === 0 ? t("Met — maintain") : `${t("Learning needed to reach")} L${r.level}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-[var(--muted)]">{t("Set the current level per competency; the gap and recommendation update automatically.")}</p>
        </>
      )}
    </>
  );
}
