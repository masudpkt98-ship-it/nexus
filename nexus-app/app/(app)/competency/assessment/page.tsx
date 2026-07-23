"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { assessmentSeed, type AssessmentRecord, type AssessStatus } from "@/lib/compassSeed";
import { useI18n } from "@/lib/i18n";

const statusTone = (s: AssessStatus): "gray" | "amber" | "green" | "red" =>
  s === "Lulus" ? "green" : s === "Tidak Lulus" ? "red" : s === "Dinilai" ? "amber" : "gray";
const METHODS = ["Quiz", "Praktik", "Wawancara", "Observasi", "Studi Kasus", "Simulasi"];

export default function AssessmentPage() {
  const { t } = useI18n();
  const [recs] = useLocalState<AssessmentRecord[]>("compass-assessments", assessmentSeed);
  const [q, setQ] = useState("");
  const rows = recs.filter((r) => !q.trim() || `${r.employee} ${r.competency} ${r.assessor}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader title="Assessment" subtitle="COMPASS · Pembuktian kompetensi · Quiz · Praktik · Observasi · Simulasi" />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {METHODS.map((m) => (<span key={m} className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--muted)] dark:bg-white/10">{m}</span>))}
        </div>
        <div className="relative ml-auto min-w-[200px] flex-1">
          <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search employee, competency, assessor…")} className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500" />
        </div>
      </div>

      <div className="glass card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">{t("Employee")}</th>
              <th className="px-4 py-3 font-medium">{t("Competency")}</th>
              <th className="px-4 py-3 font-medium">{t("Method")}</th>
              <th className="px-4 py-3 font-medium">{t("Assessor")}</th>
              <th className="px-4 py-3 font-medium text-center">{t("Score")}</th>
              <th className="px-4 py-3 font-medium">{t("Status")}</th>
              <th className="px-4 py-3 font-medium">{t("Date")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                <td className="px-4 py-2.5 text-[13px]">{r.employee}</td>
                <td className="px-4 py-2.5 text-[13px]">{r.competency}</td>
                <td className="px-4 py-2.5"><Badge tone="gray">{r.method}</Badge></td>
                <td className="px-4 py-2.5 text-[12px] text-[var(--muted)]">{r.assessor}</td>
                <td className="px-4 py-2.5 text-center font-semibold">{r.score ?? "—"}</td>
                <td className="px-4 py-2.5"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                <td className="px-4 py-2.5 text-[12px] text-[var(--muted)]">{r.date}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">{t("No records yet.")}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
