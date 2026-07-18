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

// SVPs (+ direct VPs) under each Direktur — per the org chart (SO.png).
// These are the cascade targets for the Direktur → SVP level.
export const SVP_BY_DIREKTUR: Record<Direktur, string[]> = {
  "Direktur Produksi": ["SVP Operasi 1", "SVP Operasi 2", "SVP Teknologi & K3LH", "SVP Pemeliharaan"],
  "Direktur Pengembangan": ["SVP Teknik & Pengembangan", "SVP Manajemen Logistik", "SVP SBU Jasa Pelayanan Pabrik"],
  "Direktur Keuangan & Umum": ["SVP Manajemen Keuangan", "SVP Mitra Bisnis & Pelabuhan", "SVP Sumber Daya Manusia", "SVP Umum"],
  "Direktur Manajemen Risiko": ["SVP Tata Kelola & Manajemen Risiko", "VP Hukum"],
};

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
  svpCascade: Record<string, string[]>; // kpiId → SVP[] checked (Direktur → SVP level)
}

export const emptyMapping = (): MappingState => ({ kpis: [], cascade: {}, svpCascade: {} });

const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const idOf = (kpi: string) => clean(kpi).toLowerCase();
const truthy = (v: unknown) => v === true || /^(true|1|x|v|ya|yes|✓)$/i.test(clean(v));

type Row = Record<string, unknown>;
const pick = (r: Row, keys: string[]) => { for (const k of keys) if (k in r) return r[k]; return ""; };

// The source column name(s) that carry each canonical Direktur's cascade flag.
// (Korporat/Matrix label the 3rd one "Direktur SDM dan Umum"; KatalogAP uses
// "Direktur Keuangan & Umum".)
const DIREKTUR_COLS: Record<Direktur, string[]> = {
  "Direktur Produksi": ["Direktur Produksi"],
  "Direktur Pengembangan": ["Direktur Pengembangan"],
  "Direktur Keuangan & Umum": ["Direktur Keuangan & Umum", "Direktur SDM dan Umum"],
  "Direktur Manajemen Risiko": ["Direktur Manajemen Risiko"],
};

// Detect which of the three sources a sheet is, by columns UNIQUE to each.
// (All three carry the Direktur columns, so detect on distinctive fields.)
export function detectSource(columns: string[]): MapSource | null {
  const has = (c: string) => columns.includes(c);
  if (has("Sumber Cascade PIHC")) return "KatalogAP";               // only KatalogAP
  if (has("Bobot") || has("Target Tahunan") || has("Jenis Pengukuran")) return "Korporat"; // only Korporat
  if (has("Fungsi")) return "Matrix";                                // Matrix (has Fungsi, no Bobot/PIHC)
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
    // Seed the cascade from any Direktur column present in this file.
    const checked = DIREKTUR.filter((d) => DIREKTUR_COLS[d].some((col) => truthy(r[col])));
    if (checked.length) cascade[k.id] = [...checked];
  }
  return { kpis, cascade };
}

// Count KPIs per source (a KPI may belong to several).
export function sourceCounts(kpis: MapKpi[]): Record<MapSource, number> {
  const c: Record<MapSource, number> = { Korporat: 0, Matrix: 0, KatalogAP: 0 };
  for (const k of kpis) for (const s of k.sources) c[s]++;
  return c;
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
  return { kpis: [...byId.values()], cascade, svpCascade: { ...state.svpCascade } };
}
