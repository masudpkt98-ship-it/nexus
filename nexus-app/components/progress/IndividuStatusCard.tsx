"use client";

import React from "react";
import { cn } from "@/components/ui";
import { METRICS, type MetricKey, type MetricStatus, type StatusTone } from "@/lib/perfProgress";

export interface IndividuPerson {
  npk: string;
  name: string;
  position: string;
  unit: string;
  directorate: string;
  compartment?: string;
}

const toneTile: Record<StatusTone, string> = {
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  amber: "border-gold-500/30 bg-gold-500/10 text-gold-600 dark:text-gold-300",
  red: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300",
  blue: "border-royal-500/30 bg-royal-500/10 text-royal-500 dark:text-royal-300",
  gray: "border-slate-400/25 bg-slate-500/5 text-[var(--muted)]",
};

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

export function IndividuStatusCard({
  person,
  statuses,
}: {
  person: IndividuPerson;
  statuses: Record<MetricKey, MetricStatus>;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(260px,340px)_1fr]">
      {/* Identity card */}
      <div className="overflow-hidden rounded-2xl border bg-[rgb(var(--surface))] shadow-glow">
        <div className="relative flex flex-col items-center gap-3 bg-gradient-to-br from-royal-600 via-royal-500 to-gold-500 px-6 pb-14 pt-7 text-center text-white">
          <Ornament className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 opacity-20" />
          <Ornament className="pointer-events-none absolute -bottom-8 -left-6 h-24 w-24 opacity-20" />
          <div className="text-[15px] font-bold leading-tight drop-shadow-sm">{person.name}</div>
          <div className="text-[12px] font-medium tracking-wider text-white/85">{person.npk}</div>
          <div className="text-[11px] text-white/80">{person.position || "—"}</div>
        </div>
        <div className="-mt-10 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-[rgb(var(--surface))] bg-gradient-to-br from-royal-400 to-gold-500 text-2xl font-bold text-white shadow-lg">
            {initials(person.name)}
          </div>
        </div>
        <div className="px-5 pb-3 pt-3 text-center">
          <div className="text-[13px] font-semibold leading-snug">{person.unit || "—"}</div>
          {person.compartment && person.compartment !== "—" && (
            <div className="mt-0.5 text-[11px] text-[var(--muted)]">{person.compartment}</div>
          )}
        </div>
        <div className="bg-gradient-to-r from-royal-500 to-gold-500 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
          {person.directorate || "Unit Kerja"}
        </div>
      </div>

      {/* Status tiles */}
      <div>
        <div className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Status KPI Individu Tahunan
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {METRICS.map((m) => {
            const s = statuses[m.key];
            return (
              <div key={m.key} className={cn("rounded-xl border px-4 py-3 transition", toneTile[s.tone])}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider opacity-80">{m.label}</span>
                  {s.done && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">✓</span>
                  )}
                </div>
                <div className="mt-1 text-[17px] font-bold leading-tight">{s.label}</div>
                {!s.available && <div className="mt-0.5 text-[10px] font-medium opacity-70">belum diimpor</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// A subtle batik-style rosette (pure SVG, no assets).
function Ornament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse key={i} cx="50" cy="50" rx="14" ry="40" transform={`rotate(${i * 22.5} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="8" />
    </svg>
  );
}
