"use client";

import React, { useMemo, useRef, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import {
  MAPPING_KEY, DIREKTUR, type Direktur, type MappingState,
  emptyMapping, detectSource, parseSheet, mergeMapping,
} from "@/lib/perfMapping";

const fmt = (n: number) => n.toLocaleString("id-ID");
const TABS = ["KPI Korporat", "KPI Manajemen (SVP)", "KPI Individu"] as const;
const shortDir = (d: string) => d.replace(/^Direktur\s+/, "");

export default function MappingPage() {
  const { t } = useI18n();
  const [state, setState] = useLocalState<MappingState>(MAPPING_KEY, emptyMapping());
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [fFungsi, setFFungsi] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = async (file: File) => {
    setBusy(true); setNote(null);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      let next = state;
      const got: string[] = [];
      for (const sheet of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheet], { defval: "" });
        if (!rows.length) continue;
        const src = detectSource(Object.keys(rows[0]));
        if (!src) continue;
        next = mergeMapping(next, parseSheet(src, rows));
        got.push(src);
      }
      if (got.length) { setState(next); setNote(`${t("Imported")} ${file.name} → ${got.join(", ")}.`); }
      else setNote(t("Unrecognized file. Expected KPI Korporat / Matrix / KatalogAP."));
    } catch {
      setNote(t("Could not read the file. Make sure it is a valid .xlsx."));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const fungsiList = useMemo(() => ["", ...Array.from(new Set(state.kpis.map((k) => k.fungsi).filter(Boolean)))], [state.kpis]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.kpis.filter((k) => {
      if (fFungsi && k.fungsi !== fFungsi) return false;
      if (needle && !`${k.kpi} ${k.fungsi} ${k.tipe}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [state.kpis, q, fFungsi]);

  const isOn = (id: string, d: Direktur) => (state.cascade[id] ?? []).includes(d);
  const toggle = (id: string, d: Direktur) => setState((s) => {
    const set = new Set(s.cascade[id] ?? []);
    set.has(d) ? set.delete(d) : set.add(d);
    return { ...s, cascade: { ...s.cascade, [id]: [...set] } };
  });
  const toggleCol = (d: Direktur) => setState((s) => {
    const allOn = filtered.every((k) => (s.cascade[k.id] ?? []).includes(d));
    const c = { ...s.cascade };
    for (const k of filtered) {
      const set = new Set(c[k.id] ?? []);
      allOn ? set.delete(d) : set.add(d);
      c[k.id] = [...set];
    }
    return { ...s, cascade: c };
  });
  const countFor = (d: Direktur) => state.kpis.filter((k) => (state.cascade[k.id] ?? []).includes(d)).length;

  const clearAll = () => { if (confirm(t("Clear all mapping data from this browser?"))) setState(emptyMapping()); };
  const hasData = state.kpis.length > 0;

  return (
    <>
      <PageHeader
        title="Performance Mapping"
        subtitle="Cascade the Corporate KPI down to the 4 Direktur — check the matrix to assign"
        actions={
          <>
            {hasData && <Btn variant="ghost" onClick={clearAll}>{t("Clear data")}</Btn>}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); }} />
            <Btn variant="primary" onClick={() => fileRef.current?.click()}>
              <Icon.plus className="h-4 w-4" /> {busy ? t("Importing…") : t("Import Excel")}
            </Btn>
          </>
        }
      />

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((tb, i) => (
          <button key={tb} onClick={() => setTab(i)}
            className={cn("rounded-lg px-3.5 py-2 text-[13px] font-medium transition", tab === i ? "bg-gradient-to-r from-royal-500 to-royal-700 text-white shadow-glow" : "glass hover:bg-black/5 dark:hover:bg-white/5")}>
            {t(tb)}
          </button>
        ))}
      </div>

      {note && <div className="mb-4 rounded-lg border border-royal-500/30 bg-royal-500/5 px-3 py-2 text-[13px]">{note}</div>}

      {/* ---- Tab 0: KPI Korporat + cascade matrix ---- */}
      {tab === 0 && (
        !hasData ? (
          <Card className="text-center">
            <Icon.strategy className="mx-auto h-10 w-10 text-[var(--muted)]" />
            <p className="mt-2 text-[14px] font-medium">{t("No KPI imported yet")}</p>
            <p className="mx-auto mt-1 max-w-lg text-[12px] text-[var(--muted)]">
              {t("Import KPI Korporat.xlsx (the corporate KPI), then supplement with Matrix.xlsx and KatalogAP.xlsx. Tick the matrix to cascade each KPI to the target Direktur.")}
            </p>
          </Card>
        ) : (
          <>
            {/* Direktur summary */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {DIREKTUR.map((d) => (
                <Card key={d}>
                  <div className="text-[11px] text-[var(--muted)]">{shortDir(d)}</div>
                  <div className="mt-1 text-2xl font-bold text-royal-400">{fmt(countFor(d))}</div>
                  <div className="text-[10px] text-[var(--muted)]">{t("KPI cascaded")}</div>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <Card className="mt-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1">
                  <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search KPI…")} className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500" />
                </div>
                <select value={fFungsi} onChange={(e) => setFFungsi(e.target.value)} className="rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
                  {fungsiList.map((f) => <option key={f} value={f}>{f || t("All functions")}</option>)}
                </select>
                <span className="text-[11px] text-[var(--muted)]">{fmt(filtered.length)}/{fmt(state.kpis.length)} {t("KPI")}</span>
              </div>

              {/* Cascade matrix */}
              <div className="max-h-[64vh] overflow-auto">
                <table className="w-full min-w-[820px] text-[12px]">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      <th className="sticky top-0 z-10 border-b bg-[rgb(var(--surface))] px-2 py-2">KPI</th>
                      <th className="sticky top-0 z-10 border-b bg-[rgb(var(--surface))] px-2 py-2">{t("Function")}</th>
                      {DIREKTUR.map((d) => (
                        <th key={d} className="sticky top-0 z-10 border-b bg-[rgb(var(--surface))] px-2 py-2 text-center">
                          <div className="whitespace-nowrap">{shortDir(d)}</div>
                          <button onClick={() => toggleCol(d)} className="mt-0.5 text-[9px] font-medium text-royal-400 hover:underline">{t("toggle all")}</button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((k) => (
                      <tr key={k.id} className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="px-2 py-1.5">
                          <div className="font-medium">{k.kpi}</div>
                          <div className="mt-0.5 flex flex-wrap gap-1 text-[10px] text-[var(--muted)]">
                            {k.satuan && <span>{k.satuan}</span>}
                            {k.tipe && <Badge tone="gray">{k.tipe}</Badge>}
                            {k.prioritas && <Badge tone="amber">{k.prioritas}</Badge>}
                            {k.sources.map((s) => <Badge key={s} tone="blue">{s}</Badge>)}
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-[var(--muted)]">{k.fungsi}</td>
                        {DIREKTUR.map((d) => (
                          <td key={d} className="px-2 py-1.5 text-center">
                            <input type="checkbox" checked={isOn(k.id, d)} onChange={() => toggle(k.id, d)} className="accent-royal-500" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* KPI Direksi — result of the cascade */}
            <DireksiResult state={state} />
          </>
        )
      )}

      {/* ---- Tab 1 & 2: staged ---- */}
      {tab === 1 && <Staged t={t} title="KPI Manajemen (SVP)" note="Cascade Direktur → SVP will build on the matrix above." />}
      {tab === 2 && <Staged t={t} title="KPI Individu" note="Cascade SVP → Individu is the next level." />}
    </>
  );
}

function DireksiResult({ state }: { state: MappingState }) {
  const { t } = useI18n();
  const [sel, setSel] = useState<Direktur>(DIREKTUR[0]);
  const list = state.kpis.filter((k) => (state.cascade[k.id] ?? []).includes(sel));
  return (
    <Card className="mt-4">
      <SectionTitle title="KPI Direksi" subtitle="Result of the cascade — per Direktur" action={
        <select value={sel} onChange={(e) => setSel(e.target.value as Direktur)} className="rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
          {DIREKTUR.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      } />
      {list.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-[var(--muted)]">{t("No KPI cascaded to this Direktur yet — tick the matrix above.")}</p>
      ) : (
        <ol className="space-y-1.5">
          {list.map((k, i) => (
            <li key={k.id} className="flex items-start gap-3 rounded-lg border p-2 text-[12.5px]">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-royal-500/15 text-[10px] font-bold text-royal-400">{i + 1}</span>
              <span className="flex-1">{k.kpi}</span>
              <span className="text-[10px] text-[var(--muted)]">{k.fungsi}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function Staged({ t, title, note }: { t: (k: string) => string; title: string; note: string }) {
  return (
    <Card className="text-center">
      <Icon.performance className="mx-auto h-10 w-10 text-[var(--muted)]" />
      <p className="mt-2 text-[14px] font-medium">{t(title)}</p>
      <p className="mx-auto mt-1 max-w-md text-[12px] text-[var(--muted)]">{t(note)}</p>
    </Card>
  );
}
