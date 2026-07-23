"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeePicker } from "@/components/EmployeePicker";
import { competencies as mockCompetencies, developmentPlans as mockDevelopmentPlans } from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { apiGet, apiSend, apiDownload, hasSession } from "@/lib/api";
import { useApiAuthed } from "@/lib/auth";
import { LiveBadge } from "@/components/LiveBadge";
import { useI18n } from "@/lib/i18n";

type Comp = { id: number; name: string; category: string; current: number; required: number };
type DevPlan = { id: string; employee: string; avatar: string; role: string; readiness: number; gaps: number; nextStep: string };

const inputCls =
  "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const initials = (name: string) => name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

let seq = 0;
const nextDpId = () => {
  try {
    return `dp-${crypto.randomUUID().slice(0, 6)}`;
  } catch {
    return `dp-${++seq}-${Date.now()}`;
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

const emptyComp = { open: false, id: null as number | null, name: "", category: "", current: 3, required: 4 };
const emptyDp = { open: false, id: null as string | null, employee: "", role: "", readiness: 60, gaps: 1, nextStep: "" };

export default function CompetencyPage() {
  const { t } = useI18n();
  const authed = useApiAuthed();
  const [rows, setRows] = useLocalState<Comp[]>("competencies", mockCompetencies.map((c, i) => ({ id: i + 1, ...c })));
  const [plans, setPlans] = useLocalState<DevPlan[]>("development-plans", mockDevelopmentPlans.map((d, i) => ({ id: `dp-${i + 1}`, ...d })));
  const [live, setLive] = useState(false);
  const [form, setForm] = useState(emptyComp);
  const [dp, setDp] = useState(emptyDp);

  // Hybrid: seed from localStorage, prefer live API when signed in.
  useEffect(() => {
    if (!hasSession()) return;
    let active = true;
    apiGet<{ competencies?: Comp[]; developmentPlans?: DevPlan[] }>("/competency")
      .then((res) => {
        if (!active || !res) return;
        if (Array.isArray(res.competencies)) setRows(res.competencies.map((c, i) => ({ ...c, id: c.id ?? i + 1 })));
        if (Array.isArray(res.developmentPlans)) setPlans(res.developmentPlans.map((d, i) => ({ ...d, id: d.id ?? `dp-${i + 1}` })));
        setLive(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncComp = (method: "POST" | "PUT" | "DELETE", path: string, body?: unknown) => {
    if (hasSession()) apiSend(method, path, body).catch(() => {});
  };

  // --- competency CRUD ---
  const openCreate = () => setForm({ ...emptyComp, open: true });
  const openEdit = (c: Comp) => setForm({ open: true, id: c.id, name: c.name, category: c.category, current: c.current, required: c.required });
  const saveForm = () => {
    const body = { name: form.name.trim(), category: form.category.trim(), current: form.current, required: form.required };
    if (!body.name || !body.category) return;
    if (form.id == null) {
      const id = Math.max(0, ...rows.map((x) => x.id)) + 1;
      setRows((r) => [...r, { id, ...body }]);
      syncComp("POST", "/competency", { id, ...body });
    } else {
      setRows((r) => r.map((x) => (x.id === form.id ? { ...x, ...body } : x)));
      syncComp("PUT", `/competency/${form.id}`, body);
    }
    setForm(emptyComp);
  };
  const removeRow = (c: Comp) => {
    setRows((r) => r.filter((x) => x.id !== c.id));
    syncComp("DELETE", `/competency/${c.id}`);
  };

  // --- development plan CRUD ---
  const openDpCreate = (nextStep = "") => setDp({ ...emptyDp, open: true, nextStep });
  const openDpEdit = (d: DevPlan) => setDp({ open: true, id: d.id, employee: d.employee, role: d.role, readiness: d.readiness, gaps: d.gaps, nextStep: d.nextStep });
  const saveDp = () => {
    const employee = dp.employee.trim();
    if (!employee) return;
    const body = { employee, avatar: initials(employee), role: dp.role.trim() || "—", readiness: clamp(dp.readiness, 0, 100), gaps: Math.max(0, dp.gaps), nextStep: dp.nextStep.trim() || "—" };
    if (dp.id == null) setPlans((p) => [...p, { id: nextDpId(), ...body }]);
    else setPlans((p) => p.map((x) => (x.id === dp.id ? { ...x, ...body } : x)));
    setDp(emptyDp);
  };
  const removeDp = (d: DevPlan) => setPlans((p) => p.filter((x) => x.id !== d.id));

  const avgReq = rows.reduce((s, c) => s + c.required, 0);
  const avgCur = rows.reduce((s, c) => s + c.current, 0);
  const index = avgReq ? Math.round((avgCur / avgReq) * 100) : 0;
  const gaps = rows.filter((c) => c.current < c.required);

  return (
    <>
      <PageHeader
        title="Competency Management"
        subtitle="Dictionary · Matrix · Mapping · Assessment · Gap Analysis · IDP · Career Readiness"
        actions={
          <>
            <LiveBadge live={live} />
            {authed && (
              <Btn onClick={() => apiDownload("/exports/competencies", undefined, "nexus-competencies.xlsx", "GET")}>
                <Icon.document className="h-4 w-4" /> {t("Excel")}
              </Btn>
            )}
            <Btn variant="primary" onClick={openCreate}>
              <Icon.plus className="h-4 w-4" /> {t("New Competency")}
            </Btn>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Link href="/competency/dictionary" className="flex items-center gap-3 rounded-xl border border-royal-500/30 bg-royal-500/5 px-4 py-3 transition hover:border-royal-500/50 hover:bg-royal-500/10">
          <Icon.knowledge className="h-5 w-5 shrink-0 text-royal-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{t("Kamus Kompetensi")}</div>
            <div className="text-[11px] text-[var(--muted)]">{t("Daftar, Level & Kamus Kompetensi Teknis")}</div>
          </div>
          <Icon.chevron className="h-4 w-4 shrink-0 text-[var(--muted)]" />
        </Link>
        <Link href="/competency/profile" className="flex items-center gap-3 rounded-xl border border-royal-500/30 bg-royal-500/5 px-4 py-3 transition hover:border-royal-500/50 hover:bg-royal-500/10">
          <Icon.users className="h-5 w-5 shrink-0 text-royal-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{t("Job Competency Profile")}</div>
            <div className="text-[11px] text-[var(--muted)]">{t("Kompetensi per jabatan · Job Family")}</div>
          </div>
          <Icon.chevron className="h-4 w-4 shrink-0 text-[var(--muted)]" />
        </Link>
        <Link href="/competency/matrix" className="flex items-center gap-3 rounded-xl border border-royal-500/30 bg-royal-500/5 px-4 py-3 transition hover:border-royal-500/50 hover:bg-royal-500/10">
          <Icon.competency className="h-5 w-5 shrink-0 text-royal-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{t("Competency Matrix")}</div>
            <div className="text-[11px] text-[var(--muted)]">{t("Standar & penilaian kompetensi · gap analysis")}</div>
          </div>
          <Icon.chevron className="h-4 w-4 shrink-0 text-[var(--muted)]" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <div className="text-xs text-[var(--muted)]">{t("Competency Index")}</div>
          <div className="mt-1 text-2xl font-bold gold-gradient">{index}%</div>
          <ProgressBar value={index} tone="gold" className="mt-2" />
        </Card>
        <Card>
          <div className="text-xs text-[var(--muted)]">{t("Critical Gaps")}</div>
          <div className="mt-1 text-2xl font-bold text-rose-500">{gaps.length}</div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">
            {t("across")} {rows.length} {t("competencies")}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-[var(--muted)]">{t("Assessed Staff")}</div>
          <div className="mt-1 text-2xl font-bold">92%</div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">{t("of department")}</div>
        </Card>
        <Card>
          <div className="text-xs text-[var(--muted)]">{t("Certifications")}</div>
          <div className="mt-1 text-2xl font-bold text-royal-400">42</div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">{t("active this year")}</div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="Competency Gap Analysis" subtitle="Required vs current proficiency (level 1–5)" />
          <div className="space-y-4">
            {rows.map((c) => {
              const gap = c.required - c.current;
              return (
                <div key={c.id} dir="auto" className="group">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      <Badge tone="gray">{t(c.category)}</Badge>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <span>
                        {c.current} / {c.required}
                        {gap > 0 && <span className="ml-2 text-rose-500">−{gap}</span>}
                      </span>
                      <button onClick={() => openEdit(c)} className="font-medium opacity-0 transition hover:text-royal-400 group-hover:opacity-100" aria-label={`Edit ${c.name}`} title={t("Edit")}>
                        {t("Edit")}
                      </button>
                      <button onClick={() => removeRow(c)} className="opacity-0 transition hover:text-rose-400 group-hover:opacity-100" aria-label={`Delete ${c.name}`} title={t("Delete")}>
                        ✕
                      </button>
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div className="absolute inset-y-0 rounded-full bg-royal-500/25" style={{ width: `${(c.required / 5) * 100}%` }} />
                    <div className={`absolute inset-y-0 rounded-full bg-gradient-to-r ${gap > 0 ? "from-gold-400 to-gold-500" : "from-emerald-400 to-emerald-500"}`} style={{ width: `${(c.current / 5) * 100}%` }} />
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && <p className="py-3 text-center text-[12px] text-[var(--muted)]">{t("across")} 0 {t("competencies")}</p>}
          </div>
          <div className="mt-4 flex items-center gap-4 text-[11px] text-[var(--muted)]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-royal-500/40" /> {t("Required")}</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-gold-400" /> {t("Current (gap)")}</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> {t("Met")}</span>
          </div>
        </Card>

        <Card>
          <SectionTitle title="AI Learning Recommendations" action={<Icon.spark className="h-4 w-4 text-gold-400" />} />
          <div className="space-y-3">
            {gaps.slice(0, 4).map((c) => (
              <div key={c.id} dir="auto" className="rounded-xl border p-3">
                <div className="text-[13px] font-medium">{c.name}</div>
                <div className="mt-1 text-[11px] text-[var(--muted)]">
                  {t("Recommended:")} {t(c.category)} {t("advanced track · est. 6 weeks")}
                </div>
                <button onClick={() => openDpCreate(`${c.name} — ${t("advanced track · est. 6 weeks")}`)} className="mt-2 text-[11px] font-medium text-royal-400 hover:underline">
                  {t("Add to IDP →")}
                </button>
              </div>
            ))}
            {gaps.length === 0 && <p className="py-3 text-center text-[12px] text-[var(--muted)]">{t("Met")}</p>}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <SectionTitle
          title="Career Readiness & IDP"
          subtitle="Individual Development Plans"
          action={
            <button onClick={() => openDpCreate()} className="text-royal-400 transition hover:text-royal-300" aria-label="Add development plan" title={t("Add")}>
              <Icon.plus className="h-4 w-4" />
            </button>
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((d) => (
            <Card key={d.id} dir="auto" className="group">
              <div className="flex items-center gap-3">
                <Avatar initials={d.avatar} tone={d.readiness >= 90 ? "gold" : "blue"} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold">{d.employee}</div>
                  <div className="text-[10px] text-[var(--muted)]">{d.role}</div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button onClick={() => openDpEdit(d)} className="font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100" title={t("Edit")}>
                    {t("Edit")}
                  </button>
                  <button onClick={() => removeDp(d)} className="text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100" title={t("Delete")}>
                    ✕
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-[11px] text-[var(--muted)]">{t("Readiness")}</span>
                <span className="text-lg font-bold">{d.readiness}%</span>
              </div>
              <ProgressBar value={d.readiness} tone={d.readiness >= 90 ? "gold" : "blue"} className="mt-1" />
              <div className="mt-3 flex items-center gap-2 text-[11px]">
                <Badge tone={d.gaps === 0 ? "green" : "amber"}>
                  {d.gaps} {d.gaps !== 1 ? t("gaps") : t("gap")}
                </Badge>
              </div>
              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-[var(--muted)]">
                <Icon.development className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal-400" />
                {d.nextStep}
              </div>
            </Card>
          ))}
          {plans.length === 0 && <Card className="col-span-full text-center text-[12px] text-[var(--muted)]">{t("No development plans yet. Add one.")}</Card>}
        </div>
      </div>

      {form.open && (
        <Modal
          icon={<Icon.competency className="h-4 w-4 shrink-0 text-royal-400" />}
          title={form.id == null ? t("New Competency") : t("Edit Competency")}
          onClose={() => setForm(emptyComp)}
          onSave={saveForm}
          saveLabel={form.id == null ? t("Create") : t("Save")}
        >
          <label className={labelCls}>
            {t("Name")}
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t("e.g. Cloud Architecture")} className={inputCls} />
          </label>
          <label className={labelCls}>
            {t("Category")}
            <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder={t("e.g. Technical")} list="competency-categories" className={inputCls} />
            <datalist id="competency-categories">
              {Array.from(new Set(rows.map((c) => c.category))).map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Current level")}
              <select value={form.current} onChange={(e) => setForm((f) => ({ ...f, current: Number(e.target.value) }))} className={`${inputCls} text-[var(--text)]`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {t("Level")} {n}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              {t("Required level")}
              <select value={form.required} onChange={(e) => setForm((f) => ({ ...f, required: Number(e.target.value) }))} className={`${inputCls} text-[var(--text)]`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {t("Level")} {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Modal>
      )}

      {dp.open && (
        <Modal
          icon={<Icon.development className="h-4 w-4 shrink-0 text-royal-400" />}
          title={dp.id == null ? t("New Development Plan") : t("Edit Development Plan")}
          onClose={() => setDp(emptyDp)}
          onSave={saveDp}
          saveLabel={dp.id == null ? t("Create") : t("Save")}
        >
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Employee")}
              <EmployeePicker
                value={dp.employee}
                onChange={(v) => setDp((f) => ({ ...f, employee: v }))}
                onPick={(emp) => setDp((f) => ({ ...f, role: f.role.trim() ? f.role : emp.position || f.role }))}
                className={inputCls}
              />
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
    </>
  );
}
