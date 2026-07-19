// ============================================================================
// NEXUS — Mock data layer (stands in for the Laravel REST API / PostgreSQL)
// ============================================================================

export type Role =
  | "Administrator"
  | "VP"
  | "Manager"
  | "Supervisor"
  | "Staff"
  | "Internal Customer"
  | "Executive";

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
  avatar: string; // initials
  email: string;
}

export const currentUser: User = {
  id: "u-001",
  name: "Masud Barbarossa",
  role: "Administrator",
  title: "Plt. AVP Manajemen Kompetensi & Kinerja",
  avatar: "MB",
  email: "masud@nexus.co",
};

export const demoUsers: User[] = [
  currentUser,
  { id: "u-002", name: "Sinta Larasati", role: "Manager", title: "Manager Performance", avatar: "SL", email: "sinta@nexus.co" },
  { id: "u-003", name: "Dimas Prakoso", role: "Supervisor", title: "Supervisor Development", avatar: "DP", email: "dimas@nexus.co" },
  { id: "u-004", name: "Rani Kusuma", role: "Staff", title: "Competency Analyst", avatar: "RK", email: "rani@nexus.co" },
  { id: "u-005", name: "Bagus Hartono", role: "Executive", title: "Director Operations", avatar: "BH", email: "bagus@nexus.co" },
];

// ---------------------------------------------------------------------------
// KPI & dashboard
// ---------------------------------------------------------------------------

export interface Kpi {
  label: string;
  value: number;
  target: number;
  unit: string;
  delta: number; // vs last period, percentage points
  status: "green" | "amber" | "red";
}

export const executiveKpis: Kpi[] = [
  { label: "Overall KPI Achievement", value: 87, target: 90, unit: "%", delta: 3.2, status: "amber" },
  { label: "Task Completion Rate", value: 92, target: 95, unit: "%", delta: 1.8, status: "green" },
  { label: "Customer Satisfaction", value: 4.4, target: 4.5, unit: "/5", delta: 0.2, status: "green" },
  { label: "Competency Index", value: 78, target: 85, unit: "%", delta: -1.1, status: "red" },
];

export const workloadByTeam = [
  { team: "Performance", open: 24, done: 61 },
  { team: "Development", open: 18, done: 42 },
  { team: "Competency", open: 31, done: 38 },
  { team: "Customer", open: 12, done: 55 },
  { team: "Strategy", open: 9, done: 27 },
];

export const kpiTrend = [
  { m: "Jan", v: 72 },
  { m: "Feb", v: 74 },
  { m: "Mar", v: 78 },
  { m: "Apr", v: 77 },
  { m: "May", v: 82 },
  { m: "Jun", v: 85 },
  { m: "Jul", v: 87 },
];

export const satisfactionTrend = [
  { m: "Jan", v: 4.0 },
  { m: "Feb", v: 4.1 },
  { m: "Mar", v: 4.1 },
  { m: "Apr", v: 4.2 },
  { m: "May", v: 4.3 },
  { m: "Jun", v: 4.3 },
  { m: "Jul", v: 4.4 },
];

// Competency heatmap: rows = competency, cols = team, value 0-100
export const competencyHeatmap = {
  competencies: ["Leadership", "Analytics", "Communication", "Project Mgmt", "Technical", "Coaching"],
  teams: ["Perf.", "Dev.", "Comp.", "Cust.", "Strat."],
  matrix: [
    [82, 74, 70, 66, 88],
    [90, 68, 85, 60, 79],
    [76, 80, 72, 88, 70],
    [70, 66, 64, 58, 84],
    [88, 62, 90, 55, 66],
    [64, 78, 60, 72, 74],
  ],
};

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "task" | "approval" | "kpi" | "training" | "request" | "meeting";
}

export const recentActivity: Activity[] = [
  { id: "a1", user: "Sinta L.", action: "completed task", target: "Q3 KPI Cascade", time: "12m", type: "task" },
  { id: "a2", user: "Dimas P.", action: "requested approval for", target: "Leadership Program Budget", time: "38m", type: "approval" },
  { id: "a3", user: "Rani K.", action: "updated competency gap for", target: "Analytics Team", time: "1h", type: "kpi" },
  { id: "a4", user: "System AI", action: "flagged risk on", target: "Project Aurora timeline", time: "2h", type: "task" },
  { id: "a5", user: "Bagus H.", action: "submitted request", target: "SR-2041 Data Access", time: "3h", type: "request" },
  { id: "a6", user: "Sinta L.", action: "scheduled meeting", target: "Quarterly Review", time: "4h", type: "meeting" },
  { id: "a7", user: "Rani K.", action: "enrolled in", target: "Advanced Analytics Cert.", time: "5h", type: "training" },
];

// ---------------------------------------------------------------------------
// Strategy
// ---------------------------------------------------------------------------

export interface Objective {
  id: string;
  title: string;
  owner: string;
  progress: number;
  keyResults: { title: string; progress: number }[];
  quarter: string;
}

export const objectives: Objective[] = [
  {
    id: "okr-1",
    title: "Elevate department competency maturity to Level 4",
    owner: "Arif Wibowo",
    progress: 68,
    quarter: "FY26",
    keyResults: [
      { title: "Assess 100% of staff against matrix", progress: 92 },
      { title: "Close 60% of critical competency gaps", progress: 54 },
      { title: "Launch 3 development programs", progress: 66 },
    ],
  },
  {
    id: "okr-2",
    title: "Achieve 95% on-time execution across programs",
    owner: "Sinta Larasati",
    progress: 74,
    quarter: "FY26",
    keyResults: [
      { title: "Reduce overdue tasks below 8%", progress: 70 },
      { title: "Automate 40% of admin workflows", progress: 61 },
      { title: "Milestone adherence ≥ 90%", progress: 88 },
    ],
  },
  {
    id: "okr-3",
    title: "Deliver best-in-class internal customer value",
    owner: "Bagus Hartono",
    progress: 81,
    quarter: "FY26",
    keyResults: [
      { title: "NPS ≥ 55", progress: 84 },
      { title: "SLA compliance ≥ 95%", progress: 79 },
      { title: "CSAT ≥ 4.5", progress: 80 },
    ],
  },
];

// --- Strategic Planning: Vision, Mission, Core Values, Goals, SWOT ---------

export const strategyVision =
  "To become the intelligent digital ecosystem for organizational excellence.";

export interface MissionItem {
  id: string;
  text: string;
}

export const missionItems: MissionItem[] = [
  { id: "ms-1", text: "Empower organizations through integrated competency and performance management." },
  { id: "ms-2", text: "Connect people, competency, execution, and value into one operating system." },
  { id: "ms-3", text: "Drive data-driven decisions with real-time insight across every department." },
  { id: "ms-4", text: "Cultivate a culture of continuous learning and measurable growth." },
  { id: "ms-5", text: "Deliver best-in-class internal service and lasting stakeholder value." },
];

export interface CoreValue {
  id: string;
  letter: string;
  title: string;
  description: string;
}

export const coreValues: CoreValue[] = [
  { id: "cv-1", letter: "I", title: "Integrity", description: "We act with honesty and hold ourselves accountable for every outcome." },
  { id: "cv-2", letter: "E", title: "Excellence", description: "We pursue the highest standards in everything we deliver." },
  { id: "cv-3", letter: "C", title: "Collaboration", description: "We connect people and teams to achieve shared goals." },
  { id: "cv-4", letter: "N", title: "Innovation", description: "We continuously improve through creativity and technology." },
];

// A strategy line under a Strategic Goal, with its concrete program/activities.
// `programs` keeps the source's multi-line bullet text verbatim (rendered with
// whitespace-pre-line) so nothing from the RKAP plan is lost.
export interface GoalStrategy {
  strategy: string;
  programs: string;
}

export interface StrategicGoal {
  id: string;
  code: string; // Kode Sasaran, e.g. "PRD-01"
  division: string; // Bidang (owning function)
  title: string; // Sasaran (the goal statement)
  target: string; // planning horizon (RKAP year)
  owner: string; // kept for back-compat display; defaults to the division
  description?: string; // optional free-text note
  strategies: GoalStrategy[];
}

// Sourced from "Program Kegiatan 2026" (Sasaran → Strategi → Program Kegiatan).
// 90 corporate strategic goals across 14 divisions.
export const strategicGoals: StrategicGoal[] = [
  {
    id: "sg-prd-01",
    code: "PRD-01",
    division: "Bidang Produksi",
    title: "- Target produksi amoniak, urea dan NPK sesuai target RKAP 2026.\n- Target energi konsumsi amoniak dan urea sesuai target RKAP 2026.",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Meningkatkan efisiensi dan keandalan pabrik amoniak dan Urea eksisting", programs: "- Program TA Pabrik 1A\n- Program TA Pabrik 5\n- Program TA Boiler Batu Bara\n- Basic Engineering Design Package Reformed Gas WHB 101-C Pabrik Ammoniak-5" },
    ],
  },
  {
    id: "sg-prd-02",
    code: "PRD-02",
    division: "Bidang Produksi",
    title: "Target produksi NPK sesuai RKAP tahun 2026 dan losses dry basis kumulatif sebesar 1,1%",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Meningkatkan efisiensi dan keandalan pabrik NPK", programs: "- Program TA Plant 2 NPK Fusion Pabrik 7\n- Program Penggantian Struktural NPK Blending 2 Pabrik 7" },
    ],
  },
  {
    id: "sg-prd-03",
    code: "PRD-03",
    division: "Bidang Produksi",
    title: "Memastikan standardisasi dan kontrol kualitas produk memenuhi SNI",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Memastikan standardisasi dan konsistensi kontrol kualitas", programs: "Program TA UBS 6" },
    ],
  },
  {
    id: "sg-prd-04",
    code: "PRD-04",
    division: "Bidang Produksi",
    title: "Peningkatan kapasitas shipping out produk kantong dan curah serta shipping in bahan baku",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Meningkatkan kapasitas shipping out produk curah dan kantong serta shipping in bahan baku", programs: "- Ekstensi Dermaga 2 & Penambahan Fasilitas BSL-3\n- Penambahan conveyor dari UBS VI ke BSL-3\n- Pembangunan Dermaga 11" },
    ],
  },
  {
    id: "sg-prd-05",
    code: "PRD-05",
    division: "Bidang Produksi",
    title: "Meningkatkan kecepatan pelayanan dan tata kelola pelabuhan berbasis Teknologi 4.0 yang ramah terhadap lingkungan",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Menjadikan Tersus PKT sebagai Pelabuhan digitalisasi Smart Port", programs: "- Implementasi Automatic Identification System (AIS Receiver)\n- Penggantian bahan bakar kendaraan operasional Tersus PKT dengan energi ramah lingkungan." },
    ],
  },
  {
    id: "sg-prd-06",
    code: "PRD-06",
    division: "Bidang Produksi",
    title: "Tata kelola pelabuhan yang ramah terhadap lingkungan",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Mempertahankan predikat Green Port", programs: "- Membangun tempat pengelolaan penampungan limbah dari kapal PRF (Port Reception Facility).\n- Monitoring emisi kendaraan operasional Pelabuhan berbahan bakar fosil.\n- Pembangunan Oil Boom Launcher untuk mempercepat pergelaran oil boom dan meminimalkan kerusakan oil boom\n- Implementasi Shore Power Connection di area dermaga tersus PKT." },
    ],
  },
  {
    id: "sg-prd-07",
    code: "PRD-07",
    division: "Bidang Produksi",
    title: "Memenuhi Plant Availability Ammonia >94,56% & Urea >96,47%",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Peningkatan keandalan peralatan pabrik", programs: "- Penerapan life cycle management (LCM) dan obsolete management sebagai salah satu pilar usulan investasi.\n- Menerapkan RCS (reliability centered spare) dan mengoptimalkan inventory nonmoving sparepart berdasarkan strategy maintenance.\n- Mengembangkan strategi pemeliharaan dan strategi material pada item Stationary sesuai kebutuhan sertifikasi Bejana Tekan, Alat Penukar Panas, Tangki, Boiler, Valve Pengaman dan Sistem Perpipaan.\n- Perbaikan Rotor Equipment Rotating\n- Pembelian Motor MV\n- Revitalisasi Kelistrikan Pabrik 6\n- Revitalisasi dan investasi aset (alat berat, mesin produksi)\n- Peningkatan PdM peralatan listrik, rotating & Electrical Sistem Integration (ESI)" },
      { strategy: "Mengoptimalkan strategi pemeliharaan berdasarkan kajian risiko menggunakan Reliability Centered Maintenance (RCM) dan Risk Based Inspection (RBI)", programs: "Melakuka pemeliharaan berdasarkan kajian risiko menggunakan Reliability Centered Maintenance (RCM) dan Risk Based Inspection (RBI)" },
      { strategy: "Meningkatkan service level inventory critical spare part dan insurance spare di atas 98% dengan mengintegrasikan strategi pemeliharaan dan inventory menggunakan metode Reliability Centered Spare (RCS).", programs: "Pengembangan Sistem Reliability Centered Spares (RCS)" },
    ],
  },
  {
    id: "sg-prd-08",
    code: "PRD-08",
    division: "Bidang Produksi",
    title: "Peningkatan service level > 98%, Nilai inventory spare part 1,5% RAV",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Penurunan persediaan suku cadang melalui optimalisasi Material Requirement Planning (MRP)", programs: "1. Optimalisasi MRP type spare part (V1, PD dan SCP) melalui program SHP PI\n2. Penurunan nilai material non moving, material PD dan migrasi ke Suku Cadang Penyangga (SCP)" },
    ],
  },
  {
    id: "sg-prd-09",
    code: "PRD-09",
    division: "Bidang Produksi",
    title: "Penetrasi Produk dan jasa SBU JPP ke pasar Domestik untuk Industri powerplant 2026",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Support produk ke Industri Power Plant (Air Cap Distributor)", programs: "Uji coba Produk yang sudah produksi oleh JPP terhadap costumer Power Plant" },
    ],
  },
  {
    id: "sg-prd-10",
    code: "PRD-10",
    division: "Bidang Produksi",
    title: "Pemenuhan COGM urea sesuai target RKAP 2026 dan target energi konsumsi amoniak dan urea sesuai target RKAP 2026",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Penerapan sistem manajemen energi sesuai standar ISO 50001:2018", programs: "Mengimplementasikan Sistem Manajemen Energi ke seluruh pabrik Amonia dan Urea." },
    ],
  },
  {
    id: "sg-prd-11",
    code: "PRD-11",
    division: "Bidang Produksi",
    title: "Mengimplementasikan Progressive & Higher Efficiency",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Implementasi sistem untuk mempertahankan efisiensi pabrik dalam penggunaan bahan baku.", programs: "i-Reactor (Intelligent Process Calculation & Prediction Collaborator) - Tahap III (P-2, dan P-1A)" },
      { strategy: "Transformasi digital pada kinerja proses dan alat dalam rangka operasional pabrik yang efisien dan ketepatan perencanaan maintenance", programs: "Implementasi Use Case Industry 4.0" },
      { strategy: "Peningkatan efisiensi proses produksi ammonia, urea, utility dengan adanya early warning deviasi proses, seringas dapat segera dilakukan action plan sesuai proposed task.", programs: "Daily Energy Consumption Prognosis System (iPredict) Enhancement" },
    ],
  },
  {
    id: "sg-prd-12",
    code: "PRD-12",
    division: "Bidang Produksi",
    title: "Mempertahankan Peringkat Emas Proper Daerah & Nasional",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Mematuhi PermenLHK No. 17 Tahun 2019 tentang baku mutu emisi bagi usaha dan/atau kegiatan industri pupuk dan industri amonium nitrat", programs: "Kajian Penambahan FGD (Fluidized Gas Desulfurizer) di Unit Boiler Batubara untuk Menurunkan Emisi Sulfur" },
    ],
  },
  {
    id: "sg-prd-13",
    code: "PRD-13",
    division: "Bidang Produksi",
    title: "Mempertahankan dan meningkatkan reputasi Perusahaan di bidang K3 baik melalui sertifikasi ataupun penghargaan nasional maupun internasional.",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Mengikuti international conference terkait dengan best practice K3.\nMelaksanakan benchmark & workshop", programs: "- Mengikuti international conference K3 secara regular minimal 1x/tahun.\n- Melaksanakan benchmark ke multinational company dan atau national company dengan penerapan K3 prima (Perusahaan bidang petrochemical/oil gas/chemical manufacture) minimal 1x/tahun." },
    ],
  },
  {
    id: "sg-prd-14",
    code: "PRD-14",
    division: "Bidang Produksi",
    title: "Meminimalkan terjadinya kerugian (loss prevention) yang disebabkan karena “process safety”. Pencapaian kriteria process safety excellence. LTIFR (Lost Time Injury Frequency Rate) 5yrs = 0",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Menerapkan PSM sesuai standar OSHA 1910.119/3133", programs: "- Penyusunan Checklist Audit Internal Process Safety per Element dan per Sub Area Process\n- Pelaksanaan Audit internal per Element dan per sub area process Per 2 Tahun\n- Improvement Detection System dan Pemasangan Fixed Gas Detector Area Ammonia Loading Arm & Methanol Storage Tank\n- Improvement Fire alarm system & fire suppression system area perkantoran dan pembaruan fire protection system equipment & vehicle (water tender, PPE for fire fighter, fire extinguisher, etc)\n- Pendampingan konsultan terkait PSM excellence\n- Pelaksanaan studi LOPA/SIL/Risk Graph tiap pabrik\n- Kajian Risiko Proses proyek sesuai dengan berjalan.\n- Pelatihan sertifikasi dan non sertifikasi terkait process safety dari internationally recognized provider\n- Melakukan Emergency Response Drill Loss of Containment" },
    ],
  },
  {
    id: "sg-prd-15",
    code: "PRD-15",
    division: "Bidang Produksi",
    title: "Mencegah terjadinya Occupational Disease at workplace oleh tenaga kerja baik TKO, TKNO dan non organik/ kontraktor",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Meningkatkan budaya K3 perusahaan dan pekerja dari level dependent ke arah level independent & interindependent safety culture sebagai bentuk reputasi world class company", programs: "- Chronic Disease Management Programme (CDMP) merupakan program pendampingan follow up hasil MCU karyawan.\n- Pelatihan sertifikasi dan non sertifikasi terkait bidang K3\n- Pelatihan basic safety karyawan TKNO per 3 tahun\n- Pelatihan intermediate/advance safety bagi TKO dan TKNO\n- Pelaksanaan awareness, refreshment dan training K3 termasuk bidang process safety bagi karyawan TKO dan TKNO terutama di bawah Direktorat Operasi\n- Aplikasi CSMS online\n- Pengukuran Lingker dan evaluasi lingker.\n- Pelaksanaan dan pelaporan HRA area proses\n- Peningkatan dan pemanfaatan Teknologi untuk penerapan K3" },
    ],
  },
  {
    id: "sg-prd-16",
    code: "PRD-16",
    division: "Bidang Produksi",
    title: "Mempertahankan peringkat Emas Proper Daerah dan Nasional",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Melakukan upaya-upaya 3R & Pengolahan Limbah", programs: "- Pemanfaatan Limbah Faba untuk kegiatan stabilisasi tanah kapling 4 dan 5\n- Modifikasi Emergency Pond A & B" },
    ],
  },
  {
    id: "sg-prd-17",
    code: "PRD-17",
    division: "Bidang Produksi",
    title: "Mengoptimalkan sumber daya di Laboratorium dengan meningkatkan efektifitas dan efisiensi pelayanan internal dan eksternal sehingga seluruh permintaan analisis laboratorium dapat terpenuhi sebesar 100%",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Melakukan pemutakhiran metode uji", programs: "Melakukan pembelian standar metode termutakhir (SNI, ASTM, AOAC, JIS, USEPA, dll)" },
      { strategy: "Melakukan pemutakhiran instrumen Analisa", programs: "Melakukan investasi peralatan instrumentasi laboratorium" },
      { strategy: "Melakukan peningkatan kompetensi personil laboratorium", programs: "- Mengikuti pelatihan serta sertifikasi\n- Melakukan benchmark, ke laboratorium yang memiliki standar nasional/internasional\n- Mengikuti seminar nasional/internasional, dan bergabung dalam asosiasi laboratorium." },
      { strategy: "Optimasi dan otomatisasi peralatan pengujian/kalibrasi laboratorium", programs: "- Pemutakhiran software dan hardware instrumen analisa laboratorium\n- Berkolaborasi dengan pihak TI dalam menyusun road map digitalisasi di Laboratorium\n- Integrasi Quality Assurance Laboratorium dengan aplikasi SIMALA" },
      { strategy: "Meningkatkan pendapatan jasa analisa, kalibrasi, dan bahan acuan ke pelanggan eksternal", programs: "Meningkatkan promosi dan menjalin relasi kepada pelanggan" },
    ],
  },
  {
    id: "sg-prd-18",
    code: "PRD-18",
    division: "Bidang Produksi",
    title: "Mempertahankan Sertifikasi SNI Produk untuk Pupuk Urea, Pupuk NPK, dan Amoniak untuk meningkatkan daya/nilai jual dan meningkatkan kepuasan pelanggan",
    target: "FY26",
    owner: "Bidang Produksi",
    strategies: [
      { strategy: "Mengimplementasikan ISO 17025:2017", programs: "Melakukan penambahan ruang lingkup akreditasi Analisa Hg dan Arsen di Pupuk NPK, Kalibrasi Flowmeter" },
      { strategy: "Mempertahankan registrasi Laboratorium Lingkungan dalam rangka pencapaian PROPER Nasional/ Daerah peringkat Emas", programs: "Melakukan penambahan ruang lingkup akreditasi Analisa Free Chlorine, DO pada air limbah" },
    ],
  },
  {
    id: "sg-pgd-01",
    code: "PGD-01",
    division: "Bidang Pengadaan",
    title: "Memastikan ketersediaan stock barang dalam kondisi prima",
    target: "FY26",
    owner: "Bidang Pengadaan",
    strategies: [
      { strategy: "Peningkatan bertahap logistik internal PI Group hingga 50% dan digitalisasi logistik", programs: "- Implementasi program Stock Holding Policy (SHP) sesuai roadmap PI\n- Melakukan program re-cataloging sesuai pedoman dan target Pupuk Indonesia\n- Digitalisasi pencatatan barang keluar-masuk melalui aplikasi sesuai roadmap PI\n- Menambah kapasitas cool room di Gudang Spareparts (Gudang 1)\n- Menambah sistem drainase di sekeliling Gudang Bahan Baku dan perbaikan saluran outfall (pembuangan air hujan ke laut)\n- Penambahan Rak Material dan Rak Pipa untuk Gudang Sparepart (Gudang 1 dan 2) dan Gudang Receiving" },
    ],
  },
  {
    id: "sg-pgd-02",
    code: "PGD-02",
    division: "Bidang Pengadaan",
    title: "Memastikan jaminaan pasokan bahan baku kunci",
    target: "FY26",
    owner: "Bidang Pengadaan",
    strategies: [
      { strategy: "Pemenuhan kontrak gas proyek pengembangan", programs: "Melakukan MoU/HoA serta Persiapan PJBG untuk rencana pengembangan Soda Ash dan NPK-3." },
    ],
  },
  {
    id: "sg-pgd-03",
    code: "PGD-03",
    division: "Bidang Pengadaan",
    title: "Menjamin kelancaran ketersediaan bahan baku pupuk NPK melalui koordinasi dengan PT Pupuk Indonesia (Persero).",
    target: "FY26",
    owner: "Bidang Pengadaan",
    strategies: [
      { strategy: "Skema pasokan bahan baku Phosphate dan Kalium handal & kompetitif", programs: "- Mengusulkan kepada PI terkait perencanaan kombinasi Long Term Contract (LTC) dan Spot purchase untuk pengadaan bahan baku NPK\n- Mengusulkan kepada PI terkait combine shipment dengan tetap mempertimbangkan kebutuhan dan kapasitas gudang Anper\n- Koordinasi dengan Melakukan program re-cataloging sesuai pedoman dan target Pupuk Indonesia\n- Koordinasi dengan Departemen PPE & Departemen Operasi untuk menentukan spesifikasi teknis yang paling sesuai dengan jenis NPK yang akan diproduksi." },
      { strategy: "Skema pasokan bahan baku lokal terjamin kontinuitasnya", programs: "- Mengusulkan kepada PI terkait multi winner dengan vendor yang telah terbukti memiliki performa baik dan telah dilakukan due diligence\n- Menambah frekuensi mutasi kapal bahan baku dari Surabaya ke Bontang dan memastikan kelayakan kapal mutasi dalam kondisi prima" },
    ],
  },
  {
    id: "sg-pgd-04",
    code: "PGD-04",
    division: "Bidang Pengadaan",
    title: "Menjamin kelancaran ketersediaan batubara",
    target: "FY26",
    owner: "Bidang Pengadaan",
    strategies: [
      { strategy: "Review kebijakan internal terkait dengan pengadaan batubara", programs: "Melakukan due diligance terhadap sumber batubara terdekat yang ada di wilayah Kaltim" },
    ],
  },
  {
    id: "sg-pgd-05",
    code: "PGD-05",
    division: "Bidang Pengadaan",
    title: "Meningkatkan tingkat kepatuhan TKDN pada pengadaan barang dan jasa sesuai regulasi pemerintah.",
    target: "FY26",
    owner: "Bidang Pengadaan",
    strategies: [
      { strategy: "Peningkatan kepatuhan TKDN melalui pendampingan dan verifikasi oleh konsultan tersertifikasi.", programs: "Jasa Konsultasi TKDN untuk Proyek Strategis 2026." },
    ],
  },
  {
    id: "sg-pgd-06",
    code: "PGD-06",
    division: "Bidang Pengadaan",
    title: "Meningkatkan efektivitas dan kepastian hukum kontrak strategis melalui penyusunan kontrak berbasis formula yang akuntabel.",
    target: "FY26",
    owner: "Bidang Pengadaan",
    strategies: [
      { strategy: "Penguatan kontrak jangka panjang berbasis price adjustment formula.", programs: "Jasa Konsultasi Penyusunan dan Perumusan Formula Harga dalam Kontrak Jangka Panjang." },
    ],
  },
  {
    id: "sg-pmd-01",
    code: "PMD-01",
    division: "Bidang Pemasaran dan Distribusi",
    title: "Optimalisasi stok produk",
    target: "FY26",
    owner: "Bidang Pemasaran dan Distribusi",
    strategies: [
      { strategy: "Optimalisasi stok produk", programs: "Menyalurkan dan meningkatkan penjualan stok produk sesuai target dengan pengelolaan saldo akhir yang optimal." },
    ],
  },
  {
    id: "sg-pmd-02",
    code: "PMD-02",
    division: "Bidang Pemasaran dan Distribusi",
    title: "Tercapai Target Luas Lahan Program Agrosolution sesuai target RKAP 2026",
    target: "FY26",
    owner: "Bidang Pemasaran dan Distribusi",
    strategies: [
      { strategy: "Akuisisi Lahan Program Agrosolution Tahun 2026", programs: "- Farmers Meeting dan Kunjungan Mitra Integrator\n- Tanam Perdana/ Panen Bersama Agrosolution\n- Evaluasi Kinerja Mitra Integrator Agrosolution Tahun 2026 (EMIT)\n- Farmers Meeting Berhadiah\n- Program Reward Key Farmers\n- Profiling data iFarms, verifikasi dan jasa administrasi analisis usaha tani bersama PPL & Key Farmers\n- Penetrasi Pengembangan Program Agrosolution di Wilayah Baru." },
    ],
  },
  {
    id: "sg-pmd-03",
    code: "PMD-03",
    division: "Bidang Pemasaran dan Distribusi",
    title: "Tercapai target Penjualan Produk Spesifik sesuai RKAP 2026",
    target: "FY26",
    owner: "Bidang Pemasaran dan Distribusi",
    strategies: [
      { strategy: "SPJB Distributor Eksklusif & Mitra Integrator Agosolution 2026", programs: "- Penandatanganan SPJB 2026\n- Rewarding akhir tahun atas pencapaian target 2026" },
      { strategy: "Meningkatkan Penjualan NPK Komersil", programs: "- Promosi Periodik dan Tematik untuk Customer\n- Promo langsung ke Petani\n- Demplot Produk Non Sentralisasi\n- Program loyalty NPK pelangi Jos 2026" },
    ],
  },
  {
    id: "sg-trb-01",
    code: "TRB-01",
    division: "Bidang Transformasi Bisnis",
    title: "Peningkatan kinerja Perusahaan yang didukung oleh proses bisnis yang efektif dan efisien.",
    target: "FY26",
    owner: "Bidang Transformasi Bisnis",
    strategies: [
      { strategy: "Membangun arsitektur proses bisnis perusahaan yang terintegrasi melalui penyusunan peta proses bisnis lintas fungsi.", programs: "- Melakukan pemetaan proses bisnis eksisting (as-is) dengan melibatkan Subject Matter Expert (SME) dari masing-masing unit kerja.\n- Menyusun pemodelan proses bisnis eksisting dan melakukan analisis untuk mengidentifikasi duplikasi aktivitas, tumpang tindih proses, serta potensi inefisiensi.\n- Melakukan penyelarasan proses bisnis dengan Business Owner serta menetapkan peran dan tanggung jawab melalui penyusunan RACI Matrix." },
    ],
  },
  {
    id: "sg-trb-02",
    code: "TRB-02",
    division: "Bidang Transformasi Bisnis",
    title: "Meningkatkan efektivitas dan efisiensi implementasi Sistem Manajemen berbasis ISO dan Non-ISO sesuai kebutuhan Perusahaan",
    target: "FY26",
    owner: "Bidang Transformasi Bisnis",
    strategies: [
      { strategy: "Melakukan evaluasi efektivitas dan efisiensi implementasi Sistem Manajemen berbasis ISO dan Non-ISO", programs: "- Implementasi mekanisme baru dalam pelaksanaan audit sistem manajemen, meliputi perbaikan pada timeline dan rencana audit serta proses audit dengan menggunakan aplikasi PKT Master\n- Menerapkan Integrated Management System (IMS)" },
    ],
  },
  {
    id: "sg-trb-03",
    code: "TRB-03",
    division: "Bidang Transformasi Bisnis",
    title: "Kontribusi inovasi melaui replikasi inovasi unggulan dari penerapan Manajemen Inovasi Pupuk Kaltim untuk penerapan inovasi di lingkungan Pupuk Indonesia Group",
    target: "FY26",
    owner: "Bidang Transformasi Bisnis",
    strategies: [
      { strategy: "Menyiapkan mekanisme pemetaan inovasi unggulan yg dapat direplikasi di Lingkungan PI Group", programs: "- Evaluasi mekanisme manajemen inovasi melalui pemetaan inovasi yang berpotensi untuk di replikasikan di PI Group.\n- Menyiapkan kepengurusan Hak Cipta/Paten terhadap inovasi unggulan yang berpotensi di replikasi di PI Group.\n- Menyusun skema reward khusus untuk inovasi unggulan yang berhasil di replikasikan di PI Group" },
    ],
  },
  {
    id: "sg-inv-01",
    code: "INV-01",
    division: "Bidang Investasi",
    title: "Merencanakan kapasitas yang dibutuhkan untuk memenuhi proyeksi peningkatan penjualan sesuai dengan target market segmen NPK",
    target: "FY26",
    owner: "Bidang Investasi",
    strategies: [
      { strategy: "Persiapan pengembangan pabrik NPK Nitrat", programs: "- Kajian teknologi pabrik\n- Kajian pasar NPK basis nitrat\n- Persiapan Premarketing NPK Nitrat" },
    ],
  },
  {
    id: "sg-inv-02",
    code: "INV-02",
    division: "Bidang Investasi",
    title: "- Merencanakan kapasitas yang dibutuhkan untuk memenuhi proyeksi peningkatan penjualan\n- Mengkonsiderasi cost-benefit terkait CAPEX untuk asset baru",
    target: "FY26",
    owner: "Bidang Investasi",
    strategies: [
      { strategy: "Membuat kajian Pembangunan Pabrik Ammonia - Urea Papua Barat", programs: "- Kajian Feasibility Study proyek pembangunan Pabrik Ammonia-Urea Papua Barat\n- Studi Teknis Alternatif Lokasi\n- Pemilihan licensor dan penyusunan BED Pabrik Ammonia & Urea" },
    ],
  },
  {
    id: "sg-inv-03",
    code: "INV-03",
    division: "Bidang Investasi",
    title: "- Peningkatan revenue Perusahaan melalui program Pengembangan\n- Mengkonsiderasi cost-benefit terkait CAPEX untuk asset baru",
    target: "FY26",
    owner: "Bidang Investasi",
    strategies: [
      { strategy: "Kajian New Produk dan Ekspansi Pabrik", programs: "- Kajian FS New Produk dan Ekspansi Pabrik\n- Penyusunan FS Blue Ammonia melalui CCS bersama Chevron\n- Update studi pengembangan Pink Ammonia\n- Kajian Pabrik Methanol" },
      { strategy: "Kajian pengembangan infrastruktur (penyiapan lahan/dermaga, dll.)", programs: "Kajian cost & benefit/FS pengembangan infrastruktur (penyiapan lahan/dermaga, dll.)" },
      { strategy: "Pelaksanaan Proyek Revamping Ammonia P-2", programs: "Plant acceptance proyek" },
      { strategy: "Pelaksanaan Proyek Soda Ash", programs: "Pelaksanaan Soda Ash PKT\nEPC A: 38,49%;\nEPC B: 26,58%;\nEPC C (Infrastruktur): 3,00%" },
    ],
  },
  {
    id: "sg-inv-04",
    code: "INV-04",
    division: "Bidang Investasi",
    title: "Peningkatan revenue Perusahaan melalui penjualan aset",
    target: "FY26",
    owner: "Bidang Investasi",
    strategies: [
      { strategy: "Kajian Appraisal Dismantling Pabrik", programs: "Penyusunan Kajian Appraisal Dismantling Pabrik Ammonia Kaltim 1" },
    ],
  },
  {
    id: "sg-inv-05",
    code: "INV-05",
    division: "Bidang Investasi",
    title: "Penguatan Operating Model Sub Holding & Kluster",
    target: "FY26",
    owner: "Bidang Investasi",
    strategies: [
      { strategy: "Penyelarasan Portofolio Perusahaan", programs: "1. Divestasi Saham PT Kalimantan Agro Nusantara (Kalianusa)\n   - Penyelesaian seluruh aktivitas (kajian-kajian pendukung) dan permohonan persetujuan aksi korporasi atas rencana divestasi saham PT Kalianusa\n   - Transaksi Jual Beli Saham dan penandatanganan akta jual beli\n2. Likuidasi PT Pupuk Agro Nusantara (PAN)\n   - Penyelesaian seluruh aktivitas (kajian-kajian pendukung) dan persetujuan aksi korporasi terkait likuidasi PT PAN\n   - RUPSLB PAN Persetujuan Likuidasi Perusahaan dan Penunjukan Likuidator\n3. Merger PT Kaltim Industrial Estate (KIE) dengan PT Kawasan Industri Kujang Cikampek (KIKC)\n   - Penyelesaian seluruh aktivitas (kajian-kajian pendukung) dan permohonan persetujuan aksi korporasi atas rencana merger KIE - KIKC\n   - RUPSLB KIE tentang Penggabungan KIE – KIKC\n4. Merger PT Pupuk Indonesia Utilitas (PIU) dengan PT Kaltim Daya Mandiri (KDM)\n   - Penyelesaian seluruh aktivitas (kajian-kajian pendukung) dan permohonan persetujuan aksi korporasi atas rencana merger PIU - KDM\n   - RUPSLB PIU tentang Penggabungan PIU – KDM\n5. Penyelesaian Aksi Korporasi Divestasi/ Likuidasi Cucu Perusahaan PKT (Anak Perusahaan PT Kaltim Industrial Estate)\n   - Divestasi Saham PT Kaltim Jasa Sekuriti\n   - Divestasi Saham PT Hotel Bintang Sintuk\n   - Divestasi Saham PT Kaltim Medika Utama\n   - Likuidasi PT Prakarsa Nusa Sinergi\n   - Merger PT Kaltim Daya Mandiri – PT Pupuk Indonesia Utilitas" },
    ],
  },
  {
    id: "sg-inv-06",
    code: "INV-06",
    division: "Bidang Investasi",
    title: "Meningkatkan cost efficiency utilitas untuk memastikan harga utilitas yang kompetitif",
    target: "FY26",
    owner: "Bidang Investasi",
    strategies: [
      { strategy: "Peningkatan utilisasi kapasitas produksi (listrik) KDM sesuai rencana kebutuhan eksisting dan rencana pengembangan", programs: "Menyusun skema pasokan listrik yang handal dan kompetitif dengan membandingkan HPP listrik pembangkit internal PKT" },
    ],
  },
  {
    id: "sg-lit-01",
    code: "LIT-01",
    division: "Bidang Penelitian dan Pengembangan",
    title: "Pengembangan rintisan teknologi riset yang selaras dan impikatif",
    target: "FY26",
    owner: "Bidang Penelitian dan Pengembangan",
    strategies: [
      { strategy: "Penyusunan Kajian Amonium Klorida bahan baku NPK", programs: "- Penelitian penggunaan Amonium Klorida sebagai pengganti urea\n- Pengujian Amonium Klorida fokus pada NPK subsidi untuk tanaman pangan" },
      { strategy: "Peningkatan Efisiensi dan Optimalisasi Pabrik", programs: "- Integrasi proses bisnis riset dengan Sistem Manajemen Produksi (SIMPRO)\n- Gatekeeping usulan & pelaksanaan riset" },
      { strategy: "Pengujian Katalis HTS LTS", programs: "Implementasi riset dan inovasi di bidang pengujian katalis HTS LTS" },
      { strategy: "Riset Industrial Chemicals", programs: "- Kajian Hybrid Green Ammonia berbasis PLTS\n- Pengembangan Produk Unggulan Specialty" },
      { strategy: "Uji Performa Urea Coating Mikroba", programs: "Pelaksanaan Uji Performa Urea Coating Mikroba pada berbagai komoditas tanaman" },
      { strategy: "Implementasi Program AgTech PI Group", programs: "Mendukung pelaksanaan kegiatan mapping dan deployment menggunakan teknologi PreciPalm sesuai penugasan IARI." },
    ],
  },
  {
    id: "sg-lit-02",
    code: "LIT-02",
    division: "Bidang Penelitian dan Pengembangan",
    title: "Mengamankan supply renewable energy dengan harga kompetitif berdasarkan analisis dan identifikasi potensi sumber dan harga renewable energy di Indonesia.",
    target: "FY26",
    owner: "Bidang Penelitian dan Pengembangan",
    strategies: [
      { strategy: "Penjajakan partnership dengan renewable energy technology provider untuk clean ammonia.", programs: "Patnership dengan renewable energy technology provider untuk clean Ammonia yaitu MOU integrasi dengan ACWA power PLTS & PLTB." },
    ],
  },
  {
    id: "sg-tif-01",
    code: "TIF-01",
    division: "Bidang Teknologi Informasi",
    title: "Regenerasi Perangkat Kemanan Jaringan (Firewall) 100%.",
    target: "FY26",
    owner: "Bidang Teknologi Informasi",
    strategies: [
      { strategy: "Penguatan kapabilitas infrastruktur dan keamanan informasi perusahaan", programs: "Regenerasi Perangkat Kemanan Jaringan (Firewall)" },
    ],
  },
  {
    id: "sg-sdm-01",
    code: "SDM-01",
    division: "Bidang SDM",
    title: "Menciptakan organisasi yang efektif dan efisien selaras dengan transformasi bisnis",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "- Tersedianya Struktur Organisasi berdasarkan hasil Business Process Improvement, yang disesuaikan dengan blueprint proses bisnis perusahaan\n- Analisa Kebutuhan Karyawan untuk mendukung Struktur Organisasi", programs: "- Melakukan restrukturisasi organisasi berdasarkan hasil Business Process Improvement, yang disesuaikan dengan blueprint proses bisnis perusahaan\n- Menyusun dan menetapkan usulan manpower planning yang optimal untuk mendukung transformasi bisnis perusahaan" },
    ],
  },
  {
    id: "sg-sdm-02",
    code: "SDM-02",
    division: "Bidang SDM",
    title: "Performance Acceleration Through Professional Coaching",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "- Menyelenggarakan program pendampingan profesional untuk karyawan dengan special assignments sehingga dapat terutilisasi di unit kerja secara optimal\n- Mendukung implementasi Roadmap Human Experience Management dan membangun Performance-Driven Culture.\n- Meningkatkan motivasi, disiplin, dan kinerja karyawan terdampak PIP.", programs: "Melakukan pendampingan dan bimbingan profesional kepada karyawan dengan special assignments dalam program Performance Improvement Plan (PIP)" },
    ],
  },
  {
    id: "sg-sdm-03",
    code: "SDM-03",
    division: "Bidang SDM",
    title: "Meningkatkan kapabilitas karyawan melalui program pengelolaan pengetahuan",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "Pengelolaan mekanisme penyusunan konten pengetahuan serta pemerataan penggunaan aset pengetahuan untuk Seluruh Insan Pupuk Kaltim", programs: "- Penerbitan buku pengetahuan Core Business Process & Critical Knowledge PKT\n- Pembuatan dan publikasi konten digital aset pengetahuan\n- Upgrading pelaksanaan kegiatan NEXTGEN melalui kegiatan Sharing Knowledge, COP, COI serta pemberian reward sesuai target yang telah ditetapkan\n- Optimalisasi Pengelolaan Perpustakaan PKT\n- Pemanfaatan platform dan kolaborasi dengan MIT-Industrial Liaison Program yang dapat diakses setiap waktu untuk peningkatan kapabilitas, dan kompetensi karyawan PKT dengan target penerapan hasil pembelajaran dalam program internal knowledge sharing." },
    ],
  },
  {
    id: "sg-sdm-04",
    code: "SDM-04",
    division: "Bidang SDM",
    title: "Meningkatkan kapabilitas dan kesiapan kepemimpinan internal",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "Leadership Development Program untuk BOD-4 dan BOD-5", programs: "- Memetakan TNA untuk BOD-4 dan BOD-5\n- Menunjuk fasilitator internal/eksternal yang kompeten\n- Melaksanakan pelatihan secara blended learning (online & offline)\n- Melakukan evaluasi efektivitas pelatihan" },
    ],
  },
  {
    id: "sg-sdm-05",
    code: "SDM-05",
    division: "Bidang SDM",
    title: "Meningkatakan kapabilitas karyawan fungsi core process internal perusahaan",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "Mengembangkan strategi pengembangan kompetensi karyawan", programs: "- Menyusun kurikulum pengembangan kompetensi karyawan dan penyelesaian kurikulum ODP/PEDP Intermediate, Advance, dan Advance Plus\n- Internalisasi Kompetensi Perilaku & Kompetensi Teknis sesuai Pedoman PT Pupuk Indonesia (Persero)" },
    ],
  },
  {
    id: "sg-sdm-06",
    code: "SDM-06",
    division: "Bidang SDM",
    title: "Sertifikasi Kompetensi Karyawan, Khususnya bidang operator dan pemeliharaan pabrik",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "- Meningkatkan jumlah karyawan tersertifikasi sesuai standar kompetensi nasional\n- Menyusun dan menerapkan roadmap sertifikasi berbasis kebutuhan unit kerja\n- Menyelenggarakan pelatihan berbasis SKKNI dan kebutuhan organisasi\n- Evaluasi dampak sertifikasi terhadap kinerja", programs: "- Menyusun infrastruktur untuk menjalankan uji kompetensi sesuai standar.\n- Pengembangan Kurikulum Pelatihan Terintegrasi untuk karyawan.\n- Sertifikasi Kompetensi Kerja Karyawan agar berstandar." },
    ],
  },
  {
    id: "sg-sdm-07",
    code: "SDM-07",
    division: "Bidang SDM",
    title: "Pengembangan Kompetensi Karyawan agar Menjadi Sumber Daya Yang Berkualitas Tinggi dan Meningkatkan kinerja perusahaan dengan memastikan pemenuhan kompetensi teknis karyawan",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "- Alignment KPI Korporat, KPI Unit Kerja dan KPI Individu\n- Penguatan program Coaching (Leader as a Coach)", programs: "- Program workshop untuk Sinkronisasi target bersama Tim KPI Korporat, KPI Manajemen dan KPI Unit Kerja dan Penguatan budaya Coaching & Mentoring untuk peningkatan kinerja karyawan\n- Program gamifikasi penguatan budaya Coaching & Mentoring" },
    ],
  },
  {
    id: "sg-sdm-08",
    code: "SDM-08",
    division: "Bidang SDM",
    title: "Mengimplementasikan program penguatan budaya inovasi, kolaborasi dan kinerja tinggi di seluruh unit kerja",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "Culture Transformation Program", programs: "- Melakukan sosialisasi & internalisasi nilai budaya melalui webinar, townhall, dan media internal\n- Menunjuk dan melatih change agent di setiap unit kerja\n- Mengembangkan sistem reward & recognition untuk perilaku inovatif dan kolaboratif\n- Melakukan survei budaya organisasi secara berkala" },
    ],
  },
  {
    id: "sg-sdm-09",
    code: "SDM-09",
    division: "Bidang SDM",
    title: "Asesmen Potensi Karyawan",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "- Menjalankan program asesmen dan development utk total 1.056 karyawan (Grade 1–7)\n- Mengembangkan RJP menjadi lebih kompetitif & mengakuisisi world-class talent\n- Memperkuat capaian bisnis melalui peningkatan leadership di seluruh layer.", programs: "Assessment Grade 1 s.d. 7" },
      { strategy: "- Mendukung implementasi RJP dalam pengembangan world class talent.\n- Meningkatkan kesiapan karyawan dalam proses promosi, rotasi, dan pengembangan jabatan melalui asesmen berbasis kompetensi.", programs: "Pembekalan Asesmen" },
    ],
  },
  {
    id: "sg-sdm-10",
    code: "SDM-10",
    division: "Bidang SDM",
    title: "Menyelenggarakan proses seleksi BoD-1 dan BoD-2 secara objektif dan adil",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "Fit & Proper Test", programs: "Operasional Fit & Proper Test" },
    ],
  },
  {
    id: "sg-sdm-11",
    code: "SDM-11",
    division: "Bidang SDM",
    title: "Performance Acceleration Through Professional Coaching",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "- Menyelenggarakan program pendampingan profesional untuk karyawan dengan special assignments sehingga dapat terutilisasi di unit kerja secara optimal\n- Mendukung implementasi Roadmap Human Experience Management dan membangun performance-driven culture.\n- Meningkatkan motivasi, disiplin, dan kinerja karyawan terdampak PIP.", programs: "Melakukan pendampingan dan bimbingan profesional kepada karyawan dengan special assignments dalam program Performance Improvement Plan (PIP)" },
    ],
  },
  {
    id: "sg-sdm-12",
    code: "SDM-12",
    division: "Bidang SDM",
    title: "Employee Assistance Program",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "- Memberikan dukungan psikologis kepada karyawan per tahun.\n- Menurunkan tingkat absensi terkait masalah kesehatan mental.\n- Meningkatkan produktivitas individu dan tim melalui dukungan psikologis.", programs: "Dedicated psychologist" },
      { strategy: "- Meningkatkan literasi psikologis karyawan dan pasangan melalui pendekatan yang interaktif dan edukatif.\n- Meningkatkan partisipasi karyawan dalam program EAP.\n- Memperkuat budaya organisasi yang peduli terhadap kesehatan mental.", programs: "Offline Counseling Week: \"Mental Health Awareness & Support Week\"" },
      { strategy: "- Meningkatkan Literasi Kesehatan Mental\n- Membangun Budaya Organisasi yang Psikologis Aman (Psychological Safety)\n- Meningkatkan Kesejahteraan Psikologis (Psychological Wellbeing) Karyawan", programs: "Webinar/seminar EAP" },
      { strategy: "- Meningkatkan literasi psikologis karyawan dan pasangan melalui pendekatan yang menyenangkan dan interaktif.\n- Meningkatkan partisipasi karyawan dalam program EAP.\n- Memperkuat budaya organisasi yang peduli terhadap kesehatan mental.", programs: "Booth EAP" },
      { strategy: "- Meningkatkan kompetensi kepemimpinan calon pemimpin dalam mendukung kesehatan mental tim.\n- Mewujudkan budaya kerja yang peduli dan suportif melalui keterampilan PFA.\n- Mengintegrasikan PFA dalam strategi Human Experience Management perusahaan.", programs: "Training Psychological First Aid MHA" },
      { strategy: "- Implementasi Roadmap Human Experience Management: Meningkatkan kompetensi kepemimpinan dalam mendukung kesehatan mental tim.\n- Mengembangkan dan mengakuisisi world-class talent: Membangun budaya kerja yang peduli dan suportif melalui keterampilan PFA.", programs: "Training Psychological First Aid for Excecutive Band 1 & 2" },
    ],
  },
  {
    id: "sg-sdm-13",
    code: "SDM-13",
    division: "Bidang SDM",
    title: "Mengembangkan dan mengakuisisi world class talent untuk mendukung Corporate Long Term Plan dan keberlanjutan kepemimpinan",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "Talent Development Program (TDP) 2026", programs: "Menyelenggarakan development program bagi karyawan yang ditetapkan sebagai talent shortlist sebagai upaya retensi dan peningkatan kompetensi yang berdaya saing global" },
    ],
  },
  {
    id: "sg-sdm-14",
    code: "SDM-14",
    division: "Bidang SDM",
    title: "Pemenuhan Karyawan Core Business Melalui Program Rekrutmen Karyawan Baru",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "- Memberikan pengalaman onboarding yang positif dan profesional bagi seluruh karyawan baru.\n- Meningkatkan engagement dan sense of belonging sejak hari pertama kerja.\n- Mendukung employer branding sebagai perusahaan yang people-centric dan profesional.", programs: "Operasional Onboarding Karyawan Baru" },
    ],
  },
  {
    id: "sg-sdm-15",
    code: "SDM-15",
    division: "Bidang SDM",
    title: "Meningkatkan kesejahteraan karyawan dalam mendukung pelaksanaan tugas Perusahaan.",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "Memberikan fasilitas rumah bagi karyawan", programs: "Program Pemilikan Rumah Karyawan (PPRK)" },
    ],
  },
  {
    id: "sg-sdm-16",
    code: "SDM-16",
    division: "Bidang SDM",
    title: "- Penguatan kolaborasi Antar Perusahaan dalam Forum HRD PKT Group\n- Menyelaraskan dan menyinergikan kebijakan SDM dalam PKT Group\n- Pengembangan kapasitas komunikasi SDM untuk meningkatkan kompetensi komunikasi strategis para HRD di seluruh perusahaan PKT Group",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "- Pembentukan Forum HRD PKT Group yang terstruktur\n- Penyelarasan Kebijakan dan Prosedur SDM yang strategis di seluruh perusahaan PKT Group\n- Digitalisasi Komunikasi SDM Lintas Entitas\n- Penguatan Identitas dan Budaya Bersama Forum HRD PKT Group\n- Capacity Building dan Knowledge Sharing\n- Monitoring, Evaluasi, dan Perbaikan Berkelanjutan", programs: "- Penetapan Struktur, Penyusunan Surat Keputusan (SK) Pembentukan Forum HRD PKT Group, dan Agenda Kegiatan Tahunan Forum HRD PKT Group\n- Penyusunan penyelarasan kebijakan bersama lintas entitas Perusahaan\n- Workshop Nilai Budaya Perusahaan dan Budaya Kerja\n- Knowledge Sharing Sessioan perihal adanya perubahan peraturan ketenagakerjaan\n- Evaluasi Tahun terhadap Program Sinergi Forum HRD PKT Group" },
    ],
  },
  {
    id: "sg-sdm-17",
    code: "SDM-17",
    division: "Bidang SDM",
    title: "- Meningkatkan efektivitas fungsi LKS Bipartit sebagai wadah dialog sosial internal diperusahaan\n- Mendorong Harmonisasi Hubungan Industrial yang berkelanjutan dengan Serikat Pekerja\n- Meningkatkan kualitas penyelesaian masalah hubungan kerja secara internal\n- Mewujudkan transparansi informasi ketenagakerjaan antara Manajemen dan Pekerja\n- Mengintegrasikan Hasil Forum LKS Bipartit ke dalam Keputusan Strategis Perusahaan",
    target: "FY26",
    owner: "Bidang SDM",
    strategies: [
      { strategy: "- Revitalisasi Peran dan Fungsi LKS Bipartit\n- Penyusunan Agenda Tetap\n- Integritas aspirasi Pekerja ke dalam Kebijakan Perusahaan\n- Program Monitoring dan Evaluasi Kinerja Forum\n- Pembangunan Sistem Komunikasi Internal antara Perusahaan dan Serikat Pekerja\n- Peningkatan Kapasitas Anggota LKS", programs: "- Penyusunan SK Pembentukan Struktur Keanggotaan LKS Bipartit per 2 tahun\n- Penetapan Jadwal Rutin tiap Bulan dan Penentuan Topik-Topik terkait Hubungan Kerja, Kesejahteraan, Produktivitas, dsb.\n- Integrasi hasil forum LKS Bipartit ke dalam bahan pertimbangan keputusan Manajemen\n- Menetapkan KPI Forum dan Survei Tahunan Efektivitas LKS Bipartit\n- Pengembangan dashboard atau folder digital khusus LKS Bipartit berisi Absensi, Dokumentasi, Notulen dan Kebijakan hasil Diskusi\n- Workshop peran LKS Bipartit dalam Hubungan Industrial" },
    ],
  },
  {
    id: "sg-mrh-01",
    code: "MRH-01",
    division: "Bidang Manajemen Risiko dan Hukum",
    title: "Meningkatkan Risk Maturity Index (RMI) dalam menciptakan budaya sadar risiko di PT Pupuk Kaltim.",
    target: "FY26",
    owner: "Bidang Manajemen Risiko dan Hukum",
    strategies: [
      { strategy: "Penguatan tata kelola risiko terintegrasi berdasarkan Peraturan Kementerian BUMN No PER-02/MBU/2023 perihal Pedoman Tata Kelola dan Kegiatan Korporasi dan Juknis turunannya, ISO 31000 serta peraturan yang berlaku", programs: "- Penyusunan dan pemutakhiran roadmap dan soft structure tata kelola risiko terintegrasi\n- Pengembangan infrastruktur tata kelola risiko terintegrasi, diantaranya Sistem Manajemen Risiko Terintegrasi dalam Pengelolaan Risiko Perusahaan, risk modelling dan Sistem Kajian Risiko\n- Internalisasi budaya risiko terintegrasi dalam pengelolaan risiko kepada seluruh Stakeholder Perusahaan serta peningkatan kompetensi dan kapabilitas Organ Pengelola Risiko\n- Pengelolaan Manajemen Risiko Terintegrasi (Risiko RJPP, RKAP, Risiko Utama, Risiko Operasional, Risiko Sistem Manajemen, Risiko Proyek, Risiko Anper & Afiliasi, Risiko ESG dan Risiko Individu)\n- Penguatan pengendalian internal (ICOFR, internal control testing)\n- Implementasi dan pemantauan penerapan komposit risiko\n- Pelaksanaan Asesmen Risk Maturity Index 2026 PI Group oleh Konsultan Eksternal dan menindaklanjuti rekomendasi Asesmen RMI tahun sebelumnya" },
      { strategy: "Penguatan implementasi resiliensi operasional dan keuangan Perusahaan", programs: "- Implementasi, internalisasi dan sertifikasi Business Continuity Management System (BCMS)\n- Pemutakhiran dan penyusunan Financial Contingency Plan" },
    ],
  },
  {
    id: "sg-mrh-02",
    code: "MRH-02",
    division: "Bidang Manajemen Risiko dan Hukum",
    title: "Mengamankan Kegiatan Bisnis Perusahaan dari Aspek Hukum Korporasi, Bisnis dan Pengembangan Usaha.",
    target: "FY26",
    owner: "Bidang Manajemen Risiko dan Hukum",
    strategies: [
      { strategy: "Melakukan pendampingan dari aspek hukum terhadap aksi korporasi Perusahaan dan Persiapan, pelaksanaan program dan/atau proyek strategis Perusahaan.", programs: "- Melakukan perubahan Anggaran Dasar dan pendampingan hukum untuk penyesuaian dokumen internal.\n- Standarisasi dan review dokumen perusahaan antara lain: a. Keputusan Pemegang Saham; b. keputusan/surat dewan komisaris; c. keputusan/surat direksi; d. perjanjian sesuai dengan ketentuan yang berlaku.\n- Pemberian legal advice dan legal opinion." },
    ],
  },
  {
    id: "sg-mrh-03",
    code: "MRH-03",
    division: "Bidang Manajemen Risiko dan Hukum",
    title: "Mengamankan Kegiatan Bisnis Perusahaan Dari Aspek Litigasi.",
    target: "FY26",
    owner: "Bidang Manajemen Risiko dan Hukum",
    strategies: [
      { strategy: "- Melakukan pendampingan dan pemberian advice dari aspek hukum terhadap permasalahan /sengketa hukum di luar penyedilikan/pengadilan.\n- Penanangan perkara hukum bidang penjualan, operasional produksi, pengadaan dan pengembangan proyek.", programs: "- Mendampingi dan mengevaluasi, serta berkoordinasi dengan unit kerja terkait persiapan yang dilakukan sehubungan dengan pemberian advice terhadap permasalahan hukum dan penanganan perkara.\n- Penanganan permasalahan hukum strategis dan/atau sengketa antar BUMN" },
    ],
  },
  {
    id: "sg-mrh-04",
    code: "MRH-04",
    division: "Bidang Manajemen Risiko dan Hukum",
    title: "Meningkatkan kapabilitas fungsi hukum dalam rangka perbaikan penerapan tata kelola perusahaan dan pengendalian risiko hukum, risiko kepatuhan dan risiko litigasi.",
    target: "FY26",
    owner: "Bidang Manajemen Risiko dan Hukum",
    strategies: [
      { strategy: "Meningkatan kapabilitas fungsi hukum melalui pelatihan maupun sertifikasi.", programs: "- Mengikuti program pelatihan dan sertifikasi yang berfokus pada peningkatan kompetensi di bidang tata kelola perusahaan serta aspek-aspek hukum yang terkait.\n- Mengikuti seminar dan/atau sosialisasi yang diselenggarakan oleh narasumber kredibel dari universitas terkemuka maupun firma hukum bereputasi tinggi sebagai upaya peningkatan pengetahuan dan pemahaman di bidang hukum dan tata kelola." },
    ],
  },
  {
    id: "sg-sek-01",
    code: "SEK-01",
    division: "Bidang Kesekretariatan",
    title: "Kegiatan perpanjangan sertifikat HGB",
    target: "FY26",
    owner: "Bidang Kesekretariatan",
    strategies: [
      { strategy: "Terbit Sertifikat Perpanjangan HGB 68:\n- HGB 05: Terbit Sertifikat Perpanjangan HGB\n- HGB 04: Selesai dilakukan proses pengukuran\n- HGB 81: Selesai dilakukan proses pengukuran\n- HGB 102: Proses tender dan permohonan perpanjangan Sertifikat HGB\n- HGB 106: Proses tender dan permohonan perpanjangan Sertifikat HGB\n- HGB 107: Proses tender dan permohonan perpanjangan Sertifikat HGB", programs: "- Melakukan monitoring Sertifikat HGB secara berkala dan pengurusan sertifikat minimal 3 tahun sebelum masa berakhirnya sertifikat\n- Identifikasi batas-batas lahan dan pemasangan peremajaan patok-patok batas tanah (bekerja sama dengan Unit Kerja terkait)\n- Kegiatan perpanjangan Sertifikat HGB dilakukan menggunakan teknologi pengukuran terbaru\n- Berkoordinasi dengan instansi terkait dalam rangka kelancaran proses perpanjangan Sertifikat HGB" },
    ],
  },
  {
    id: "sg-sek-02",
    code: "SEK-02",
    division: "Bidang Kesekretariatan",
    title: "Kegiatan Sertifikasi Laik Fungsi Pabrik",
    target: "FY26",
    owner: "Bidang Kesekretariatan",
    strategies: [
      { strategy: "Mendapatkan Sertifikat Laik Fungsi:\n- Pabrik 6 Boiler Batu Barat\n- Pabrik 6 Gudang\n- Pabrik 3 Amoniak\n- Pabrik 3 Urea\n- Pabrik 4 Urea", programs: "- Melakukan koordinasi dan monitoring terkait Peralatan Pabrik yang ada di Perusahaan\n- Bekerjasama dengan konsultan pemeriksa\n- Identifikasi & Pemeriksaan peralatan pabrik yang akan dilakukan sertifikasi atau pemeriksaan kesesuaian standar\n- Kegiatan pengujian\n- Berkoordinasi dengan lembaga/instansi penguji terkait dalam rangka Sertifikasi Laik Fungsi" },
    ],
  },
  {
    id: "sg-sek-03",
    code: "SEK-03",
    division: "Bidang Kesekretariatan",
    title: "Penyelesaian Perizinan PBG dan izin lainnya",
    target: "FY26",
    owner: "Bidang Kesekretariatan",
    strategies: [
      { strategy: "Kegiatan Perizinan Proyek Pengembangan Perusahaan", programs: "- Melakukan persiapan dokumen persyaratan, anggaran dan penyusunan jadwal\n- Melakukan koordinasi dengan internal dan eksternal\n- Bekerjasama dengan instansi terkait\n- Kegiatan pengurusan periznan\n- Berkoordinasi dengan lembaga/instansi terkait" },
    ],
  },
  {
    id: "sg-sek-04",
    code: "SEK-04",
    division: "Bidang Kesekretariatan",
    title: "Dokumen Perusahaan Terkelola dengan Baik sesuai dengan Peraturan yang berlaku dan Sistem Manajemen Informasi.",
    target: "FY26",
    owner: "Bidang Kesekretariatan",
    strategies: [
      { strategy: "Melakukan Sertifikasi SDM Kearsipan di seluruh unit kerja.", programs: "Dokumen Perusahaan terkelola sesuai dengan Kebijakan, Prosedur, Pedoman dan WI yang berlaku di Perusahaan." },
      { strategy: "Digitalisasi Korespondensi kepada seluruh unit kerja.", programs: "Sentralisasi Korespondensi Perusahaan" },
      { strategy: "Penetapan Pedoman Penyelenggaraan Kearsipan", programs: "- Penetapan TND\n- Penetapan Klasifikasi Arsip\n- Penetapan Jadwal Retensi Arsip\n- Penetapan SKKAD" },
      { strategy: "Pengajuan dan Pemenuhan Syarat-Syarat Akreditasi Unit Kearsipan PKT kepada ANRI.", programs: "Mendapatkan Akreditasi Unit Kearsipan" },
    ],
  },
  {
    id: "sg-sek-05",
    code: "SEK-05",
    division: "Bidang Kesekretariatan",
    title: "Meningkatkan Reputasi Positif Perusahaan",
    target: "FY26",
    owner: "Bidang Kesekretariatan",
    strategies: [
      { strategy: "Meningkatkan Eksistensi Perusahaan melalui pembentukan opini publik", programs: "Mengikuti penghargaan dan pameran berskala nasional dan internasional, antara lain ASRAT, SNI, IQA, IQE, Anugerah BUMN, Humas Indonesia dan PR Indonesia" },
    ],
  },
  {
    id: "sg-sek-06",
    code: "SEK-06",
    division: "Bidang Kesekretariatan",
    title: "Meningkatkan Visibility Perusahaan di Media",
    target: "FY26",
    owner: "Bidang Kesekretariatan",
    strategies: [
      { strategy: "Kerjasama strategis dengan Media untuk campaign Perusahaan", programs: "Kerjasama dengan media nasional atau KOL (Key Opinion Leader)" },
    ],
  },
  {
    id: "sg-sek-07",
    code: "SEK-07",
    division: "Bidang Kesekretariatan",
    title: "Mendukung pengembangan Proyek PKT di Bontang",
    target: "FY26",
    owner: "Bidang Kesekretariatan",
    strategies: [
      { strategy: "Membangun komunikasi yang inklusif dengan stakeholder terkait proyek di Bontang (Penyiapan lahan, Soda Ash, NPK Chemical)", programs: "Melakukan aktifitas sosial kemasyarakatan sebagai berikut:\n- Silaturahmi dengan Pemerintah\n- Silaturahmi dengan TNI Polri\n- Silaturahmi dengan tokoh adat, Tokoh agama, tokoh masyarakat dan LSM\n- Identifikasi Isu di sekitar lokasi rencana Proyek\n- Membentuk jejaring informan dan penghubung\n- Melakukan kegiatan charity di sekitar lokasi rencana proyek" },
    ],
  },
  {
    id: "sg-sek-08",
    code: "SEK-08",
    division: "Bidang Kesekretariatan",
    title: "Mendukung pengembangan Proyek Papua Barat",
    target: "FY26",
    owner: "Bidang Kesekretariatan",
    strategies: [
      { strategy: "Membangun komunikasi yang inklusif dengan stakeholder terkait proyek di Papua Barat", programs: "Melakukan aktifitas sosial kemasyarakatan sebagai berikut:\n- Indentifikasi stakeholder\n- Silaturahmi dengan Pemerintah\n- Silaturahmi dengan TNI Polri dan KUPP\n- Silaturahmi dengan tokoh adat, Tokoh agama, tokoh masyarakat, LSM, dan Jurnalis lokal\n- Identifikasi Isu di sekitar lokasi rencana Proyek\n- Membentuk jejaring informan dan penghubung\n- Melakukan kegiatan charity di sekitar lokasi rencana proyek" },
    ],
  },
  {
    id: "sg-sek-09",
    code: "SEK-09",
    division: "Bidang Kesekretariatan",
    title: "Mengetahui Persepsi Publik dan Pemangku Kepentingan dalam memandang Perusahaan",
    target: "FY26",
    owner: "Bidang Kesekretariatan",
    strategies: [
      { strategy: "Survei Pengukuran Reputasi Perusahaan", programs: "Melakukan Pengukuran Reputasi Perusahaan" },
    ],
  },
  {
    id: "sg-sek-10",
    code: "SEK-10",
    division: "Bidang Kesekretariatan",
    title: "Pencapaian PROPER Emas 2026",
    target: "FY26",
    owner: "Bidang Kesekretariatan",
    strategies: [
      { strategy: "Pelaksanaan Inovasi Sosial Berbasis Pertanian", programs: "- Implementasi PKT BERSERI (Pertanian Bulutana Berkelanjutan dan Sejahtera dan Mandiri)\n- PKT BISA (Pertanian Kompos Terpadu untuk Babadan Inovatif dan Sejahtera)" },
    ],
  },
  {
    id: "sg-sek-11",
    code: "SEK-11",
    division: "Bidang Kesekretariatan",
    title: "Pencapaian Aspek Peningkatan Engagement Karyawan",
    target: "FY26",
    owner: "Bidang Kesekretariatan",
    strategies: [
      { strategy: "Meningkatkan Keterlibatan Karyawan dalam Tanggung Jawab Sosial Perusahaan", programs: "Sosialisasi Rutin dan Pelaksanaan Program EVOLUTION - Employee Volunteering Initiation." },
    ],
  },
  {
    id: "sg-spi-01",
    code: "SPI-01",
    division: "Bidang Satuan Pengawasan Internal",
    title: "Meningkatkan efektivitas pengawasan dan sinergi pengendalian internal atas transaksi/ proses lintas entitas melalui pelaksanaan joint audit bersama SPI PIHC, guna memastikan kepatuhan terhadap prinsip-prinsip tata kelola Perusahaan yang baik",
    target: "FY26",
    owner: "Bidang Satuan Pengawasan Internal",
    strategies: [
      { strategy: "- Pelaksanaan Join Audit Bersama SPI PI Group\n- Pelaksanaan Audit Operasional Pabrik menggunakan Jasa Pro Hire", programs: "- Menyusun PKPT yang mencakup joint audit SPI PIHC\n- Menerbitkan Surat Tugas joint audit\n- Melakukan penyusunan rencana/ program joint audit yang terkoordinasi (lingkup, sasaran, tujuan dan langkah audit)\n- Melaksanakan kegiatan joint audit\n- Melaksanakan monitoring tindak lanjut" },
    ],
  },
  {
    id: "sg-spi-02",
    code: "SPI-02",
    division: "Bidang Satuan Pengawasan Internal",
    title: "Pelaksanaan Asesmen Sistem Pengendalian Internal Perusahaan (SPIP) oleh Auditor Eksternal",
    target: "FY26",
    owner: "Bidang Satuan Pengawasan Internal",
    strategies: [
      { strategy: "Pelaksanaan Asesmen Sistem Pengendalian Internal Perusahaan (SPIP) oleh Auditor Eksternal", programs: "- Menyusun TOR terkait pelaksanaan program SPIP\n- Melakukan evaluasi Sistem Pengendalian Internal Perusahaan (SPIP)\n- Menerbitkan Laporan Hasil Evaluasi SPIP" },
    ],
  },
  {
    id: "sg-spi-03",
    code: "SPI-03",
    division: "Bidang Satuan Pengawasan Internal",
    title: "Meningkatkan keandalan pelaporan keuangan dan efektivitas pengendalian internal atas pelaporan keuangan (ICOFR)",
    target: "FY26",
    owner: "Bidang Satuan Pengawasan Internal",
    strategies: [
      { strategy: "Melaksanakan evaluasi efektivitas ICOFR oleh Lini 3 yang terdokumentasi dan berbasis risiko.", programs: "Pendampingan dan Pelatihan atas Pelaksanaan evaluasi dan penyusunan laporan evaluasi serta rekomendasi perbaikan" },
    ],
  },
  {
    id: "sg-spi-04",
    code: "SPI-04",
    division: "Bidang Satuan Pengawasan Internal",
    title: "Mewujudkan budaya mutu dan peningkatan berkelanjutan pada pelaksanaan audit internal",
    target: "FY26",
    owner: "Bidang Satuan Pengawasan Internal",
    strategies: [
      { strategy: "Menerapkan Quality Assurance and Improvement Program (QAIP) SPI PKT yang sistematis dan sesuai standar berlaku", programs: "Pelaksanaan internal assessment QAIP, pelatihan auditor terkait standar mutu IIA, tindak lanjut hasil QAIP" },
    ],
  },
  {
    id: "sg-spi-05",
    code: "SPI-05",
    division: "Bidang Satuan Pengawasan Internal",
    title: "Meningkatkan kapabilitas fungsi SPI agar mampu memberikan nilai strategis bagi organisasi",
    target: "FY26",
    owner: "Bidang Satuan Pengawasan Internal",
    strategies: [
      { strategy: "Penguatan SDM, proses, dan teknologi untuk mencapai level kematangan audit internal yang lebih tinggi sesuai kerangka IACM (Internal Audit Capability Model)", programs: "Pemetaan kondisi eksisting terhadap kerangka IACM, penyusunan roadmap peningkatan kapabilitas, pelaksanaan audit berbasis data analytics." },
    ],
  },
  {
    id: "sg-spi-06",
    code: "SPI-06",
    division: "Bidang Satuan Pengawasan Internal",
    title: "Meningkatkan efektivitas penerapan prinsip Governance, Risk, and Compliance (GRC)",
    target: "FY26",
    owner: "Bidang Satuan Pengawasan Internal",
    strategies: [
      { strategy: "Kolaborasi aktif dan pendampingan BPKP guna memperkuat integrasi pengawasan dan akuntabilitas perusahaan.", programs: "Pendampingan atas Pelaksanaan Evaluasi atau Reviu berdasarkan Program BPKP maupun permintaan perusahaan." },
    ],
  },
  {
    id: "sg-umm-01",
    code: "UMM-01",
    division: "Bidang Umum",
    title: "Peningkatan infrastruktur",
    target: "FY26",
    owner: "Bidang Umum",
    strategies: [
      { strategy: "Peningkatan beban jalan area pabrik", programs: "Upgrading Jalan Flexible Pavement menjadi Rigid Pavement" },
    ],
  },
  {
    id: "sg-umm-02",
    code: "UMM-02",
    division: "Bidang Umum",
    title: "Retrofit/revamping equipment-equipment sistem kelistrikan dan tata udara yang telah memasuki umur ekonomis (Multiyears)",
    target: "FY26",
    owner: "Bidang Umum",
    strategies: [
      { strategy: "- Penguatan Infrastruktur Pendukung\n- Proses Operasional yang Efisien\n- Optimasi Biaya dengan Cost Optimazation Management", programs: "- Retrofit LV Switchgear Gardu area JPP, Pergudangan, dan Dermaga Konstruksi\n- Penambahan Emergency Diesel Generator untuk area JPP, Pergudangan, dan Dermaga Kontruksi, dan Perumahan PC VI\n- Retrofit sistem Tata Udara perkantoran\n- Penambahan penyalur petir untuk kawasan pergudangan, sarana olahraga, dan kawasan perumahan PC VI" },
    ],
  },
  {
    id: "sg-umm-03",
    code: "UMM-03",
    division: "Bidang Umum",
    title: "Peningkatan pendapatan perusahaan dari optimalisasi aset",
    target: "FY26",
    owner: "Bidang Umum",
    strategies: [
      { strategy: "Peningkatan pendapatan perusahaan dari optimalisasi aset", programs: "- Kajian optimalisasi asset idle dan komersialisasi Sarana Olahraga Sintuk (area Golf, lapangan Tennis outdoor dan kolam renang sintuk)\n- Kajian evaluasi tarif sewa asset.\n- Renovasi Kawasan Koperasi (Pujasera, Parkir area dan Aula Koperasi)\n- Renovasi kantor Perwakilan Balikpapan" },
    ],
  },
  {
    id: "sg-umm-04",
    code: "UMM-04",
    division: "Bidang Umum",
    title: "Peningkatan sistem keamanan berbasis teknologi dalam rangka meningkatkan keamanan perusahaan dan mencegah terjadinya risiko gangguan keamanan yang dapat merugikan perusahaan",
    target: "FY26",
    owner: "Bidang Umum",
    strategies: [
      { strategy: "Peningkatan sistem keamanan berbasis teknologi dalam rangka meningkatkan keamanan perusahaan dan mencegah terjadinya risiko gangguan keamanan yang dapat merugikan perusahaan", programs: "- Pemasangan X-ray scanner di area pintu masuk falcon, fireground, dan kantor pusat untuk memastikan tidak adanya barang-barang yang berbahaya dan dilarang masuk ke area pabrik ataupun perkantoran (single year)\n- Pengadaan UPS System untuk membackup power listrik yang ada di command center (single year)\n- Pemasangan atau instalasi under vehicle system untuk memantau kendaraan yang masuk ke area pabrik (single year)\n- Penambahan access door di area control room pabrik dan area perkantoran (single year)\n- Penambahan CCTV di area-area kritikal pabrik (single year)\n- Penambahan titik perimeter signal di area kawasan pabrik (multi years)" },
      { strategy: "Pembangunan pos jaga dan pagar pengamanan", programs: "- Pemagaran batas tanah di area HP01 (multi years)\n- Pemagaran area Gedung Pengadaan (eks Jastek) (single year)" },
    ],
  },
  {
    id: "sg-umm-05",
    code: "UMM-05",
    division: "Bidang Umum",
    title: "Menyediakan lingkungan kerja yang nyaman bagi karyawan",
    target: "FY26",
    owner: "Bidang Umum",
    strategies: [
      { strategy: "Menyediakan ruang kerja yang aman dan nyaman bagi karyawan", programs: "Melakukan renovasi tata ruang zona 1" },
    ],
  },
  {
    id: "sg-umm-06",
    code: "UMM-06",
    division: "Bidang Umum",
    title: "Menjaga kelestarian lingkungan hidup",
    target: "FY26",
    owner: "Bidang Umum",
    strategies: [
      { strategy: "Melaksanakan program menuju zero waste 2030 (multi years)", programs: "Penambahan Tempat Sampah Untuk Area Pabrik & Perkantoran disesuaikan dengan jenis sampahnya (pemilahan)" },
    ],
  },
  {
    id: "sg-umm-07",
    code: "UMM-07",
    division: "Bidang Umum",
    title: "Meningkatkan kinerja karyawan dalam mendukung pelaksanaan tugas Perusahaan.",
    target: "FY26",
    owner: "Bidang Umum",
    strategies: [
      { strategy: "Memberikan fasilitas rumah dinas yang layak bagi karyawan", programs: "Membangun rumah dinas PC VI" },
    ],
  },
  {
    id: "sg-keu-01",
    code: "KEU-01",
    division: "Bidang Keuangan",
    title: "Memastikan likuiditas Perusahaan untuk menjamin ketersediaan dana dalam mendukung kebutuhan Proyek Pengembangan Perusahaan",
    target: "FY26",
    owner: "Bidang Keuangan",
    strategies: [
      { strategy: "Memastikan ketersediaan pendanaan untuk proyek-proyek pengembangan Perusahaan.", programs: "Mendapatkan fasilitas Perbankan yang paling optimal sesuai dengan kebutuhan selama masa Proyek Pengembangan Perusahaan" },
    ],
  },
  {
    id: "sg-keu-02",
    code: "KEU-02",
    division: "Bidang Keuangan",
    title: "Perusahaan telah siap dalam menerapkan Pernyataan Standar Pengungkapan Keberlanjutan (PSPK) 1 dan 2",
    target: "FY26",
    owner: "Bidang Keuangan",
    strategies: [
      { strategy: "Melakukan persiapan penerapan PSPK 1 dan PSPK 2.", programs: "Melakukan penunjukan konsultan untuk melakukan kajian Gap Analysis dan konsultasi kesiapan dan langkah strategis Perusahaan dalam penerapan PSPK 1 dan PSPK 2." },
    ],
  },
  {
    id: "sg-keu-03",
    code: "KEU-03",
    division: "Bidang Keuangan",
    title: "Perusahaan telah siap dalam menerapkan Standar Akuntansi Keuangan terbaru (IFRS 18 Presentation and Disclosure in Financial Statements) yang akan berlaku efektif pada 1 Januari 2027 (penerapan lebih awal diperkenankan).",
    target: "FY26",
    owner: "Bidang Keuangan",
    strategies: [
      { strategy: "Melakukan persiapan penerapan IFRS 18.", programs: "Melakukan penunjukan konsultan untuk melakukan kajian Gap Analysis penerapan Standar Akuntansi Keuangan terbaru IFRS 18 terhadap proses penyusunan Laporan Keuangan Perusahaan." },
    ],
  },
  {
    id: "sg-keu-04",
    code: "KEU-04",
    division: "Bidang Keuangan",
    title: "Persiapan Penerapan Costing Produk Pabrik Baru",
    target: "FY26",
    owner: "Bidang Keuangan",
    strategies: [
      { strategy: "Persiapan pengembangan sistem aplikasi perhitungan costing untuk pabrik baru", programs: "Melakukan persiapan sistem aplikasi perhitungan costing untuk pabrik baru" },
    ],
  },
  {
    id: "sg-esg-01",
    code: "ESG-01",
    division: "Bidang ESG & Dekarbonisasi",
    title: "Pemenuhan komitmen ESG melalui implementasi inisiatif program Dekarbonisasi",
    target: "FY26",
    owner: "Bidang ESG & Dekarbonisasi",
    strategies: [
      { strategy: "Skor ESG Rating mencapai 68 dan penurunan emisi CO2 sebesar 753.520 ton CO2eq tahun 2026", programs: "- Efisiensi energi Pabrik\n- Penggunaan green energy PLTS\n- Penggunaan kendaraan listrik\n- Program Zero Waste melalui pengolahan sampah\n- Perlindungan keanekaragaman hayati (biodiversity) melalui penanaman mangrove, rehabilitasi terumbu karang, serta pelestarian tanaman dan satwa endemik" },
    ],
  },
  {
    id: "sg-esg-02",
    code: "ESG-02",
    division: "Bidang ESG & Dekarbonisasi",
    title: "Eksekusi strategi pengembangan bisnis karbon berbasis teknologi dan Nature Based Solution (NBS)",
    target: "FY26",
    owner: "Bidang ESG & Dekarbonisasi",
    strategies: [
      { strategy: "Penambahan luas area program NBS pada 2026 adalah 4100 Ha (1000 Ha agroforestry dan 3100 Ha sektor kehutanan) dengan porsi biaya PKT sebesar 30%", programs: "Mendukung pelaksanaan NBS PI tahun 2026 melalui kontribusi 30% biaya untuk program agroforestry dan sektor kehutanan" },
      { strategy: "Sertifikasi Pengurangan Emisi (SPE) GRK – Pabrik Soda Ash PKT", programs: "Persiapan Sertifikasi Pengurangan Emisi (SPE) GRK – Pabrik Soda Ash PKT" },
    ],
  },
];

// ---- Performance Dictionary ----
// Balanced-scorecard perspectives a Corporate KPI can belong to.
export const kpiPerspectives = ["Financial", "Customer", "Internal Process", "Learning & Growth"] as const;
// Subordinate org levels a Corporate KPI can cascade down to (SVP, SPM, Dirut Anper, …).
export const subordinateLevels = ["Direktur", "SVP", "VP", "SPM", "GM", "Manager", "Dirut Anper", "Ketua Yayasan"] as const;

export interface CorporateKpi {
  id: string;
  code: string;
  name: string;
  perspective: string;
  unit: string;
  target: string;
  strategicGoalId?: string; // link to a Strategic Goal (strategy-goals store)
  cascadableTo: string[]; // subordinate levels/roles that may adopt this KPI
}

export const corporateKpis: CorporateKpi[] = [
  { id: "ck-01", code: "CK-01", name: "Corporate Revenue Growth", perspective: "Financial", unit: "%", target: "12", strategicGoalId: "sg-inv-03", cascadableTo: ["Direktur", "SVP", "Dirut Anper"] },
  { id: "ck-02", code: "CK-02", name: "EBITDA Margin", perspective: "Financial", unit: "%", target: "28", strategicGoalId: "sg-keu-01", cascadableTo: ["Direktur", "SVP", "VP"] },
  { id: "ck-03", code: "CK-03", name: "Internal Customer Satisfaction (NPS)", perspective: "Customer", unit: "index", target: "60", strategicGoalId: "sg-sek-09", cascadableTo: ["SVP", "VP", "SPM", "Manager"] },
  { id: "ck-04", code: "CK-04", name: "Digital Process Adoption", perspective: "Internal Process", unit: "%", target: "90", strategicGoalId: "sg-trb-01", cascadableTo: ["VP", "SPM", "Manager"] },
  { id: "ck-05", code: "CK-05", name: "Competency Index", perspective: "Learning & Growth", unit: "%", target: "85", strategicGoalId: "sg-sdm-05", cascadableTo: ["SVP", "VP", "SPM", "GM", "Manager"] },
  { id: "ck-06", code: "CK-06", name: "Foundation Program Realization", perspective: "Customer", unit: "%", target: "95", strategicGoalId: "sg-sek-10", cascadableTo: ["Ketua Yayasan"] },
];

// ---- Performance Planning (Add KPI form + recap) ----
export const kpiGroups = ["KPI Bersama", "KPI Direktorat", "KPI Individu"] as const;
export const kpiTypes = ["Strategis", "Teknis", "Generik", "Project"] as const;
export const kpiMeasurements = ["Exact", "Proxy", "Activity"] as const;
export const kpiPolarities = ["Maximize", "Minimize", "Stabilize"] as const;
export const kpiFrequencies = ["Monthly", "Quarterly", "Half Yearly", "Yearly"] as const;
export const kpiCascadeTypes = ["Fully Cascade A", "Fully Cascade B", "Partially Cascade", "Contributory Cascade", "Non Cascade"] as const;
export const kpiConsolidations = ["Take Last Known", "Average", "Sum"] as const;
export const kpiUnits = ["Persen", "Rp Miliar", "Rate", "BBTUD", "Index", "Hari", "Unit", "Skor"] as const;
export const kpiValidities = ["Exact", "Proxy"] as const;
export const esgCriteriaOptions = ["Environment", "Social", "Governance"] as const;
export const kpiMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"] as const;

export interface KpiConversion { from: string; to: string; value: string }
export interface PlanningKpi {
  id: string;
  group: string; // KPI Bersama / Direktorat / Individu (recap grouping)
  perspective: string; // Perspektif Balanced Scorecard
  strategicGoalId?: string; // Sasaran Strategis — picked from strategic goals
  strategicGoalText?: string; // manual Sasaran Strategis when none of the goals fit
  name: string;
  definition: string;
  purpose: string;
  type: string; // Tipe KPI (Spesifik / Mandatory)
  weight: number; // Bobot
  formula: string; // Formula Penilaian
  hasConversion: boolean;
  conversions: KpiConversion[];
  measurement: string; // Jenis Pengukuran
  polarity: string;
  frequency: string;
  cascadeType: string;
  consolidation: string; // Take Last Known / Average / Sum
  monthlyTargets: Record<string, number>; // Jan..Des
  annualTarget: number;
  dataSource: string;
  unit: string; // Satuan
  esgCriteria: string[];
  validity: string;
  proxyMax?: number;
  supportingFile: string; // link or file name
  pic: string; // Penanggung Jawab KPI
  dataManager: string; // Pengelola Data KPI
  period: string; // Periode KPI (year)
}

export const planningKpis: PlanningKpi[] = [
  { id: "pk-01", group: "KPI Bersama", perspective: "Financial", strategicGoalId: "sg-keu-01", name: "% Excess of ROIC - WACC", definition: "Selisih ROIC terhadap WACC.", purpose: "Memastikan penciptaan nilai di atas biaya modal.", type: "Spesifik", weight: 11, formula: "ROIC - WACC", hasConversion: false, conversions: [], measurement: "Exact", polarity: "Maximize", frequency: "Yearly", cascadeType: "Fully Cascade A", consolidation: "Take Last Known", monthlyTargets: {}, annualTarget: 9.63, dataSource: "Laporan Keuangan", unit: "Persen", esgCriteria: [], validity: "Exact", supportingFile: "", pic: "Purwanto", dataManager: "", period: "2026" },
  { id: "pk-02", group: "KPI Bersama", perspective: "Financial", strategicGoalId: "sg-keu-01", name: "$ Net Income", definition: "Laba bersih perusahaan.", purpose: "Mencapai target profitabilitas.", type: "Mandatory", weight: 11, formula: "Total Revenue - Total Cost", hasConversion: false, conversions: [], measurement: "Exact", polarity: "Maximize", frequency: "Monthly", cascadeType: "Fully Cascade A", consolidation: "Take Last Known", monthlyTargets: {}, annualTarget: 5681.35, dataSource: "Laporan Keuangan", unit: "Rp Miliar", esgCriteria: [], validity: "Exact", supportingFile: "", pic: "Purwanto", dataManager: "", period: "2026" },
  { id: "pk-03", group: "KPI Direktorat", perspective: "Internal Process", strategicGoalId: "sg-prd-10", name: "% Penghematan Biaya OH COGM", definition: "Efisiensi biaya overhead pada COGM.", purpose: "Menurunkan biaya produksi.", type: "Spesifik", weight: 15, formula: "(Baseline - Aktual) / Baseline", hasConversion: false, conversions: [], measurement: "Exact", polarity: "Maximize", frequency: "Monthly", cascadeType: "Fully Cascade A", consolidation: "Take Last Known", monthlyTargets: {}, annualTarget: 100, dataSource: "SAP", unit: "Persen", esgCriteria: [], validity: "Exact", supportingFile: "", pic: "Purwanto", dataManager: "", period: "2026" },
];

export interface JobProfile {
  id: string;
  role: string; // position / title
  level: string; // org level (SVP, VP, …)
  unit: string;
  purpose: string;
  responsibilities: string[];
  kpiIds: string[]; // linked Corporate KPI ids
}

export const jobProfiles: JobProfile[] = [
  { id: "jp-01", role: "SVP Human Capital", level: "SVP", unit: "Human Capital", purpose: "Memimpin strategi human capital dan pengembangan kompetensi korporat.", responsibilities: ["Menyusun strategi human capital", "Mengelola sistem manajemen kinerja", "Memastikan kesiapan talenta"], kpiIds: ["ck-03", "ck-05"] },
  { id: "jp-02", role: "VP Performance Management", level: "VP", unit: "Performance Management", purpose: "Mengelola sistem manajemen kinerja korporat dan cascading KPI.", responsibilities: ["Menjalankan cascading KPI", "Memantau pencapaian KPI unit", "Mengelola siklus penilaian kinerja"], kpiIds: ["ck-02", "ck-04"] },
];

export type SwotType = "Strength" | "Weakness" | "Opportunity" | "Threat";

export interface SwotItem {
  id: string;
  type: SwotType;
  text: string;
}

export const swotItems: SwotItem[] = [
  { id: "sw-1", type: "Strength", text: "Strong leadership commitment to digital transformation." },
  { id: "sw-2", type: "Strength", text: "Skilled and motivated core team." },
  { id: "sw-3", type: "Weakness", text: "Several legacy manual processes still in use." },
  { id: "sw-4", type: "Weakness", text: "Uneven data quality across departments." },
  { id: "sw-5", type: "Opportunity", text: "Growing demand for integrated HR platforms." },
  { id: "sw-6", type: "Opportunity", text: "Executive sponsorship for automation initiatives." },
  { id: "sw-7", type: "Threat", text: "Rapidly changing technology landscape." },
  { id: "sw-8", type: "Threat", text: "Competition for skilled talent." },
];

export interface Program {
  id: string;
  name: string;
  owner: string;
  status: "On Track" | "At Risk" | "Delayed" | "Completed";
  progress: number;
  budget: number;
  spent: number;
  start: string;
  end: string;
  risk: "Low" | "Medium" | "High";
  milestones: number;
  milestonesDone: number;
  goalIds?: string[]; // linked Strategic Goals (strategicGoals.id)
  okrIds?: string[]; // linked OKR objectives (objectives.id)
}

export const programs: Program[] = [
  { id: "PRG-01", name: "Competency Digital Transformation", owner: "Arif Wibowo", status: "On Track", progress: 72, budget: 850, spent: 540, start: "2026-01-10", end: "2026-11-30", risk: "Low", milestones: 8, milestonesDone: 5, goalIds: ["sg-sdm-05"], okrIds: ["okr-1"] },
  { id: "PRG-02", name: "Leadership Development 2026", owner: "Dimas Prakoso", status: "At Risk", progress: 48, budget: 420, spent: 300, start: "2026-02-01", end: "2026-09-15", risk: "Medium", milestones: 6, milestonesDone: 2, goalIds: ["sg-sdm-04"], okrIds: [] },
  { id: "PRG-03", name: "Performance Automation Suite", owner: "Sinta Larasati", status: "On Track", progress: 66, budget: 610, spent: 380, start: "2026-03-05", end: "2026-12-20", risk: "Low", milestones: 7, milestonesDone: 4, goalIds: ["sg-trb-01"], okrIds: ["okr-2"] },
  { id: "PRG-04", name: "Customer Experience Uplift", owner: "Bagus Hartono", status: "Delayed", progress: 35, budget: 300, spent: 210, start: "2026-01-20", end: "2026-08-30", risk: "High", milestones: 5, milestonesDone: 1, goalIds: ["sg-sek-09"], okrIds: ["okr-3"] },
  { id: "PRG-05", name: "Knowledge Base Modernization", owner: "Rani Kusuma", status: "Completed", progress: 100, budget: 180, spent: 172, start: "2025-09-01", end: "2026-03-31", risk: "Low", milestones: 4, milestonesDone: 4, goalIds: [], okrIds: [] },
];

// ---------------------------------------------------------------------------
// Tasks (Kanban)
// ---------------------------------------------------------------------------

// Employee master (Direktori Karyawan) — populated by importing an HR spreadsheet at runtime.
// Seeded empty on purpose: real PII must never live in the repo.
export interface Employee {
  npk: string; // employee number (unique id)
  name: string;
  position: string; // Jabatan
  unit: string; // Unit Kerja
  directorate: string; // Direktorat
  compartment: string; // Kompartemen
  location: string; // Lokasi
  stream: string; // Stream
  pg: string; // personal grade
  jg: string; // job grade
  gender: string; // L / P
  age: string; // Usia
  supervisor: string; // Atasan
  education: string; // Jenjang
  major: string; // Prodi
  university: string; // Universitas
  sf: string; // S/F
}

export const employees: Employee[] = [];

// ---- Kamus Kompetensi (Competency Dictionary) ----
// Categories the dictionary is divided into (extensible: Manajerial, Perilaku, …).
export const competencyCategories = ["Kompetensi Teknis", "Kompetensi Manajerial", "Perilaku"] as const;
export type CompetencyCategory = (typeof competencyCategories)[number];

// The proficiency scale (Level Kompetensi Teknis).
export interface CompetencyLevelDef {
  level: number;
  name: string;
  description: string;
}
export const technicalCompetencyLevels: CompetencyLevelDef[] = [
  { level: 1, name: "Knowledgeable", description: "Memahami konsep dan prinsip dasar kompetensi." },
  { level: 2, name: "Basic Practitioner", description: "Menerapkan kompetensi pada tugas rutin dengan bimbingan." },
  { level: 3, name: "Intermediate Practitioner", description: "Menerapkan kompetensi secara mandiri pada situasi umum." },
  { level: 4, name: "Advanced", description: "Menangani situasi kompleks dan membimbing orang lain." },
  { level: 5, name: "Expert", description: "Menjadi rujukan utama dan merumuskan standar di bidangnya." },
];

// A competency plus its per-level behavioural indicators (Kamus Kompetensi Teknis).
export interface CompetencyIndicator {
  level: number;
  indicator: string;
}
export interface DictionaryCompetency {
  id: string;
  code: string;
  name: string;
  category: CompetencyCategory;
  definition: string;
  indicators: CompetencyIndicator[];
  jobFamily?: string; // Daftar grouping
  jobFamilyName?: string;
  functionName?: string;
}

// ---- Competency Matrix ----
// Standards: required proficiency level per group (Job Family / category) per competency.
export type CompetencyStandards = Record<string, Record<string, number>>; // group -> competencyId -> required level (1..N)
// Assessment: an employee's actual level per competency, grouped by the same key.
export interface MatrixEmployee {
  npk: string;
  name: string;
  levels: Record<string, number>; // competencyId -> actual level (1..N; absent/0 = not assessed)
}
export type CompetencyAssessments = Record<string, MatrixEmployee[]>; // group -> assessed employees

export const technicalCompetencies: DictionaryCompetency[] = [
  {
    id: "tk-01", code: "TK-01", name: "Pemeliharaan Peralatan Rotating", category: "Kompetensi Teknis",
    definition: "Kemampuan memelihara dan memperbaiki peralatan berputar (pompa, kompresor, turbin) untuk menjaga keandalan operasi pabrik.",
    indicators: [
      { level: 1, indicator: "Mengenal jenis peralatan rotating dan fungsi komponen utamanya." },
      { level: 2, indicator: "Melakukan pemeliharaan preventif rutin dengan bimbingan." },
      { level: 3, indicator: "Mendiagnosis gangguan umum dan melakukan perbaikan secara mandiri." },
      { level: 4, indicator: "Menganalisis akar masalah kegagalan dan menyusun program keandalan." },
      { level: 5, indicator: "Merumuskan standar pemeliharaan dan strategi reliability tingkat korporat." },
    ],
  },
  {
    id: "tk-02", code: "TK-02", name: "Instrumentasi dan Sistem Kontrol", category: "Kompetensi Teknis",
    definition: "Kemampuan mengkalibrasi, memelihara, dan mengoptimalkan instrumentasi serta sistem kontrol proses (DCS/PLC).",
    indicators: [
      { level: 1, indicator: "Memahami prinsip pengukuran dan simbol instrumentasi dasar." },
      { level: 2, indicator: "Melakukan kalibrasi instrumen sederhana sesuai prosedur." },
      { level: 3, indicator: "Melakukan troubleshooting loop kontrol secara mandiri." },
      { level: 4, indicator: "Melakukan tuning dan optimasi strategi kontrol lanjutan." },
      { level: 5, indicator: "Merancang arsitektur sistem kontrol dan menetapkan standar teknis." },
    ],
  },
  {
    id: "tk-03", code: "TK-03", name: "Operasi Proses Produksi", category: "Kompetensi Teknis",
    definition: "Kemampuan mengoperasikan unit proses produksi secara aman, efisien, dan sesuai parameter mutu.",
    indicators: [
      { level: 1, indicator: "Memahami diagram alir proses dan parameter operasi utama." },
      { level: 2, indicator: "Menjalankan unit pada kondisi normal dengan pengawasan." },
      { level: 3, indicator: "Menangani start-up, shutdown, dan gangguan operasi secara mandiri." },
      { level: 4, indicator: "Mengoptimalkan yield dan konsumsi energi unit proses." },
      { level: 5, indicator: "Menetapkan operating envelope dan strategi peningkatan kapasitas." },
    ],
  },
  {
    id: "tk-04", code: "TK-04", name: "Keselamatan Proses (Process Safety)", category: "Kompetensi Teknis",
    definition: "Kemampuan menerapkan prinsip keselamatan proses untuk mencegah insiden bahan berbahaya dan menjaga integritas aset.",
    indicators: [
      { level: 1, indicator: "Mengenal bahaya proses dan aturan keselamatan dasar." },
      { level: 2, indicator: "Menerapkan prosedur kerja aman dan izin kerja dengan benar." },
      { level: 3, indicator: "Memfasilitasi HAZOP dan analisis risiko proses secara mandiri." },
      { level: 4, indicator: "Merancang lapisan proteksi (LOPA/SIS) dan mengelola perubahan (MOC)." },
      { level: 5, indicator: "Membangun budaya dan sistem manajemen keselamatan proses korporat." },
    ],
  },
  {
    id: "tk-05", code: "TK-05", name: "Analisis Laboratorium dan Mutu", category: "Kompetensi Teknis",
    definition: "Kemampuan melakukan pengujian laboratorium dan pengendalian mutu produk sesuai standar.",
    indicators: [
      { level: 1, indicator: "Memahami metode sampling dan prosedur pengujian dasar." },
      { level: 2, indicator: "Menjalankan analisis rutin dan mencatat hasil sesuai prosedur." },
      { level: 3, indicator: "Memvalidasi hasil, menangani penyimpangan, dan menjaga akurasi." },
      { level: 4, indicator: "Mengembangkan metode uji dan program jaminan mutu (QA/QC)." },
      { level: 5, indicator: "Menetapkan standar mutu dan sistem akreditasi laboratorium." },
    ],
  },
];

export type TaskStatus = "Backlog" | "In Progress" | "Review" | "Done";
export type Priority = "Low" | "Medium" | "High" | "Critical";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}
export interface Subtask {
  id: string;
  title: string;
  done: boolean; // manual state; ignored when the subtask has checklist items (derived instead)
  checklist: ChecklistItem[];
}
export type EvidenceKind = "file" | "link";
export interface Evidence {
  id: string;
  kind: EvidenceKind;
  name: string;
  url: string; // link href, or a data: URL for an attached file
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string;
  avatar: string;
  due: string;
  program: string;
  milestoneId?: string; // linked Milestone (milestones.id); undefined = additional task
  checklist: { total: number; done: number };
  subtasks?: Subtask[]; // Task → Subtask → Checklist hierarchy
  evidence?: Evidence[]; // attached files / links, pinned to the task
  comments: number;
  tags: string[];
}

export const tasks: Task[] = [
  { id: "T-101", title: "Draft Q3 KPI cascade for Performance team", status: "In Progress", priority: "High", assignee: "Sinta L.", avatar: "SL", due: "2026-07-10", program: "PRG-03", milestoneId: "mst-301", checklist: { total: 6, done: 4 }, comments: 3, tags: ["KPI", "Q3"],
    subtasks: [
      { id: "st-1011", title: "Collect team OKRs", done: true, checklist: [
        { id: "cl-10111", text: "Export current OKRs", done: true },
        { id: "cl-10112", text: "Validate with team leads", done: true },
      ] },
      { id: "st-1012", title: "Draft cascade matrix", done: false, checklist: [
        { id: "cl-10121", text: "Map objectives → KPIs", done: true },
        { id: "cl-10122", text: "Assign weights", done: false },
        { id: "cl-10123", text: "Review with Arif", done: false },
      ] },
    ],
    evidence: [
      { id: "ev-1011", kind: "link", name: "KPI cascade worksheet", url: "https://docs.google.com/spreadsheets/kpi-cascade" },
    ],
  },
  { id: "T-102", title: "Competency gap analysis — Analytics", status: "Review", priority: "Critical", assignee: "Rani K.", avatar: "RK", due: "2026-07-08", program: "PRG-01", milestoneId: "mst-102", checklist: { total: 8, done: 8 }, comments: 5, tags: ["Competency"] },
  { id: "T-103", title: "Finalize Leadership curriculum module 3", status: "Backlog", priority: "Medium", assignee: "Dimas P.", avatar: "DP", due: "2026-07-18", program: "PRG-02", milestoneId: "mst-201", checklist: { total: 5, done: 1 }, comments: 1, tags: ["Training"] },
  { id: "T-104", title: "Migrate SOP library to new KM system", status: "In Progress", priority: "Medium", assignee: "Rani K.", avatar: "RK", due: "2026-07-14", program: "PRG-05", milestoneId: "mst-501", checklist: { total: 10, done: 7 }, comments: 2, tags: ["Knowledge"] },
  { id: "T-105", title: "Configure SLA rules for service requests", status: "Done", priority: "High", assignee: "Sinta L.", avatar: "SL", due: "2026-07-02", program: "PRG-03", milestoneId: "mst-302", checklist: { total: 4, done: 4 }, comments: 0, tags: ["SLA"] },
  { id: "T-106", title: "Executive dashboard traffic-light logic", status: "In Progress", priority: "High", assignee: "Arif W.", avatar: "AW", due: "2026-07-11", program: "PRG-03", milestoneId: "mst-303", checklist: { total: 7, done: 3 }, comments: 4, tags: ["Dashboard"] },
  { id: "T-107", title: "CX survey redesign & NPS mapping", status: "Backlog", priority: "Critical", assignee: "Bagus H.", avatar: "BH", due: "2026-07-20", program: "PRG-04", milestoneId: "mst-401", checklist: { total: 6, done: 0 }, comments: 2, tags: ["CX", "NPS"] },
  { id: "T-108", title: "Approve training budget PRG-02", status: "Review", priority: "High", assignee: "Arif W.", avatar: "AW", due: "2026-07-09", program: "PRG-02", checklist: { total: 3, done: 2 }, comments: 6, tags: ["Approval"] },
  { id: "T-109", title: "Publish IDP templates for supervisors", status: "Done", priority: "Low", assignee: "Dimas P.", avatar: "DP", due: "2026-06-30", program: "PRG-01", checklist: { total: 5, done: 5 }, comments: 1, tags: ["IDP"] },
  { id: "T-110", title: "Set up Redis cache for analytics API", status: "Backlog", priority: "Medium", assignee: "Rani K.", avatar: "RK", due: "2026-07-22", program: "PRG-03", checklist: { total: 4, done: 0 }, comments: 0, tags: ["Tech"] },
];

export const taskColumns: TaskStatus[] = ["Backlog", "In Progress", "Review", "Done"];

// ---------------------------------------------------------------------------
// Competency
// ---------------------------------------------------------------------------

export interface Competency {
  name: string;
  category: string;
  required: number;
  current: number;
}

export const competencies: Competency[] = [
  { name: "Strategic Leadership", category: "Leadership", required: 4, current: 3 },
  { name: "Data Analytics", category: "Technical", required: 4, current: 3 },
  { name: "Performance Coaching", category: "People", required: 5, current: 4 },
  { name: "Project Management", category: "Delivery", required: 4, current: 4 },
  { name: "Stakeholder Communication", category: "People", required: 4, current: 3 },
  { name: "Process Automation", category: "Technical", required: 3, current: 2 },
  { name: "Financial Acumen", category: "Business", required: 3, current: 3 },
  { name: "Change Management", category: "Leadership", required: 4, current: 2 },
];

export interface DevPlan {
  employee: string;
  avatar: string;
  role: string;
  readiness: number;
  gaps: number;
  nextStep: string;
}

export const developmentPlans: DevPlan[] = [
  { employee: "Rani Kusuma", avatar: "RK", role: "Competency Analyst", readiness: 74, gaps: 2, nextStep: "Advanced Analytics Certification" },
  { employee: "Dimas Prakoso", avatar: "DP", role: "Supervisor Development", readiness: 81, gaps: 1, nextStep: "Leadership Simulation Lab" },
  { employee: "Sinta Larasati", avatar: "SL", role: "Manager Performance", readiness: 88, gaps: 1, nextStep: "Executive Coaching" },
  { employee: "Bagus Hartono", avatar: "BH", role: "Director Operations", readiness: 92, gaps: 0, nextStep: "Board Readiness Program" },
];

// ---------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------

export interface PerfKpi {
  id: string;
  name: string;
  level: "Corporate" | "Department" | "Individual";
  weight: number;
  target: number;
  actual: number;
  unit: string;
}

export const performanceKpis: PerfKpi[] = [
  { id: "K1", name: "Program On-Time Delivery", level: "Department", weight: 25, target: 95, actual: 91, unit: "%" },
  { id: "K2", name: "Competency Gap Closure", level: "Department", weight: 20, target: 60, actual: 54, unit: "%" },
  { id: "K3", name: "Internal CSAT", level: "Corporate", weight: 20, target: 4.5, actual: 4.4, unit: "/5" },
  { id: "K4", name: "SLA Compliance", level: "Department", weight: 15, target: 95, actual: 93, unit: "%" },
  { id: "K5", name: "Training Effectiveness", level: "Individual", weight: 10, target: 85, actual: 88, unit: "%" },
  { id: "K6", name: "Cost Efficiency", level: "Corporate", weight: 10, target: 100, actual: 104, unit: "%" },
];

export const topPerformers = [
  { name: "Bagus Hartono", avatar: "BH", score: 96, role: "Director Operations" },
  { name: "Sinta Larasati", avatar: "SL", score: 93, role: "Manager Performance" },
  { name: "Dimas Prakoso", avatar: "DP", score: 89, role: "Supervisor Development" },
  { name: "Rani Kusuma", avatar: "RK", score: 86, role: "Competency Analyst" },
];

// ---------------------------------------------------------------------------
// Customer requests & satisfaction
// ---------------------------------------------------------------------------

export interface ServiceRequest {
  id: string;
  title: string;
  requester: string;
  priority: Priority;
  sla: "Within SLA" | "At Risk" | "Breached";
  status: "New" | "In Progress" | "Waiting Approval" | "Resolved";
  pic: string;
  created: string;
}

export const serviceRequests: ServiceRequest[] = [
  { id: "SR-2041", title: "Access to performance data warehouse", requester: "Bagus H.", priority: "High", sla: "Within SLA", status: "In Progress", pic: "Rani K.", created: "2026-07-05" },
  { id: "SR-2042", title: "New competency dashboard for Ops", requester: "Ops Dept.", priority: "Medium", sla: "At Risk", status: "Waiting Approval", pic: "Sinta L.", created: "2026-07-04" },
  { id: "SR-2043", title: "Bulk training enrollment — 40 staff", requester: "HR Dept.", priority: "High", sla: "Within SLA", status: "New", pic: "Dimas P.", created: "2026-07-06" },
  { id: "SR-2044", title: "Export Q2 appraisal reports", requester: "Finance", priority: "Low", sla: "Breached", status: "In Progress", pic: "Rani K.", created: "2026-06-28" },
  { id: "SR-2045", title: "Integrate Outlook calendar sync", requester: "IT Dept.", priority: "Medium", sla: "Within SLA", status: "Resolved", pic: "Arif W.", created: "2026-06-25" },
];

export const npsData = { promoters: 62, passives: 27, detractors: 11, nps: 51 };

export const satisfactionByService = [
  { service: "Competency Assessment", score: 4.5 },
  { service: "Training Delivery", score: 4.6 },
  { service: "Performance Review", score: 4.2 },
  { service: "Data & Reporting", score: 4.1 },
  { service: "Service Requests", score: 4.4 },
];

// ---------------------------------------------------------------------------
// AI Assistant
// ---------------------------------------------------------------------------

export interface AiInsight {
  id: string;
  type: "risk" | "recommendation" | "summary" | "prediction";
  title: string;
  body: string;
  confidence: number;
}

export const aiInsights: AiInsight[] = [
  { id: "ai1", type: "risk", title: "Project Aurora likely to slip 2 weeks", body: "Milestone velocity dropped 18% over the last sprint. 3 critical tasks are unassigned and 2 dependencies are blocked.", confidence: 87 },
  { id: "ai2", type: "recommendation", title: "Rebalance workload for Competency team", body: "Competency team is at 128% capacity while Strategy is at 61%. Reassign 4 non-critical tasks to level utilization.", confidence: 79 },
  { id: "ai3", type: "prediction", title: "Q3 KPI achievement forecast: 89%", body: "Based on current trend, overall KPI will reach 89% by quarter end — just below the 90% target. Focus on Competency Index to close the gap.", confidence: 82 },
  { id: "ai4", type: "summary", title: "Weekly executive summary ready", body: "12 tasks completed, 3 programs advanced, 1 risk flagged, CSAT up 0.1. Full narrative report generated and ready to export.", confidence: 95 },
];

export const aiSuggestions = [
  "Generate Q3 executive summary",
  "Draft IDP for Rani Kusuma",
  "Predict delays across all programs",
  "Suggest priority for my open tasks",
  "Summarize last meeting minutes",
  "Recommend training for Analytics gaps",
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  channel: "In-App" | "Email" | "WhatsApp" | "Push";
  title: string;
  time: string;
  read: boolean;
  kind: "deadline" | "approval" | "training" | "birthday" | "system";
}

export const notifications: Notification[] = [
  { id: "n1", channel: "In-App", title: "Task T-102 moved to Review — needs your approval", time: "5m", read: false, kind: "approval" },
  { id: "n2", channel: "Email", title: "Deadline tomorrow: Q3 KPI cascade (T-101)", time: "1h", read: false, kind: "deadline" },
  { id: "n3", channel: "WhatsApp", title: "Leadership training starts Monday 09:00", time: "3h", read: true, kind: "training" },
  { id: "n4", channel: "Push", title: "🎂 It's Sinta Larasati's birthday today", time: "6h", read: true, kind: "birthday" },
  { id: "n5", channel: "In-App", title: "AI flagged a schedule risk on Project Aurora", time: "8h", read: true, kind: "system" },
];

// ---------------------------------------------------------------------------
// Modules registry (used by dashboard quick links)
// ---------------------------------------------------------------------------

export interface Meeting {
  id: string;
  title: string;
  time: string;
  attendees: number;
  actionItems: number;
}

export const meetings: Meeting[] = [
  { id: "M1", title: "Quarterly Performance Review", time: "Today · 14:00", attendees: 8, actionItems: 5 },
  { id: "M2", title: "Competency Council Sync", time: "Tomorrow · 10:00", attendees: 5, actionItems: 3 },
  { id: "M3", title: "Program Aurora Standup", time: "Wed · 09:30", attendees: 6, actionItems: 2 },
];

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  version: string;
  updated: string;
  type: "SOP" | "Guideline" | "Template" | "Presentation";
}

export const knowledgeDocs: KnowledgeDoc[] = [
  { id: "D1", title: "Competency Assessment SOP", category: "Competency", version: "v3.2", updated: "2026-06-20", type: "SOP" },
  { id: "D2", title: "KPI Cascade Guideline", category: "Performance", version: "v2.0", updated: "2026-05-11", type: "Guideline" },
  { id: "D3", title: "IDP Template 2026", category: "Development", version: "v1.4", updated: "2026-06-01", type: "Template" },
  { id: "D4", title: "Leadership Program Deck", category: "Development", version: "v1.0", updated: "2026-06-28", type: "Presentation" },
  { id: "D5", title: "Service Request Handling SOP", category: "Customer", version: "v2.5", updated: "2026-06-15", type: "SOP" },
];

// --- Document Management ----------------------------------------------------

export type DocType = "SOP" | "Guideline" | "Template" | "Presentation";
export type DocApproval = "Approved" | "Pending" | "Rejected";

export interface DocItem {
  id: string;
  title: string;
  type: DocType;
  folder: string;
  owner: string;
  version: string;
  approval: DocApproval;
  updated: string; // ISO date (YYYY-MM-DD)
  signed: boolean;
}

export const docFolders = ["Strategy", "Programs", "Competency", "Performance", "Customer", "Templates"];

export const documents: DocItem[] = [
  { id: "doc-1", title: "Competency Assessment SOP", type: "SOP", folder: "Competency", owner: "Arif Wibowo", version: "v3.2", approval: "Approved", updated: "2026-06-20", signed: true },
  { id: "doc-2", title: "KPI Cascade Guideline", type: "Guideline", folder: "Performance", owner: "Sinta Larasati", version: "v2.0", approval: "Pending", updated: "2026-05-11", signed: false },
  { id: "doc-3", title: "IDP Template 2026", type: "Template", folder: "Templates", owner: "Rani Kusuma", version: "v1.4", approval: "Pending", updated: "2026-06-01", signed: false },
  { id: "doc-4", title: "Leadership Program Deck", type: "Presentation", folder: "Programs", owner: "Dimas Prakoso", version: "v1.0", approval: "Pending", updated: "2026-06-28", signed: false },
  { id: "doc-5", title: "Service Request Handling SOP", type: "SOP", folder: "Customer", owner: "Bagus Hartono", version: "v2.5", approval: "Approved", updated: "2026-06-15", signed: true },
  { id: "doc-6", title: "Strategic Plan FY26", type: "Guideline", folder: "Strategy", owner: "Arif Wibowo", version: "v1.2", approval: "Approved", updated: "2026-06-25", signed: true },
  { id: "doc-7", title: "Performance Appraisal SOP", type: "SOP", folder: "Performance", owner: "Sinta Larasati", version: "v4.1", approval: "Approved", updated: "2026-05-30", signed: true },
  { id: "doc-8", title: "Program Charter Template", type: "Template", folder: "Programs", owner: "Dimas Prakoso", version: "v2.0", approval: "Approved", updated: "2026-06-10", signed: false },
  { id: "doc-9", title: "Competency Matrix 2026", type: "Guideline", folder: "Competency", owner: "Rani Kusuma", version: "v3.0", approval: "Pending", updated: "2026-06-18", signed: false },
  { id: "doc-10", title: "Customer Satisfaction Report", type: "Presentation", folder: "Customer", owner: "Bagus Hartono", version: "v1.3", approval: "Approved", updated: "2026-06-22", signed: true },
];

// --- Meetings: agenda & action items ---------------------------------------

export interface AgendaItem {
  id: string;
  text: string;
}

export const meetingAgenda: AgendaItem[] = [
  { id: "ag-1", text: "Review Q3 KPI achievement vs. target" },
  { id: "ag-2", text: "Competency gap closure progress — Analytics team" },
  { id: "ag-3", text: "Leadership Development 2026 budget approval" },
  { id: "ag-4", text: "Open service requests & SLA risk review" },
];

export type ActionStatus = "Open" | "Done";

export interface ActionItem {
  id: string;
  assignee: string;
  text: string;
  status: ActionStatus;
}

export const meetingActions: ActionItem[] = [
  { id: "ac-1", assignee: "SL", text: "Finalize Q3 KPI cascade for Performance team", status: "Open" },
  { id: "ac-2", assignee: "RK", text: "Submit competency gap analysis for Analytics", status: "Done" },
  { id: "ac-3", assignee: "DP", text: "Circulate Leadership curriculum module 3 draft", status: "Open" },
  { id: "ac-4", assignee: "AW", text: "Approve training budget for PRG-02", status: "Open" },
];

// --- Development: training calendar -----------------------------------------

export interface TrainingSession {
  id: string;
  name: string;
  date: string;
  seats: string;
}

export const trainingSessions: TrainingSession[] = [
  { id: "ts-1", name: "Leadership Simulation Lab", date: "Mon · Jul 13 · 09:00", seats: "12 / 20" },
  { id: "ts-2", name: "Advanced Analytics Certification", date: "Wed · Jul 15 · 13:30", seats: "18 / 25" },
  { id: "ts-3", name: "Supervisor Coaching Clinic", date: "Fri · Jul 17 · 10:00", seats: "9 / 15" },
  { id: "ts-4", name: "Executive Presence Workshop", date: "Tue · Jul 21 · 14:00", seats: "6 / 12" },
];

// --- Milestones (owned by a Program; tasks link up to a milestone) ----------

export type MilestoneStatus = "Planned" | "In Progress" | "At Risk" | "Done";

export interface Milestone {
  id: string;
  programId: string;
  name: string;
  due: string; // ISO date
  status: MilestoneStatus;
  progress: number;
}

export const milestones: Milestone[] = [
  { id: "mst-101", programId: "PRG-01", name: "Competency matrix rollout", due: "2026-04-30", status: "Done", progress: 100 },
  { id: "mst-102", programId: "PRG-01", name: "Assess 100% of staff", due: "2026-08-15", status: "In Progress", progress: 62 },
  { id: "mst-103", programId: "PRG-01", name: "Launch 3 development programs", due: "2026-11-15", status: "Planned", progress: 20 },
  { id: "mst-201", programId: "PRG-02", name: "Curriculum design", due: "2026-04-20", status: "Done", progress: 100 },
  { id: "mst-202", programId: "PRG-02", name: "Pilot cohort", due: "2026-07-30", status: "In Progress", progress: 45 },
  { id: "mst-301", programId: "PRG-03", name: "KPI cascade automation", due: "2026-07-25", status: "In Progress", progress: 70 },
  { id: "mst-302", programId: "PRG-03", name: "SLA rules engine", due: "2026-06-30", status: "Done", progress: 100 },
  { id: "mst-303", programId: "PRG-03", name: "Executive dashboard live", due: "2026-10-10", status: "Planned", progress: 30 },
  { id: "mst-401", programId: "PRG-04", name: "CX survey redesign", due: "2026-07-20", status: "At Risk", progress: 40 },
  { id: "mst-402", programId: "PRG-04", name: "NPS mapping", due: "2026-08-30", status: "Planned", progress: 10 },
  { id: "mst-501", programId: "PRG-05", name: "SOP library migration", due: "2026-03-15", status: "Done", progress: 100 },
];
