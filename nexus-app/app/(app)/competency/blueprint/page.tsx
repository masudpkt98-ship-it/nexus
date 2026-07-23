"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeeSearch } from "@/components/EmployeeSearch";
import { matchJabatan, resolveTech, norm, levelTone } from "@/lib/compass";
import { lmsSeed } from "@/lib/compassSeed";
import { type Employee, type JabatanCompetencyProfile } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

interface Step { kind: "milestone" | "competency"; title: string; code?: string; level?: number; lms: number }

export default function BlueprintPage() {
  const { t } = useI18n();
  const [emp, setEmp] = useState<Employee | null>(null);
  const [sel, setSel] = useState<JabatanCompetencyProfile | null>(null);
  const pick = (e: Employee) => { setEmp(e); setSel(matchJabatan(e.position || "")); };

  const steps: Step[] = useMemo(() => {
    if (!sel) return [];
    // Foundational competencies first (lower target level), then advanced.
    const tech = resolveTech(sel).slice().sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
    const lmsCount = (name: string) => lmsSeed.filter((m) => norm(m.competency) === norm(name)).length;
    return [
      { kind: "milestone", title: t("Orientation"), lms: 0 },
      ...tech.map((c) => ({ kind: "competency" as const, title: c.name, code: c.code, level: c.level, lms: lmsCount(c.name) })),
      { kind: "milestone", title: t("Assessment"), lms: 0 },
      { kind: "milestone", title: t("Certification"), lms: 0 },
    ];
  }, [sel, t]);

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader title="Role Learning Blueprint" subtitle="COMPASS · Kurikulum pembelajaran untuk satu jabatan" />

      <Card className="mb-4">
        <label className="block text-[11px] font-medium text-[var(--muted)]">
          {t("Find by employee")}
          <div className="mt-1"><EmployeeSearch onSelect={pick} /></div>
        </label>
      </Card>

      {!sel ? (
        <Card className="flex min-h-[160px] items-center justify-center text-center text-[13px] text-[var(--muted)]">
          {emp ? t("No competency profile found for this employee's position.") : t("Search an employee to build the learning blueprint.")}
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <div className="text-base font-semibold">{sel.jabatan}</div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">{t("Curriculum")} · {steps.filter((s) => s.kind === "competency").length} {t("competencies")}</div>
          </Card>
          <div className="mx-auto max-w-xl">
            {steps.map((s, i) => (
              <div key={i}>
                <div className="flex items-center gap-3 rounded-xl border p-3 glass">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-royal-500/15 text-[13px] font-bold text-royal-400">{i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {s.code && <Badge tone="blue">{s.code}</Badge>}
                      <span className="truncate text-[13px] font-medium">{s.title}</span>
                    </div>
                    {s.kind === "milestone" && <div className="text-[11px] text-[var(--muted)]">{t("Milestone")}</div>}
                  </div>
                  {s.level != null && <Badge tone={levelTone(s.level)}>L{s.level}</Badge>}
                  {s.lms > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-royal-400"><Icon.knowledge className="h-3.5 w-3.5" />{s.lms}</span>}
                </div>
                {i < steps.length - 1 && <div className="ml-[27px] h-4 w-px bg-[var(--muted)]/40" />}
              </div>
            ))}
          </div>
          <p className="mx-auto mt-3 max-w-xl text-[11px] text-[var(--muted)]">{t("Ordered from foundational (lower target level) to advanced. Numbers link to available Learning Modules.")}</p>
        </>
      )}
    </>
  );
}
