"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge, ProgressBar, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeeSearch } from "@/components/EmployeeSearch";
import { matchJabatan, resolveTech, behByName, norm, tierTone, levelTone } from "@/lib/compass";
import { useLocalState } from "@/lib/useLocalState";
import { assessmentSeed, certificationSeed, type AssessmentRecord, type CertificationRecord } from "@/lib/compassSeed";
import { type Employee, type JabatanCompetencyProfile } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?";

export default function PassportPage() {
  const { t } = useI18n();
  const [current] = useLocalState<Record<string, number>>("compass-current-levels", {});
  const [emp, setEmp] = useState<Employee | null>(null);
  const [sel, setSel] = useState<JabatanCompetencyProfile | null>(null);
  const pick = (e: Employee) => { setEmp(e); setSel(matchJabatan(e.position || "")); };

  const npk = emp?.npk ? String(emp.npk) : "";
  const tech = useMemo(() => (sel ? resolveTech(sel) : []), [sel]);
  const rows = tech.map((c) => ({ ...c, current: current[`${npk}|${c.code}`] ?? 0 }));
  const readiness = rows.length ? Math.round((rows.reduce((s, r) => s + Math.min(r.current, r.level), 0) / rows.reduce((s, r) => s + r.level, 0)) * 100) : 0;
  const achieved = rows.filter((r) => r.current >= r.level && r.current > 0).length;

  const nameMatch = (recName: string) => emp && norm(recName) && (norm(recName) === norm(emp.name) || norm(emp.name).includes(norm(recName)) || norm(recName).includes(norm(emp.name)));
  const myAssess: AssessmentRecord[] = emp ? assessmentSeed.filter((a) => nameMatch(a.employee)) : [];
  const myCerts: CertificationRecord[] = emp ? certificationSeed.filter((c) => nameMatch(c.employee)) : [];

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader title="Competency Passport" subtitle="COMPASS · Riwayat kompetensi lengkap seorang karyawan" />

      <Card className="mb-4">
        <label className="block text-[11px] font-medium text-[var(--muted)]">
          {t("Find by employee")}
          <div className="mt-1"><EmployeeSearch onSelect={pick} /></div>
        </label>
      </Card>

      {!emp ? (
        <Card className="flex min-h-[160px] items-center justify-center text-center text-[13px] text-[var(--muted)]">{t("Search an employee to open their competency passport.")}</Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3">
              <Avatar initials={initials(emp.name)} />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold">{emp.name}</div>
                <div className="text-[12px] text-[var(--muted)]">{emp.position}{emp.unit ? ` · ${emp.unit}` : ""}{sel?.band ? ` · ${sel.band}` : ""}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div><div className="text-xs text-[var(--muted)]">{t("Readiness")}</div><div className="mt-1 text-xl font-bold gold-gradient">{readiness}%</div><ProgressBar value={readiness} tone="gold" className="mt-1.5" /></div>
              <div><div className="text-xs text-[var(--muted)]">{t("Competencies Achieved")}</div><div className="mt-1 text-xl font-bold text-emerald-500">{achieved}/{rows.length}</div></div>
              <div><div className="text-xs text-[var(--muted)]">{t("Assessments")}</div><div className="mt-1 text-xl font-bold">{myAssess.length}</div></div>
              <div><div className="text-xs text-[var(--muted)]">{t("Certifications")}</div><div className="mt-1 text-xl font-bold">{myCerts.length}</div></div>
            </div>
          </Card>

          {!sel ? (
            <Card className="text-center text-[13px] text-[var(--muted)]">{t("No competency profile found for this employee's position.")}</Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Kompetensi Teknis")}</div>
                <div className="glass card divide-y">
                  {rows.map((r) => (
                    <div key={r.code} className="flex items-center gap-2 px-3 py-2">
                      <Badge tone="blue">{r.code}</Badge>
                      <span className="min-w-0 flex-1 truncate text-[13px]">{r.name}</span>
                      <span className="text-[11px] text-[var(--muted)]">{r.current > 0 ? `L${r.current}` : "—"} / </span>
                      <Badge tone={levelTone(r.level)}>L{r.level}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Kompetensi Perilaku")}</div>
                <div className="glass card divide-y">
                  {sel.beh.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-[13px]">{behByName(b.n)?.name ?? b.n}</span>
                      <Badge tone={tierTone(b.t)}>{b.t}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Assessments & Certifications */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Assessments")}</div>
              <div className="glass card divide-y">
                {myAssess.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 px-3 py-2 text-[12px]">
                    <span className="min-w-0 flex-1 truncate">{a.competency}</span>
                    <Badge tone="gray">{a.method}</Badge>
                    {a.score != null && <span className="font-semibold">{a.score}</span>}
                    <Badge tone={a.status === "Lulus" ? "green" : a.status === "Tidak Lulus" ? "red" : "amber"}>{a.status}</Badge>
                  </div>
                ))}
                {myAssess.length === 0 && <div className="px-3 py-4 text-center text-[12px] text-[var(--muted)]">{t("No records yet.")}</div>}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Certifications")}</div>
              <div className="glass card divide-y">
                {myCerts.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-2 text-[12px]">
                    <span className="min-w-0 flex-1 truncate">{c.title}</span>
                    <Badge tone={c.status === "Competent" ? "green" : c.status === "Expired" ? "red" : "amber"}>{c.status}</Badge>
                    {c.issued && c.issued !== "—" && <span className="text-[var(--muted)]">{c.issued}</span>}
                  </div>
                ))}
                {myCerts.length === 0 && <div className="px-3 py-4 text-center text-[12px] text-[var(--muted)]">{t("No records yet.")}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
