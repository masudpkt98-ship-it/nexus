"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { employees as employeeSeed, type Employee } from "@/lib/data";

const fmt = (n: number) => n.toLocaleString("id-ID");

export default function CompetencyDashboardPage() {
  const { t } = useI18n();
  // Same single source of truth as the Performance Dashboard: Employee Directory.
  const [directory] = useLocalState<Employee[]>("employees", employeeSeed);
  const counted = useMemo(
    () => directory.filter((e) => { const n = String(e.npk ?? "").trim(); return n && !n.startsWith("9"); }).length,
    [directory]
  );

  return (
    <>
      <PageHeader
        title="Competency Dashboard"
        subtitle="Monitoring Competency — Assessment · Gap · Development"
      />

      <div className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-[12px]",
        counted ? "border-royal-500/25 bg-royal-500/5" : "border-amber-500/30 bg-amber-500/5"
      )}>
        <Icon.users className="h-4 w-4 text-royal-400" />
        <span className="font-medium">{t("Employee source")}: {t("Employee Directory")}</span>
        <span className="text-[var(--muted)]">— {fmt(counted)} {t("employees counted (NIK 9 excluded)")}</span>
      </div>

      <Card className="mt-4 text-center">
        <Icon.competency className="mx-auto h-10 w-10 text-[var(--muted)]" />
        <p className="mt-2 text-[14px] font-medium">{t("Competency monitoring — ready for data")}</p>
        <p className="mx-auto mt-1 max-w-md text-[12px] text-[var(--muted)]">
          {t("This dashboard will compile competency assessment & gap data the same way as the Performance Dashboard — sourced from the Employee Directory, NIK 9 excluded, deduped by NIK + Nama.")}
        </p>
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          {t("Provide a competency export (assessment / gap) and it will be wired in here.")}
        </p>
      </Card>
    </>
  );
}
