"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { LiveBadge } from "@/components/LiveBadge";
import { useLocalState } from "@/lib/useLocalState";
import { apiListPendingCostActivities, apiSaveCostActivity, hasSession } from "@/lib/api";
import { costActivitiesSeed } from "@/lib/costOptSeed";
import {
  rupiah, plannedTotal, realizedTotal, variancePct, evidenceCompletion, statusTone,
  type Activity, type ActivityStatus,
} from "@/lib/costOpt";
import { useI18n } from "@/lib/i18n";

/** The two states that are actually waiting on somebody. */
const AWAITING: ActivityStatus[] = ["Waiting Approval", "LPJ Review"];

export default function CostApprovalsPage() {
  const { t } = useI18n();
  // Shares the Cost Optimization cache, so a decision here is reflected there
  // immediately even before the next server read.
  const [activities, setActivities] = useLocalState<Activity[]>("cost-activities", costActivitiesSeed);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSession()) return;
    let alive = true;
    apiListPendingCostActivities()
      .then((pending) => {
        if (!alive) return;
        setLive(true);
        if (!pending.length) return;
        // Merge rather than replace: this endpoint returns only the queue, and
        // the cache also holds everything not awaiting a decision.
        setActivities((prev) => {
          const byId = new Map(prev.map((a) => [a.id, a]));
          pending.forEach((a) => byId.set(a.id, a));
          return Array.from(byId.values());
        });
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queue = activities.filter((a) => AWAITING.includes(a.status));

  const decide = (a: Activity, status: ActivityStatus, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    const next: Activity = { ...a, status };
    setBusy(a.id);
    setActivities((prev) => prev.map((x) => (x.id === a.id ? next : x)));
    if (hasSession()) {
      apiSaveCostActivity(next)
        .catch((e: { status?: number }) =>
          alert(
            e?.status === 403
              ? "Ditolak server: hanya peran dengan cost.manage yang dapat memutuskan persetujuan."
              : "Gagal menyimpan ke server; perubahan tersimpan lokal saja."
          )
        )
        .finally(() => setBusy(null));
    } else {
      setBusy(null);
    }
  };

  return (
    <>
      <Link href="/cost-optimization" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Cost Optimization")}
      </Link>
      <PageHeader
        title="Antrean Persetujuan"
        subtitle="Proposal & LPJ yang menunggu keputusan Anda"
        actions={<LiveBadge live={live} />}
      />

      {queue.length === 0 ? (
        <Card className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-center">
          <Icon.check className="h-8 w-8 text-emerald-500" />
          <div className="text-[14px] font-semibold">{t("Tidak ada yang menunggu keputusan")}</div>
          <div className="text-[12px] text-[var(--muted)]">{t("Semua proposal dan LPJ sudah diproses.")}</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {queue.map((a) => {
            const planned = plannedTotal(a);
            const realized = realizedTotal(a);
            const variance = variancePct(a);
            const evidence = evidenceCompletion(a);
            const isLpj = a.status === "LPJ Review";
            const pending = busy === a.id;

            return (
              <Card key={a.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                      <span className="text-[11px] text-[var(--muted)]">{a.refNo}</span>
                    </div>
                    <div className="mt-1 text-[15px] font-semibold leading-snug">{a.nama}</div>
                    <div className="text-[12px] text-[var(--muted)]">
                      {a.jenis} · {a.tanggal || "—"} · {a.penanggungJawab || "—"}
                    </div>
                  </div>
                  <Link href={`/cost-optimization?activity=${encodeURIComponent(a.id)}`} className="text-[12px] text-royal-400 transition hover:text-royal-300">
                    {t("Lihat detail")} →
                  </Link>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-[12px] sm:grid-cols-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{t("Rencana")}</div>
                    <div className="font-semibold">{rupiah(planned)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{t("Realisasi")}</div>
                    <div className="font-semibold">{rupiah(realized)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{t("Selisih")}</div>
                    <div className={`font-semibold ${Math.abs(variance) > 5 ? "text-rose-400" : "text-emerald-500"}`}>
                      {variance > 0 ? "+" : ""}{variance}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{t("Evidence")}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{evidence}%</span>
                      <div className="w-14"><ProgressBar value={evidence} tone={evidence === 100 ? "green" : "gold"} /></div>
                    </div>
                  </div>
                </div>

                {/* An LPJ can only close with complete evidence — the module's own rule. */}
                {isLpj && evidence < 100 && (
                  <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-500">
                    {t("Evidence belum lengkap — sebaiknya dikembalikan untuk dilengkapi sebelum ditutup.")}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap justify-end gap-2 border-t pt-3">
                  {isLpj ? (
                    <>
                      <Btn onClick={() => decide(a, "In Progress")} disabled={pending}>{t("Kembalikan")}</Btn>
                      <Btn variant="gold" onClick={() => decide(a, "Closed", `${t("Setujui LPJ dan tutup")} ${a.refNo}?`)} disabled={pending}>
                        {t("Setujui LPJ & Tutup")}
                      </Btn>
                    </>
                  ) : (
                    <>
                      <Btn onClick={() => decide(a, "Need Revision")} disabled={pending}>{t("Minta Revisi")}</Btn>
                      <Btn onClick={() => decide(a, "Rejected", `${t("Tolak proposal")} ${a.refNo}?`)} disabled={pending}>{t("Tolak")}</Btn>
                      <Btn variant="primary" onClick={() => decide(a, "In Progress")} disabled={pending}>{t("Setujui Proposal")}</Btn>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
