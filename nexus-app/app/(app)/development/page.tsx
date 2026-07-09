"use client";

import React, { useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { developmentPlans as mockDevelopmentPlans, trainingSessions as mockSessions, type TrainingSession } from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { LiveBadge } from "@/components/LiveBadge";
import { useI18n } from "@/lib/i18n";

type DevPlan = { id: string; employee: string; avatar: string; role: string; readiness: number; gaps: number; nextStep: string };

const summary = [
  { label: "Active Programs", value: 6, tone: "blue" },
  { label: "Enrolled", value: 128, tone: "blue" },
  { label: "Avg Effectiveness", value: "88%", tone: "gold" },
  { label: "Certifications", value: 42, tone: "green" },
] as const;

const inputCls =
  "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const initials = (name: string) => name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

let seq = 0;
const newId = (p: string) => {
  try {
    return `${p}-${crypto.randomUUID().slice(0, 6)}`;
  } catch {
    return `${p}-${++seq}-${Date.now()}`;
  }
};

function Modal({ icon, title, onClose, onSave, saveLabel, children }: { icon: React.ReactNode; title: string; onClose: () => void; onSave: () => void; saveLabel: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass card shadow-glass animate-fade-up">
        <div className="flex items-center gap-2 border-b p-4">
          {icon}
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

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <button onClick={onEdit} className="font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100" title={t("Edit")}>
        {t("Edit")}
      </button>
      <button onClick={onDelete} className="text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100" title={t("Delete")}>
        ✕
      </button>
    </div>
  );
}

const emptyDp = { open: false, id: null as string | null, employee: "", role: "", readiness: 60, gaps: 1, nextStep: "" };
const emptySession = { open: false, id: null as string | null, name: "", date: "", seats: "" };

export default function DevelopmentPage() {
  const { t } = useI18n();
  // Shared with the Competency module (same localStorage key) so plans stay in sync.
  const [plans, setPlans] = useLocalState<DevPlan[]>("development-plans", mockDevelopmentPlans.map((d, i) => ({ id: `dp-${i + 1}`, ...d })));
  const [sessions, setSessions] = useLocalState<TrainingSession[]>("training-calendar", mockSessions);
  const [dp, setDp] = useState(emptyDp);
  const [ss, setSs] = useState(emptySession);

  // --- development plan CRUD ---
  const openDpCreate = () => setDp({ ...emptyDp, open: true });
  const openDpEdit = (d: DevPlan) => setDp({ open: true, id: d.id, employee: d.employee, role: d.role, readiness: d.readiness, gaps: d.gaps, nextStep: d.nextStep });
  const saveDp = () => {
    const employee = dp.employee.trim();
    if (!employee) return;
    const body = { employee, avatar: initials(employee), role: dp.role.trim() || "—", readiness: clamp(dp.readiness, 0, 100), gaps: Math.max(0, dp.gaps), nextStep: dp.nextStep.trim() || "—" };
    if (dp.id == null) setPlans((p) => [...p, { id: newId("dp"), ...body }]);
    else setPlans((p) => p.map((x) => (x.id === dp.id ? { ...x, ...body } : x)));
    setDp(emptyDp);
  };
  const removeDp = (d: DevPlan) => setPlans((p) => p.filter((x) => x.id !== d.id));

  // --- training session CRUD ---
  const openSsCreate = () => setSs({ ...emptySession, open: true });
  const openSsEdit = (s: TrainingSession) => setSs({ open: true, id: s.id, name: s.name, date: s.date, seats: s.seats });
  const saveSs = () => {
    const name = ss.name.trim();
    if (!name) return;
    const body = { name, date: ss.date.trim() || "TBD", seats: ss.seats.trim() || "0 / 0" };
    if (ss.id == null) setSessions((r) => [...r, { id: newId("ts"), ...body }]);
    else setSessions((r) => r.map((x) => (x.id === ss.id ? { ...x, ...body } : x)));
    setSs(emptySession);
  };
  const removeSs = (s: TrainingSession) => setSessions((r) => r.filter((x) => x.id !== s.id));

  return (
    <>
      <PageHeader
        title="Development Program"
        subtitle="Operator · Supervisor · Leadership Development · Training Calendar · Learning Journey"
        actions={
          <>
            <LiveBadge live={false} />
            <Btn variant="primary" onClick={openDpCreate}>
              <Icon.plus className="h-4 w-4" /> {t("New Plan")}
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-[var(--muted)]">{t(s.label)}</div>
            <div className={`mt-1 text-2xl font-bold ${s.tone === "green" ? "text-emerald-500" : s.tone === "gold" ? "gold-gradient" : ""}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle
            title="Development Plans"
            subtitle="Individual readiness & next learning step"
            action={
              <button onClick={openDpCreate} className="text-royal-400 transition hover:text-royal-300" aria-label="Add development plan" title={t("Add")}>
                <Icon.plus className="h-4 w-4" />
              </button>
            }
          />
          <div className="space-y-3">
            {plans.map((p) => (
              <Card key={p.id} dir="auto" className="group hover:border-royal-500/40 transition">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex min-w-[200px] flex-1 items-center gap-3">
                    <Avatar initials={p.avatar} tone="gold" />
                    <div className="min-w-0">
                      <div className="font-semibold">{p.employee}</div>
                      <div className="text-[11px] text-[var(--muted)]">{p.role}</div>
                    </div>
                  </div>

                  <div className="w-44">
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className="text-[var(--muted)]">{t("Readiness")}</span>
                      <span className="font-semibold">{p.readiness}%</span>
                    </div>
                    <ProgressBar value={p.readiness} tone="gold" />
                  </div>

                  <div className="text-center">
                    <div className="text-[10px] text-[var(--muted)]">{t("Gaps")}</div>
                    <Badge tone={p.gaps === 0 ? "green" : p.gaps > 1 ? "amber" : "blue"}>{p.gaps}</Badge>
                  </div>

                  <div className="flex min-w-[180px] flex-1 items-center gap-2 text-[12px]">
                    <Icon.development className="h-4 w-4 shrink-0 text-royal-400" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-[var(--muted)]">{t("Next Step")}</div>
                      <div className="font-medium">{p.nextStep}</div>
                    </div>
                  </div>

                  <RowActions onEdit={() => openDpEdit(p)} onDelete={() => removeDp(p)} />
                </div>
              </Card>
            ))}
            {plans.length === 0 && <Card className="text-center text-[12px] text-[var(--muted)]">{t("No development plans yet. Add one.")}</Card>}
          </div>
        </div>

        <div>
          <SectionTitle
            title="Training Calendar"
            subtitle="Upcoming sessions"
            action={
              <button onClick={openSsCreate} className="text-royal-400 transition hover:text-royal-300" aria-label="Add session" title={t("Add")}>
                <Icon.plus className="h-4 w-4" />
              </button>
            }
          />
          <Card>
            <div className="space-y-4">
              {sessions.map((s) => (
                <div key={s.id} dir="auto" className="group flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-royal-500/12 text-royal-400">
                    <Icon.meeting className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate text-sm font-medium">{s.name}</div>
                      <RowActions onEdit={() => openSsEdit(s)} onDelete={() => removeSs(s)} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                      <span>{s.date}</span>
                      <span>·</span>
                      <span>
                        {s.seats} {t("seats")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && <p className="py-3 text-center text-[12px] text-[var(--muted)]">{t("No sessions yet. Add one.")}</p>}
            </div>
          </Card>
        </div>
      </div>

      {dp.open && (
        <Modal icon={<Icon.development className="h-4 w-4 shrink-0 text-royal-400" />} title={dp.id == null ? t("New Development Plan") : t("Edit Development Plan")} onClose={() => setDp(emptyDp)} onSave={saveDp} saveLabel={dp.id == null ? t("Create") : t("Save")}>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Employee")}
              <input value={dp.employee} onChange={(e) => setDp((f) => ({ ...f, employee: e.target.value }))} placeholder={t("e.g. Arif Wibowo")} className={inputCls} />
            </label>
            <label className={labelCls}>
              {t("Role")}
              <input value={dp.role} onChange={(e) => setDp((f) => ({ ...f, role: e.target.value }))} placeholder={t("e.g. Competency Analyst")} className={inputCls} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Readiness")} (%)
              <input type="number" min={0} max={100} value={dp.readiness} onChange={(e) => setDp((f) => ({ ...f, readiness: Number(e.target.value) }))} className={inputCls} />
            </label>
            <label className={labelCls}>
              {t("Gaps")}
              <input type="number" min={0} value={dp.gaps} onChange={(e) => setDp((f) => ({ ...f, gaps: Number(e.target.value) }))} className={inputCls} />
            </label>
          </div>
          <label className={labelCls}>
            {t("Next Step")}
            <input value={dp.nextStep} onChange={(e) => setDp((f) => ({ ...f, nextStep: e.target.value }))} placeholder={t("e.g. Advanced Analytics Certification")} className={inputCls} />
          </label>
        </Modal>
      )}

      {ss.open && (
        <Modal icon={<Icon.meeting className="h-4 w-4 shrink-0 text-royal-400" />} title={ss.id == null ? t("New Session") : t("Edit Session")} onClose={() => setSs(emptySession)} onSave={saveSs} saveLabel={ss.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Name")}
            <input value={ss.name} onChange={(e) => setSs((f) => ({ ...f, name: e.target.value }))} placeholder={t("e.g. Leadership Simulation Lab")} className={inputCls} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Date")}
              <input value={ss.date} onChange={(e) => setSs((f) => ({ ...f, date: e.target.value }))} placeholder={t("e.g. Mon · Jul 13 · 09:00")} className={inputCls} />
            </label>
            <label className={labelCls}>
              {t("Seats")}
              <input value={ss.seats} onChange={(e) => setSs((f) => ({ ...f, seats: e.target.value }))} placeholder={t("e.g. 12 / 20")} className={inputCls} />
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}
