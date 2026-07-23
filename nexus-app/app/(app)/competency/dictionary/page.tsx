"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import {
  competencyCategories,
  technicalCompetencyLevels as seedLevels,
  type CompetencyCategory,
  type DictionaryCompetency,
  type CompetencyLevelDef,
} from "@/lib/data";
import { competencyDictionarySeed as seedComps } from "@/lib/competencyDictionarySeed";
import { parseKamus, parseDaftarGrouping, parseProficiency, applyGrouping, mergeLevels } from "@/lib/importCompetencies";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";

const inputCls = "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";

let seq = 0;
const newId = (p: string) => {
  try {
    return `${p}-${crypto.randomUUID().slice(0, 5)}`;
  } catch {
    return `${p}-${++seq}${Math.round(performance.now())}`;
  }
};

function Modal({ title, onClose, onSave, saveLabel, children, wide }: { title: string; onClose: () => void; onSave: () => void; saveLabel: string; children: React.ReactNode; wide?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative z-10 w-full glass card shadow-glass animate-fade-up", wide ? "max-w-2xl" : "max-w-md")}>
        <div className="flex items-center gap-2 border-b p-4">
          <Icon.knowledge className="h-4 w-4 shrink-0 text-royal-400" />
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

type CForm = { open: boolean; id: string | null; code: string; name: string; definition: string; indicators: { level: number; indicator: string }[] };
type LForm = { open: boolean; level: number; name: string; description: string };

const TABS = ["Daftar", "Level", "Kamus"] as const;
type Tab = (typeof TABS)[number];
// Tab label follows the selected category, e.g. "Daftar Kompetensi Teknis" / "Daftar Perilaku".
const tabLabel = (tab: Tab, cat: string) => `${tab} ${cat}`;

export default function CompetencyDictionaryPage() {
  const { t } = useI18n();
  const [comps, setComps] = useLocalState<DictionaryCompetency[]>("competency-dictionary", seedComps);
  const [levels, setLevels] = useLocalState<CompetencyLevelDef[]>("technical-competency-levels", seedLevels);
  const [cat, setCat] = useState<CompetencyCategory>(competencyCategories[0]);
  const [tab, setTab] = useState<Tab>("Daftar");
  const switchCat = (c: CompetencyCategory) => { setCat(c); setQ(""); setFJf(""); setOpen({}); };
  const [form, setForm] = useState<CForm>({ open: false, id: null, code: "", name: "", definition: "", indicators: [] });
  const [lForm, setLForm] = useState<LForm>({ open: false, level: 0, name: "", description: "" });
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const [fJf, setFJf] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const catRows = comps.filter((c) => c.category === cat);
  const jobFamilies = useMemo(() => Array.from(new Set(catRows.map((c) => c.jobFamilyName).filter(Boolean) as string[])).sort(), [catRows]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return catRows.filter((c) => {
      if (fJf && c.jobFamilyName !== fJf) return false;
      if (needle && !`${c.code} ${c.name} ${c.functionName ?? ""} ${c.jobFamilyName ?? ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [catRows, q, fJf]);
  const levelName = (lv: number) => levels.find((l) => l.level === lv)?.name ?? `L${lv}`;

  // --- import from the PI spreadsheets (browser-only; nothing is uploaded) ---
  const onImport = async (files: FileList) => {
    setBusy(true);
    setNote(null);
    try {
      const XLSX = await import("xlsx");
      let importedComps: DictionaryCompetency[] | null = null;
      let grouping: ReturnType<typeof parseDaftarGrouping> | null = null;
      let parsedLevels: ReturnType<typeof parseProficiency> | null = null;
      for (const file of Array.from(files)) {
        const wb = XLSX.read(await file.arrayBuffer());
        for (const sheetName of wb.SheetNames) {
          const rowsJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], { defval: "" });
          if (rowsJson.length === 0) continue;
          const keys = Object.keys(rowsJson[0]).join(" ").toLowerCase();
          if (/kode kompetensi|kode\b/.test(keys) && /level\s*1/.test(keys)) importedComps = parseKamus(rowsJson, cat);
          else if (/competency|kompetensi/.test(keys) && /job family|function/.test(keys)) grouping = parseDaftarGrouping(rowsJson);
          else if (/level kecakapan|standar|proficiency/.test(keys) || (/\blevel\b/.test(keys) && /deskripsi|indikator/.test(keys))) parsedLevels = parseProficiency(rowsJson);
        }
      }
      const msgs: string[] = [];
      // Replace only the selected category's competencies; keep the other categories intact.
      let next = comps;
      if (importedComps) next = [...comps.filter((c) => c.category !== cat), ...importedComps];
      if (grouping) next = applyGrouping(next, grouping);
      if (importedComps || grouping) {
        setComps(next);
        if (importedComps) msgs.push(`${importedComps.length} ${t("competencies")} · ${cat}`);
        if (grouping) msgs.push(`${grouping.size} ${t("mapped to Job Family")}`);
      }
      if (parsedLevels) {
        setLevels((base) => mergeLevels(base, parsedLevels!));
        msgs.push(`${parsedLevels.length} ${t("levels")}`);
      }
      setNote(msgs.length ? `${t("Imported")}: ${msgs.join(" · ")}.` : t("No recognizable competency sheet found in the file(s)."));
    } catch {
      setNote(t("Could not read the file. Make sure it is a valid .xlsx."));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // --- competency CRUD ---
  const emptyIndicators = () => levels.map((l) => ({ level: l.level, indicator: "" }));
  const openCreate = () => setForm({ open: true, id: null, code: "", name: "", definition: "", indicators: emptyIndicators() });
  const openEdit = (c: DictionaryCompetency) => {
    // align indicators to the current level scale
    const indicators = levels.map((l) => ({ level: l.level, indicator: c.indicators.find((i) => i.level === l.level)?.indicator ?? "" }));
    setForm({ open: true, id: c.id, code: c.code, name: c.name, definition: c.definition, indicators });
  };
  const saveForm = () => {
    const name = form.name.trim();
    if (!name) return;
    const body = { code: form.code.trim() || "—", name, category: cat, definition: form.definition.trim(), indicators: form.indicators.map((i) => ({ ...i, indicator: i.indicator.trim() })) };
    if (form.id == null) setComps((list) => [...list, { id: newId("tc"), ...body }]);
    else setComps((list) => list.map((c) => (c.id === form.id ? { ...c, ...body } : c)));
    setForm({ open: false, id: null, code: "", name: "", definition: "", indicators: [] });
  };
  const removeComp = (c: DictionaryCompetency) => {
    if (!confirm(`${t("Delete")} “${c.name}”?`)) return;
    setComps((list) => list.filter((x) => x.id !== c.id));
  };
  const setIndicator = (level: number, v: string) => setForm((f) => ({ ...f, indicators: f.indicators.map((i) => (i.level === level ? { ...i, indicator: v } : i)) }));

  // --- level CRUD (edit name/description) ---
  const openLevelEdit = (l: CompetencyLevelDef) => setLForm({ open: true, level: l.level, name: l.name, description: l.description });
  const saveLevel = () => {
    setLevels((list) => list.map((l) => (l.level === lForm.level ? { ...l, name: lForm.name.trim() || l.name, description: lForm.description.trim() } : l)));
    setLForm({ open: false, level: 0, name: "", description: "" });
  };

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader
        title="Kamus Kompetensi"
        subtitle="Manajemen Kompetensi · Kamus Kompetensi"
        actions={
          <>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) onImport(e.target.files); }} />
            <Btn variant="ghost" onClick={() => fileRef.current?.click()}><Icon.knowledge className="h-4 w-4" /> {busy ? t("Importing…") : t("Import Excel")}</Btn>
            {tab === "Daftar" && <Btn variant="primary" onClick={openCreate}><Icon.plus className="h-4 w-4" /> {t("Add")}</Btn>}
          </>
        }
      />

      {note && <div className="mb-4 rounded-xl border border-royal-500/30 bg-royal-500/10 px-4 py-2.5 text-[13px] text-royal-300">{note}</div>}

      {/* Category selector (Kompetensi Teknis · Manajerial · Perilaku) */}
      <div className="mb-3 flex flex-wrap gap-2">
        {competencyCategories.map((c) => {
          const count = comps.filter((x) => x.category === c).length;
          return (
            <button key={c} onClick={() => switchCat(c)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition", c === cat ? "bg-royal-500 text-white" : "glass text-[var(--muted)] hover:text-[var(--text)]")}>
              {c}{count > 0 && <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]", c === cat ? "bg-white/20" : "bg-black/10 dark:bg-white/10")}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* View tabs: Daftar / Level / Kamus (label follows the category) */}
      <div className="mb-4 flex flex-wrap rounded-xl glass p-0.5">
        {TABS.map((v) => (
          <button key={v} onClick={() => setTab(v)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition", tab === v ? "bg-royal-500 text-white" : "text-[var(--muted)] hover:text-[var(--text)]")}>{tabLabel(v, cat)}</button>
        ))}
      </div>

      {/* ---- Daftar Kompetensi Teknis ---- */}
      {tab === "Daftar" && (
        <div className="glass card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <div className="relative min-w-[200px] flex-1">
              <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search code, competency, function…")} className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500" />
            </div>
            {jobFamilies.length > 0 && (
              <select value={fJf} onChange={(e) => setFJf(e.target.value)} className="rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
                <option value="">{t("All Job Families")}</option>
                {jobFamilies.map((j) => (<option key={j} value={j}>{j}</option>))}
              </select>
            )}
            <span className="text-[12px] text-[var(--muted)]">{rows.length}{rows.length !== catRows.length ? ` / ${catRows.length}` : ""} {t("competencies")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("Code")}</th>
                  <th className="px-4 py-3 font-medium">{t("Competency")}</th>
                  <th className="px-4 py-3 font-medium">{t("Job Family")}</th>
                  <th className="px-4 py-3 font-medium">{t("Function")}</th>
                  <th className="px-4 py-3 font-medium">{t("Levels")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} dir="auto" className="group border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="px-4 py-3"><Badge tone="blue">{c.code}</Badge></td>
                    <td className="max-w-[280px] px-4 py-3"><div className="font-medium">{c.name}</div><div className="line-clamp-1 text-[11px] text-[var(--muted)]">{c.definition || "—"}</div></td>
                    <td className="px-4 py-3 text-xs text-[var(--muted)]">{c.jobFamilyName || "—"}</td>
                    <td className="px-4 py-3 text-xs text-[var(--muted)]">{c.functionName || "—"}</td>
                    <td className="px-4 py-3 text-xs text-[var(--muted)]">{c.keyActions?.length ? `${c.keyActions.length} ${t("key actions")}` : `${c.indicators.filter((i) => i.indicator.trim()).length}/${levels.length}`}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2 text-[11px] opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => openEdit(c)} title={t("Edit")} className="font-medium text-[var(--muted)] hover:text-royal-400">{t("Edit")}</button>
                        <button onClick={() => removeComp(c)} title={t("Delete")} className="text-[var(--muted)] hover:text-rose-400">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">{catRows.length === 0 ? t("No competencies yet. Add one.") : t("No competencies match your filters.")}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- Level Kompetensi Teknis ---- */}
      {tab === "Level" && (
        <div className="space-y-3">
          {levels.map((l) => (
            <Card key={l.level} className="group flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-royal-500/15 text-sm font-bold text-royal-400">{l.level}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{l.name}</span>
                  <Badge tone="gray">Level {l.level}</Badge>
                </div>
                <p className="mt-1 text-[13px] text-[var(--muted)]">{l.description}</p>
              </div>
              <button onClick={() => openLevelEdit(l)} title={t("Edit")} className="shrink-0 text-[11px] font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100">{t("Edit")}</button>
            </Card>
          ))}
        </div>
      )}

      {/* ---- Kamus Kompetensi Teknis ---- */}
      {tab === "Kamus" && (
        <div className="space-y-3">
          {rows.map((c) => {
            const isOpen = open[c.id] ?? false;
            return (
              <Card key={c.id} dir="auto">
                <button onClick={() => toggle(c.id)} className="flex w-full items-center gap-2 text-left">
                  <Icon.chevron className={cn("h-4 w-4 shrink-0 text-[var(--muted)] transition", isOpen && "rotate-90")} />
                  <Badge tone="blue">{c.code}</Badge>
                  <span className="min-w-0 flex-1 truncate font-semibold">{c.name}</span>
                  <span className="shrink-0 text-[10px] text-[var(--muted)]">{c.keyActions?.length ? `${c.keyActions.length} ${t("key actions")}` : `${c.indicators.filter((i) => i.indicator.trim()).length} ${t("indicators")}`}</span>
                </button>
                {isOpen && (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-[13px] text-[var(--muted)]">{c.definition || "—"}</p>
                    {c.keyActions?.length ? (
                      <div className="mt-3">
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("Key Actions")}</div>
                        <ul className="space-y-1.5">
                          {c.keyActions.map((a, i) => (
                            <li key={i} className="flex gap-2 rounded-lg border p-2.5 text-[13px]">
                              <span className="text-royal-400">•</span><span className="min-w-0 flex-1">{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {levels.map((l) => {
                          const ind = c.indicators.find((i) => i.level === l.level)?.indicator?.trim();
                          return (
                            <div key={l.level} className="flex gap-3 rounded-lg border p-2.5">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-royal-500/15 text-[11px] font-bold text-royal-400">{l.level}</div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-semibold text-[var(--muted)]">{l.name}</div>
                                <div className="whitespace-pre-line text-[13px]">{ind || <span className="text-[var(--muted)]">—</span>}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
          {rows.length === 0 && <Card className="text-center text-[13px] text-[var(--muted)]">{t("No competencies yet. Add one.")}</Card>}
        </div>
      )}

      {/* competency modal */}
      {form.open && (
        <Modal wide title={form.id == null ? t("New Competency") : t("Edit Competency")} onClose={() => setForm((f) => ({ ...f, open: false }))} onSave={saveForm} saveLabel={form.id == null ? t("Create") : t("Save")}>
          <div className="grid grid-cols-3 gap-3">
            <label className={labelCls}>{t("Code")}
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="TK-06" className={inputCls} />
            </label>
            <label className={cn(labelCls, "col-span-2")}>{t("Competency")}
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t("e.g. Pemeliharaan Peralatan Rotating")} className={inputCls} />
            </label>
          </div>
          <label className={labelCls}>{t("Definition")}
            <textarea value={form.definition} onChange={(e) => setForm((f) => ({ ...f, definition: e.target.value }))} rows={2} placeholder={t("Short definition of the competency")} className={inputCls} />
          </label>
          <div>
            <div className={cn(labelCls, "mb-1")}>{t("Level indicators")}</div>
            <div className="space-y-2">
              {form.indicators.map((i) => (
                <div key={i.level} className="flex items-start gap-2">
                  <div className="mt-1 flex h-6 w-14 shrink-0 items-center justify-center rounded-md bg-royal-500/15 text-[10px] font-semibold text-royal-400">L{i.level} · {levelName(i.level)}</div>
                  <input value={i.indicator} onChange={(e) => setIndicator(i.level, e.target.value)} placeholder={`${t("Indicator for level")} ${i.level}`} className={inputCls} />
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* level modal */}
      {lForm.open && (
        <Modal title={`${t("Edit Level")} ${lForm.level}`} onClose={() => setLForm((f) => ({ ...f, open: false }))} onSave={saveLevel} saveLabel={t("Save")}>
          <label className={labelCls}>{t("Name")}
            <input value={lForm.name} onChange={(e) => setLForm((f) => ({ ...f, name: e.target.value }))} placeholder="Dasar" className={inputCls} />
          </label>
          <label className={labelCls}>{t("Description")}
            <textarea value={lForm.description} onChange={(e) => setLForm((f) => ({ ...f, description: e.target.value }))} rows={3} className={inputCls} />
          </label>
        </Modal>
      )}
    </>
  );
}
