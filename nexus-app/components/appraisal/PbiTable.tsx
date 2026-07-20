"use client";

import React from "react";
import { cn } from "@/components/ui";
import { PBI_CATALOG, type PbiScoreMap, type PbiScore, pbiKey } from "@/lib/perfAppraisal";

const num = (v: number) => (v || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });

function TipeBadge({ tipe }: { tipe: string }) {
  return (
    <span className="inline-flex gap-1 font-bold">
      {tipe.split(" ").map((t) => (
        <span key={t} className={t === "R" ? "text-emerald-500" : "text-rose-500"}>{t}</span>
      ))}
    </span>
  );
}

// PBI (Performance Behaviour Indicator) scoring — seeded catalog, per-unit
// editable Reward / Punishment / Skor PBI. Final score folds in KPI achievement.
export function PbiTable({
  unitKey, scores, onChange, finalPct,
}: {
  unitKey: string;
  scores: PbiScoreMap;
  onChange: (pbiId: string, field: keyof PbiScore, value: number) => void;
  finalPct: number;
}) {
  const fungsiOrder = Array.from(new Set(PBI_CATALOG.map((p) => p.fungsi)));
  let totalSkor = 0;
  for (const p of PBI_CATALOG) totalSkor += scores[pbiKey(unitKey, p.id)]?.skor || 0;

  const inputCls = "w-16 rounded border bg-[rgb(var(--surface))] px-1.5 py-1 text-right text-[12px] outline-none focus:border-royal-500";

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[820px] text-[12.5px]">
        <thead>
          <tr className="bg-gradient-to-r from-royal-700 to-royal-600 text-left text-white">
            <th className="px-3 py-3 font-semibold">Fungsi</th>
            <th className="px-3 py-3 font-semibold">No</th>
            <th className="px-3 py-3 font-semibold">PBI</th>
            <th className="px-3 py-3 text-center font-semibold">Tipe</th>
            <th className="px-3 py-3 text-center font-semibold">Range Skor PBI</th>
            <th className="px-3 py-3 text-right font-semibold">Reward</th>
            <th className="px-3 py-3 text-right font-semibold">Punishment</th>
            <th className="px-3 py-3 text-right font-semibold">Skor PBI</th>
          </tr>
        </thead>
        <tbody>
          {fungsiOrder.map((fungsi) => {
            const rows = PBI_CATALOG.filter((p) => p.fungsi === fungsi);
            return (
              <React.Fragment key={fungsi}>
                {rows.map((p, i) => {
                  const sc = scores[pbiKey(unitKey, p.id)] ?? {};
                  return (
                    <tr key={p.id} className="border-b align-top hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                      {i === 0 && <td rowSpan={rows.length} className="border-r px-3 py-3 font-semibold">{fungsi}</td>}
                      <td className="px-3 py-3 text-[var(--muted)]">{PBI_CATALOG.indexOf(p) + 1}</td>
                      <td className="px-3 py-3 font-medium">{p.pbi}</td>
                      <td className="px-3 py-3 text-center"><TipeBadge tipe={p.tipe} /></td>
                      <td className="px-3 py-3 text-center font-medium text-[var(--muted)]">{p.range}</td>
                      <td className="px-3 py-3 text-right">
                        <input type="number" value={sc.reward ?? ""} onChange={(e) => onChange(p.id, "reward", Number(e.target.value))} className={inputCls} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input type="number" value={sc.punishment ?? ""} onChange={(e) => onChange(p.id, "punishment", Number(e.target.value))} className={inputCls} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input type="number" value={sc.skor ?? ""} onChange={(e) => onChange(p.id, "skor", Number(e.target.value))} className={cn(inputCls, "font-bold")} />
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-royal-600 text-white">
            <td className="px-3 py-2 text-right text-[13px] font-semibold" colSpan={7}>Total Skor PBI</td>
            <td className="px-3 py-2 text-right text-[13px] font-bold">{num(totalSkor)}</td>
          </tr>
          <tr className="bg-royal-700 text-white">
            <td className="px-3 py-2 text-right text-[13px] font-semibold" colSpan={7}>Pencapaian Skor Final KPI (%)</td>
            <td className="px-3 py-2 text-right"><span className="inline-block rounded-md bg-emerald-500 px-2 py-0.5 text-[13px] font-bold text-white">{num(finalPct)}</span></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
