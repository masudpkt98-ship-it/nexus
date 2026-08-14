"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, ProgressBar, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { hasSession, apiListCostActivities, apiSaveCostActivity } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { costActivitiesSeed } from "@/lib/costOptSeed";
import {
  ACTIVITY_TYPES, BUDGET_COMPONENTS, PAYMENT_METHODS, PROPOSAL_ATTACHMENTS,
  EVIDENCE_CATEGORIES, GOVERNANCE_KPIS,
  rupiah, budgetLineTotal, plannedTotal, realizedTotal, variancePct,
  evidenceCompletion, evidenceKey, nextRefNo, newActivity, statusTone,
  type Activity, type ActivityStatus, type BudgetComponent, type BudgetLine,
  type PaymentMethod, type Realization, type TravelDetail,
} from "@/lib/costOpt";

const inputCls = "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "text-[11px] font-medium text-[var(--muted)]";
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export default function CostOptimizationPage() {
  const { t } = useI18n();
  const [activities, setActivities] = useLocalState<Activity[]>("cost-activities", costActivitiesSeed);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<ActivityStatus | "All">("All");

  const open = activities.find((a) => a.id === openId) || null;

  // Activities are server-backed. The page saves an activity as one whole
  // document (status changes and evidence ticks take the same path), so the sync
  // sends the whole thing and stays idempotent.
  useEffect(() => {
    if (!hasSession()) return;
    let active = true;
    apiListCostActivities()
      .then((d) => { if (active && d.length) setActivities(d); })
      .catch(() => {});
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upsert = (a: Activity) => {
    setActivities((prev) => (prev.some((x) => x.id === a.id) ? prev.map((x) => (x.id === a.id ? a : x)) : [a, ...prev]));
    if (hasSession()) {
      apiSaveCostActivity(a).catch((e: { status?: number }) =>
        alert(
          e?.status === 403
            ? "Ditolak server: hanya peran dengan cost.manage yang dapat mengubah kegiatan & biaya."
            : "Gagal menyimpan ke server; perubahan tersimpan lokal saja."
        )
      );
    }
  };

  // AVP dashboard metrics.
  const waitingProposals = activities.filter((a) => a.status === "Waiting Approval").length;
  const lpjReview = activities.filter((a) => a.status === "LPJ Review").length;
  const outstandingLpj = activities.filter((a) => a.status === "In Progress").length;
  const budgetUsed = activities.reduce((s, a) => s + realizedTotal(a), 0);
  const budgetPlanned = activities.reduce((s, a) => s + plannedTotal(a), 0);
  const budgetRemaining = Math.max(0, budgetPlanned - budgetUsed);

  // Governance KPI live values.
  const closed = activities.filter((a) => a.status === "Closed");
  const evidenceAvg = activities.length
    ? Math.round(activities.reduce((s, a) => s + evidenceCompletion(a), 0) / activities.length)
    : 0;
  const avgVariance = closed.length
    ? Math.round((closed.reduce((s, a) => s + Math.abs(variancePct(a)), 0) / closed.length) * 10) / 10
    : 0;
  const kpiValues = [95, 96, evidenceAvg, avgVariance, outstandingLpj, 0];

  const shown = activities.filter((a) => filter === "All" || a.status === filter);

  return (
    <>
      <PageHeader
        title="Cost Optimization"
        subtitle="Sistem Pengelolaan Kegiatan & Biaya — Simple Process, Complete Evidence"
        actions={
          <Btn variant="primary" onClick={() => setCreating(true)}>
            <Icon.plus className="h-4 w-4" /> {t("New Activity")}
          </Btn>
        }
      />

      {/* AVP Dashboard */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon="clock" tone="amber" label="Proposal Menunggu Persetujuan" value={String(waitingProposals)} />
        <Metric icon="alert" tone="amber" label="LPJ Belum Diverifikasi" value={String(lpjReview)} />
        <Metric icon="analytics" tone="blue" label="Budget Terpakai" value={rupiah(budgetUsed)} sub={`Sisa ${rupiah(budgetRemaining)}`} />
        <Metric icon="task" tone="red" label="Outstanding (Belum LPJ)" value={`${outstandingLpj} kegiatan`} />
      </div>

      {/* Governance KPI strip */}
      <Card className="mt-4 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Icon.target className="h-4 w-4 text-royal-400" /> {t("KPI Pengelolaan")}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {GOVERNANCE_KPIS.map((k, i) => {
            const v = kpiValues[i];
            const ok = k.good(v);
            const display = k.target.includes("%") ? `${v}%` : String(v);
            return (
              <div key={k.kpi} className="rounded-lg border p-3">
                <div className="text-[11px] leading-tight text-[var(--muted)]">{k.kpi}</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className={cn("text-lg font-bold", ok ? "text-emerald-500" : "text-rose-500")}>{display}</span>
                  <span className="text-[10px] text-[var(--muted)]">{k.target}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Filter + activity list */}
      <div className="mt-5 mb-3 flex flex-wrap items-center gap-1.5">
        {(["All", "Draft", "Waiting Approval", "Need Revision", "In Progress", "LPJ Review", "Closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] transition",
              filter === f ? "border-royal-500 bg-royal-500/10 text-royal-400" : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/5",
            )}
          >
            {t(f)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {shown.map((a) => {
          const plan = plannedTotal(a);
          const real = realizedTotal(a);
          return (
            <button
              key={a.id}
              onClick={() => setOpenId(a.id)}
              className="glass card flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-royal-500/10 px-1.5 py-0.5 font-mono text-[10px] text-royal-400">{a.refNo}</span>
                  <Badge tone="gray">{a.jenis}</Badge>
                </div>
                <div className="mt-1 truncate text-sm font-semibold">{a.nama}</div>
                <div className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                  {a.penanggungJawab} · {a.tanggal || "—"} · {a.lokasi || "—"}
                </div>
              </div>
              <div className="hidden w-40 shrink-0 sm:block">
                <div className="flex justify-between text-[10px] text-[var(--muted)]">
                  <span>Realisasi</span><span>{plan ? Math.round((real / plan) * 100) : 0}%</span>
                </div>
                <ProgressBar value={plan ? (real / plan) * 100 : 0} tone={real > plan ? "red" : "green"} />
                <div className="mt-1 text-right text-[10px] text-[var(--muted)]">{rupiah(real)} / {rupiah(plan)}</div>
              </div>
              <Badge tone={statusTone(a.status)}>{t(a.status)}</Badge>
            </button>
          );
        })}
        {!shown.length && <Card className="p-8 text-center text-sm text-[var(--muted)]">{t("Belum ada kegiatan pada status ini.")}</Card>}
      </div>

      {creating && (
        <ProposalModal
          activity={newActivity(nextRefNo(activities, new Date().getFullYear()), new Date().toISOString().slice(0, 10))}
          onClose={() => setCreating(false)}
          onSave={(a) => { upsert(a); setCreating(false); setOpenId(a.id); }}
        />
      )}

      {open && (
        <DetailDrawer
          activity={open}
          onClose={() => setOpenId(null)}
          onChange={upsert}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
function Metric({ icon, tone, label, value, sub }: { icon: keyof typeof Icon; tone: "amber" | "blue" | "red" | "green"; label: string; value: string; sub?: string }) {
  const { t } = useI18n();
  const IconCmp = Icon[icon];
  const toneCls = tone === "amber" ? "text-gold-500 bg-gold-400/10" : tone === "blue" ? "text-royal-400 bg-royal-500/10" : tone === "red" ? "text-rose-500 bg-rose-500/10" : "text-emerald-500 bg-emerald-500/10";
  return (
    <Card className="p-4">
      <div className={cn("mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg", toneCls)}>
        <IconCmp className="h-4 w-4" />
      </div>
      <div className="text-[11px] text-[var(--muted)]">{t(label)}</div>
      <div className="mt-0.5 text-lg font-bold">{value}</div>
      {sub && <div className="text-[11px] text-[var(--muted)]">{sub}</div>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Modul 1 — Proposal form (create / edit).
function ProposalModal({ activity, onClose, onSave }: { activity: Activity; onClose: () => void; onSave: (a: Activity) => void }) {
  const { t } = useI18n();
  const [a, setA] = useState<Activity>(activity);
  const set = <K extends keyof Activity>(k: K, v: Activity[K]) => setA((p) => ({ ...p, [k]: v }));
  const [travelOn, setTravelOn] = useState(!!activity.travel);

  const setLine = (i: number, patch: Partial<BudgetLine>) =>
    set("budget", a.budget.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => set("budget", [...a.budget, { component: "Lain-lain", qty: 1, price: 0 }]);
  const rmLine = (i: number) => set("budget", a.budget.filter((_, idx) => idx !== i));

  const total = plannedTotal({ ...a, travel: travelOn ? a.travel : null });
  const travel: TravelDetail = a.travel || { kotaTujuan: "", tglBerangkat: "", tglPulang: "", moda: "Pesawat", personel: 1, tiket: 0, hotel: 0, uangHarian: 0, taksi: 0, tol: 0, parkir: 0 };
  const setTravel = (patch: Partial<TravelDetail>) => set("travel", { ...travel, ...patch });

  const toggleAttach = (name: string) =>
    set("attachments", a.attachments.includes(name) ? a.attachments.filter((x) => x !== name) : [...a.attachments, name]);

  const submit = (status: ActivityStatus) => onSave({ ...a, travel: travelOn ? travel : null, status });

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div>
          <div className="text-sm font-bold">{t("Pengajuan Proposal")} — {a.refNo}</div>
          <div className="text-[11px] text-[var(--muted)]">{t("Modul 1 · One Activity = One Proposal = One LPJ")}</div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5"><Icon.chevron className="h-4 w-4 rotate-90" /></button>
      </div>

      <div className="space-y-5 overflow-y-auto px-5 py-4">
        {/* A. Informasi Kegiatan */}
        <Section title="A. Informasi Kegiatan">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nama Kegiatan" className="sm:col-span-2"><input className={inputCls} value={a.nama} onChange={(e) => set("nama", e.target.value)} /></Field>
            <Field label="Jenis Kegiatan">
              <select className={inputCls} value={a.jenis} onChange={(e) => set("jenis", e.target.value as Activity["jenis"])}>
                {ACTIVITY_TYPES.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Tanggal"><input type="date" className={inputCls} value={a.tanggal} onChange={(e) => set("tanggal", e.target.value)} /></Field>
            <Field label="Tujuan" className="sm:col-span-2"><input className={inputCls} value={a.tujuan} onChange={(e) => set("tujuan", e.target.value)} /></Field>
            <Field label="Latar Belakang" className="sm:col-span-2"><textarea rows={2} className={inputCls} value={a.latarBelakang} onChange={(e) => set("latarBelakang", e.target.value)} /></Field>
            <Field label="Output yang Diharapkan" className="sm:col-span-2"><input className={inputCls} value={a.output} onChange={(e) => set("output", e.target.value)} /></Field>
            <Field label="Lokasi"><input className={inputCls} value={a.lokasi} onChange={(e) => set("lokasi", e.target.value)} /></Field>
            <Field label="Penanggung Jawab"><input className={inputCls} value={a.penanggungJawab} onChange={(e) => set("penanggungJawab", e.target.value)} /></Field>
            <Field label="Peserta" className="sm:col-span-2"><input className={inputCls} value={a.peserta} onChange={(e) => set("peserta", e.target.value)} /></Field>
          </div>
        </Section>

        {/* B. Estimasi Anggaran */}
        <Section title="B. Estimasi Anggaran">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead><tr className="text-left text-[var(--muted)]">
                <th className="py-1 font-medium">Komponen</th><th className="font-medium">Qty</th><th className="font-medium">Harga</th><th className="text-right font-medium">Total</th><th></th>
              </tr></thead>
              <tbody>
                {a.budget.map((l, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1 pr-2">
                      <select className="w-full rounded border bg-transparent px-1.5 py-1" value={l.component} onChange={(e) => setLine(i, { component: e.target.value as BudgetComponent })}>
                        {BUDGET_COMPONENTS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="pr-2"><input type="number" className="w-16 rounded border bg-transparent px-1.5 py-1" value={l.qty} onChange={(e) => setLine(i, { qty: +e.target.value })} /></td>
                    <td className="pr-2"><input type="number" className="w-28 rounded border bg-transparent px-1.5 py-1" value={l.price} onChange={(e) => setLine(i, { price: +e.target.value })} /></td>
                    <td className="text-right tabular-nums">{rupiah(budgetLineTotal(l))}</td>
                    <td className="pl-2 text-right"><button onClick={() => rmLine(i)} className="text-rose-500 hover:opacity-70">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addLine} className="mt-2 text-[12px] text-royal-400 hover:underline">+ {t("Tambah Komponen")}</button>
        </Section>

        {/* C. Biaya Perjalanan Dinas */}
        <Section title="C. Biaya Perjalanan Dinas">
          <label className="flex items-center gap-2 text-[12px]">
            <input type="checkbox" checked={travelOn} onChange={(e) => setTravelOn(e.target.checked)} /> {t("Kegiatan ini termasuk perjalanan dinas")}
          </label>
          {travelOn && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Kota Tujuan"><input className={inputCls} value={travel.kotaTujuan} onChange={(e) => setTravel({ kotaTujuan: e.target.value })} /></Field>
              <Field label="Tanggal Berangkat"><input type="date" className={inputCls} value={travel.tglBerangkat} onChange={(e) => setTravel({ tglBerangkat: e.target.value })} /></Field>
              <Field label="Tanggal Pulang"><input type="date" className={inputCls} value={travel.tglPulang} onChange={(e) => setTravel({ tglPulang: e.target.value })} /></Field>
              <Field label="Moda Transportasi"><input className={inputCls} value={travel.moda} onChange={(e) => setTravel({ moda: e.target.value })} /></Field>
              <Field label="Jumlah Personel"><input type="number" className={inputCls} value={travel.personel} onChange={(e) => setTravel({ personel: +e.target.value })} /></Field>
              {(["tiket", "hotel", "uangHarian", "taksi", "tol", "parkir"] as const).map((k) => (
                <Field key={k} label={k === "uangHarian" ? "Uang Harian" : k[0].toUpperCase() + k.slice(1)}>
                  <input type="number" className={inputCls} value={travel[k]} onChange={(e) => setTravel({ [k]: +e.target.value } as Partial<TravelDetail>)} />
                </Field>
              ))}
            </div>
          )}
        </Section>

        {/* D. Lampiran */}
        <Section title="D. Lampiran Proposal">
          <div className="flex flex-wrap gap-2">
            {PROPOSAL_ATTACHMENTS.map((name) => (
              <label key={name} className={cn("flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px]", a.attachments.includes(name) ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" : "text-[var(--muted)]")}>
                <input type="checkbox" className="hidden" checked={a.attachments.includes(name)} onChange={() => toggleAttach(name)} />
                {a.attachments.includes(name) ? "✔" : "○"} {name}
              </label>
            ))}
          </div>
        </Section>

        <div className="rounded-lg bg-royal-500/10 px-4 py-3 text-sm font-semibold text-royal-400">
          {t("Total Estimasi")}: {rupiah(total)}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-5 py-3">
        <span className="text-[11px] text-[var(--muted)]">{t("Workflow")}: Staff → Supervisor → AVP → Approved</span>
        <div className="flex gap-2">
          <Btn onClick={() => submit("Draft")}>{t("Simpan Draft")}</Btn>
          <Btn variant="primary" onClick={() => submit("Waiting Approval")} disabled={!a.nama}>{t("Ajukan (Submit)")}</Btn>
        </div>
      </div>
    </Overlay>
  );
}

// ---------------------------------------------------------------------------
// Detail drawer with the 4 modules as tabs + approval actions.
const TABS = ["Proposal", "Realisasi", "Evidence", "LPJ"] as const;
type Tab = (typeof TABS)[number];

function DetailDrawer({ activity, onClose, onChange }: { activity: Activity; onClose: () => void; onChange: (a: Activity) => void }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("Proposal");
  const [editing, setEditing] = useState(false);
  const a = activity;

  const setStatus = (status: ActivityStatus) => onChange({ ...a, status });

  return (
    <>
      <Overlay onClose={onClose} wide>
        <div className="flex items-start justify-between border-b px-5 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded bg-royal-500/10 px-1.5 py-0.5 font-mono text-[10px] text-royal-400">{a.refNo}</span>
              <Badge tone={statusTone(a.status)}>{t(a.status)}</Badge>
            </div>
            <div className="mt-1 truncate text-sm font-bold">{a.nama || t("(Tanpa nama)")}</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5"><Icon.chevron className="h-4 w-4 rotate-90" /></button>
        </div>

        {/* tabs */}
        <div className="flex gap-1 border-b px-4">
          {TABS.map((x, i) => (
            <button key={x} onClick={() => setTab(x)} className={cn("relative px-3 py-2 text-[12.5px] font-medium transition", tab === x ? "text-royal-400" : "text-[var(--muted)] hover:text-[var(--text)]")}>
              <span className="mr-1 text-[10px] opacity-60">{i + 1}</span>{t(x)}
              {tab === x && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-royal-400" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "Proposal" && <ProposalView a={a} onEdit={() => setEditing(true)} />}
          {tab === "Realisasi" && <RealisasiTab a={a} onChange={onChange} />}
          {tab === "Evidence" && <EvidenceTab a={a} onChange={onChange} />}
          {tab === "LPJ" && <LpjTab a={a} onChange={onChange} />}
        </div>

        {/* Approval bar (context-sensitive) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3">
          <span className="text-[11px] text-[var(--muted)]">{approvalHint(a.status, t)}</span>
          <div className="flex gap-2">
            {a.status === "Draft" && <Btn variant="primary" onClick={() => setStatus("Waiting Approval")}>{t("Ajukan (Submit)")}</Btn>}
            {a.status === "Need Revision" && <Btn variant="primary" onClick={() => setStatus("Waiting Approval")}>{t("Ajukan Ulang")}</Btn>}
            {a.status === "Waiting Approval" && <>
              <Btn onClick={() => setStatus("Need Revision")}>{t("Perlu Revisi")}</Btn>
              <Btn onClick={() => setStatus("Rejected")}>{t("Tolak")}</Btn>
              <Btn variant="primary" onClick={() => setStatus("In Progress")}>{t("Setujui Proposal (AVP)")}</Btn>
            </>}
            {a.status === "In Progress" && <Btn variant="primary" onClick={() => setStatus("LPJ Review")}>{t("Ajukan LPJ")}</Btn>}
            {a.status === "LPJ Review" && <>
              <Btn onClick={() => setStatus("In Progress")}>{t("Kembalikan")}</Btn>
              <Btn variant="gold" onClick={() => setStatus("Closed")}>{t("Setujui LPJ & Tutup (AVP)")}</Btn>
            </>}
            {a.status === "Closed" && <Badge tone="green">✓ {t("Closed")}</Badge>}
          </div>
        </div>
      </Overlay>

      {editing && (
        <ProposalModal activity={a} onClose={() => setEditing(false)} onSave={(x) => { onChange(x); setEditing(false); }} />
      )}
    </>
  );
}

function approvalHint(s: ActivityStatus, t: (k: string) => string) {
  const map: Record<ActivityStatus, string> = {
    Draft: "Draft — belum diajukan.",
    "Waiting Approval": "Menunggu persetujuan proposal oleh AVP.",
    "Need Revision": "Dikembalikan untuk revisi.",
    Rejected: "Proposal ditolak.",
    "In Progress": "Kegiatan berjalan — input realisasi, upload evidence, lalu ajukan LPJ.",
    "LPJ Review": "Menunggu verifikasi & persetujuan LPJ oleh AVP.",
    Closed: "Kegiatan selesai & terarsip.",
  };
  return t(map[s]);
}

// ---------------------------------------------------------------------------
function ProposalView({ a, onEdit }: { a: Activity; onEdit: () => void }) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Btn onClick={onEdit}>{t("Edit Proposal")}</Btn></div>
      <Section title="A. Informasi Kegiatan">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-2">
          <Row k="Jenis" v={a.jenis} /><Row k="Tanggal" v={a.tanggal || "—"} />
          <Row k="Tujuan" v={a.tujuan || "—"} full /><Row k="Latar Belakang" v={a.latarBelakang || "—"} full />
          <Row k="Output" v={a.output || "—"} full />
          <Row k="Lokasi" v={a.lokasi || "—"} /><Row k="Penanggung Jawab" v={a.penanggungJawab || "—"} />
          <Row k="Peserta" v={a.peserta || "—"} full />
        </dl>
      </Section>
      <Section title="B. Estimasi Anggaran">
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-[var(--muted)]"><th className="py-1 font-medium">Komponen</th><th className="font-medium">Qty</th><th className="font-medium">Harga</th><th className="text-right font-medium">Total</th></tr></thead>
          <tbody>
            {a.budget.map((l, i) => (
              <tr key={i} className="border-t"><td className="py-1">{l.component}</td><td>{l.qty}</td><td>{rupiah(l.price)}</td><td className="text-right tabular-nums">{rupiah(budgetLineTotal(l))}</td></tr>
            ))}
            <tr className="border-t font-semibold"><td colSpan={3} className="py-1">{t("Total Estimasi")}</td><td className="text-right tabular-nums text-royal-400">{rupiah(plannedTotal(a))}</td></tr>
          </tbody>
        </table>
      </Section>
      {a.travel && (
        <Section title="C. Perjalanan Dinas">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-3">
            <Row k="Kota Tujuan" v={a.travel.kotaTujuan} /><Row k="Berangkat" v={a.travel.tglBerangkat} /><Row k="Pulang" v={a.travel.tglPulang} />
            <Row k="Moda" v={a.travel.moda} /><Row k="Personel" v={String(a.travel.personel)} />
          </dl>
        </Section>
      )}
      <Section title="D. Lampiran">
        <div className="flex flex-wrap gap-2">
          {PROPOSAL_ATTACHMENTS.map((name) => (
            <Badge key={name} tone={a.attachments.includes(name) ? "green" : "gray"}>{a.attachments.includes(name) ? "✔" : "○"} {name}</Badge>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modul 2 — Realisasi biaya.
function RealisasiTab({ a, onChange }: { a: Activity; onChange: (a: Activity) => void }) {
  const { t } = useI18n();
  const [f, setF] = useState<Omit<Realization, "id">>({ tanggal: "", nomorBukti: "", vendor: "", component: "Konsumsi", nominal: 0, metode: "Transfer" });
  const add = () => {
    if (!f.vendor && !f.nominal) return;
    onChange({ ...a, realizations: [...a.realizations, { ...f, id: uid() }] });
    setF({ tanggal: "", nomorBukti: "", vendor: "", component: "Konsumsi", nominal: 0, metode: "Transfer" });
  };
  const rm = (id: string) => onChange({ ...a, realizations: a.realizations.filter((r) => r.id !== id) });
  const plan = plannedTotal(a), real = realizedTotal(a);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Rencana" value={rupiah(plan)} />
        <StatCard label="Realisasi" value={rupiah(real)} />
        <StatCard label="Selisih" value={rupiah(plan - real)} tone={real > plan ? "red" : "green"} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-[var(--muted)]">
            <th className="py-1 font-medium">Tanggal</th><th className="font-medium">No. Bukti</th><th className="font-medium">Vendor</th><th className="font-medium">Komponen</th><th className="text-right font-medium">Nominal</th><th className="font-medium">Metode</th><th></th>
          </tr></thead>
          <tbody>
            {a.realizations.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-1">{r.tanggal || "—"}</td><td className="font-mono text-[11px]">{r.nomorBukti || "—"}</td><td>{r.vendor}</td>
                <td><Badge tone="gray">{r.component}</Badge></td><td className="text-right tabular-nums">{rupiah(r.nominal)}</td>
                <td>{r.metode}</td><td className="text-right"><button onClick={() => rm(r.id)} className="text-rose-500 hover:opacity-70">×</button></td>
              </tr>
            ))}
            {!a.realizations.length && <tr><td colSpan={7} className="py-4 text-center text-[var(--muted)]">{t("Belum ada realisasi.")}</td></tr>}
          </tbody>
        </table>
      </div>

      <Section title="Tambah Realisasi">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input type="date" className={inputCls} value={f.tanggal} onChange={(e) => setF({ ...f, tanggal: e.target.value })} />
          <input placeholder="No. Bukti" className={inputCls} value={f.nomorBukti} onChange={(e) => setF({ ...f, nomorBukti: e.target.value })} />
          <input placeholder="Vendor" className={inputCls} value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} />
          <select className={inputCls} value={f.component} onChange={(e) => setF({ ...f, component: e.target.value as BudgetComponent })}>{BUDGET_COMPONENTS.map((c) => <option key={c}>{c}</option>)}</select>
          <input type="number" placeholder="Nominal" className={inputCls} value={f.nominal || ""} onChange={(e) => setF({ ...f, nominal: +e.target.value })} />
          <select className={inputCls} value={f.metode} onChange={(e) => setF({ ...f, metode: e.target.value as PaymentMethod })}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select>
          <Btn variant="primary" onClick={add}>+ {t("Tambah")}</Btn>
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modul 3 — Evidence (the "heart").
function EvidenceTab({ a, onChange }: { a: Activity; onChange: (a: Activity) => void }) {
  const { t } = useI18n();
  const toggle = (key: string) =>
    onChange({ ...a, evidence: a.evidence.includes(key) ? a.evidence.filter((k) => k !== key) : [...a.evidence, key] });
  const pct = evidenceCompletion(a);
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-1 flex items-center justify-between text-[12px]"><span className="font-semibold">{t("Kelengkapan Evidence")}</span><span className={pct >= 100 ? "text-emerald-500" : "text-gold-500"}>{pct}%</span></div>
        <ProgressBar value={pct} tone={pct >= 100 ? "green" : "gold"} />
        <div className="mt-1 text-[11px] text-[var(--muted)]">{t("No Evidence → No Reimbursement / No LPJ Approval")}</div>
      </Card>
      {EVIDENCE_CATEGORIES.map((cat) => (
        <Section key={cat.key} title={cat.label}>
          <div className="flex flex-wrap gap-2">
            {cat.items.map((item) => {
              const key = evidenceKey(cat.key, item);
              const on = a.evidence.includes(key);
              return (
                <button key={key} onClick={() => toggle(key)} className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition", on ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/5")}>
                  {on ? "✔" : "○"} {item}
                </button>
              );
            })}
          </div>
        </Section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modul 4 — LPJ (form, not Word).
function LpjTab({ a, onChange }: { a: Activity; onChange: (a: Activity) => void }) {
  const { t } = useI18n();
  const set = (patch: Partial<Activity["lpj"]>) => onChange({ ...a, lpj: { ...a.lpj, ...patch } });

  // Realisasi anggaran per component: rencana (from budget) vs realisasi (from realizations).
  const rows = useMemo(() => {
    const plan: Record<string, number> = {};
    a.budget.forEach((l) => { plan[l.component] = (plan[l.component] || 0) + budgetLineTotal(l); });
    const real: Record<string, number> = {};
    a.realizations.forEach((r) => { real[r.component] = (real[r.component] || 0) + r.nominal; });
    const keys = Array.from(new Set([...Object.keys(plan), ...Object.keys(real)]));
    return keys.map((k) => ({ uraian: k, rencana: plan[k] || 0, realisasi: real[k] || 0 }));
  }, [a.budget, a.realizations]);

  return (
    <div className="space-y-4">
      <Section title="Ringkasan">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(["tujuan", "pelaksanaan", "hasil", "manfaat"] as const).map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)}><textarea rows={2} className={inputCls} value={a.lpj[k]} onChange={(e) => set({ [k]: e.target.value })} /></Field>
          ))}
        </div>
      </Section>
      <Section title="Output & Outcome">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Output"><textarea rows={2} className={inputCls} value={a.lpj.output} onChange={(e) => set({ output: e.target.value })} /></Field>
          <Field label="Outcome"><textarea rows={2} className={inputCls} value={a.lpj.outcome} onChange={(e) => set({ outcome: e.target.value })} /></Field>
        </div>
      </Section>
      <Section title="Realisasi Anggaran">
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-[var(--muted)]"><th className="py-1 font-medium">Uraian</th><th className="text-right font-medium">Rencana</th><th className="text-right font-medium">Realisasi</th><th className="text-right font-medium">Selisih</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const s = r.rencana - r.realisasi;
              return <tr key={r.uraian} className="border-t"><td className="py-1">{r.uraian}</td><td className="text-right tabular-nums">{rupiah(r.rencana)}</td><td className="text-right tabular-nums">{rupiah(r.realisasi)}</td><td className={cn("text-right tabular-nums", s < 0 ? "text-rose-500" : "text-emerald-500")}>{rupiah(s)}</td></tr>;
            })}
            <tr className="border-t font-semibold">
              <td className="py-1">Total</td>
              <td className="text-right tabular-nums">{rupiah(rows.reduce((x, r) => x + r.rencana, 0))}</td>
              <td className="text-right tabular-nums">{rupiah(rows.reduce((x, r) => x + r.realisasi, 0))}</td>
              <td className="text-right tabular-nums">{rupiah(rows.reduce((x, r) => x + (r.rencana - r.realisasi), 0))}</td>
            </tr>
          </tbody>
        </table>
      </Section>
      <Section title="Lessons Learned">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Kendala"><textarea rows={2} className={inputCls} value={a.lpj.kendala} onChange={(e) => set({ kendala: e.target.value })} /></Field>
          <Field label="Solusi"><textarea rows={2} className={inputCls} value={a.lpj.solusi} onChange={(e) => set({ solusi: e.target.value })} /></Field>
          <Field label="Rekomendasi"><textarea rows={2} className={inputCls} value={a.lpj.rekomendasi} onChange={(e) => set({ rekomendasi: e.target.value })} /></Field>
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="mb-2 text-[12px] font-semibold text-royal-400">{t(title)}</div>
      {children}
    </div>
  );
}
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  const { t } = useI18n();
  return <label className={cn("block", className)}><span className={labelCls}>{t(label)}</span>{children}</label>;
}
function Row({ k, v, full }: { k: string; v: string; full?: boolean }) {
  const { t } = useI18n();
  return <div className={cn(full && "sm:col-span-2")}><dt className="text-[11px] text-[var(--muted)]">{t(k)}</dt><dd className="font-medium">{v}</dd></div>;
}
function StatCard({ label, value, tone }: { label: string; value: string; tone?: "red" | "green" }) {
  const { t } = useI18n();
  return (
    <Card className="p-3">
      <div className="text-[11px] text-[var(--muted)]">{t(label)}</div>
      <div className={cn("mt-0.5 text-sm font-bold tabular-nums", tone === "red" && "text-rose-500", tone === "green" && "text-emerald-500")}>{value}</div>
    </Card>
  );
}

// Portal overlay so `fixed` positioning escapes any transform containing-block.
function Overlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8" onClick={onClose}>
      <div
        className={cn("glass card my-auto flex max-h-[90vh] w-full flex-col rounded-2xl border shadow-2xl", wide ? "max-w-3xl" : "max-w-2xl")}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
