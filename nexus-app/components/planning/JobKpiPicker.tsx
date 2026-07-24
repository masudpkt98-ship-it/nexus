"use client";

import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Btn } from "@/components/PageHeader";
import { Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { emptyForm, newKpiId } from "@/components/planning/KpiFormModal";
import { kpiPerspectives, type PlanningKpi } from "@/lib/data";
import { type Responsibility } from "@/lib/jobKpi";
import { usedKpiNames, isKpiUsed } from "@/lib/kpiUsage";
import { useI18n } from "@/lib/i18n";

type JobDescLite = { jabatanName?: string; responsibilities?: Responsibility[] | string };

const respList = (r: Responsibility[] | string | undefined): Responsibility[] => {
  if (Array.isArray(r)) return r;
  if (typeof r === "string") return r.split("\n").map((s) => s.trim()).filter(Boolean).map((text) => ({ text, kpis: [] }));
  return [];
};

/** Pick KPIs from an imported Job Profile (compass-job-desc) to add as
 *  Planning KPI Items. Nothing is added automatically — the user chooses. */
export function JobKpiPicker({ period, group, onAdd, onClose }: { period: string; group: string; onAdd: (kpis: PlanningKpi[]) => void; onClose: () => void }) {
  const { t } = useI18n();
  const descs = useMemo<Record<string, JobDescLite>>(() => {
    try { return JSON.parse(localStorage.getItem("compass-job-desc") || "{}"); } catch { return {}; }
  }, []);
  const jobs = useMemo(
    () => Object.entries(descs)
      .map(([key, d]) => ({ key, name: d.jabatanName || "", resps: respList(d.responsibilities) }))
      .filter((j) => j.name && j.resps.some((r) => r.kpis?.length))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [descs],
  );
  const [jobKey, setJobKey] = useState(jobs[0]?.key ?? "");
  const job = jobs.find((j) => j.key === jobKey);
  const [sel, setSel] = useState<Set<string>>(new Set());

  const used = useMemo(() => usedKpiNames(), []);
  const flat = job ? job.resps.flatMap((r, ri) => r.kpis.map((k, ki) => ({ r, k, id: `${ri}-${ki}` }))) : [];
  const unusedIds = flat.filter((x) => !isKpiUsed(used, x.k.name)).map((x) => x.id);
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allOn = unusedIds.length > 0 && unusedIds.every((id) => sel.has(id));
  const toggleAll = () => setSel(allOn ? new Set() : new Set(unusedIds));

  const add = () => {
    const chosen = flat.filter((x) => sel.has(x.id));
    const kpis: PlanningKpi[] = chosen.map(({ k }) => ({
      ...emptyForm(period, group),
      id: newKpiId(),
      name: k.name,
      perspective: (kpiPerspectives as readonly string[]).includes(k.perspective) ? k.perspective : "Financial",
      weight: k.weight || 0,
      unit: k.uom || "Persen",
      annualTarget: Number(k.target) || 0,
    } as PlanningKpi));
    onAdd(kpis);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-2xl glass card shadow-glass animate-fade-up">
          <div className="flex items-center gap-2 border-b p-4">
            <Icon.document className="h-4 w-4 shrink-0 text-royal-400" />
            <div className="text-sm font-semibold">{t("Add KPI from Job Profile")}</div>
            <button onClick={onClose} className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400" aria-label="Close">✕</button>
          </div>

          <div className="space-y-3 p-5">
            {jobs.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-[var(--muted)]">{t("No Job Profile KPIs found. Import the KPI Excel in Job Profile first.")}</p>
            ) : (
              <>
                <label className="block text-[11px] font-medium text-[var(--muted)]">
                  {t("Job Profile")}
                  <select value={jobKey} onChange={(e) => { setJobKey(e.target.value); setSel(new Set()); }} className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
                    {jobs.map((j) => (<option key={j.key} value={j.key}>{j.name}</option>))}
                  </select>
                </label>

                <div className="flex items-center justify-between">
                  <button onClick={toggleAll} className="text-[12px] font-medium text-royal-400 hover:text-royal-300">{allOn ? t("Clear all") : t("Select all")}</button>
                  <span className="text-[11px] text-[var(--muted)]">{sel.size} {t("selected")}</span>
                </div>

                <div className="max-h-[52vh] space-y-3 overflow-y-auto">
                  {job?.resps.map((r, ri) => (
                    <div key={ri} className="rounded-lg border p-2.5">
                      <div className="mb-1.5 flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-royal-500/15 text-[10px] font-bold text-royal-400">{ri + 1}</span>
                        <span className="text-[12px] font-medium">{r.text}</span>
                      </div>
                      <div className="space-y-1 pl-7">
                        {r.kpis.map((k, ki) => {
                          const id = `${ri}-${ki}`;
                          return (
                            <label key={ki} className={cn("flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[12px] transition hover:bg-black/5 dark:hover:bg-white/5", sel.has(id) && "bg-royal-500/10")}>
                              <input type="checkbox" checked={sel.has(id)} onChange={() => toggle(id)} className="h-3.5 w-3.5 accent-royal-500" />
                              <span className={cn("min-w-0 flex-1 truncate", isKpiUsed(used, k.name) && "text-[var(--muted)]")}>{k.name}</span>
                              {isKpiUsed(used, k.name) && <Badge tone="green">✓ {t("Used")}</Badge>}
                              {k.uom && <Badge tone="gray">{k.uom}</Badge>}
                              {k.target && <span className="text-[var(--muted)]">T: {k.target}</span>}
                              {!!k.weight && <Badge tone="blue">{k.weight}%</Badge>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t p-3">
            <Btn variant="ghost" onClick={onClose}>{t("Cancel")}</Btn>
            <Btn variant="primary" onClick={add} disabled={sel.size === 0}><Icon.plus className="h-4 w-4" /> {t("Add")} ({sel.size})</Btn>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
