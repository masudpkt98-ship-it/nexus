"use client";

import React, { useMemo, useState } from "react";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { IndividuStatusCard, type IndividuPerson } from "@/components/progress/IndividuStatusCard";
import { type MetricKey, type MetricStatus } from "@/lib/perfProgress";

export function ProgressIndividuView({
  people,
  statusFor,
  scopeNote,
}: {
  people: IndividuPerson[];
  statusFor: (npk: string) => Record<MetricKey, MetricStatus>;
  scopeNote?: string;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<IndividuPerson | null>(null);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return people
      .filter((p) => `${p.name} ${p.npk} ${p.unit}`.toLowerCase().includes(needle))
      .slice(0, 12);
  }, [q, people]);

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[14px] font-bold">Search Karyawan</div>
          <Badge tone="blue">{people.length.toLocaleString("id-ID")} karyawan</Badge>
          {scopeNote && <Badge tone="purple">{scopeNote}</Badge>}
        </div>
        <div className="relative mt-3">
          <Icon.search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setSelected(null); }}
            placeholder="Ketik nama, NPK, atau unit kerja…"
            className="w-full rounded-xl border bg-[rgb(var(--surface))] py-2.5 pl-10 pr-3 text-[14px] outline-none focus:border-royal-500"
          />
        </div>
        {!selected && matches.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-xl border">
            {matches.map((p) => (
              <button
                key={p.npk}
                onClick={() => { setSelected(p); }}
                className="flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-0 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-royal-400 to-gold-500 text-[11px] font-semibold text-white">
                  {p.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{p.name}</span>
                  <span className="block truncate text-[11px] text-[var(--muted)]">{p.npk} · {p.unit}</span>
                </span>
                <Icon.chevron className="h-4 w-4 text-[var(--muted)]" />
              </button>
            ))}
          </div>
        )}
        {!selected && q.trim() && matches.length === 0 && (
          <div className="mt-2 text-[12px] text-[var(--muted)]">Tidak ada karyawan yang cocok.</div>
        )}
      </Card>

      {selected ? (
        <Card>
          <IndividuStatusCard person={selected} statuses={statusFor(selected.npk)} />
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <Icon.users className="h-9 w-9 text-[var(--muted)]" />
          <p className="mt-2 text-[13px] font-medium">Cari karyawan untuk melihat status KPI individunya</p>
          <p className="mt-1 text-[12px] text-[var(--muted)]">Rencana · Realisasi · Form STAR · Penilaian 360 · Maturitas Budaya · Learning Agility</p>
        </Card>
      )}
    </div>
  );
}
