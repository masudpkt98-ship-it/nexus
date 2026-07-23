"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { mentoringSeed, type MentoringSession } from "@/lib/compassSeed";
import { useI18n } from "@/lib/i18n";

export default function MentoringPage() {
  const { t } = useI18n();
  const [sessions] = useLocalState<MentoringSession[]>("compass-mentoring", mentoringSeed);

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader title="Mentoring & Coaching" subtitle="COMPASS · Pendampingan · transfer pengalaman & peningkatan performa" />

      <div className="grid gap-4 lg:grid-cols-2">
        {sessions.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold">{s.topic}</div>
                <div className="truncate text-[12px] text-[var(--muted)]">{s.employee} · {t("Mentor")}: {s.mentor}</div>
              </div>
              <Badge tone={s.kind === "Coaching" ? "amber" : "blue"}>{s.kind}</Badge>
            </div>
            <div className="mt-3 space-y-2 text-[13px]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Notes")}</div>
                <p className="mt-0.5">{s.notes}</p>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Action Plan")}</div>
                <p className="mt-0.5">{s.actionPlan}</p>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-[var(--muted)]">{s.date}</div>
          </Card>
        ))}
      </div>
    </>
  );
}
