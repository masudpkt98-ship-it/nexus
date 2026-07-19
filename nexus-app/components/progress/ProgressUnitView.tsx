"use client";

import React, { useState } from "react";
import { Card, DonutChart, Gauge, ProgressBar, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import {
  METRICS, PLAN_BUCKETS, BUCKET_COLOR, BUCKET_TONE,
  type ProgressModel, type DirectorateProgress, type KompartemenProgress, type UnitProgress,
  type PlanBucket, type MetricKey, type MetricAgg,
} from "@/lib/perfProgress";

const fmt = (n: number) => n.toLocaleString("id-ID");
const pct = (n: number) => `${Math.round(n)}%`;

const bucketText: Record<string, string> = {
  green: "text-emerald-500", amber: "text-gold-500", red: "text-rose-500", blue: "text-royal-400", gray: "text-[var(--muted)]",
};

// A board-shaped datum (Direktorat or Kompartemen share this shape).
interface BoardData {
  jumlah: number;
  buckets: Record<PlanBucket, number>;
  metrics: Partial<Record<MetricKey, MetricAgg>>;
  completeness: number;
}

export function ProgressUnitView({ model, periodText }: { model: ProgressModel; periodText: string }) {
  const allKomp = model.directorates.flatMap((d) => d.kompartemens);
  const kompRanking = [...allKomp].sort((a, b) => b.completeness - a.completeness || b.jumlah - a.jumlah || a.kompartemen.localeCompare(b.kompartemen));
  const dirRanking = [...model.directorates].sort((a, b) => b.completeness - a.completeness || b.jumlah - a.jumlah || a.directorate.localeCompare(b.directorate));

  return (
    <div className="space-y-5">
      {/* All Direktorat */}
      <Card className="overflow-hidden">
        <AchievementBoard variant="hero" title="Realisasi Tahunan — All Direktorat" subtitle={periodText}
          total={model.totalKaryawan} buckets={model.buckets} metrics={model.metrics} />
      </Card>

      {/* Rankings — Direktorat / Kompartemen / Unit Kerja */}
      <RankingCard dirRanking={dirRanking} kompRanking={kompRanking} unitRanking={model.ranking} />

      {/* Klaster Direktorat — the 5 Direktorat together */}
      <ClusterCard title="Capaian per Direktorat" subtitle={`${model.directorates.length} Direktorat`} icon="users">
        {model.directorates.map((d) => (
          <BoardRow key={d.directorate} title={d.directorate} board={d} units={d.units} unitCount={d.units.length} kompCount={d.kompartemens.length} />
        ))}
      </ClusterCard>

      {/* Klaster Kompartemen — every Kompartemen together */}
      <ClusterCard title="Capaian per Kompartemen" subtitle={`${allKomp.length} Kompartemen`} icon="dashboard">
        {kompRanking.map((k) => (
          <BoardRow key={`${k.directorate}-${k.kompartemen}`} title={k.kompartemen} subtitle={k.directorate} board={k} units={k.units} unitCount={k.units.length} />
        ))}
      </ClusterCard>
    </div>
  );
}

// ---- Cluster wrapper (one card holding many collapsible boards) ---------------
function ClusterCard({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: keyof typeof Icon; children: React.ReactNode }) {
  const IconCmp = Icon[icon];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-royal-500 to-royal-700 text-white shadow-glow">
          <IconCmp className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[14px] font-bold">{title}</div>
          <div className="text-[11px] text-[var(--muted)]">{subtitle}</div>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </Card>
  );
}

// ---- One collapsible board row (Direktorat or Kompartemen) --------------------
// Header row is always visible; expanding reveals the full "All Direktorat"-style
// board + the per-Departemen (unit kerja) detail table.
function BoardRow({ title, subtitle, board, units, unitCount, kompCount }: {
  title: string; subtitle?: string; board: BoardData; units: UnitProgress[]; unitCount: number; kompCount?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{title}</div>
          <div className="truncate text-[10.5px] text-[var(--muted)]">
            {subtitle ? `${subtitle} · ` : ""}{fmt(board.jumlah)} karyawan{kompCount != null ? ` · ${kompCount} kompartemen` : ""} · {unitCount} unit kerja
          </div>
        </div>
        <div className="hidden w-32 sm:block"><ProgressBar value={board.completeness} tone="gold" /></div>
        <div className="w-11 text-right text-[13px] font-bold tabular-nums gold-gradient">{pct(board.completeness)}</div>
        <Icon.chevron className={cn("h-4 w-4 shrink-0 text-[var(--muted)] transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="border-t px-3 py-4">
          <AchievementBoard variant="compact" title={`Capaian ${title}`} subtitle={`${fmt(board.jumlah)} karyawan`}
            total={board.jumlah} buckets={board.buckets} metrics={board.metrics} donutSize={140} />
          <div className="mt-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Detail per Departemen</div>
            <UnitTable units={units} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Reusable "All Direktorat"-style board: donut + funnel cards + gauges ------
function AchievementBoard({ variant = "section", title, subtitle, total, buckets, metrics, donutSize = 168 }: {
  variant?: "hero" | "section" | "compact";
  title: string; subtitle?: string; total: number;
  buckets: Record<PlanBucket, number>; metrics: Partial<Record<MetricKey, MetricAgg>>; donutSize?: number;
}) {
  const segments = PLAN_BUCKETS.map((b) => ({ value: buckets[b], color: BUCKET_COLOR[b], label: b }));
  const gaugeSize = variant === "compact" ? 92 : 104;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {variant === "hero" ? (
          <span className="rounded-lg bg-gradient-to-r from-royal-500 to-gold-500 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.15em] text-white">{title}</span>
        ) : (
          <span className={cn("font-bold", variant === "compact" ? "text-[13px]" : "text-[14px]")}>{title}</span>
        )}
        {subtitle && <span className="text-[11px] text-[var(--muted)]">· {subtitle}</span>}
      </div>
      <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center">
          <DonutChart segments={segments} size={donutSize} thickness={variant === "compact" ? 16 : 20}
            center={
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Jumlah Karyawan</div>
                <div className={cn("font-bold brand-gradient", variant === "compact" ? "text-2xl" : "text-3xl")}>{fmt(total)}</div>
              </div>
            } />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {PLAN_BUCKETS.map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 text-[10.5px] text-[var(--muted)]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: BUCKET_COLOR[b] }} /> {b}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {PLAN_BUCKETS.map((b) => {
            const v = buckets[b];
            const share = total ? (v / total) * 100 : 0;
            return (
              <div key={b} className="rounded-xl border bg-[rgb(var(--surface))] p-3">
                <div className="text-[11px] font-medium text-[var(--muted)]">{b}</div>
                <div className={cn("mt-1 text-2xl font-bold tabular-nums", bucketText[BUCKET_TONE[b]])}>{fmt(v)}</div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${share}%`, background: BUCKET_COLOR[b] }} />
                </div>
                <div className="mt-1 text-[10px] text-[var(--muted)]">{pct(share)} dari total</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {METRICS.map((m) => <MetricGauge key={m.key} label={m.label} agg={metrics[m.key]} available={m.available} size={gaugeSize} />)}
      </div>
    </>
  );
}

function MetricGauge({ label, agg, available, size = 104 }: { label: string; agg?: MetricAgg; available: boolean; size?: number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border bg-[rgb(var(--surface))] p-2.5 text-center">
      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</div>
      {available && agg ? (
        <>
          <Gauge value={Math.round(agg.pct)} size={size} />
          <div className="text-[10px] text-[var(--muted)]">{fmt(agg.done)}/{fmt(agg.total)}</div>
        </>
      ) : (
        <div className="flex h-[64px] w-full flex-col items-center justify-center text-[var(--muted)]">
          <Icon.clock className="h-5 w-5 opacity-50" />
          <span className="mt-1 text-[10px]">belum diimpor</span>
        </div>
      )}
    </div>
  );
}

// ---- Ranking (Direktorat · Kompartemen · Unit Kerja) --------------------------
function RankingCard({ dirRanking, kompRanking, unitRanking }: { dirRanking: DirectorateProgress[]; kompRanking: KompartemenProgress[]; unitRanking: UnitProgress[] }) {
  const [mode, setMode] = useState<"dir" | "komp" | "unit">("dir");
  const [showAll, setShowAll] = useState(false);
  const medal = ["🥇", "🥈", "🥉"];
  const rows = mode === "dir"
    ? dirRanking.map((d) => ({ key: d.directorate, name: d.directorate, sub: `${d.kompartemens.length} kompartemen · ${d.units.length} unit`, jumlah: d.jumlah, completeness: d.completeness }))
    : mode === "komp"
    ? kompRanking.map((k) => ({ key: `${k.directorate}-${k.kompartemen}`, name: k.kompartemen, sub: k.directorate, jumlah: k.jumlah, completeness: k.completeness }))
    : unitRanking.map((u) => ({ key: `${u.directorate}-${u.unit}`, name: u.unit, sub: u.directorate, jumlah: u.jumlah, completeness: u.completeness }));
  const list = showAll ? rows.slice(0, 30) : rows.slice(0, 10);
  const modeLabel = mode === "dir" ? "Direktorat" : mode === "komp" ? "Kompartemen" : "Unit Kerja";

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon.spark className="h-5 w-5 text-gold-400" />
          <div>
            <div className="text-[14px] font-bold">Ranking {modeLabel} Terlengkap</div>
            <div className="text-[11px] text-[var(--muted)]">Skor kelengkapan tahapan KPI (Rencana &amp; Realisasi approved)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {([["dir", "Direktorat"], ["komp", "Kompartemen"], ["unit", "Unit Kerja"]] as const).map(([v, label]) => (
              <button key={v} onClick={() => { setMode(v); setShowAll(false); }}
                className={cn("rounded-lg px-3 py-1.5 text-[12px] font-medium transition", mode === v ? "bg-royal-500/15 text-royal-400" : "glass hover:bg-black/5 dark:hover:bg-white/5")}>
                {label}
              </button>
            ))}
          </div>
          {rows.length > 10 && (
            <button onClick={() => setShowAll((v) => !v)} className="text-[12px] font-medium text-royal-400 hover:underline">
              {showAll ? "Ringkas" : "30 besar"}
            </button>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        {list.map((u, i) => (
          <div key={u.key} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2",
            i < 3 ? "bg-gradient-to-r from-gold-500/10 to-transparent border-gold-500/30" : "bg-[rgb(var(--surface))]")}>
            <div className="w-7 shrink-0 text-center text-[15px] font-bold tabular-nums">
              {i < 3 ? medal[i] : <span className="text-[var(--muted)]">{i + 1}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{u.name}</div>
              <div className="truncate text-[10.5px] text-[var(--muted)]">{u.sub} · {fmt(u.jumlah)} karyawan</div>
            </div>
            <div className="hidden w-40 sm:block"><ProgressBar value={u.completeness} tone="gold" /></div>
            <div className="w-12 text-right text-[15px] font-bold tabular-nums gold-gradient">{pct(u.completeness)}</div>
          </div>
        ))}
        {list.length === 0 && <div className="py-6 text-center text-[12px] text-[var(--muted)]">Belum ada data.</div>}
      </div>
    </Card>
  );
}

// ---- Unit-kerja (Departemen) detail table -------------------------------------
function UnitTable({ units }: { units: UnitProgress[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-[12px]">
        <thead>
          <tr className="border-b text-left text-[10px] uppercase tracking-wider text-[var(--muted)]">
            <th className="py-2 pr-2">Unit Kerja</th>
            <th className="px-2 text-right">Jumlah</th>
            {METRICS.map((m) => <th key={m.key} className="px-2 text-center">{m.short}</th>)}
          </tr>
        </thead>
        <tbody>
          {units.map((u) => (
            <tr key={u.unit} className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
              <td className="py-2 pr-2 font-medium">{u.unit}</td>
              <td className="px-2 text-right tabular-nums text-[var(--muted)]">{fmt(u.jumlah)}</td>
              {METRICS.map((m) => <MetricCell key={m.key} agg={u.metrics[m.key]} available={m.available} />)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricCell({ agg, available }: { agg?: MetricAgg; available: boolean }) {
  if (!available || !agg) return <td className="px-2 text-center text-[var(--muted)]">—</td>;
  const tone = agg.pct >= 90 ? "green" : agg.pct >= 60 ? "gold" : "red";
  return (
    <td className="px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        <div className="min-w-[52px] flex-1"><ProgressBar value={agg.pct} tone={tone as "green" | "gold" | "red"} /></div>
        <span className="w-8 text-right text-[11px] tabular-nums">{pct(agg.pct)}</span>
      </div>
    </td>
  );
}
