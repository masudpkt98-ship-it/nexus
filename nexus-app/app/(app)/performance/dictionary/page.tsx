"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import {
  corporateKpis as seedKpis,
  jobProfiles as seedProfiles,
  strategicGoals as seedGoals,
  kpiPerspectives,
  subordinateLevels,
  type CorporateKpi,
  type JobProfile,
  type StrategicGoal,
} from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";

const inputCls = "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";
let seq = 0;
const newId = (p: string) => { try { return `${p}-${crypto.randomUUID().slice(0, 5)}`; } catch { return `${p}-${++seq}${Math.round(performance.now())}`; } };
const perspectiveTone: Record<string, "green" | "blue" | "amber" | "purple" | "gray"> = { Financial: "green", Customer: "blue", "Internal Process": "amber", "Learning & Growth": "purple" };

function Modal({ title, onClose, onSave, saveLabel, children, wide }: { title: string; onClose: () => void; onSave: () => void; saveLabel: string; children: React.ReactNode; wide?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative z-10 w-full glass card shadow-glass animate-fade-up", wide ? "max-w-2xl" : "max-w-lg")}>
        <div className="flex items-center gap-2 border-b p-4">
          <Icon.performance className="h-4 w-4 shrink-0 text-royal-400" />
          <div className="text-sm font-semibold">{title}</div>
          <button onClick={onClose} className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400" aria-label="Close">✕</button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">{children}</div>
        <div className="flex justify-end gap-2 border-t p-3">
          <Btn variant="ghost" onClick={onClose}>{t("Cancel")}</Btn>
          <Btn variant="primary" onClick={onSave}>{saveLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

const TABS = ["Corporate KPI", "Strategic Goal", "Alignment & Cascading", "Job Profile"] as const;
type Tab = (typeof TABS)[number];

type KForm = { open: boolean; id: string | null; code: string; name: string; perspective: string; unit: string; target: string; strategicGoalId: string; cascadableTo: string[] };
const emptyK: KForm = { open: false, id: null, code: "", name: "", perspective: "Financial", unit: "%", target: "", strategicGoalId: "", cascadableTo: [] };
type JForm = { open: boolean; id: string | null; role: string; level: string; unit: string; purpose: string; responsibilities: string; kpiIds: string[] };
const emptyJ: JForm = { open: false, id: null, role: "", level: "SVP", unit: "", purpose: "", responsibilities: "", kpiIds: [] };

export default function PerformanceDictionaryPage() {
  const { t } = useI18n();
  // Shared reference stores — consumable by any module that needs them.
  const [kpis, setKpis] = useLocalState<CorporateKpi[]>("corporate-kpis", seedKpis);
  const [profiles, setProfiles] = useLocalState<JobProfile[]>("job-profiles", seedProfiles);
  const [goals] = useLocalState<StrategicGoal[]>("strategy-goals", seedGoals); // pulled from Strategic Planning
  const [tab, setTab] = useState<Tab>("Corporate KPI");
  const [kForm, setKForm] = useState<KForm>(emptyK);
  const [jForm, setJForm] = useState<JForm>(emptyJ);

  const goalTitle = (id?: string) => goals.find((g) => g.id === id)?.title;
  const kpiName = (id: string) => kpis.find((k) => k.id === id)?.name ?? id;
  const kpisForGoal = (gid: string) => kpis.filter((k) => k.strategicGoalId === gid);
  const unalignedKpis = useMemo(() => kpis.filter((k) => !k.strategicGoalId || !goals.some((g) => g.id === k.strategicGoalId)), [kpis, goals]);

  // --- Corporate KPI CRUD ---
  const openKCreate = () => setKForm({ ...emptyK, open: true });
  const openKEdit = (k: CorporateKpi) => setKForm({ open: true, id: k.id, code: k.code, name: k.name, perspective: k.perspective, unit: k.unit, target: k.target, strategicGoalId: k.strategicGoalId ?? "", cascadableTo: k.cascadableTo });
  const saveK = () => {
    const name = kForm.name.trim();
    if (!name) return;
    const body = { code: kForm.code.trim() || "—", name, perspective: kForm.perspective, unit: kForm.unit.trim(), target: kForm.target.trim(), strategicGoalId: kForm.strategicGoalId || undefined, cascadableTo: kForm.cascadableTo };
    if (kForm.id == null) setKpis((l) => [...l, { id: newId("ck"), ...body }]);
    else setKpis((l) => l.map((x) => (x.id === kForm.id ? { ...x, ...body } : x)));
    setKForm(emptyK);
  };
  const removeK = (k: CorporateKpi) => { if (confirm(`${t("Delete")} “${k.name}”?`)) setKpis((l) => l.filter((x) => x.id !== k.id)); };
  const toggleCascade = (lvl: string) => setKForm((f) => ({ ...f, cascadableTo: f.cascadableTo.includes(lvl) ? f.cascadableTo.filter((x) => x !== lvl) : [...f.cascadableTo, lvl] }));

  // --- Job Profile CRUD ---
  const openJCreate = () => setJForm({ ...emptyJ, open: true });
  const openJEdit = (p: JobProfile) => setJForm({ open: true, id: p.id, role: p.role, level: p.level, unit: p.unit, purpose: p.purpose, responsibilities: p.responsibilities.join("\n"), kpiIds: p.kpiIds });
  const saveJ = () => {
    const role = jForm.role.trim();
    if (!role) return;
    const body = { role, level: jForm.level, unit: jForm.unit.trim(), purpose: jForm.purpose.trim(), responsibilities: jForm.responsibilities.split("\n").map((s) => s.trim()).filter(Boolean), kpiIds: jForm.kpiIds };
    if (jForm.id == null) setProfiles((l) => [...l, { id: newId("jp"), ...body }]);
    else setProfiles((l) => l.map((x) => (x.id === jForm.id ? { ...x, ...body } : x)));
    setJForm(emptyJ);
  };
  const removeJ = (p: JobProfile) => { if (confirm(`${t("Delete")} “${p.role}”?`)) setProfiles((l) => l.filter((x) => x.id !== p.id)); };
  const toggleKpiLink = (id: string) => setJForm((f) => ({ ...f, kpiIds: f.kpiIds.includes(id) ? f.kpiIds.filter((x) => x !== id) : [...f.kpiIds, id] }));

  return (
    <>
      <Link href="/performance" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Performance Management")}
      </Link>
      <PageHeader
        title="Performance Dictionary"
        subtitle="Corporate KPI · Strategic Goal · Alignment & Cascading · Job Profile"
        actions={
          tab === "Corporate KPI" ? <Btn variant="primary" onClick={openKCreate}><Icon.plus className="h-4 w-4" /> {t("New KPI")}</Btn>
          : tab === "Job Profile" ? <Btn variant="primary" onClick={openJCreate}><Icon.plus className="h-4 w-4" /> {t("New Profile")}</Btn>
          : undefined
        }
      />

      <div className="mb-4 flex flex-wrap rounded-xl glass p-0.5">
        {TABS.map((v) => (
          <button key={v} onClick={() => setTab(v)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition", tab === v ? "bg-royal-500 text-white" : "text-[var(--muted)] hover:text-[var(--text)]")}>
            {v === "Corporate KPI" ? t("Corporate KPI") : v === "Strategic Goal" ? t("Strategic Goal") : v === "Alignment & Cascading" ? t("Alignment & Cascading") : t("Job Profile")}
          </button>
        ))}
      </div>

      {/* ---- Corporate KPI ---- */}
      {tab === "Corporate KPI" && (
        <div className="glass card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("Code")}</th>
                  <th className="px-4 py-3 font-medium">KPI</th>
                  <th className="px-4 py-3 font-medium">{t("Perspective")}</th>
                  <th className="px-4 py-3 font-medium">{t("Target")}</th>
                  <th className="px-4 py-3 font-medium">{t("Strategic Goal")}</th>
                  <th className="px-4 py-3 font-medium">{t("Cascadable to")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {kpis.map((k) => (
                  <tr key={k.id} dir="auto" className="group border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="px-4 py-3"><Badge tone="blue">{k.code}</Badge></td>
                    <td className="px-4 py-3 font-medium">{k.name}</td>
                    <td className="px-4 py-3"><Badge tone={perspectiveTone[k.perspective] ?? "gray"}>{k.perspective}</Badge></td>
                    <td className="px-4 py-3 text-xs text-[var(--muted)]">{k.target}{k.unit ? ` ${k.unit}` : ""}</td>
                    <td className="max-w-[200px] px-4 py-3 text-xs text-[var(--muted)]">{goalTitle(k.strategicGoalId) ?? <span className="opacity-50">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {k.cascadableTo.map((lvl) => <span key={lvl} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[10px] text-royal-400">{lvl}</span>)}
                        {k.cascadableTo.length === 0 && <span className="text-[11px] text-[var(--muted)]">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2 text-[11px] opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => openKEdit(k)} title={t("Edit")} className="font-medium text-[var(--muted)] hover:text-royal-400">{t("Edit")}</button>
                        <button onClick={() => removeK(k)} title={t("Delete")} className="text-[var(--muted)] hover:text-rose-400">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {kpis.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">{t("No KPIs yet. Add one.")}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- Strategic Goal (pulled from Strategic Planning) ---- */}
      {tab === "Strategic Goal" && (
        <>
          <div className="mb-3 flex items-center gap-2 text-[12px] text-[var(--muted)]">
            <Icon.strategy className="h-4 w-4 text-violet-400" />
            {t("Pulled from Strategic Planning.")}
            <Link href="/strategy" className="font-medium text-royal-400 hover:underline">{t("Edit in Strategic Planning")}</Link>
          </div>
          <div className="space-y-3">
            {goals.map((g) => {
              const linked = kpisForGoal(g.id);
              return (
                <Card key={g.id} dir="auto">
                  <div className="flex items-start gap-3">
                    <Icon.strategy className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{g.title}</span>
                        <Badge tone="gray">{g.target}</Badge>
                        <Badge tone="blue">{linked.length} KPI</Badge>
                      </div>
                      <p className="mt-1 text-[13px] text-[var(--muted)]">{g.description}</p>
                      {linked.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {linked.map((k) => <span key={k.id} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[10px] text-royal-400">{k.code} · {k.name}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
            {goals.length === 0 && <Card className="text-center text-[13px] text-[var(--muted)]">{t("No strategic goals yet. Add them in Strategic Planning.")}</Card>}
          </div>
        </>
      )}

      {/* ---- Alignment & Cascading Catalogue ---- */}
      {tab === "Alignment & Cascading" && (
        <div className="space-y-3">
          {goals.map((g) => {
            const linked = kpisForGoal(g.id);
            return (
              <Card key={g.id} dir="auto">
                <div className="flex items-center gap-2">
                  <Icon.strategy className="h-4 w-4 shrink-0 text-violet-400" />
                  <span className="font-semibold">{g.title}</span>
                  <Badge tone="gray">{g.target}</Badge>
                </div>
                <div className="mt-2 space-y-2 border-t pt-2">
                  {linked.map((k) => (
                    <div key={k.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5">
                      <Badge tone="blue">{k.code}</Badge>
                      <span className="min-w-0 flex-1 text-[13px] font-medium">{k.name}</span>
                      <Badge tone={perspectiveTone[k.perspective] ?? "gray"}>{k.perspective}</Badge>
                      <Icon.chevron className="h-3.5 w-3.5 text-[var(--muted)]" />
                      <div className="flex flex-wrap gap-1">
                        {k.cascadableTo.length > 0 ? k.cascadableTo.map((lvl) => <span key={lvl} className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-500">{lvl}</span>)
                          : <span className="text-[11px] text-[var(--muted)]">{t("not cascaded")}</span>}
                      </div>
                    </div>
                  ))}
                  {linked.length === 0 && <div className="py-1.5 text-[12px] text-[var(--muted)]">{t("No KPI aligned to this goal yet.")}</div>}
                </div>
              </Card>
            );
          })}
          {unalignedKpis.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 text-[var(--muted)]"><Icon.alert className="h-4 w-4" /><span className="text-[13px] font-semibold">{t("Unaligned KPIs")}</span><Badge tone="amber">{unalignedKpis.length}</Badge></div>
              <div className="mt-2 flex flex-wrap gap-1 border-t pt-2">
                {unalignedKpis.map((k) => <span key={k.id} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-500">{k.code} · {k.name}</span>)}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ---- Job Profile & Others ---- */}
      {tab === "Job Profile" && (
        <div className="grid gap-3 lg:grid-cols-2">
          {profiles.map((p) => (
            <Card key={p.id} dir="auto" className="group">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{p.role}</span>
                    <Badge tone="purple">{p.level}</Badge>
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">{p.unit}</div>
                </div>
                <div className="flex items-center gap-2 text-[11px] opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => openJEdit(p)} title={t("Edit")} className="font-medium text-[var(--muted)] hover:text-royal-400">{t("Edit")}</button>
                  <button onClick={() => removeJ(p)} title={t("Delete")} className="text-[var(--muted)] hover:text-rose-400">✕</button>
                </div>
              </div>
              {p.purpose && <p className="mt-2 text-[13px] text-[var(--muted)]">{p.purpose}</p>}
              {p.responsibilities.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[12px]">
                  {p.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
              {p.kpiIds.length > 0 && (
                <div className="mt-2 border-t pt-2">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Linked KPIs")}</div>
                  <div className="flex flex-wrap gap-1">{p.kpiIds.map((id) => <span key={id} className="rounded bg-royal-500/10 px-1.5 py-0.5 text-[10px] text-royal-400">{kpiName(id)}</span>)}</div>
                </div>
              )}
            </Card>
          ))}
          {profiles.length === 0 && <Card className="text-center text-[13px] text-[var(--muted)]">{t("No job profiles yet. Add one.")}</Card>}
        </div>
      )}

      {/* KPI modal */}
      {kForm.open && (
        <Modal wide title={kForm.id == null ? t("New KPI") : t("Edit KPI")} onClose={() => setKForm(emptyK)} onSave={saveK} saveLabel={kForm.id == null ? t("Create") : t("Save")}>
          <div className="grid grid-cols-3 gap-3">
            <label className={labelCls}>{t("Code")}<input value={kForm.code} onChange={(e) => setKForm((f) => ({ ...f, code: e.target.value }))} placeholder="CK-07" className={inputCls} /></label>
            <label className={cn(labelCls, "col-span-2")}>{t("Name")}<input value={kForm.name} onChange={(e) => setKForm((f) => ({ ...f, name: e.target.value }))} placeholder={t("e.g. Corporate Revenue Growth")} className={inputCls} /></label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className={labelCls}>{t("Perspective")}
              <select value={kForm.perspective} onChange={(e) => setKForm((f) => ({ ...f, perspective: e.target.value }))} className={`${inputCls} text-[var(--text)]`}>
                {kpiPerspectives.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className={labelCls}>{t("Target")}<input value={kForm.target} onChange={(e) => setKForm((f) => ({ ...f, target: e.target.value }))} placeholder="12" className={inputCls} /></label>
            <label className={labelCls}>{t("Unit")}<input value={kForm.unit} onChange={(e) => setKForm((f) => ({ ...f, unit: e.target.value }))} placeholder="%" className={inputCls} /></label>
          </div>
          <label className={labelCls}>{t("Strategic Goal")}
            <select value={kForm.strategicGoalId} onChange={(e) => setKForm((f) => ({ ...f, strategicGoalId: e.target.value }))} className={`${inputCls} text-[var(--text)]`}>
              <option value="">{t("— none")}</option>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </label>
          <div>
            <div className={labelCls}>{t("Cascadable to")}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {subordinateLevels.map((lvl) => (
                <button key={lvl} type="button" onClick={() => toggleCascade(lvl)} className={cn("rounded-lg border px-2.5 py-1 text-[12px] transition", kForm.cascadableTo.includes(lvl) ? "border-royal-500 bg-royal-500/15 text-royal-400" : "text-[var(--muted)] hover:border-royal-500/40")}>{lvl}</button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Job Profile modal */}
      {jForm.open && (
        <Modal wide title={jForm.id == null ? t("New Profile") : t("Edit Profile")} onClose={() => setJForm(emptyJ)} onSave={saveJ} saveLabel={jForm.id == null ? t("Create") : t("Save")}>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>{t("Role")}<input value={jForm.role} onChange={(e) => setJForm((f) => ({ ...f, role: e.target.value }))} placeholder={t("e.g. SVP Human Capital")} className={inputCls} /></label>
            <label className={labelCls}>{t("Level")}
              <select value={jForm.level} onChange={(e) => setJForm((f) => ({ ...f, level: e.target.value }))} className={`${inputCls} text-[var(--text)]`}>
                {subordinateLevels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
          </div>
          <label className={labelCls}>{t("Unit")}<input value={jForm.unit} onChange={(e) => setJForm((f) => ({ ...f, unit: e.target.value }))} placeholder="Human Capital" className={inputCls} /></label>
          <label className={labelCls}>{t("Purpose")}<textarea value={jForm.purpose} onChange={(e) => setJForm((f) => ({ ...f, purpose: e.target.value }))} rows={2} className={inputCls} /></label>
          <label className={labelCls}>{t("Responsibilities (one per line)")}<textarea value={jForm.responsibilities} onChange={(e) => setJForm((f) => ({ ...f, responsibilities: e.target.value }))} rows={3} className={inputCls} /></label>
          <div>
            <div className={labelCls}>{t("Linked KPIs")}</div>
            <div className="mt-1 max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
              {kpis.map((k) => (
                <label key={k.id} className="flex items-center gap-2 text-[12px]">
                  <input type="checkbox" checked={jForm.kpiIds.includes(k.id)} onChange={() => toggleKpiLink(k.id)} className="accent-royal-500" />
                  <span className="text-[var(--muted)]">{k.code}</span> {k.name}
                </label>
              ))}
              {kpis.length === 0 && <div className="text-[12px] text-[var(--muted)]">{t("No KPIs yet. Add one.")}</div>}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
