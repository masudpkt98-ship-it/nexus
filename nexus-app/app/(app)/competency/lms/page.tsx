"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { lmsSeed, type LmsModule, type LmsType } from "@/lib/compassSeed";
import { levelTone } from "@/lib/compass";
import { useI18n } from "@/lib/i18n";

const TYPES: LmsType[] = ["Video", "PDF", "Animasi", "eBook", "Quiz", "SOP"];
const typeTone = (t: LmsType): "blue" | "amber" | "green" | "purple" | "gray" | "red" =>
  ({ Video: "red", PDF: "gray", Animasi: "purple", eBook: "blue", Quiz: "amber", SOP: "green" } as const)[t];

export default function LmsPage() {
  const { t } = useI18n();
  const [mods] = useLocalState<LmsModule[]>("compass-lms", lmsSeed);
  const [type, setType] = useState<LmsType | "">("");
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return mods.filter((m) => (!type || m.type === type) && (!n || `${m.title} ${m.competency}`.toLowerCase().includes(n)));
  }, [mods, type, q]);

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader title="Learning Modules (LMS)" subtitle="COMPASS · Katalog materi pembelajaran" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setType("")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition", !type ? "bg-royal-500 text-white" : "glass text-[var(--muted)] hover:text-[var(--text)]")}>{t("All")}</button>
        {TYPES.map((ty) => (
          <button key={ty} onClick={() => setType(ty)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition", type === ty ? "bg-royal-500 text-white" : "glass text-[var(--muted)] hover:text-[var(--text)]")}>{ty}</button>
        ))}
        <div className="relative ml-auto min-w-[200px] flex-1">
          <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search title or competency…")} className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((m) => (
          <Card key={m.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Badge tone={typeTone(m.type)}>{m.type}</Badge>
              <Badge tone={levelTone(m.level)}>L{m.level}</Badge>
            </div>
            <div className="text-[14px] font-semibold leading-snug">{m.title}</div>
            <div className="mt-auto flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span className="inline-flex items-center gap-1"><Icon.knowledge className="h-3.5 w-3.5" /> {m.competency}</span>
              <span>{m.duration}</span>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <Card className="col-span-full text-center text-[13px] text-[var(--muted)]">{t("No modules match.")}</Card>}
      </div>
    </>
  );
}
