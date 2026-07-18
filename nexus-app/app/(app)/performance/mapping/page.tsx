"use client";

import React, { useMemo, useRef, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import {
  MAPPING_KEY, DIREKTUR, SVP_BY_DIREKTUR, VP_BY_SVP, AVP_BY_VP, type Direktur, type MapSource, type MapKpi, type MappingState,
  emptyMapping, detectSource, parseSheet, mergeMapping, sourceCounts,
} from "@/lib/perfMapping";

const SOURCES: MapSource[] = ["Korporat", "Matrix", "KatalogAP"];
const sourceTone: Record<MapSource, "green" | "amber" | "blue" | "purple"> = { Korporat: "green", Matrix: "amber", KatalogAP: "blue", Manual: "purple" };
const inputCls = "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";
const ALL_VP = Object.keys(AVP_BY_VP);

const fmt = (n: number) => n.toLocaleString("id-ID");
const TABS = ["KPI Korporat", "KPI Manajemen (SVP)", "KPI VP", "KPI AVP"] as const;
const shortDir = (d: string) => d.replace(/^Direktur\s+/, "");

export default function MappingPage() {
  const { t } = useI18n();
  const [state, setState] = useLocalState<MappingState>(MAPPING_KEY, emptyMapping());
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [fFungsi, setFFungsi] = useState("");
  const [fSource, setFSource] = useState<"" | MapSource>("");
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
      if (fSource && !k.sources.includes(fSource)) return false;
      if (needle && !`${k.kpi} ${k.fungsi} ${k.tipe}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [state.kpis, q, fFungsi, fSource]);

  const srcCounts = useMemo(() => sourceCounts(state.kpis), [state.kpis]);

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
                <select value={fSource} onChange={(e) => setFSource(e.target.value as "" | MapSource)} className="rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
                  <option value="">{t("All sources")}</option>
                  {SOURCES.map((s) => <option key={s} value={s}>{s} ({srcCounts[s]})</option>)}
                </select>
                <span className="text-[11px] text-[var(--muted)]">{fmt(filtered.length)}/{fmt(state.kpis.length)} {t("KPI")}</span>
              </div>

              {/* Source legend / counts */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-[var(--muted)]">{t("Sources")}:</span>
                {SOURCES.map((s) => (
                  <button key={s} onClick={() => setFSource(fSource === s ? "" : s)} className={cn("transition", fSource === s && "ring-1 ring-royal-500 rounded-full")}>
                    <Badge tone={sourceTone[s]}>{s} {srcCounts[s]}</Badge>
                  </button>
                ))}
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
                            {k.prioritas && <Badge tone="purple">{k.prioritas}</Badge>}
                            {k.sources.map((s) => <Badge key={s} tone={sourceTone[s]}>{s}</Badge>)}
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

      {/* ---- Tab 1: KPI Manajemen (SVP) — cascade Direktur → SVP ---- */}
      {tab === 1 && (hasData ? <ManajemenTab state={state} setState={setState} /> : <Staged t={t} title="KPI Manajemen (SVP)" note="Import & cascade to the Direktur first (KPI Korporat tab)." />)}
      {/* ---- Tab 2: KPI VP — cascade SVP → VP ---- */}
      {tab === 2 && (hasData ? <IndividuTab state={state} setState={setState} /> : <Staged t={t} title="KPI VP" note="Cascade to the SVP first (KPI Manajemen tab)." />)}
      {/* ---- Tab 3: KPI AVP — cascade VP → AVP (VP → Staf if no AVP) ---- */}
      {tab === 3 && (hasData ? <AvpTab state={state} setState={setState} /> : <Staged t={t} title="KPI AVP" note="Cascade to a VP first (KPI VP tab)." />)}
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

// ---- KPI Manajemen (SVP): cascade a Direktur's KPI down to their SVPs --------
function ManajemenTab({ state, setState }: { state: MappingState; setState: (u: (s: MappingState) => MappingState) => void }) {
  const { t } = useI18n();
  const [dir, setDir] = useState<Direktur>(DIREKTUR[0]);
  const [src, setSrc] = useState<"direktur" | "katalog">("direktur");
  const [showForm, setShowForm] = useState(false);
  const svps = SVP_BY_DIREKTUR[dir];
  const svpCascade = state.svpCascade ?? {};

  // Add a KPI manually → new item assigned to the chosen SVP (under this Direktur).
  const addManual = (f: Omit<MapKpi, "id" | "esg" | "fungsi" | "sources">, svp: string) => setState((s) => {
    let id = ""; try { id = `manual-${crypto.randomUUID().slice(0, 8)}`; } catch { id = `manual-${Date.now()}`; }
    const k: MapKpi = { ...f, id, esg: "", fungsi: "Manual", sources: ["Manual"] };
    return {
      ...s,
      kpis: [...s.kpis, k],
      cascade: { ...s.cascade, [id]: [dir] },
      svpCascade: { ...(s.svpCascade ?? {}), [id]: [svp] },
    };
  });
  const removeKpi = (id: string) => setState((s) => {
    const cascade = { ...s.cascade }; delete cascade[id];
    const sv = { ...(s.svpCascade ?? {}) }; delete sv[id];
    return { ...s, kpis: s.kpis.filter((k) => k.id !== id), cascade, svpCascade: sv };
  });

  // KPI SVP is cascaded from TWO sources: the selected Direktur's KPI (SO chart)
  // or straight from the KatalogAP catalog.
  const rows = useMemo(() => (
    src === "katalog"
      ? state.kpis.filter((k) => k.sources.includes("KatalogAP"))
      : state.kpis.filter((k) => (state.cascade[k.id] ?? []).includes(dir))
  ), [state.kpis, state.cascade, dir, src]);

  const on = (id: string, svp: string) => (svpCascade[id] ?? []).includes(svp);
  const toggle = (id: string, svp: string) => setState((s) => {
    const set = new Set(s.svpCascade?.[id] ?? []);
    set.has(svp) ? set.delete(svp) : set.add(svp);
    return { ...s, svpCascade: { ...(s.svpCascade ?? {}), [id]: [...set] } };
  });
  const toggleCol = (svp: string) => setState((s) => {
    const allOn = rows.every((k) => (s.svpCascade?.[k.id] ?? []).includes(svp));
    const c = { ...(s.svpCascade ?? {}) };
    for (const k of rows) {
      const set = new Set(c[k.id] ?? []);
      allOn ? set.delete(svp) : set.add(svp);
      c[k.id] = [...set];
    }
    return { ...s, svpCascade: c };
  });
  const countFor = (svp: string) => rows.filter((k) => (svpCascade[k.id] ?? []).includes(svp)).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{t("Source")}</span>
        <div className="flex gap-1">
          {([["direktur", "From Direktur (SO)"], ["katalog", "From KatalogAP"]] as const).map(([v, label]) => (
            <button key={v} onClick={() => setSrc(v)}
              className={cn("rounded-lg px-3 py-1.5 text-[12px] font-medium transition", src === v ? "bg-royal-500/15 text-royal-400" : "glass hover:bg-black/5 dark:hover:bg-white/5")}>
              {t(label)}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{t("Direktur")}</span>
        <select value={dir} onChange={(e) => setDir(e.target.value as Direktur)} className="rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
          {DIREKTUR.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <Badge tone="blue">{fmt(rows.length)} {t("KPI to cascade")}</Badge>
        <div className="ml-auto">
          <Btn variant="primary" onClick={() => setShowForm(true)}><Icon.plus className="h-4 w-4" /> {t("Add KPI")}</Btn>
        </div>
      </div>

      {showForm && <AddManualKpiForm title={t("Add KPI SVP")} targetLabel="SVP" targets={svps} contextLabel={dir} onClose={() => setShowForm(false)} onSave={(f, svp) => { addManual(f, svp); setShowForm(false); }} />}

      {rows.length === 0 ? (
        <Card className="text-center text-[13px] text-[var(--muted)]">
          {src === "katalog" ? t("No KatalogAP KPI imported — import KatalogAP.xlsx first.") : t("No KPI cascaded to this Direktur yet — tick the matrix in the KPI Korporat tab.")}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {svps.map((s) => (
              <Card key={s}>
                <div className="text-[11px] text-[var(--muted)]">{s}</div>
                <div className="mt-1 text-2xl font-bold text-royal-400">{fmt(countFor(s))}</div>
                <div className="text-[10px] text-[var(--muted)]">{t("KPI cascaded")}</div>
              </Card>
            ))}
          </div>

          <Card className="mt-4">
            <SectionTitle title="Cascade Direktur → SVP" subtitle={dir} />
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full min-w-[720px] text-[12px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    <th className="sticky top-0 z-10 border-b bg-[rgb(var(--surface))] px-2 py-2">KPI</th>
                    {svps.map((s) => (
                      <th key={s} className="sticky top-0 z-10 border-b bg-[rgb(var(--surface))] px-2 py-2 text-center">
                        <div className="whitespace-nowrap">{s.replace(/^SVP\s+/, "")}</div>
                        <button onClick={() => toggleCol(s)} className="mt-0.5 text-[9px] font-medium text-royal-400 hover:underline">{t("toggle all")}</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((k) => (
                    <tr key={k.id} className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="px-2 py-1.5">
                        <div className="font-medium">{k.kpi}</div>
                        <div className="mt-0.5 text-[10px] text-[var(--muted)]">{k.fungsi}{k.satuan ? ` · ${k.satuan}` : ""}</div>
                      </td>
                      {svps.map((s) => (
                        <td key={s} className="px-2 py-1.5 text-center">
                          <input type="checkbox" checked={on(k.id, s)} onChange={() => toggle(k.id, s)} className="accent-royal-500" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <CascadeResult title="KPI SVP" rows={rows} targets={svps} cascadeMap={svpCascade} onRemove={removeKpi} />
        </>
      )}
    </>
  );
}

// ---- KPI Individu (VP): cascade an SVP's KPI down to their VPs ---------------
function IndividuTab({ state, setState }: { state: MappingState; setState: (u: (s: MappingState) => MappingState) => void }) {
  const { t } = useI18n();
  const [dir, setDir] = useState<Direktur>(DIREKTUR[0]);
  const svpsOfDir = SVP_BY_DIREKTUR[dir];
  const [svp, setSvp] = useState(svpsOfDir[0]);
  const curSvp = svpsOfDir.includes(svp) ? svp : svpsOfDir[0];
  const [src, setSrc] = useState<"svp" | "history">("svp");
  const [showForm, setShowForm] = useState(false);
  const vps = VP_BY_SVP[curSvp] ?? [];
  const vpCascade = state.vpCascade ?? {};

  // Source of VP KPI: cascade from the SVP, or the whole KPI history (previous KPIs).
  const rows = useMemo(() => (
    src === "history"
      ? state.kpis
      : state.kpis.filter((k) => (state.svpCascade?.[k.id] ?? []).includes(curSvp))
  ), [state.kpis, state.svpCascade, curSvp, src]);

  const on = (id: string, vp: string) => (vpCascade[id] ?? []).includes(vp);
  const toggle = (id: string, vp: string) => setState((s) => {
    const set = new Set(s.vpCascade?.[id] ?? []);
    set.has(vp) ? set.delete(vp) : set.add(vp);
    return { ...s, vpCascade: { ...(s.vpCascade ?? {}), [id]: [...set] } };
  });
  const toggleCol = (vp: string) => setState((s) => {
    const allOn = rows.every((k) => (s.vpCascade?.[k.id] ?? []).includes(vp));
    const c = { ...(s.vpCascade ?? {}) };
    for (const k of rows) { const set = new Set(c[k.id] ?? []); allOn ? set.delete(vp) : set.add(vp); c[k.id] = [...set]; }
    return { ...s, vpCascade: c };
  });
  const countFor = (vp: string) => rows.filter((k) => (vpCascade[k.id] ?? []).includes(vp)).length;

  const addManual = (f: Omit<MapKpi, "id" | "esg" | "fungsi" | "sources">, vp: string) => setState((s) => {
    let id = ""; try { id = `manual-${crypto.randomUUID().slice(0, 8)}`; } catch { id = `manual-${Date.now()}`; }
    const k: MapKpi = { ...f, id, esg: "", fungsi: "Manual", sources: ["Manual"] };
    return { ...s, kpis: [...s.kpis, k], svpCascade: { ...s.svpCascade, [id]: [curSvp] }, vpCascade: { ...(s.vpCascade ?? {}), [id]: [vp] } };
  });
  const removeKpi = (id: string) => setState((s) => {
    const sv = { ...(s.svpCascade ?? {}) }; delete sv[id];
    const vp = { ...(s.vpCascade ?? {}) }; delete vp[id];
    return { ...s, kpis: s.kpis.filter((k) => k.id !== id), svpCascade: sv, vpCascade: vp };
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{t("Source")}</span>
        <div className="flex gap-1">
          {([["svp", "From SVP"], ["history", "Performance History"]] as const).map(([v, label]) => (
            <button key={v} onClick={() => setSrc(v)}
              className={cn("rounded-lg px-3 py-1.5 text-[12px] font-medium transition", src === v ? "bg-royal-500/15 text-royal-400" : "glass hover:bg-black/5 dark:hover:bg-white/5")}>
              {t(label)}
            </button>
          ))}
        </div>
        <select value={dir} onChange={(e) => { setDir(e.target.value as Direktur); }} className="rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
          {DIREKTUR.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={curSvp} onChange={(e) => setSvp(e.target.value)} className="rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
          {svpsOfDir.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Badge tone="blue">{fmt(rows.length)} {t("KPI to cascade")}</Badge>
        <div className="ml-auto"><Btn variant="primary" onClick={() => setShowForm(true)}><Icon.plus className="h-4 w-4" /> {t("Add KPI")}</Btn></div>
      </div>

      {showForm && vps.length > 0 && <AddManualKpiForm title={t("Add KPI VP")} targetLabel="VP" targets={vps} contextLabel={curSvp} onClose={() => setShowForm(false)} onSave={(f, vp) => { addManual(f, vp); setShowForm(false); }} />}

      {vps.length === 0 ? (
        <Card className="text-center text-[13px] text-[var(--muted)]">{t("This SVP has no VP under it in the org chart.")}</Card>
      ) : rows.length === 0 ? (
        <Card className="text-center text-[13px] text-[var(--muted)]">
          {src === "svp" ? t("No KPI cascaded to this SVP yet — use the KPI Manajemen tab.") : t("No KPI in history yet.")}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {vps.map((v) => (
              <Card key={v}><div className="text-[11px] text-[var(--muted)]">{v.replace(/^VP\s+/, "")}</div><div className="mt-1 text-2xl font-bold text-royal-400">{fmt(countFor(v))}</div><div className="text-[10px] text-[var(--muted)]">{t("KPI cascaded")}</div></Card>
            ))}
          </div>

          <Card className="mt-4">
            <SectionTitle title="Cascade SVP → VP" subtitle={curSvp} />
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full min-w-[720px] text-[12px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    <th className="sticky top-0 z-10 border-b bg-[rgb(var(--surface))] px-2 py-2">KPI</th>
                    {vps.map((v) => (
                      <th key={v} className="sticky top-0 z-10 border-b bg-[rgb(var(--surface))] px-2 py-2 text-center">
                        <div className="whitespace-nowrap">{v.replace(/^VP\s+/, "")}</div>
                        <button onClick={() => toggleCol(v)} className="mt-0.5 text-[9px] font-medium text-royal-400 hover:underline">{t("toggle all")}</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((k) => (
                    <tr key={k.id} className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="px-2 py-1.5"><div className="font-medium">{k.kpi}</div><div className="mt-0.5 text-[10px] text-[var(--muted)]">{k.fungsi}{k.satuan ? ` · ${k.satuan}` : ""}</div></td>
                      {vps.map((v) => (
                        <td key={v} className="px-2 py-1.5 text-center"><input type="checkbox" checked={on(k.id, v)} onChange={() => toggle(k.id, v)} className="accent-royal-500" /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <CascadeResult title="KPI VP" rows={rows} targets={vps} cascadeMap={vpCascade} onRemove={removeKpi} />
        </>
      )}
    </>
  );
}

// ---- KPI AVP: cascade a VP's KPI down to their AVPs (or "Staf" if none) ------
function AvpTab({ state, setState }: { state: MappingState; setState: (u: (s: MappingState) => MappingState) => void }) {
  const { t } = useI18n();
  const [vp, setVp] = useState(ALL_VP[0]);
  const [src, setSrc] = useState<"vp" | "history">("vp");
  const [showForm, setShowForm] = useState(false);
  const avps = (AVP_BY_VP[vp] ?? []).length ? AVP_BY_VP[vp] : ["Staf"]; // VP → Staf when no AVP
  const avpCascade = state.avpCascade ?? {};

  const rows = useMemo(() => (
    src === "history" ? state.kpis : state.kpis.filter((k) => (state.vpCascade?.[k.id] ?? []).includes(vp))
  ), [state.kpis, state.vpCascade, vp, src]);

  const on = (id: string, avp: string) => (avpCascade[id] ?? []).includes(avp);
  const toggle = (id: string, avp: string) => setState((s) => {
    const set = new Set(s.avpCascade?.[id] ?? []);
    set.has(avp) ? set.delete(avp) : set.add(avp);
    return { ...s, avpCascade: { ...(s.avpCascade ?? {}), [id]: [...set] } };
  });
  const toggleCol = (avp: string) => setState((s) => {
    const allOn = rows.every((k) => (s.avpCascade?.[k.id] ?? []).includes(avp));
    const c = { ...(s.avpCascade ?? {}) };
    for (const k of rows) { const set = new Set(c[k.id] ?? []); allOn ? set.delete(avp) : set.add(avp); c[k.id] = [...set]; }
    return { ...s, avpCascade: c };
  });
  const countFor = (avp: string) => rows.filter((k) => (avpCascade[k.id] ?? []).includes(avp)).length;

  const addManual = (f: Omit<MapKpi, "id" | "esg" | "fungsi" | "sources">, avp: string) => setState((s) => {
    let id = ""; try { id = `manual-${crypto.randomUUID().slice(0, 8)}`; } catch { id = `manual-${Date.now()}`; }
    const k: MapKpi = { ...f, id, esg: "", fungsi: "Manual", sources: ["Manual"] };
    return { ...s, kpis: [...s.kpis, k], vpCascade: { ...s.vpCascade, [id]: [vp] }, avpCascade: { ...(s.avpCascade ?? {}), [id]: [avp] } };
  });
  const removeKpi = (id: string) => setState((s) => {
    const vpc = { ...(s.vpCascade ?? {}) }; delete vpc[id];
    const avc = { ...(s.avpCascade ?? {}) }; delete avc[id];
    return { ...s, kpis: s.kpis.filter((k) => k.id !== id), vpCascade: vpc, avpCascade: avc };
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{t("Source")}</span>
        <div className="flex gap-1">
          {([["vp", "From VP"], ["history", "Performance History"]] as const).map(([v, label]) => (
            <button key={v} onClick={() => setSrc(v)} className={cn("rounded-lg px-3 py-1.5 text-[12px] font-medium transition", src === v ? "bg-royal-500/15 text-royal-400" : "glass hover:bg-black/5 dark:hover:bg-white/5")}>{t(label)}</button>
          ))}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">VP</span>
        <select value={vp} onChange={(e) => setVp(e.target.value)} className="max-w-[280px] rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
          {ALL_VP.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <Badge tone="blue">{fmt(rows.length)} {t("KPI to cascade")}</Badge>
        {AVP_BY_VP[vp]?.length === 0 && <Badge tone="amber">{t("No AVP → Staf")}</Badge>}
        <div className="ml-auto"><Btn variant="primary" onClick={() => setShowForm(true)}><Icon.plus className="h-4 w-4" /> {t("Add KPI")}</Btn></div>
      </div>

      {showForm && <AddManualKpiForm title={t("Add KPI AVP")} targetLabel={AVP_BY_VP[vp]?.length ? "AVP" : "Staf"} targets={avps} contextLabel={vp} onClose={() => setShowForm(false)} onSave={(f, avp) => { addManual(f, avp); setShowForm(false); }} />}

      {rows.length === 0 ? (
        <Card className="text-center text-[13px] text-[var(--muted)]">
          {src === "vp" ? t("No KPI cascaded to this VP yet — use the KPI VP tab.") : t("No KPI in history yet.")}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {avps.map((a) => (
              <Card key={a}><div className="text-[11px] text-[var(--muted)]">{a}</div><div className="mt-1 text-2xl font-bold text-royal-400">{fmt(countFor(a))}</div><div className="text-[10px] text-[var(--muted)]">{t("KPI cascaded")}</div></Card>
            ))}
          </div>

          <Card className="mt-4">
            <SectionTitle title={AVP_BY_VP[vp]?.length ? "Cascade VP → AVP" : "Cascade VP → Staf"} subtitle={vp} />
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full min-w-[720px] text-[12px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    <th className="sticky top-0 z-10 border-b bg-[rgb(var(--surface))] px-2 py-2">KPI</th>
                    {avps.map((a) => (
                      <th key={a} className="sticky top-0 z-10 border-b bg-[rgb(var(--surface))] px-2 py-2 text-center">
                        <div className="whitespace-nowrap">{a}</div>
                        <button onClick={() => toggleCol(a)} className="mt-0.5 text-[9px] font-medium text-royal-400 hover:underline">{t("toggle all")}</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((k) => (
                    <tr key={k.id} className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="px-2 py-1.5"><div className="font-medium">{k.kpi}</div><div className="mt-0.5 text-[10px] text-[var(--muted)]">{k.fungsi}{k.satuan ? ` · ${k.satuan}` : ""}</div></td>
                      {avps.map((a) => (
                        <td key={a} className="px-2 py-1.5 text-center"><input type="checkbox" checked={on(k.id, a)} onChange={() => toggle(k.id, a)} className="accent-royal-500" /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <CascadeResult title={AVP_BY_VP[vp]?.length ? "KPI AVP" : "KPI Staf"} rows={rows} targets={avps} cascadeMap={avpCascade} onRemove={removeKpi} />
        </>
      )}
    </>
  );
}

function CascadeResult({ title, rows, targets, cascadeMap, onRemove }: { title: string; rows: MapKpi[]; targets: string[]; cascadeMap: Record<string, string[]>; onRemove: (id: string) => void }) {
  const { t } = useI18n();
  const [sel, setSel] = useState(targets[0]);
  const cur = targets.includes(sel) ? sel : targets[0];
  const list = rows.filter((k) => (cascadeMap[k.id] ?? []).includes(cur));
  return (
    <Card className="mt-4">
      <SectionTitle title={title} subtitle="Result — the assigned KPI form" action={
        <select value={cur} onChange={(e) => setSel(e.target.value)} className="rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500">
          {targets.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      } />
      {list.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-[var(--muted)]">{t("No KPI cascaded to this SVP yet.")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[12px]">
            <thead>
              <tr className="border-b text-left text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {["No", "KPI", t("Validity"), t("Unit"), t("Polarity"), t("Priority"), "Bobot", "Frekuensi", "Target", ""].map((h, i) => <th key={i} className="px-2 py-2">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((k, i) => (
                <tr key={k.id} className="group border-b last:border-0">
                  <td className="px-2 py-1.5 tabular-nums text-[var(--muted)]">{i + 1}</td>
                  <td className="px-2 py-1.5">
                    <span className="font-medium">{k.kpi}</span>
                    {k.sources.includes("Manual") && <Badge tone="purple">{t("Manual")}</Badge>}
                  </td>
                  <td className="px-2 py-1.5">{k.validitas}</td>
                  <td className="px-2 py-1.5">{k.satuan}</td>
                  <td className="px-2 py-1.5">{k.polaritas}</td>
                  <td className="px-2 py-1.5">{k.prioritas || "—"}</td>
                  <td className="px-2 py-1.5">{k.bobot || "—"}</td>
                  <td className="px-2 py-1.5">{k.frekuensi || "—"}</td>
                  <td className="px-2 py-1.5">{k.target || "—"}</td>
                  <td className="px-2 py-1.5 text-right">
                    {k.sources.includes("Manual") && (
                      <button onClick={() => onRemove(k.id)} className="text-[11px] text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100" title={t("Delete")}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---- Manual KPI form (matches the KPI SVP.xlsx columns) — reused for SVP & VP -
function AddManualKpiForm({ title, targetLabel, targets, contextLabel, onClose, onSave }: {
  title: string;
  targetLabel: string; // "SVP" | "VP"
  targets: string[];
  contextLabel: string;
  onClose: () => void;
  onSave: (f: Omit<MapKpi, "id" | "esg" | "fungsi" | "sources">, target: string) => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState({ kpi: "", validitas: "", satuan: "", polaritas: "Maximize", sumberCascade: "", tipe: "", prioritas: "", bobot: "", pengukuran: "", frekuensi: "", target: "" });
  const [svp, setSvp] = useState(targets[0]);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const save = () => { if (!f.kpi.trim()) return; onSave({ ...f, kpi: f.kpi.trim() }, svp); };

  const Field = ({ label, k, ph }: { label: string; k: keyof typeof f; ph?: string }) => (
    <label className={labelCls}>{label}
      <input value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} className={inputCls} />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg glass card shadow-glass animate-fade-up">
        <div className="flex items-center gap-2 border-b p-4">
          <Icon.performance className="h-4 w-4 shrink-0 text-royal-400" />
          <div className="text-sm font-semibold">{title}</div>
          <span className="text-[11px] text-[var(--muted)]">· {contextLabel}</span>
          <button onClick={onClose} className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400" aria-label="Close">✕</button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <label className={labelCls}>{targetLabel} ({t("target")})
            <select value={svp} onChange={(e) => setSvp(e.target.value)} className={`${inputCls} text-[var(--text)]`}>
              {targets.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className={labelCls}>KPI
            <textarea value={f.kpi} onChange={(e) => set("kpi", e.target.value)} rows={2} placeholder={t("KPI name…")} className={inputCls} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Validity")} k="validitas" ph="Exact (110)" />
            <Field label={t("Unit")} k="satuan" ph="Persen" />
            <label className={labelCls}>{t("Polarity")}
              <select value={f.polaritas} onChange={(e) => set("polaritas", e.target.value)} className={`${inputCls} text-[var(--text)]`}>
                {["Maximize", "Minimize", "Stabilize"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <Field label="Sumber Cascade" k="sumberCascade" ph="Kolegial / D2 …" />
            <Field label="Jenis Cascade" k="tipe" ph="Contribute / Fully B" />
            <Field label={t("Priority")} k="prioritas" ph="Wajib" />
            <Field label="Bobot" k="bobot" ph="%" />
            <Field label="Jenis Pengukuran" k="pengukuran" />
            <Field label="Frekuensi" k="frekuensi" ph="Monthly" />
            <Field label="Target Tahunan" k="target" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t p-3">
          <Btn variant="ghost" onClick={onClose}>{t("Cancel")}</Btn>
          <Btn variant="primary" onClick={save}>{t("Add")}</Btn>
        </div>
      </div>
    </div>
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
