"use client";

import React, { useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, ProgressBar, DonutChart, LineChart } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { LiveBadge } from "@/components/LiveBadge";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { npsData as mockNps, satisfactionByService as mockByService, satisfactionTrend } from "@/lib/data";

const inputCls =
  "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

let seq = 0;
const nextId = () => {
  try {
    return `svc-${crypto.randomUUID().slice(0, 6)}`;
  } catch {
    return `svc-${++seq}-${Date.now()}`;
  }
};

type Nps = { promoters: number; passives: number; detractors: number };
type Service = { id: string; service: string; score: number };

function Modal({ title, onClose, onSave, saveLabel, children }: { title: string; onClose: () => void; onSave: () => void; saveLabel: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm glass card shadow-glass animate-fade-up">
        <div className="flex items-center gap-2 border-b p-4">
          <Icon.satisfaction className="h-4 w-4 shrink-0 text-royal-400" />
          <div className="text-sm font-semibold">{title}</div>
          <button onClick={onClose} className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="space-y-3 p-5">{children}</div>
        <div className="flex justify-end gap-2 border-t p-3">
          <Btn variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Btn>
          <Btn variant="primary" onClick={onSave}>
            {saveLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function RowActions({ onEdit, onDelete, label }: { onEdit: () => void; onDelete: () => void; label: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <button onClick={onEdit} aria-label={`Edit ${label}`} title={t("Edit")} className="text-[11px] font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100">
        {t("Edit")}
      </button>
      <button onClick={onDelete} aria-label={`Delete ${label}`} title={t("Delete")} className="text-[11px] text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

const emptyResponse = { open: false, rating: 5, serviceId: "" };
const emptyService = { open: false, id: null as string | null, service: "", score: 4.5 };

export default function SatisfactionPage() {
  const { t } = useI18n();
  const [nps, setNps] = useLocalState<Nps>("satisfaction-nps", {
    promoters: mockNps.promoters,
    passives: mockNps.passives,
    detractors: mockNps.detractors,
  });
  const [services, setServices] = useLocalState<Service[]>(
    "satisfaction-services",
    mockByService.map((s, i) => ({ id: `svc-${i + 1}`, ...s }))
  );
  const [resp, setResp] = useState(emptyResponse);
  const [svcForm, setSvcForm] = useState(emptyService);

  const total = Math.max(1, nps.promoters + nps.passives + nps.detractors);
  const pct = (n: number) => Math.round((n / total) * 100);
  const npsScore = Math.round(((nps.promoters - nps.detractors) / total) * 100);

  const distribution = [
    { key: "Promoters", value: pct(nps.promoters), color: "#10b981", tone: "text-emerald-500" },
    { key: "Passives", value: pct(nps.passives), color: "#e5aa26", tone: "gold-gradient" },
    { key: "Detractors", value: pct(nps.detractors), color: "#f43f5e", tone: "text-rose-500" },
  ];
  const segments = distribution.map((d) => ({ value: d.value, color: d.color, label: d.key }));

  // --- record a survey response ---
  const submitResponse = () => {
    const rating = resp.rating;
    const bucket: keyof Nps = rating >= 5 ? "promoters" : rating === 4 ? "passives" : "detractors";
    setNps((n) => ({ ...n, [bucket]: n[bucket] + 1 }));
    if (resp.serviceId) {
      setServices((r) => r.map((s) => (s.id === resp.serviceId ? { ...s, score: Math.round(clamp((s.score * 9 + rating) / 10, 1, 5) * 10) / 10 } : s)));
    }
    setResp(emptyResponse);
  };

  // --- service CRUD ---
  const openServiceCreate = () => setSvcForm({ ...emptyService, open: true });
  const openServiceEdit = (s: Service) => setSvcForm({ open: true, id: s.id, service: s.service, score: s.score });
  const saveService = () => {
    const name = svcForm.service.trim();
    if (!name) return;
    const score = clamp(Number(svcForm.score) || 0, 0, 5);
    if (svcForm.id == null) setServices((r) => [...r, { id: nextId(), service: name, score }]);
    else setServices((r) => r.map((s) => (s.id === svcForm.id ? { ...s, service: name, score } : s)));
    setSvcForm(emptyService);
  };
  const removeService = (s: Service) => setServices((r) => r.filter((x) => x.id !== s.id));

  return (
    <>
      <PageHeader
        title="Customer Satisfaction"
        subtitle="Survey · Rating · Net Promoter Score · Service Quality"
        actions={
          <>
            <LiveBadge live={false} />
            <Btn variant="primary" onClick={() => setResp({ ...emptyResponse, open: true, serviceId: services[0]?.id ?? "" })}>
              <Icon.plus className="h-4 w-4" /> {t("Record Response")}
            </Btn>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center">
          <SectionTitle title="Net Promoter Score" />
          <DonutChart
            segments={segments}
            size={180}
            thickness={20}
            center={
              <div className="text-center">
                <div className="text-4xl font-bold gold-gradient">
                  {npsScore >= 0 ? "+" : ""}
                  {npsScore}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">NPS</div>
              </div>
            }
          />
          <div className="mt-4 flex w-full justify-center gap-4 text-[11px]">
            {distribution.map((d) => (
              <div key={d.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-[var(--muted)]">{t(d.key)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle title="CSAT Trend" subtitle="Average rating (out of 5) over the last 7 months" />
          <LineChart data={satisfactionTrend.map((d) => d.v)} labels={satisfactionTrend.map((d) => d.m)} min={3.5} max={5} tone="gold" />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {distribution.map((d) => (
          <Card key={d.key}>
            <div className="text-xs text-[var(--muted)]">{t(d.key)}</div>
            <div className={`mt-1 text-2xl font-bold ${d.tone}`}>{d.value}%</div>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <Card>
          <SectionTitle
            title="Satisfaction by Service"
            subtitle="Mean score per service line"
            action={
              <button onClick={openServiceCreate} className="text-royal-400 transition hover:text-royal-300" aria-label="Add service" title={t("Add")}>
                <Icon.plus className="h-4 w-4" />
              </button>
            }
          />
          <div className="space-y-4">
            {services.map((s) => (
              <div key={s.id} dir="auto" className="group flex items-center gap-4">
                <div className="w-48 shrink-0 text-sm">{s.service}</div>
                <div className="flex-1">
                  <ProgressBar value={(s.score / 5) * 100} tone="gold" />
                </div>
                <div className="w-14 shrink-0 text-right text-sm font-semibold">{s.score.toFixed(1)}/5</div>
                <RowActions onEdit={() => openServiceEdit(s)} onDelete={() => removeService(s)} label={s.service} />
              </div>
            ))}
            {services.length === 0 && <p className="py-3 text-center text-[12px] text-[var(--muted)]">{t("No services yet. Add one.")}</p>}
          </div>
        </Card>
      </div>

      {resp.open && (
        <Modal title={t("Record Response")} onClose={() => setResp(emptyResponse)} onSave={submitResponse} saveLabel={t("Create")}>
          <label className={labelCls}>
            {t("Rating")}
            <select value={resp.rating} onChange={(e) => setResp((r) => ({ ...r, rating: Number(e.target.value) }))} className={`${inputCls} text-[var(--text)]`}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)} ({n}/5)
                </option>
              ))}
            </select>
          </label>
          <label className={labelCls}>
            {t("Service")}
            <select value={resp.serviceId} onChange={(e) => setResp((r) => ({ ...r, serviceId: e.target.value }))} className={`${inputCls} text-[var(--text)]`}>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.service}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[11px] text-[var(--muted)]">
            5★ → {t("Promoters")} · 4★ → {t("Passives")} · ≤3★ → {t("Detractors")}
          </p>
        </Modal>
      )}

      {svcForm.open && (
        <Modal title={svcForm.id == null ? t("New Service") : t("Edit Service")} onClose={() => setSvcForm(emptyService)} onSave={saveService} saveLabel={svcForm.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Service")}
            <input value={svcForm.service} onChange={(e) => setSvcForm((f) => ({ ...f, service: e.target.value }))} placeholder={t("e.g. Competency Assessment")} className={inputCls} />
          </label>
          <label className={labelCls}>
            {t("Score")} (0–5)
            <input type="number" min={0} max={5} step={0.1} value={svcForm.score} onChange={(e) => setSvcForm((f) => ({ ...f, score: Number(e.target.value) }))} className={inputCls} />
          </label>
        </Modal>
      )}
    </>
  );
}
