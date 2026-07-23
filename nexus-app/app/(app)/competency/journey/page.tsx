"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { journeySeed, type LearningJourney } from "@/lib/compassSeed";
import { useI18n } from "@/lib/i18n";

export default function JourneyPage() {
  const { t } = useI18n();
  const [journeys] = useLocalState<LearningJourney[]>("compass-journeys", journeySeed);

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader title="Learning Journey" subtitle="COMPASS · Urutan pembelajaran tiap individu · progress mingguan" />

      <div className="grid gap-4 lg:grid-cols-2">
        {journeys.map((j) => (
          <Card key={j.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[14px] font-semibold">{j.employee}</div>
                <div className="text-[12px] text-[var(--muted)]">{j.role}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold gold-gradient">{j.progress}%</div>
                <div className="w-24"><ProgressBar value={j.progress} tone={j.progress === 100 ? "green" : "gold"} /></div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {j.weeks.map((w) => {
                const done = (w.week / j.weeks.length) * 100 <= j.progress;
                return (
                  <div key={w.week} className="flex items-start gap-2 rounded-lg border p-2">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${done ? "bg-emerald-500 text-white" : "bg-royal-500/15 text-royal-400"}`}>
                      {done ? "✓" : w.week}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium text-[var(--muted)]">{t("Week")} {w.week}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {w.items.map((it) => (<span key={it} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[11px] text-royal-400">{it}</span>))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
