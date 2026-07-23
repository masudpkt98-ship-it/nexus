"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { exportCompetencyProfile, type CompetencyExportData } from "@/lib/competencyExport";
import { technicalCompetencyLevels as levels, type DictionaryCompetency, type Employee } from "@/lib/data";
import { competencyDictionarySeed } from "@/lib/competencyDictionarySeed";
import { jobCompetencyProfiles } from "@/lib/jobCompetencyProfiles";
import { jabatanCompetencyProfiles } from "@/lib/jabatanCompetencyProfiles";
import { jabatanTitleMap } from "@/lib/jabatanTitleMap";
import { useI18n } from "@/lib/i18n";

const selCls = "rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500";
const levelTone = (l: number): "gray" | "blue" | "amber" | "green" | "red" =>
  l >= 5 ? "green" : l >= 4 ? "blue" : l >= 3 ? "amber" : "gray";
const tierTone = (t: string): "green" | "blue" | "gray" =>
  t === "Inti" ? "green" : t === "Primer" ? "blue" : "gray";
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

export default function JobCompetencyProfilePage() {
  const { t } = useI18n();

  const techById = useMemo(() => {
    const m = new Map<number, DictionaryCompetency>();
    for (const c of competencyDictionarySeed) {
      if (c.category !== "Kompetensi Teknis") continue;
      const n = parseInt(c.code.replace(/\D/g, ""), 10);
      if (n) m.set(n, c);
    }
    return m;
  }, []);
  const behByName = useMemo(() => {
    const m = new Map<string, DictionaryCompetency>();
    for (const c of competencyDictionarySeed) if (c.category === "Perilaku") m.set(norm(c.name), c);
    return m;
  }, []);
  const levelName = (l: number) => levels.find((x) => x.level === l)?.name ?? `L${l}`;

  // ---- Real-jabatan profile (DataORG): technical + behavioral ----
  const jabByKey = useMemo(() => {
    const m = new Map<string, (typeof jabatanCompetencyProfiles)[number]>();
    for (const p of jabatanCompetencyProfiles) m.set(p.key, p);
    return m;
  }, []);
  const [jabKey, setJabKey] = useState<string | null>(null);
  const [jabQ, setJabQ] = useState("");
  const [empQ, setEmpQ] = useState("");
  const [empNote, setEmpNote] = useState<string | null>(null);
  const [matchedEmp, setMatchedEmp] = useState<{ name: string; npk: string } | null>(null);
  const [openC, setOpenC] = useState<Record<string, boolean>>({});
  const jab = jabKey ? jabByKey.get(jabKey) ?? null : null;

  // Employee Directory (read-only, from the imported/scoped `nexus-employees`).
  const [emps, setEmps] = useState<Employee[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nexus-employees");
      if (raw) setEmps(JSON.parse(raw) as Employee[]);
    } catch { /* ignore */ }
  }, []);
  const empMatches = useMemo(() => {
    const q = empQ.trim().toLowerCase();
    if (q.length < 2) return [];
    return emps.filter((e) => (e.name || "").toLowerCase().includes(q)).slice(0, 40);
  }, [empQ, emps]);

  const jabMatches = useMemo(() => {
    const q = jabQ.trim().toLowerCase();
    if (!q) return [];
    return jabatanCompetencyProfiles.filter((p) => p.jabatan.toLowerCase().includes(q)).slice(0, 40);
  }, [jabQ]);

  const pickEmployee = (e: Employee) => {
    setEmpNote(null);
    const pos = (e.position || "").trim();
    if (!pos) return;
    // Employee Directory uses the new PI job-title naming ("Auditor …"); the
    // profiles use the old PKT naming ("Staf Muda …"). Bridge via the title map,
    // then fall back to direct / contains matching.
    const np = norm(pos);
    const mapped = jabatanTitleMap[np];
    const match =
      (mapped ? jabByKey.get(mapped) : undefined) ||
      jabByKey.get(np) ||
      jabatanCompetencyProfiles.find((p) => p.key.includes(np) || np.includes(p.key));
    setEmpQ("");
    setMatchedEmp({ name: e.name, npk: String(e.npk ?? "") });
    if (match) {
      setJabKey(match.key); setJabQ("");
      setEmpNote(`${e.name} · ${e.position} → ${match.jabatan}`);
    } else {
      setJabKey(null);
      setEmpNote(`${e.name} · ${e.position} — ${t("No competency profile found for this employee's position.")}`);
    }
  };

  const buildExport = (): CompetencyExportData | null => {
    if (!jab) return null;
    return {
      employeeName: matchedEmp?.name,
      employeeNpk: matchedEmp?.npk || undefined,
      jabatan: jab.jabatan, band: jab.band, jobStream: jab.jobStream, sf: jab.sf,
      technical: jab.tech.map((tc) => {
        const c = tc.c ? techById.get(tc.c) : undefined;
        return { code: c?.code ?? (tc.c ? `TC-${tc.c}` : "—"), name: c?.name ?? tc.n ?? `#${tc.c}`, level: tc.l, levelName: levelName(tc.l) };
      }),
      behavioral: jab.beh.map((b) => ({ name: behByName.get(norm(b.n))?.name ?? b.n, tier: b.t })),
    };
  };
  const doExport = (kind: "excel" | "pdf") => { const d = buildExport(); if (d) exportCompetencyProfile(kind, d); };

  const toggleC = (id: string) => setOpenC((o) => ({ ...o, [id]: !o[id] }));

  // ---- Job Family (generic) browse — reference ----
  const families = useMemo(() => Array.from(new Set(jobCompetencyProfiles.map((j) => j.jobFamily))).sort(), []);
  const [fam, setFam] = useState(families[0]);
  const [fn, setFn] = useState("");
  const [band, setBand] = useState("");
  const [q, setQ] = useState("");
  const [selJfId, setSelJfId] = useState<string | null>(null);
  const functions = useMemo(() => Array.from(new Set(jobCompetencyProfiles.filter((j) => j.jobFamily === fam).map((j) => j.jobFunction).filter(Boolean))).sort(), [fam]);
  const bands = useMemo(() => Array.from(new Set(jobCompetencyProfiles.filter((j) => j.jobFamily === fam).map((j) => j.band).filter(Boolean))).sort(), [fam]);
  const jfJobs = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return jobCompetencyProfiles.filter((j) => j.jobFamily === fam && (!fn || j.jobFunction === fn) && (!band || j.band === band) && (!needle || `${j.title} ${j.band} ${j.jobStream}`.toLowerCase().includes(needle)));
  }, [fam, fn, band, q]);
  const selJf = useMemo(() => jobCompetencyProfiles.find((j) => j.id === selJfId) || null, [selJfId]);
  const [showJf, setShowJf] = useState(false);

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader title="Job Competency Profile" subtitle="Manajemen Kompetensi · Kompetensi Teknis & Perilaku yang dibutuhkan per jabatan" />

      {/* Search: by employee or by jabatan */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="relative block text-[11px] font-medium text-[var(--muted)]">
            {t("Find by employee")}
            <div className="relative mt-1 w-72">
              <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input value={empQ} onChange={(e) => setEmpQ(e.target.value)} placeholder={emps.length ? t("Type an employee name…") : t("Sign in to load the employee directory")} className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500" />
            </div>
            {empMatches.length > 0 && (
              <div className="absolute z-30 mt-1 max-h-72 w-72 overflow-y-auto rounded-lg border bg-[rgb(var(--surface))] shadow-glass">
                {empMatches.map((e) => (
                  <button key={e.npk || e.name} onClick={() => pickEmployee(e)} className="block w-full px-3 py-1.5 text-left hover:bg-black/5 dark:hover:bg-white/5">
                    <div className="truncate text-[12px] font-medium">{e.name}</div>
                    <div className="truncate text-[10px] text-[var(--muted)]">{e.position}{e.unit ? ` · ${e.unit}` : ""}</div>
                  </button>
                ))}
              </div>
            )}
            {empQ.trim().length >= 2 && empMatches.length === 0 && emps.length > 0 && (
              <div className="absolute z-30 mt-1 w-72 rounded-lg border bg-[rgb(var(--surface))] px-3 py-2 text-[12px] text-[var(--muted)] shadow-glass">{t("No employee matches.")}</div>
            )}
          </label>
          <label className="relative block text-[11px] font-medium text-[var(--muted)]">
            {t("or search a job title")}
            <input value={jabQ} onChange={(e) => { setJabQ(e.target.value); }} placeholder={t("e.g. VP Audit…")} className="mt-1 w-64 rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500" />
            {jabMatches.length > 0 && jabQ && (
              <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-[rgb(var(--surface))] shadow-glass">
                {jabMatches.map((p) => (
                  <button key={p.key} onClick={() => { setJabKey(p.key); setJabQ(""); setEmpNote(null); setMatchedEmp(null); }} className="block w-full truncate px-3 py-1.5 text-left text-[12px] hover:bg-black/5 dark:hover:bg-white/5">
                    {p.jabatan} <span className="text-[var(--muted)]">· {p.band}</span>
                  </button>
                ))}
              </div>
            )}
          </label>
        </div>
        {empNote && <div className="mt-2 rounded-lg border border-royal-500/30 bg-royal-500/10 px-3 py-1.5 text-[12px] text-royal-300">{empNote}</div>}
      </Card>

      {/* Selected jabatan profile */}
      {jab && (
        <div className="mb-6">
          <Card className="mb-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                {matchedEmp && <div className="text-[12px] text-[var(--muted)]">{matchedEmp.name}</div>}
                <div className="text-base font-semibold">{jab.jabatan}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[var(--muted)]">
                  {jab.band && <Badge tone="blue">{jab.band}</Badge>}
                  {jab.sf && <Badge tone="gray">{jab.sf}</Badge>}
                  {jab.jobStream && <span>· {jab.jobStream}</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Btn variant="ghost" onClick={() => doExport("excel")}><Icon.document className="h-3.5 w-3.5" /> {t("Export Excel")}</Btn>
                <Btn variant="ghost" onClick={() => doExport("pdf")}><Icon.document className="h-3.5 w-3.5" /> {t("Export PDF")}</Btn>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Technical */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Kompetensi Teknis")}</div>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--muted)] dark:bg-white/10">{jab.tech.length}</span>
              </div>
              <div className="glass card divide-y">
                {jab.tech.map((tc, i) => {
                  const c = tc.c ? techById.get(tc.c) : undefined;
                  const name = c?.name ?? tc.n ?? `#${tc.c}`;
                  const key = `jt-${jab.key}-${i}`;
                  const isOpen = openC[key];
                  const ind = c?.indicators.find((x) => x.level === tc.l)?.indicator?.trim();
                  return (
                    <div key={key}>
                      <button onClick={() => c && toggleC(key)} className={cn("flex w-full items-center gap-2 px-3 py-2 text-left", c && "transition hover:bg-black/5 dark:hover:bg-white/5")}>
                        {c ? <Icon.chevron className={cn("h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition", isOpen && "rotate-90")} /> : <span className="w-3.5" />}
                        {c && <Badge tone="blue">{c.code}</Badge>}
                        <span className="min-w-0 flex-1 truncate text-[13px]">{name}</span>
                        <Badge tone={levelTone(tc.l)}>L{tc.l}</Badge>
                      </button>
                      {isOpen && c && (
                        <div className="border-t bg-black/[0.02] px-3 py-2.5 dark:bg-white/[0.02]">
                          {c.definition && <p className="mb-1.5 text-[12px] text-[var(--muted)]">{c.definition}</p>}
                          <div className="text-[11px] font-semibold text-[var(--muted)]">{t("Target level")} — L{tc.l} · {levelName(tc.l)}</div>
                          <div className="mt-1 whitespace-pre-line text-[12px]">{ind || <span className="text-[var(--muted)]">—</span>}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {jab.tech.length === 0 && <div className="px-3 py-4 text-center text-[12px] text-[var(--muted)]">—</div>}
              </div>
            </div>

            {/* Behavioral */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Kompetensi Perilaku")}</div>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--muted)] dark:bg-white/10">{jab.beh.length}</span>
              </div>
              <div className="glass card divide-y">
                {jab.beh.map((b, i) => {
                  const c = behByName.get(norm(b.n));
                  const key = `jb-${jab.key}-${i}`;
                  const isOpen = openC[key];
                  return (
                    <div key={key}>
                      <button onClick={() => c && toggleC(key)} className={cn("flex w-full items-center gap-2 px-3 py-2 text-left", c && "transition hover:bg-black/5 dark:hover:bg-white/5")}>
                        {c ? <Icon.chevron className={cn("h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition", isOpen && "rotate-90")} /> : <span className="w-3.5" />}
                        <span className="min-w-0 flex-1 truncate text-[13px]">{c?.name ?? b.n}</span>
                        <Badge tone={tierTone(b.t)}>{b.t}</Badge>
                      </button>
                      {isOpen && c && (
                        <div className="border-t bg-black/[0.02] px-3 py-2.5 dark:bg-white/[0.02]">
                          {c.definition && <p className="mb-1.5 text-[12px] text-[var(--muted)]">{c.definition}</p>}
                          {c.keyActions?.length ? (
                            <ul className="space-y-1">
                              {c.keyActions.map((a, j) => (<li key={j} className="flex gap-1.5 text-[12px]"><span className="text-royal-400">•</span><span>{a}</span></li>))}
                            </ul>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
                {jab.beh.length === 0 && <div className="px-3 py-4 text-center text-[12px] text-[var(--muted)]">—</div>}
              </div>
              <div className="mt-1.5 text-[10px] text-[var(--muted)]">{t("Tier: Inti = core · Primer = primary · Sekunder = secondary")}</div>
            </div>
          </div>
        </div>
      )}

      {/* Reference: browse by Job Family (generic Success Profile) */}
      <button onClick={() => setShowJf((s) => !s)} className="mb-3 flex items-center gap-2 text-[12px] font-medium text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className={cn("h-4 w-4 transition", showJf && "rotate-90")} /> {t("Browse by Job Family (generic)")}
      </button>
      {showJf && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select value={fam} onChange={(e) => { setFam(e.target.value); setFn(""); setBand(""); setSelJfId(null); }} className={selCls}>
              {families.map((f) => (<option key={f} value={f}>{f}</option>))}
            </select>
            <select value={fn} onChange={(e) => { setFn(e.target.value); setSelJfId(null); }} className={selCls}>
              <option value="">{t("All Job Functions")}</option>
              {functions.map((f) => (<option key={f} value={f}>{f}</option>))}
            </select>
            <select value={band} onChange={(e) => { setBand(e.target.value); setSelJfId(null); }} className={selCls}>
              <option value="">{t("All Bands")}</option>
              {bands.map((b) => (<option key={b} value={b}>{b}</option>))}
            </select>
            <div className="relative min-w-[180px] flex-1">
              <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search job title, band, stream…")} className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500" />
            </div>
            <span className="text-[12px] text-[var(--muted)]">{jfJobs.length} {t("jobs")}</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
            <div className="glass card max-h-[60vh] overflow-y-auto">
              {jfJobs.map((j) => (
                <button key={j.id} onClick={() => setSelJfId(j.id)} className={cn("flex w-full items-center gap-2 border-b px-3 py-2 text-left last:border-0 transition hover:bg-black/5 dark:hover:bg-white/5", selJfId === j.id && "bg-royal-500/10")}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{j.title}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[var(--muted)]"><Badge tone="gray">{j.band}</Badge>{j.jobStream && <span>· {j.jobStream}</span>}</div>
                  </div>
                  <span className="shrink-0 text-[10px] text-[var(--muted)]">{j.tech.length}</span>
                </button>
              ))}
              {jfJobs.length === 0 && <div className="px-3 py-8 text-center text-[13px] text-[var(--muted)]">{t("No jobs match your filters.")}</div>}
            </div>
            <div>
              {!selJf ? (
                <Card className="flex h-full min-h-[160px] items-center justify-center text-center text-[13px] text-[var(--muted)]">{t("Select a job to see its required competencies.")}</Card>
              ) : (
                <div className="glass card divide-y">
                  {selJf.tech.slice().sort((a, b) => b.l - a.l).map((tc) => {
                    const c = techById.get(tc.c);
                    return (
                      <div key={`${selJf.id}-${tc.c}`} className="flex items-center gap-2 px-3 py-2">
                        <Badge tone="blue">{c?.code ?? `TC-${tc.c}`}</Badge>
                        <span className="min-w-0 flex-1 truncate text-[13px]">{c?.name ?? `#${tc.c}`}</span>
                        <Badge tone={levelTone(tc.l)}>L{tc.l} · {levelName(tc.l)}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
