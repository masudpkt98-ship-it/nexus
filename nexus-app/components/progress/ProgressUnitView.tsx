"use client";

import React, { useState } from "react";
import { Card, DonutChart, Gauge, ProgressBar, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import {
  METRICS, AVAILABLE_METRICS, PLAN_BUCKETS, BUCKET_COLOR, BUCKET_TONE,
  type ProgressModel, type DirectorateProgress, type MetricKey, type MetricAgg,
} from "@/lib/perfProgress";

const fmt = (n: number) => n.toLocaleString("id-ID");
const pct = (n: number) => `${Math.round(n)}%`;

const bucketText: Record<string, string> = {
  green: "text-emerald-500", amber: "text-gold-500", red: "text-rose-500", blue: "text-royal-400", gray: "text-[var(--muted)]",
};

export function ProgressUnitView({ model, periodText }: { model: ProgressModel; periodText: string }) {
  return (
    <div className="space-y-5">
      <OverallBoard model={model} periodText={periodText} />
      <RankingCard model={model} />
      {model.directorates.map((d) => <DirectorateSection key={d.directorate} d={d} />)}
    </div>
  );
}

// ---- All-Direktorat funnel + overall gauges -----------------------------------
function OverallBoard({ model, periodText }: { model: ProgressModel; periodText: string }) {
  const segments = PLAN_BUCKETS.map((b) => ({ value: model.buckets[b], color: BUCKET_COLOR[b], label: b }));
  return (
    <Card className="overflow-hidden">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-lg bg-gradient-to-r from-royal-500 to-gold-500 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.15em] text-white">
          Realisasi Tahunan — All Direktorat
        </span>
        <span className="text-[11px] text-[var(--muted)]">· {periodText}</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center">
          <DonutChart
            segments={segments}
            size={168}
            thickness={20}
            center={
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Jumlah Karyawan</div>
                <div className="text-3xl font-bold brand-gradient">{fmt(model.totalKaryawan)}</div>
              </div>
            }
          />
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
            const v = model.buckets[b];
            const share = model.totalKaryawan ? (v / model.totalKaryawan) * 100 : 0;
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
      {/* overall gauges per metric */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {METRICS.map((m) => <MetricGauge key={m.key} label={m.label} agg={model.metrics[m.key]} available={m.available} />)}
      </div>
    </Card>
  );
}

function MetricGauge({ label, agg, available }: { label: string; agg?: MetricAgg; available: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-xl border bg-[rgb(var(--surface))] p-2.5 text-center">
      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</div>
      {available && agg ? (
        <>
          <Gauge value={Math.round(agg.pct)} size={104} />
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

// ---- Ranking: fastest & most complete unit kerja ------------------------------
function RankingCard({ model }: { model: ProgressModel }) {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? model.ranking.slice(0, 30) : model.ranking.slice(0, 10);
  const medal = ["🥇", "🥈", "🥉"];
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon.spark className="h-5 w-5 text-gold-400" />
          <div>
            <div className="text-[14px] font-bold">Ranking Unit Kerja Terlengkap</div>
            <div className="text-[11px] text-[var(--muted)]">Skor kelengkapan tahapan KPI (Rencana &amp; Realisasi approved)</div>
          </div>
        </div>
        {model.ranking.length > 10 && (
          <button onClick={() => setShowAll((v) => !v)} className="text-[12px] font-medium text-royal-400 hover:underline">
            {showAll ? "Ringkas" : "Lihat 30 besar"}
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {list.map((u, i) => (
          <div key={`${u.directorate}-${u.unit}`} className={cn(
            "flex items-center gap-3 rounded-xl border px-3 py-2",
            i < 3 ? "bg-gradient-to-r from-gold-500/10 to-transparent border-gold-500/30" : "bg-[rgb(var(--surface))]"
          )}>
            <div className="w-7 shrink-0 text-center text-[15px] font-bold tabular-nums">
              {i < 3 ? medal[i] : <span className="text-[var(--muted)]">{i + 1}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{u.unit}</div>
              <div className="truncate text-[10.5px] text-[var(--muted)]">{u.directorate} · {fmt(u.jumlah)} karyawan</div>
            </div>
            <div className="hidden w-40 sm:block"><ProgressBar value={u.completeness} tone="gold" /></div>
            <div className="w-12 text-right text-[15px] font-bold tabular-nums gold-gradient">{pct(u.completeness)}</div>
          </div>
        ))}
        {list.length === 0 && <div className="py-6 text-center text-[12px] text-[var(--muted)]">Belum ada data unit kerja.</div>}
      </div>
    </Card>
  );
}

// ---- One Direktorat: gauges + unit table --------------------------------------
function DirectorateSection({ d }: { d: DirectorateProgress }) {
  const [open, setOpen] = useState(true);
  return (
    <Card>
      <button onClick={() => setOpen((v) => !v)} className="mb-3 flex w-full items-center gap-3 text-left">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-royal-500 to-royal-700 text-white shadow-glow">
          <Icon.users className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <div className="text-[14px] font-bold">{d.directorate}</div>
          <div className="text-[11px] text-[var(--muted)]">{fmt(d.jumlah)} karyawan · {d.units.length} unit kerja · kelengkapan {pct(d.completeness)}</div>
        </div>
        <Icon.chevron className={cn("h-4 w-4 text-[var(--muted)] transition-transform", open && "rotate-90")} />
      </button>

      {open && (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {METRICS.map((m) => <MetricGauge key={m.key} label={m.label} agg={d.metrics[m.key]} available={m.available} />)}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-[12px]">
              <thead>
                <tr className="border-b text-left text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  <th className="py-2 pr-2">Unit Kerja</th>
                  <th className="px-2 text-right">Jumlah</th>
                  {METRICS.map((m) => <th key={m.key} className="px-2 text-center">{m.short}</th>)}
                </tr>
              </thead>
              <tbody>
                {d.units.map((u) => (
                  <tr key={u.unit} className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="py-2 pr-2 font-medium">{u.unit}</td>
                    <td className="px-2 text-right tabular-nums text-[var(--muted)]">{fmt(u.jumlah)}</td>
                    {METRICS.map((m) => <MetricCell key={m.key} agg={u.metrics[m.key]} available={m.available} />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
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
