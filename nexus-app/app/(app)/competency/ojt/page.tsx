"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { ojtSeed, type OjtItem, type OjtStatus } from "@/lib/compassSeed";
import { useI18n } from "@/lib/i18n";

const statusTone = (s: OjtStatus): "gray" | "amber" | "green" => (s === "Selesai" ? "green" : s === "Berjalan" ? "amber" : "gray");
const CYCLE: OjtStatus[] = ["Belum", "Berjalan", "Selesai"];

export default function OjtPage() {
  const { t } = useI18n();
  const [items, setItems] = useLocalState<OjtItem[]>("compass-ojt", ojtSeed);
  const cycle = (id: string) => setItems((list) => list.map((x) => (x.id === id ? { ...x, status: CYCLE[(CYCLE.indexOf(x.status) + 1) % CYCLE.length] } : x)));

  const groups: OjtItem["kind"][] = ["OJT", "Job Shadowing"];
  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader title="OJT & Job Shadowing" subtitle="COMPASS · Belajar langsung di tempat kerja" />

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g) => {
          const rows = items.filter((x) => x.kind === g);
          const done = rows.filter((x) => x.status === "Selesai").length;
          return (
            <div key={g}>
              <div className="mb-2 flex items-center gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{g}</div>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--muted)] dark:bg-white/10">{done}/{rows.length}</span>
              </div>
              <div className="glass card divide-y">
                {rows.map((x) => (
                  <div key={x.id} className="flex items-center gap-2 px-3 py-2.5">
                    <button onClick={() => cycle(x.id)} title={t("Click to change status")} className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px]", x.status === "Selesai" ? "border-emerald-500 bg-emerald-500 text-white" : x.status === "Berjalan" ? "border-amber-500 text-amber-500" : "border-[var(--muted)]")}>
                      {x.status === "Selesai" ? "✓" : x.status === "Berjalan" ? "•" : ""}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{x.activity}</div>
                      <div className="truncate text-[11px] text-[var(--muted)]">{x.role} · {t("Mentor")}: {x.mentor}</div>
                    </div>
                    <Badge tone={statusTone(x.status)}>{x.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
