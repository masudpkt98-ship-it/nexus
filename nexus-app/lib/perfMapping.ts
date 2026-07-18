// -----------------------------------------------------------------------------
// Performance Mapping — cascade the Corporate KPI down to the Direksi via a
// checkbox matrix, supplemented from Matrix.xlsx / KatalogAP.xlsx.
// -----------------------------------------------------------------------------

export const MAPPING_KEY = "perf-mapping";

// The Direksi — cascade targets. Direktur Utama heads the board; the other 4
// match KatalogAP column headers. Direktur Utama holds the corporate/kolegial
// KPI and cascades to Sekretaris Perusahaan (Sekper) & SPI (Satuan Pengawasan Intern).
export const DIREKTUR = [
  "Direktur Utama",
  "Direktur Produksi",
  "Direktur Pengembangan",
  "Direktur Keuangan & Umum",
  "Direktur Manajemen Risiko",
] as const;
export type Direktur = (typeof DIREKTUR)[number];

// SVPs (+ direct VPs) under each Direktur — per the org chart (SO.png).
// These are the cascade targets for the Direktur → SVP level.
export const SVP_BY_DIREKTUR: Record<Direktur, string[]> = {
  "Direktur Utama": ["Sekretaris Perusahaan", "SPI"],
  "Direktur Produksi": ["SVP Operasi 1", "SVP Operasi 2", "SVP Teknologi & K3LH", "SVP Pemeliharaan"],
  "Direktur Pengembangan": ["SVP Teknik & Pengembangan", "SVP Manajemen Logistik", "SVP SBU Jasa Pelayanan Pabrik"],
  "Direktur Keuangan & Umum": ["SVP Manajemen Keuangan", "SVP Mitra Bisnis & Pelabuhan", "SVP Sumber Daya Manusia", "SVP Umum"],
  "Direktur Manajemen Risiko": ["SVP Tata Kelola & Manajemen Risiko", "VP Hukum"],
};

// VPs under each SVP — per SO.png. Cascade targets for the SVP → VP level.
export const VP_BY_SVP: Record<string, string[]> = {
  // Direktur Utama's two units (Sekper & SPI) and their VPs — per the org chart.
  "Sekretaris Perusahaan": ["VP Administrasi Korporat", "VP Komunikasi Korporat", "VP Tanggung Jawab Sosial & Lingkungan", "VP Board Office"],
  "SPI": ["VP Audit Bisnis & Keuangan", "VP Konsultasi & Jaminan Kualitas", "VP Perencanaan & Monitoring"],
  "SVP Operasi 1": ["VP Operasi Pabrik 2", "VP Operasi Pabrik 5", "VP Operasi Pabrik 6 / EX P1"],
  "SVP Operasi 2": ["VP Operasi Pabrik 1A", "VP Operasi Pabrik 3", "VP Operasi Pabrik 4", "VP Operasi Pabrik 7"],
  "SVP Teknologi & K3LH": ["VP Proses & Pengelolaan Energi", "VP Laboratorium", "VP Keselamatan & Kesehatan Kerja", "VP Lingkungan Hidup", "VP Inspeksi Teknik 1", "VP Inspeksi Teknik 2"],
  "SVP Pemeliharaan": ["VP Perencanaan & Pengendalian Pemeliharaan", "VP Perencanaan & Pengendalian Turn Around", "VP Keandalan", "VP Pemeliharaan Mekanik", "VP Pemeliharaan Instrumen", "VP Pemeliharaan Listrik", "VP Bengkel"],
  "SVP Teknik & Pengembangan": ["VP Perencanaan Strategis", "VP Pengembangan Bisnis", "VP Portofolio Bisnis", "VP Riset", "VP Teknologi Informasi"],
  "SVP Manajemen Logistik": ["VP Perencanaan Penerimaan & Pergudangan", "VP Pengadaan Barang", "VP Pengadaan Jasa"],
  "SVP SBU Jasa Pelayanan Pabrik": ["VP Bisnis & Administrasi", "VP Teknik & Kontrol Kualitas", "VP Manufacturing", "VP Rancang Bangun"],
  "SVP Manajemen Keuangan": ["VP Anggaran", "VP Keuangan", "VP Akuntansi", "VP Pelaporan Manajemen"],
  "SVP Mitra Bisnis & Pelabuhan": ["VP Pengelolaan Pelanggan", "VP Operasional Penjualan", "VP Administrasi Penjualan", "VP Pelayanan Pelabuhan & Pengapalan"],
  "SVP Sumber Daya Manusia": ["VP Sistem Manajemen Terpadu & Inovasi", "VP Manajemen & Pengembangan SDM", "VP Operasional SDM"],
  "SVP Umum": ["VP Pelayanan Umum", "VP Keamanan", "VP Manajemen Aset"],
  "SVP Tata Kelola & Manajemen Risiko": ["VP Manajemen Risiko Korporasi", "Staf Tata Kelola & Kepatuhan"],
  "VP Hukum": [],
};

// AVPs under each VP — per the per-VP org charts (01.png–55.png). VPs with an
// empty list cascade straight to "Staf" (VP → Staf). SVP → VP → AVP.
export const AVP_BY_VP: Record<string, string[]> = {
  "VP Audit Bisnis & Keuangan": [],
  "VP Konsultasi & Jaminan Kualitas": [],
  "VP Perencanaan & Monitoring": ["Monitoring & Pelaporan", "Perencanaan & Counterpart"],
  "VP Administrasi Korporat": ["Kearsipan & Administrasi", "Perizinan Korporat"],
  "VP Komunikasi Korporat": ["Hubungan Media", "Komunikasi Internal", "Komunikasi Eksternal"],
  "VP Tanggung Jawab Sosial & Lingkungan": ["Pembangunan Sosial & Lingkungan", "Pembangunan Ekonomi", "Administrasi & Keuangan"],
  "VP Board Office": ["Kantor Perwakilan Jakarta", "Protokoler BoD"],
  "VP Operasi Pabrik 2": ["Utility P2", "Ammonia P2", "Urea P2"],
  "VP Operasi Pabrik 5": ["Utility P5", "Ammonia P5", "Urea P5"],
  "VP Operasi Pabrik 6 / EX P1": ["Penanganan Produk", "Boiler Batubara", "Utility & Ammonia Storage"],
  "VP Operasi Pabrik 1A": ["Ammonia P1A", "Urea P1A"],
  "VP Operasi Pabrik 3": ["Utility P3", "Ammonia P3", "Urea P3"],
  "VP Operasi Pabrik 4": ["Utility P4", "Ammonia P4", "Urea P4"],
  "VP Operasi Pabrik 7": ["NPK Fusion", "Rendal Produksi NPK & Organik", "NPK Blending, Organik & Gudang Produk NPK"],
  "VP Proses & Pengelolaan Energi": ["Proses & Pengelolaan Energi P2 & P6 / Ex P1", "Proses & Pengelolaan Energi P3 & P1A", "Proses & Pengelolaan Energi P4 & P7", "Proses & Pengelolaan Energi P5", "Perhitungan Hasil Produksi", "Perhitungan Utilisasi Aset, JVC & Produk Lain"],
  "VP Laboratorium": ["Laboratorium Kontrol 1", "Laboratorium Kontrol 2", "Laboratorium Mutu", "Laboratorium Lingkungan", "Laboratorium Kalibrasi, Inventory & Sarana"],
  "VP Keselamatan & Kesehatan Kerja": ["Safety 1", "Safety 2", "Pembinaan & Perizinan K3", "Hyperkes", "Fire & Rescue"],
  "VP Lingkungan Hidup": ["Pemantauan & Pelaporan", "Pengelolaan & Perizinan Lingkungan Hidup"],
  "VP Inspeksi Teknik 1": ["Inspeksi P1A", "Inspeksi P2", "Inspeksi P3", "Inspeksi P4", "Inspeksi P5", "Inspeksi P6 / Ex P1"],
  "VP Inspeksi Teknik 2": ["Inspeksi Rotating 1", "Inspeksi Rotating 2", "Inspeksi Bengkel", "Inspeksi Metalurgi", "Inspeksi Pelabuhan Pengapalan, Handling Storage & OSBL"],
  "VP Perencanaan & Pengendalian Pemeliharaan": ["Perencanaan Pemeliharaan P2 & P5", "Perencanaan Pemeliharaan P3 & P4", "Perencanaan Pemeliharaan P1A & Produk Lain", "Perencanaan Pemeliharaan Boiler Batubara & OSBL", "Perencanaan Pemeliharaan Fasilitas Handling & Penyimpanan Produk"],
  "VP Perencanaan & Pengendalian Turn Around": ["Jasa Pemeliharaan", "Cost Control & Administrasi"],
  "VP Keandalan": ["Risk Based Inspection", "Maintenance Strategy", "Reliability Data", "Reliability Improvement"],
  "VP Pemeliharaan Mekanik": ["Pemeliharaan Mekanik Lapangan P1A", "Pemeliharaan Mekanik Lapangan P2", "Pemeliharaan Mekanik Lapangan P3", "Pemeliharaan Mekanik Lapangan P4", "Pemeliharaan Mekanik Lapangan P5", "Pemeliharaan Mekanik Lapangan Boiler Batubara & OSBL", "Pemeliharaan Mekanik Lap. Ex P1 & Pelabuhan Pengapalan, Handling, Storage"],
  "VP Pemeliharaan Instrumen": ["Pemeliharaan Instrumen P2 & P5", "Pemeliharaan Instrumen P3 & P4", "Pemeliharaan Instrumen P1A & Produk Lain", "Pemeliharaan Instrumen P6 / Ex P1 Pelabuhan & Pengapalan"],
  "VP Pemeliharaan Listrik": ["Pemeliharaan Listrik P2 & P5", "Pemeliharaan Listrik P3 & P4", "Pemeliharaan Listrik P1A & Produk Lain", "Pemeliharaan Listrik P6 / Ex P1 Pelabuhan & Pengapalan"],
  "VP Bengkel": ["Pekerjaan Umum", "Alat Berat & Bantu", "Pengelasan & Perpipaan 1", "Pengelasan & Perpipaan 2", "Permesinan", "Perawatan & Sarana Shop"],
  "VP Perencanaan Strategis": ["Perencanaan Korporat", "Strategi Bisnis"],
  "VP Pengembangan Bisnis": ["Perencanaan & Persiapan Project", "Monitoring & Kinerja Project"],
  "VP Portofolio Bisnis": ["Kerja Sama Usaha & Kinerja Anak Perusahaan", "Investasi Portofolio Strategis"],
  "VP Riset": ["Manajemen Riset"],
  "VP Teknologi Informasi": ["IT Service", "IT Infrastructure", "IT Business Partner"],
  "VP Perencanaan Penerimaan & Pergudangan": ["Perencanaan Spareparts", "Perencanaan Non Spareparts & Jasa", "Receiving", "Pergudangan Spareparts", "Pergudangan Bahan Baku & Bahan Penolong"],
  "VP Pengadaan Barang": ["Expediting & Pelaporan", "Pengadaan Spareparts", "Pengadaan Material Lain", "Pengadaan Bahan Penolong & Batubara"],
  "VP Pengadaan Jasa": ["Pengadaan Jasa Pabrik", "Pengadaan Jasa Non Pabrik", "Kontrak Jasa & Administrasi"],
  "VP Bisnis & Administrasi": ["Keuangan & Umum", "Pengadaan Material & Jasa", "Sales & Marketing"],
  "VP Teknik & Kontrol Kualitas": ["Project Planning & Inventory Control", "Rancang Bangun", "QA / QC", "Pemeliharaan Fasilitas Manufakturing"],
  "VP Manufacturing": ["Pengecoran Logam", "Machine Shop", "Welding Shop", "Site Services"],
  "VP Rancang Bangun": ["Mechanical & Piping", "Civil & Architecture", "Electrical & Instrument", "Process", "Project Control & Technical Service"],
  "VP Anggaran": ["Perencanaan Anggaran", "Pengendalian Anggaran"],
  "VP Keuangan": ["Perbendaharaan", "Pajak & Asuransi", "Penagihan"],
  "VP Akuntansi": ["Akuntansi Biaya", "Verifikasi", "Akuntansi Umum"],
  "VP Pelaporan Manajemen": ["Administrasi Kinerja Perusahaan", "Optimalisasi Kinerja Bisnis"],
  "VP Pengelolaan Pelanggan": ["Agrospek Sumatera", "Agrospek Jawa & Nusa Tenggara", "Agrospek Kalimantan", "Agrospek Sulawesi, Maluku & Papua", "Perencanaan, Pengendalian & Administrasi", "Customer Care"],
  "VP Operasional Penjualan": ["Perencanaan & Evaluasi Penjualan", "Kontrak & Operasional Sarana Prasarana", "Stok & Jaminan Kualitas", "Pengendalian Biaya"],
  "VP Administrasi Penjualan": ["Evaluasi & Penagihan Subsidi", "Administrasi Penjualan Pupuk Dalam Negeri", "Administrasi Penjualan Ritel", "Administrasi Penjualan Pupuk Luar Negeri", "Administrasi Penjualan Non Pupuk", "Administrasi Pendukung Penjualan"],
  "VP Pelayanan Pelabuhan & Pengapalan": ["Pelabuhan", "Terminal"],
  "VP Sistem Manajemen Terpadu & Inovasi": ["Sistem Manajemen Terpadu", "Pengembangan Manajemen", "Manajemen Inovasi"],
  "VP Manajemen & Pengembangan SDM": ["Manajemen Kompetensi & Kinerja", "Manajemen Talenta", "Manajemen Organisasi & Pengetahuan", "Manajemen Budaya & Pembelajaran", "Lembaga Sertifikasi Profesi"],
  "VP Operasional SDM": ["Remunerasi", "Hubungan Industrial", "Manajemen Kepegawaian"],
  "VP Pelayanan Umum": ["Rumah Tangga & Perawatan", "Transportasi & Travel", "Pengelolaan Kawasan", "Perwakilan Kalimantan"],
  "VP Keamanan": ["Perencanaan & Perawatan", "Pengamanan, Penyelidikan & Penggalangan", "Administrasi & Perizinan"],
  "VP Manajemen Aset": ["Water Treatment Process", "Perencanaan & Pengendalian", "Pemeliharaan Bangunan & Sarana", "Pemeliharaan Sistem Kelistrikan & Pendingin", "Utilisasi Aset"],
  "VP Manajemen Risiko Korporasi": [],
  "VP Hukum": ["Hukum Korporasi", "Hukum Advokasi & Litigasi", "Hukum Bisnis & Pengembangan Usaha"],
};

export type MapSource = "Korporat" | "Matrix" | "KatalogAP" | "Manual" | "Teknis";

export interface MapKpi {
  id: string; // stable key = normalized KPI name
  kpi: string;
  validitas: string;
  satuan: string;
  esg: string;
  polaritas: string;
  tipe: string; // Jenis Cascade
  prioritas: string; // Skala Prioritas
  fungsi: string;
  sources: MapSource[]; // which files contributed this KPI
  // Extra fields carried by the KPI SVP form (manual entries fill these):
  bobot?: string;
  pengukuran?: string; // Jenis Pengukuran
  frekuensi?: string;
  target?: string; // Target Tahunan
  sumberCascade?: string;
}

export interface MappingState {
  kpis: MapKpi[];
  cascade: Record<string, string[]>; // kpiId → Direktur[] checked
  svpCascade: Record<string, string[]>; // kpiId → SVP[] checked (Direktur → SVP level)
  vpCascade: Record<string, string[]>; // kpiId → VP[] checked (SVP → VP level)
  avpCascade: Record<string, string[]>; // kpiId → AVP[] checked (VP → AVP level; AVP names are globally unique)
}

export const emptyMapping = (): MappingState => ({ kpis: [], cascade: {}, svpCascade: {}, vpCascade: {}, avpCascade: {} });

const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const idOf = (kpi: string) => clean(kpi).toLowerCase();
const truthy = (v: unknown) => v === true || /^(true|1|x|v|ya|yes|✓)$/i.test(clean(v));

type Row = Record<string, unknown>;
const pick = (r: Row, keys: string[]) => { for (const k of keys) if (k in r) return r[k]; return ""; };

// The source column name(s) that carry each canonical Direktur's cascade flag.
// (Korporat/Matrix label the 3rd one "Direktur SDM dan Umum"; KatalogAP uses
// "Direktur Keuangan & Umum".)
const DIREKTUR_COLS: Record<Direktur, string[]> = {
  "Direktur Utama": ["Direktur Utama"],
  "Direktur Produksi": ["Direktur Produksi"],
  "Direktur Pengembangan": ["Direktur Pengembangan"],
  "Direktur Keuangan & Umum": ["Direktur Keuangan & Umum", "Direktur SDM dan Umum"],
  "Direktur Manajemen Risiko": ["Direktur Manajemen Risiko"],
};

// The source column name(s) for each canonical SVP. KatalogAP labels a couple
// differently ("SVP HSE Teknologi", "SVP SDM").
const SVP_COLS: Record<string, string[]> = {
  "SVP Operasi 1": ["SVP Operasi 1"],
  "SVP Operasi 2": ["SVP Operasi 2"],
  "SVP Teknologi & K3LH": ["SVP Teknologi & K3LH", "SVP HSE Teknologi"],
  "SVP Pemeliharaan": ["SVP Pemeliharaan"],
  "SVP Teknik & Pengembangan": ["SVP Teknik & Pengembangan"],
  "SVP Manajemen Logistik": ["SVP Manajemen Logistik"],
  "SVP SBU Jasa Pelayanan Pabrik": ["SVP SBU Jasa Pelayanan Pabrik"],
  "SVP Manajemen Keuangan": ["SVP Manajemen Keuangan"],
  "SVP Mitra Bisnis & Pelabuhan": ["SVP Mitra Bisnis & Pelabuhan"],
  "SVP Sumber Daya Manusia": ["SVP Sumber Daya Manusia", "SVP SDM"],
  "SVP Umum": ["SVP Umum"],
  "SVP Tata Kelola & Manajemen Risiko": ["SVP Tata Kelola & Manajemen Risiko"],
  "VP Hukum": ["VP Hukum"],
};
const ALL_SVP = Object.keys(SVP_COLS);

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
export function parseSheet(source: MapSource, rows: Row[]): { kpis: MapKpi[]; cascade: Record<string, string[]>; svpCascade: Record<string, string[]> } {
  const kpis: MapKpi[] = [];
  const cascade: Record<string, string[]> = {};
  const svpCascade: Record<string, string[]> = {};
  let fungsi = source === "Korporat" ? "KPI Korporat" : "";
  for (const r of rows) {
    const f = clean(pick(r, ["Fungsi"]));
    if (f) fungsi = f; // fill-down grouping
    const k = toKpi(r, fungsi, source);
    if (!k) continue;
    kpis.push(k);
    // Seed the Direktur cascade from any Direktur column present in this file.
    const dirs = DIREKTUR.filter((d) => DIREKTUR_COLS[d].some((col) => truthy(r[col])));
    if (dirs.length) cascade[k.id] = [...dirs];
    // Seed the SVP cascade from any SVP column present (KatalogAP carries these).
    const svps = ALL_SVP.filter((s) => SVP_COLS[s].some((col) => truthy(r[col])));
    if (svps.length) svpCascade[k.id] = [...svps];
  }
  return { kpis, cascade, svpCascade };
}

// Count KPIs per source (a KPI may belong to several).
export function sourceCounts(kpis: MapKpi[]): Record<MapSource, number> {
  const c: Record<MapSource, number> = { Korporat: 0, Matrix: 0, KatalogAP: 0, Manual: 0, Teknis: 0 };
  for (const k of kpis) for (const s of k.sources) c[s]++;
  return c;
}

// Merge a parsed contribution into the current state (dedupe KPIs by id).
export function mergeMapping(state: MappingState, add: { kpis: MapKpi[]; cascade: Record<string, string[]>; svpCascade?: Record<string, string[]> }): MappingState {
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
    cascade[id] = [...new Set([...(cascade[id] ?? []), ...dirs])];
  }
  const svpCascade = { ...state.svpCascade };
  for (const [id, svps] of Object.entries(add.svpCascade ?? {})) {
    svpCascade[id] = [...new Set([...(svpCascade[id] ?? []), ...svps])];
  }
  return { kpis: [...byId.values()], cascade, svpCascade, vpCascade: { ...state.vpCascade }, avpCascade: { ...state.avpCascade } };
}
