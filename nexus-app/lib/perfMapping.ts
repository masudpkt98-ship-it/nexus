// -----------------------------------------------------------------------------
// Performance Mapping — cascade the Corporate KPI down to the 4 Direktur via a
// checkbox matrix, supplemented from Matrix.xlsx / KatalogAP.xlsx.
// -----------------------------------------------------------------------------

export const MAPPING_KEY = "perf-mapping";

// The 4 Direktorat (Direksi) — cascade targets. Match KatalogAP column headers.
export const DIREKTUR = [
  "Direktur Produksi",
  "Direktur Pengembangan",
  "Direktur Keuangan & Umum",
  "Direktur Manajemen Risiko",
] as const;
export type Direktur = (typeof DIREKTUR)[number];

export type MapSource = "Korporat" | "Matrix" | "KatalogAP";

export interface MapKpi {
  id: string; // stable key = normalized KPI name
  kpi: string;
  validitas: string;
  satuan: string;
  esg: string;
  polaritas: string;
  tipe: string;
  prioritas: string;
  fungsi: string;
  sources: MapSource[]; // which files contributed this KPI
}

export interface MappingState {
  kpis: MapKpi[];
  cascade: Record<string, string[]>; // kpiId → Direktur[] checked
}

export const emptyMapping = (): MappingState => ({ kpis: [], cascade: {} });

const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const idOf = (kpi: string) => clean(kpi).toLowerCase();
const truthy = (v: unknown) => v === true || /^(true|1|x|v|ya|yes|✓)$/i.test(clean(v));

type Row = Record<string, unknown>;
const pick = (r: Row, keys: string[]) => { for (const k of keys) if (k in r) return r[k]; return ""; };

// Detect which of the three sources a sheet is, by its columns.
export function detectSource(columns: string[]): MapSource | null {
  const has = (c: string) => columns.includes(c);
  if (has("Sumber Cascade PIHC") || has("Direktur Produksi")) return "KatalogAP";
  if (has("Skala \nPrioritas") || has("Skala Prioritas")) return "Korporat";
  if (has("Fungsi") && has("Sumber Cascade")) return "Matrix";
  return null;
}

function toKpi(r: Row, fungsi: string, source: MapSource): MapKpi | null {
  const kpi = clean(pick(r, ["KPI"]));
  if (!kpi) return null;
  return {
    id: idOf(kpi),
    kpi,
    validitas: clean(pick(r, ["Validitas"])),
    satuan: clean(pick(r, ["Satuan"])),
    esg: clean(pick(r, ["ESG*", "ESG"])),
    polaritas: clean(pick(r, ["Polaritas"])),
    tipe: clean(pick(r, ["Tipe", "Tipe \nCascade", "Tipe Cascade"])),
    prioritas: clean(pick(r, ["Skala \nPrioritas", "Skala Prioritas", "Cascade\nLevel Priority"])),
    fungsi,
    sources: [source],
  };
}

// Parse one imported sheet → { kpis, cascade } contribution. For KatalogAP the
// per-Direktur boolean columns seed the initial cascade.
export function parseSheet(source: MapSource, rows: Row[]): { kpis: MapKpi[]; cascade: Record<string, string[]> } {
  const kpis: MapKpi[] = [];
  const cascade: Record<string, string[]> = {};
  let fungsi = source === "Korporat" ? "KPI Korporat" : "";
  for (const r of rows) {
    const f = clean(pick(r, ["Fungsi"]));
    if (f) fungsi = f; // fill-down grouping
    const k = toKpi(r, fungsi, source);
    if (!k) continue;
    kpis.push(k);
    if (source === "KatalogAP") {
      const checked = DIREKTUR.filter((d) => truthy(r[d]));
      if (checked.length) cascade[k.id] = [...checked];
    }
  }
  return { kpis, cascade };
}

// Merge a parsed contribution into the current state (dedupe KPIs by id).
export function mergeMapping(state: MappingState, add: { kpis: MapKpi[]; cascade: Record<string, string[]> }): MappingState {
  const byId = new Map(state.kpis.map((k) => [k.id, { ...k, sources: [...k.sources] }]));
  for (const k of add.kpis) {
    const ex = byId.get(k.id);
    if (ex) {
      for (const s of k.sources) if (!ex.sources.includes(s)) ex.sources.push(s);
      // fill any blank fields from the new source
      (["validitas", "satuan", "esg", "polaritas", "tipe", "prioritas", "fungsi"] as const).forEach((f) => { if (!ex[f] && k[f]) ex[f] = k[f]; });
    } else {
      byId.set(k.id, k);
    }
  }
  const cascade = { ...state.cascade };
  for (const [id, dirs] of Object.entries(add.cascade)) {
    const set = new Set([...(cascade[id] ?? []), ...dirs]);
    cascade[id] = [...set];
  }
  return { kpis: [...byId.values()], cascade };
}
