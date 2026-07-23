"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { EmployeePicker } from "@/components/EmployeePicker";
import { technicalCompetencyLevels as levels, type DictionaryCompetency, type Employee } from "@/lib/data";
import { competencyDictionarySeed } from "@/lib/competencyDictionarySeed";
import { jobCompetencyProfiles } from "@/lib/jobCompetencyProfiles";
import { useI18n } from "@/lib/i18n";

const selCls = "rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500";
const levelTone = (l: number): "gray" | "blue" | "amber" | "green" | "red" =>
  l >= 5 ? "green" : l >= 4 ? "blue" : l >= 3 ? "amber" : "gray";

export default function JobCompetencyProfilePage() {
  const { t } = useI18n();

  // technical competencies by numeric id (TC-<n>)
  const techById = useMemo(() => {
    const m = new Map<number, DictionaryCompetency>();
    for (const c of competencyDictionarySeed) {
      if (c.category !== "Kompetensi Teknis") continue;
      const n = parseInt(c.code.replace(/\D/g, ""), 10);
      if (n) m.set(n, c);
    }
    return m;
  }, []);
  const levelName = (l: number) => levels.find((x) => x.level === l)?.name ?? `L${l}`;

  const families = useMemo(() => Array.from(new Set(jobCompetencyProfiles.map((j) => j.jobFamily))).sort(), []);
  const [fam, setFam] = useState(families[0]);
  const [fn, setFn] = useState("");
  const [band, setBand] = useState("");
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<string | null>(null);
  const [openC, setOpenC] = useState<Record<string, boolean>>({});
  const [empNote, setEmpNote] = useState<string | null>(null);

  const functions = useMemo(
    () => Array.from(new Set(jobCompetencyProfiles.filter((j) => j.jobFamily === fam).map((j) => j.jobFunction).filter(Boolean))).sort(),
    [fam],
  );
  const bands = useMemo(
    () => Array.from(new Set(jobCompetencyProfiles.filter((j) => j.jobFamily === fam).map((j) => j.band).filter(Boolean))).sort(),
    [fam],
  );
  const jobs = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return jobCompetencyProfiles.filter(
      (j) =>
        j.jobFamily === fam &&
        (!fn || j.jobFunction === fn) &&
        (!band || j.band === band) &&
        (!needle || `${j.title} ${j.band} ${j.jobStream} ${j.jobFunction}`.toLowerCase().includes(needle)),
    );
  }, [fam, fn, band, q]);
  const sel = useMemo(() => jobCompetencyProfiles.find((j) => j.id === selId) || null, [selId]);

  const switchFam = (f: string) => { setFam(f); setFn(""); setBand(""); setSelId(null); };

  // Jump to the job whose title best matches an employee's position/title.
  const pickEmployee = (e: Employee) => {
    setEmpNote(null);
    const pos = (e.position || "").toLowerCase().trim();
    if (!pos) return;
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const np = norm(pos);
    const match =
      jobCompetencyProfiles.find((j) => norm(j.title) === np) ||
      jobCompetencyProfiles.find((j) => norm(j.title).includes(np) || np.includes(norm(j.title)));
    if (match) {
      setFam(match.jobFamily); setFn(""); setBand(""); setSelId(match.id); setQ("");
      setEmpNote(`${e.name} · ${e.position} → ${match.title} (${match.band})`);
    } else {
      setEmpNote(t("No matching job profile for this employee's position. Browse by Job Family instead."));
    }
  };

  const toggleC = (id: string) => setOpenC((o) => ({ ...o, [id]: !o[id] }));

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader title="Job Competency Profile" subtitle="Manajemen Kompetensi · Kompetensi Teknis yang dibutuhkan per jabatan (Success Profile)" />

      {/* Find by employee */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-[11px] font-medium text-[var(--muted)]">
            {t("Find by employee")}
            <EmployeePicker value="" onChange={() => {}} onPick={pickEmployee} placeholderFallback={t("Type an employee name…")} className="mt-1 w-72 rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500" />
          </label>
          <span className="pb-1.5 text-[11px] text-[var(--muted)]">{t("or browse by Job Family below")}</span>
        </div>
        {empNote && <div className="mt-2 rounded-lg border border-royal-500/30 bg-royal-500/10 px-3 py-1.5 text-[12px] text-royal-300">{empNote}</div>}
      </Card>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={fam} onChange={(e) => switchFam(e.target.value)} className={selCls}>
          {families.map((f) => (<option key={f} value={f}>{f}</option>))}
        </select>
        <select value={fn} onChange={(e) => { setFn(e.target.value); setSelId(null); }} className={selCls}>
          <option value="">{t("All Job Functions")}</option>
          {functions.map((f) => (<option key={f} value={f}>{f}</option>))}
        </select>
        <select value={band} onChange={(e) => { setBand(e.target.value); setSelId(null); }} className={selCls}>
          <option value="">{t("All Bands")}</option>
          {bands.map((b) => (<option key={b} value={b}>{b}</option>))}
        </select>
        <div className="relative min-w-[200px] flex-1">
          <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search job title, band, stream…")} className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500" />
        </div>
        <span className="text-[12px] text-[var(--muted)]">{jobs.length} {t("jobs")}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* Job list */}
        <div className="glass card max-h-[70vh] overflow-y-auto">
          {jobs.map((j) => (
            <button
              key={j.id}
              onClick={() => setSelId(j.id)}
              className={cn("flex w-full items-center gap-2 border-b px-3 py-2.5 text-left last:border-0 transition hover:bg-black/5 dark:hover:bg-white/5", selId === j.id && "bg-royal-500/10")}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{j.title}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--muted)]">
                  <Badge tone="gray">{j.band}</Badge>
                  {j.type && <span>{j.type}</span>}
                  {j.jobStream && <span>· {j.jobStream}</span>}
                </div>
              </div>
              <span className="shrink-0 text-[10px] text-[var(--muted)]">{j.tech.length}</span>
            </button>
          ))}
          {jobs.length === 0 && <div className="px-3 py-8 text-center text-[13px] text-[var(--muted)]">{t("No jobs match your filters.")}</div>}
        </div>

        {/* Selected job's competency profile */}
        <div>
          {!sel ? (
            <Card className="flex h-full min-h-[200px] items-center justify-center text-center text-[13px] text-[var(--muted)]">
              {t("Select a job to see its required competencies.")}
            </Card>
          ) : (
            <>
              <Card className="mb-3">
                <div className="text-base font-semibold">{sel.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[var(--muted)]">
                  <Badge tone="blue">{sel.band}</Badge>
                  {sel.managerial && <Badge tone="gray">{sel.managerial}</Badge>}
                  {sel.type && <span>{sel.type}</span>}
                </div>
                <div className="mt-2 grid gap-1 text-[12px] text-[var(--muted)] sm:grid-cols-3">
                  <div><span className="font-medium text-[var(--text)]">{t("Job Family")}:</span> {sel.jobFamily}</div>
                  <div><span className="font-medium text-[var(--text)]">{t("Job Function")}:</span> {sel.jobFunction || "—"}</div>
                  <div><span className="font-medium text-[var(--text)]">{t("Job Stream")}:</span> {sel.jobStream || "—"}</div>
                </div>
              </Card>

              <div className="mb-2 flex items-center gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Kompetensi Teknis")}</div>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--muted)] dark:bg-white/10">{sel.tech.length}</span>
              </div>
              <div className="glass card divide-y">
                {sel.tech.slice().sort((a, b) => b.l - a.l).map((tc) => {
                  const c = techById.get(tc.c);
                  const key = `${sel.id}-${tc.c}`;
                  const isOpen = openC[key];
                  const ind = c?.indicators.find((i) => i.level === tc.l)?.indicator?.trim();
                  return (
                    <div key={key}>
                      <button onClick={() => toggleC(key)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-black/5 dark:hover:bg-white/5">
                        <Icon.chevron className={cn("h-4 w-4 shrink-0 text-[var(--muted)] transition", isOpen && "rotate-90")} />
                        <Badge tone="blue">{c?.code ?? `TC-${tc.c}`}</Badge>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{c?.name ?? `#${tc.c}`}</span>
                        <Badge tone={levelTone(tc.l)}>L{tc.l} · {levelName(tc.l)}</Badge>
                      </button>
                      {isOpen && (
                        <div className="border-t bg-black/[0.02] px-3 py-3 dark:bg-white/[0.02]">
                          {c?.definition && <p className="mb-2 text-[12px] text-[var(--muted)]">{c.definition}</p>}
                          <div className="text-[11px] font-semibold text-[var(--muted)]">{t("Target level")} — L{tc.l} · {levelName(tc.l)}</div>
                          <div className="mt-1 whitespace-pre-line text-[13px]">{ind || <span className="text-[var(--muted)]">—</span>}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Behavioral note */}
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[12px] text-amber-300/90">
                {t("Behavioral (Perilaku) standards are set per Band / Job Stream and are not part of the Job Family workbook. See the Competency Dictionary → Perilaku for the behavioral competencies.")}
                {" "}<Link href="/competency/dictionary" className="font-medium underline">{t("Open dictionary")}</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
