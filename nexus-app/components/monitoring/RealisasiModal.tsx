"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Btn } from "@/components/PageHeader";
import { Icon } from "@/components/Icons";
import { cn } from "@/components/ui";
import { type PlanningKpi } from "@/lib/data";
import {
  type PeriodSel, type RealizationEntry, type EvidenceType,
  periodLabel, periodLongLabel, periodTarget, achievementRatio,
} from "@/lib/perfRealization";

const fmt = (v: number) => (v || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });

export function RealisasiModal({
  kpi, sel, entry, createdByDefault, onSave, onClose,
}: {
  kpi: PlanningKpi;
  sel: PeriodSel;
  entry?: RealizationEntry;
  createdByDefault?: string;
  onSave: (e: RealizationEntry) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [value, setValue] = useState<string>(entry ? String(entry.value) : "");
  const [evType, setEvType] = useState<EvidenceType | "">(entry?.evidenceType ?? "");
  const [evidence, setEvidence] = useState(entry?.evidence ?? "");
  const [evName, setEvName] = useState(entry?.evidenceName ?? "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const target = periodTarget(kpi, sel);
  const real = Number(value) || 0;
  const ratio = value.trim() ? achievementRatio(real, target, kpi.polarity || "Maximize") : 0;
  const pct = Math.round(ratio * 100);
  const capped = Math.max(0, Math.min(100, pct));

  const onFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) { alert("File terlalu besar (maks 2MB). Untuk file besar gunakan Share Link."); return; }
    const reader = new FileReader();
    reader.onload = () => { setEvidence(String(reader.result)); setEvName(file.name); };
    reader.readAsDataURL(file);
  };
  const switchEv = (t: EvidenceType | "") => { setEvType(t); setEvidence(""); setEvName(""); };

  const save = () => {
    if (!value.trim()) { alert("Isi nilai Realisasi terlebih dulu."); return; }
    onSave({
      value: real,
      evidenceType: evType || undefined,
      evidence: evidence || undefined,
      evidenceName: evName || undefined,
      note: note.trim() || undefined,
      createdBy: entry?.createdBy || createdByDefault || undefined,
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
  };

  const node = (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-[rgb(var(--surface))] shadow-glass animate-slide-in-right">
        <div className="flex items-start gap-2 border-b p-4">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium uppercase tracking-wide text-royal-400">Realisasi</div>
            <div className="truncate text-[15px] font-semibold">{kpi.name}</div>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg bg-rose-500/90 px-2 py-1 text-white transition hover:bg-rose-500" aria-label="Close">✕</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <label className="block text-[12px] font-medium text-[var(--muted)]">Periode
            <input value={periodLabel(sel)} readOnly className="mt-1 w-full rounded-lg border bg-black/[0.03] px-3 py-2 text-[13px] dark:bg-white/[0.03]" />
          </label>

          <div>
            <div className="text-[11px] font-medium text-[var(--muted)]">Capaian</div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-emerald-500" : "bg-royal-500")} style={{ width: `${capped}%` }} />
            </div>
            <div className="mt-1.5 text-[12px]">
              <span className="font-medium text-[var(--muted)]">Dari target Pada {periodLongLabel(sel)}</span>{" "}
              <span className="text-[18px] font-bold text-royal-500">{fmt(target)}</span> <span className="text-[var(--muted)]">{kpi.unit}</span>
            </div>
          </div>

          <label className="block text-[12px] font-medium text-[var(--muted)]">Realisasi
            <div className="mt-1 flex overflow-hidden rounded-lg border focus-within:border-royal-500">
              <input
                value={value}
                onChange={(e) => { setValue(e.target.value); setSaved(false); }}
                inputMode="decimal"
                placeholder={`Realisasi (dalam ${kpi.unit})`}
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[14px] outline-none"
              />
              <span className="flex items-center border-l bg-black/[0.03] px-3 text-[13px] text-[var(--muted)] dark:bg-white/[0.03]">{kpi.unit}</span>
            </div>
          </label>

          <div>
            <div className="text-[12px] font-medium text-[var(--muted)]">Evidence Attachment</div>
            <select value={evType} onChange={(e) => switchEv(e.target.value as EvidenceType | "")} className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
              <option value="">Pilih Jenis</option>
              <option value="upload">Upload File</option>
              <option value="link">Share Link</option>
            </select>
            {evType === "link" && (
              <input value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="https://…" className="mt-2 w-full rounded-lg border bg-[rgb(var(--surface))] px-3 py-2 text-[13px] outline-none focus:border-royal-500" />
            )}
            {evType === "upload" && (
              <div className="mt-2">
                <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                <Btn variant="ghost" onClick={() => fileRef.current?.click()}><Icon.document className="h-4 w-4" /> {evName || "Pilih file (maks 2MB)"}</Btn>
                {evName && <span className="ml-2 text-[11px] text-emerald-500">✓ terlampir</span>}
              </div>
            )}
          </div>

          <label className="block text-[12px] font-medium text-[var(--muted)]">Deskripsi <span className="font-normal">(opsional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Catatan realisasi…" className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-3 py-2 text-[13px] outline-none focus:border-royal-500" />
          </label>

          {saved && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] font-medium text-emerald-500">
              <Icon.check className="h-4 w-4" /> Data berhasil disimpan.
            </div>
          )}

          {entry && (
            <div className="border-t pt-4">
              <div className="text-center text-[14px] font-semibold">Riwayat Penilaian</div>
              <div className="mt-0.5 text-center text-[13px] font-medium text-[var(--muted)]">Pencapaian KPI {periodLongLabel(sel)}</div>
              <div className="mt-3 text-[12px] text-[var(--muted)]">
                Created By {entry.createdBy || "—"}
                {entry.createdAt && <div>{new Date(entry.createdAt).toLocaleString("id-ID")}</div>}
                {entry.note && <div className="mt-1">Deskripsi: {entry.note}</div>}
              </div>
              {(() => {
                const r = achievementRatio(entry.value, target, kpi.polarity || "Maximize");
                const p = Math.round(r * 100);
                const c = Math.max(0, Math.min(100, p));
                return (
                  <>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-medium">
                      <span className="text-[var(--muted)]">Pencapaian</span><span className={p >= 100 ? "text-emerald-500" : "text-[var(--muted)]"}>{p}%</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <div className={cn("h-full rounded-full", p >= 100 ? "bg-emerald-500" : "bg-royal-500")} style={{ width: `${c}%` }} />
                    </div>
                  </>
                );
              })()}
              <div className="mt-2 text-[13px]">
                Realisasi s.d. {periodLongLabel(sel)} {sel.year}: <span className="text-[16px] font-bold text-royal-500">{fmt(entry.value)}</span> {kpi.unit}{" "}
                <span className="text-[var(--muted)]">dari target {fmt(target)} {kpi.unit}</span>
              </div>
              {entry.evidence && (
                <a href={entry.evidence} target="_blank" rel="noreferrer" download={entry.evidenceType === "upload" ? entry.evidenceName : undefined}
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-royal-400 hover:underline">
                  <Icon.document className="h-3.5 w-3.5" /> {entry.evidenceName || entry.evidence}
                </a>
              )}
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <Btn variant="primary" className="w-full justify-center" onClick={save}>Simpan Realisasi</Btn>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(node, document.body);
}
