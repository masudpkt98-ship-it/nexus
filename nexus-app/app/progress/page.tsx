"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/components/ui";
import { useLocalState } from "@/lib/useLocalState";
import { employees as employeeSeed, type Employee } from "@/lib/data";
import { type SnapshotMeta, getSnapshot, type Snapshot } from "@/lib/snapshotStore";
import { cleanRows, buildIndex, periodLabel, type Period } from "@/lib/perfMonitor";
import { metricStatuses, type MetricKey, type MetricStatus } from "@/lib/perfProgress";
import { IndividuStatusCard, type IndividuPerson } from "@/components/progress/IndividuStatusCard";
import { PIN_KEY, type PinMap, verifyPin } from "@/lib/progressPins";
import { apiLookupProgress } from "@/lib/api";

function ProgressPortal() {
  const params = useSearchParams();
  const [directory] = useLocalState<Employee[]>("employees", employeeSeed);
  const [pins] = useLocalState<PinMap>(PIN_KEY, {});
  const [index] = useLocalState<SnapshotMeta[]>("perf-snapshot-index", []);

  const [npk, setNpk] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [authed, setAuthed] = useState<IndividuPerson | null>(null);
  const [statuses, setStatuses] = useState<Record<MetricKey, MetricStatus> | null>(null);
  const [periodText, setPeriodText] = useState("");

  // Prefill from a scanned QR / shared link (?npk=…&pin=…).
  useEffect(() => {
    const qn = params.get("npk"); if (qn) setNpk(qn);
    const qp = params.get("pin"); if (qp) setPin(qp);
  }, [params]);

  // Local fallback: most recent snapshot carrying Planning/Appraisal data.
  useEffect(() => {
    let live = true;
    const sorted = [...index].sort((a, b) => b.year - a.year || b.value - a.value);
    (async () => {
      for (const m of sorted) {
        if (!m.datasets.planning && !m.datasets.appraisal) continue;
        const s = await getSnapshot(m.id).catch(() => null);
        if (s && (s.planning || s.appraisal)) { if (live) setSnap(s); return; }
      }
      if (live) setSnap(null);
    })();
    return () => { live = false; };
  }, [index]);

  const localPeriod: Period = snap ? { gran: snap.gran, value: snap.value } : { gran: "Tahunan", value: 0 };
  const pIdx = useMemo(() => (snap?.planning ? buildIndex("planning", cleanRows("planning", snap.planning)) : new Map()), [snap]);
  const aIdx = useMemo(() => (snap?.appraisal ? buildIndex("appraisal", cleanRows("appraisal", snap.appraisal)) : new Map()), [snap]);

  const runLookup = useCallback(async (npk0: string, pin0: string) => {
    setError(null);
    const n = npk0.trim();
    const pn = pin0.trim();
    if (!n || !pn) { setError("Isi NPK dan PIN."); return; }

    setLoading(true);
    // 1) Backend first — works from any device once admin has published.
    const remote = await apiLookupProgress(n, pn);
    if (remote.ok) {
      setLoading(false);
      setPeriodText(remote.data.period);
      setStatuses(remote.data.metrics as unknown as Record<MetricKey, MetricStatus>);
      setAuthed({
        npk: n, name: remote.data.name || "—", position: remote.data.position || "",
        unit: remote.data.unit || "", directorate: remote.data.directorate || "", compartment: remote.data.compartment || "",
      });
      return;
    }

    // 2) Local fallback (same browser/deployment where data was imported).
    const src = (snap?.directory ?? directory).find((x) => String(x.npk ?? "").trim() === n);
    if (verifyPin(pins, n, pn) && src) {
      setLoading(false);
      setPeriodText(`${snap?.year ?? ""} · ${periodLabel(localPeriod)}`);
      setStatuses(metricStatuses(pIdx.get(n), aIdx.get(n), localPeriod));
      setAuthed({
        npk: n, name: String(src.name ?? "").trim() || "—", position: String(src.position ?? "").trim(),
        unit: String(src.unit ?? "").trim(), directorate: String(src.directorate ?? "").trim(), compartment: String(src.compartment ?? "").trim(),
      });
      return;
    }

    setLoading(false);
    setError(remote.status === 403 ? remote.message : "NPK atau PIN salah, atau akses belum diaktifkan admin.");
  }, [snap, pIdx, aIdx, directory, pins, localPeriod]);

  const submit = (e: React.FormEvent) => { e.preventDefault(); runLookup(npk, pin); };

  // Scanned a QR with ?npk=&pin= → look up automatically (once).
  const autoRef = useRef(false);
  useEffect(() => {
    if (autoRef.current) return;
    const qn = params.get("npk");
    const qp = params.get("pin");
    if (qn && qp) { autoRef.current = true; runLookup(qn, qp); }
  }, [params, runLookup]);

  const reset = () => { setAuthed(null); setStatuses(null); setPin(""); setError(null); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-royal-700 via-royal-600 to-gold-600 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3 text-white">
          <LogoMark size={38} />
          <div>
            <div className="text-[15px] font-bold tracking-[0.2em]">NEXUS</div>
            <div className="text-[11px] tracking-wider text-white/80">Performance Management · Progress Individu</div>
          </div>
        </div>

        {!authed || !statuses ? (
          <div className="mx-auto max-w-md rounded-2xl border border-white/20 bg-white/95 p-6 shadow-glow dark:bg-[rgb(var(--surface))]">
            <h1 className="text-[18px] font-bold">Cek Progress KPI Anda</h1>
            <p className="mt-1 text-[12px] text-[var(--muted)]">Masukkan NPK dan PIN akses (tanpa perlu login). PIN disediakan oleh admin Bagian Manajemen Kompetensi &amp; Kinerja Dept. MPSDM.</p>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">NPK</label>
                <input value={npk} onChange={(e) => setNpk(e.target.value)} inputMode="numeric" placeholder="mis. 4254850"
                  className="mt-1 w-full rounded-xl border bg-[rgb(var(--surface))] px-3 py-2.5 text-[14px] outline-none focus:border-royal-500" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">PIN</label>
                <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" placeholder="6 digit"
                  className="mt-1 w-full rounded-xl border bg-[rgb(var(--surface))] px-3 py-2.5 text-[14px] outline-none focus:border-royal-500" />
              </div>
              {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-500">{error}</div>}
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-royal-500 to-gold-500 py-2.5 text-[14px] font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-60">
                {loading ? "Memuat…" : "Lihat Progress"}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/95 p-5 shadow-glow dark:bg-[rgb(var(--surface))]">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[12px] text-[var(--muted)]">Periode: <span className="font-semibold text-[var(--text)]">{periodText}</span></div>
              <button onClick={reset} className="text-[12px] font-medium text-royal-500 hover:underline">Ganti karyawan</button>
            </div>
            <IndividuStatusCard person={authed} statuses={statuses} />
            <div className="mt-5 rounded-xl border border-[var(--muted)]/20 bg-[rgb(var(--surface))] p-4 text-[11.5px] text-[var(--muted)]">
              <div className="font-semibold text-[var(--text)]">Important Notes</div>
              <p className="mt-1">Data diperbarui berkala sesuai keterangan periode di atas. Bila pengisian belum lengkap, mohon dilengkapi untuk keperluan Kalibrasi.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProgressPortalPage() {
  return (
    <Suspense fallback={<div className={cn("min-h-screen bg-gradient-to-br from-royal-700 to-gold-600")} />}>
      <ProgressPortal />
    </Suspense>
  );
}
