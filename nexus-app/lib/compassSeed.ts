// COMPASS tracking-module types + sample (dummy) seed data. These modules
// capture data that doesn't exist elsewhere yet; the seeds make them
// demonstrable and are meant to be replaced by real records.

export type LmsType = "Video" | "PDF" | "Animasi" | "eBook" | "Quiz" | "SOP";
export interface LmsModule {
  id: string;
  title: string;
  competency: string; // linked competency topic
  type: LmsType;
  duration: string; // e.g. "15 menit"
  level: number; // target level 1..5
}

export interface JourneyWeek { week: number; items: string[] }
export interface LearningJourney {
  id: string;
  employee: string;
  role: string;
  weeks: JourneyWeek[];
  progress: number; // 0..100
}

export type OjtStatus = "Belum" | "Berjalan" | "Selesai";
export interface OjtItem { id: string; employee: string; role: string; kind: "OJT" | "Job Shadowing"; activity: string; mentor: string; status: OjtStatus }

export type SessionKind = "Mentoring" | "Coaching";
export interface MentoringSession {
  id: string;
  employee: string;
  mentor: string;
  kind: SessionKind;
  topic: string;
  notes: string;
  actionPlan: string;
  date: string;
}

export type AssessMethod = "Quiz" | "Praktik" | "Wawancara" | "Observasi" | "Studi Kasus" | "Simulasi";
export type AssessStatus = "Dijadwalkan" | "Dinilai" | "Lulus" | "Tidak Lulus";
export interface AssessmentRecord {
  id: string;
  employee: string;
  competency: string;
  method: AssessMethod;
  assessor: string;
  score: number | null; // 0..100
  status: AssessStatus;
  date: string;
}

export type CertStatus = "Competent" | "In Progress" | "Expired";
export interface CertificationRecord {
  id: string;
  employee: string;
  title: string; // e.g. "Operator Ammonia Level 2"
  level: string;
  status: CertStatus;
  issued: string; // date
  expires?: string;
}

// ---- sample data (role-based, no real employee PII) -------------------------
export const lmsSeed: LmsModule[] = [
  { id: "lms-01", title: "Pengenalan Keselamatan Proses", competency: "Keselamatan Proses (Process Safety)", type: "Video", duration: "15 menit", level: 1 },
  { id: "lms-02", title: "Membaca P&ID", competency: "Instrumentasi dan Sistem Kontrol", type: "Animasi", duration: "20 menit", level: 3 },
  { id: "lms-03", title: "SOP Start-up Pompa Sentrifugal", competency: "Pemeliharaan Peralatan Rotating", type: "SOP", duration: "—", level: 2 },
  { id: "lms-04", title: "Operasi Unit Proses Produksi", competency: "Operasi Proses Produksi", type: "Video", duration: "25 menit", level: 2 },
  { id: "lms-05", title: "Troubleshooting Loop Kontrol", competency: "Instrumentasi dan Sistem Kontrol", type: "eBook", duration: "—", level: 3 },
  { id: "lms-06", title: "Quiz Keselamatan Kerja", competency: "Keselamatan Proses (Process Safety)", type: "Quiz", duration: "10 soal", level: 1 },
  { id: "lms-07", title: "Analisis Laboratorium Dasar", competency: "Analisis Laboratorium dan Mutu", type: "PDF", duration: "—", level: 1 },
  { id: "lms-08", title: "Manajemen Kinerja & Cascading KPI", competency: "Performance Management", type: "Video", duration: "18 menit", level: 2 },
  { id: "lms-09", title: "Perencanaan Strategis Perusahaan", competency: "Strategic Planning Management", type: "eBook", duration: "—", level: 2 },
  { id: "lms-10", title: "Quiz Instrumentasi", competency: "Instrumentasi dan Sistem Kontrol", type: "Quiz", duration: "12 soal", level: 2 },
  { id: "lms-11", title: "Pemeliharaan Preventif Rotating", competency: "Pemeliharaan Peralatan Rotating", type: "Animasi", duration: "22 menit", level: 2 },
  { id: "lms-12", title: "Good Corporate Governance", competency: "Compliance", type: "PDF", duration: "—", level: 3 },
];

export const journeySeed: LearningJourney[] = [
  {
    id: "lj-01", employee: "Kandidat Operator Ammonia", role: "Operator Ammonia", progress: 60,
    weeks: [
      { week: 1, items: ["Company Orientation", "Keselamatan Proses"] },
      { week: 2, items: ["Process Flow Diagram (PFD)"] },
      { week: 3, items: ["Equipment & Rotating"] },
      { week: 4, items: ["SOP Operasi"] },
      { week: 5, items: ["On-the-Job Training (OJT)"] },
    ],
  },
  {
    id: "lj-02", employee: "Kandidat Analis Laboratorium", role: "Analis Lab Mutu", progress: 40,
    weeks: [
      { week: 1, items: ["Company Orientation", "Keselamatan Kerja Lab"] },
      { week: 2, items: ["Metode Sampling & Pengujian"] },
      { week: 3, items: ["Analisis Rutin & Pencatatan"] },
      { week: 4, items: ["Validasi Hasil & QA/QC"] },
    ],
  },
];

export const ojtSeed: OjtItem[] = [
  { id: "ojt-01", employee: "Kandidat Operator Ammonia", role: "Operator Ammonia", kind: "OJT", activity: "Start-up Pump", mentor: "Supervisor Operasi", status: "Selesai" },
  { id: "ojt-02", employee: "Kandidat Operator Ammonia", role: "Operator Ammonia", kind: "OJT", activity: "Shutdown Pump", mentor: "Supervisor Operasi", status: "Berjalan" },
  { id: "ojt-03", employee: "Kandidat Operator Ammonia", role: "Operator Ammonia", kind: "OJT", activity: "Sampling & Membaca Instrument", mentor: "Supervisor Operasi", status: "Belum" },
  { id: "ojt-04", employee: "Kandidat Operator Ammonia", role: "Operator Ammonia", kind: "Job Shadowing", activity: "Mengikuti inspeksi lapangan", mentor: "Senior Operator", status: "Selesai" },
  { id: "ojt-05", employee: "Kandidat Operator Ammonia", role: "Operator Ammonia", kind: "Job Shadowing", activity: "Mengikuti start-up plant", mentor: "Senior Operator", status: "Berjalan" },
  { id: "ojt-06", employee: "Kandidat Operator Ammonia", role: "Operator Ammonia", kind: "Job Shadowing", activity: "Mengikuti meeting harian", mentor: "Supervisor Operasi", status: "Belum" },
];

export const mentoringSeed: MentoringSession[] = [
  { id: "mc-01", employee: "Kandidat Operator Ammonia", mentor: "Senior Operator", kind: "Mentoring", topic: "Tips Operasi Unit Ammonia", notes: "Berbagi pengalaman & best practice pengoperasian aman.", actionPlan: "Praktik SOP start-up minggu depan.", date: "2026-10-05" },
  { id: "mc-02", employee: "Kandidat Operator Ammonia", mentor: "Supervisor Operasi", kind: "Coaching", topic: "Peningkatan Performa", notes: "Kendala: belum percaya diri saat troubleshooting.", actionPlan: "Dampingi 3 sesi troubleshooting; review mingguan.", date: "2026-10-12" },
  { id: "mc-03", employee: "Kandidat Analis Laboratorium", mentor: "VP Lab Mutu", kind: "Mentoring", topic: "Akurasi Analisis", notes: "Diskusi metode validasi hasil.", actionPlan: "Ikuti program QA/QC internal.", date: "2026-10-09" },
];

export const assessmentSeed: AssessmentRecord[] = [
  { id: "as-01", employee: "Kandidat Operator Ammonia", competency: "Keselamatan Proses (Process Safety)", method: "Quiz", assessor: "HSE Officer", score: 88, status: "Lulus", date: "2026-10-06" },
  { id: "as-02", employee: "Kandidat Operator Ammonia", competency: "Operasi Proses Produksi", method: "Praktik", assessor: "Supervisor Operasi", score: 82, status: "Lulus", date: "2026-10-14" },
  { id: "as-03", employee: "Kandidat Operator Ammonia", competency: "Instrumentasi dan Sistem Kontrol", method: "Studi Kasus", assessor: "Mentor", score: null, status: "Dijadwalkan", date: "2026-10-20" },
  { id: "as-04", employee: "Kandidat Analis Laboratorium", competency: "Analisis Laboratorium dan Mutu", method: "Observasi", assessor: "VP Lab Mutu", score: 79, status: "Dinilai", date: "2026-10-11" },
];

export const certificationSeed: CertificationRecord[] = [
  { id: "ct-01", employee: "Kandidat Operator Ammonia", title: "Operator Ammonia Level 2", level: "Level 2", status: "Competent", issued: "2026-10-15", expires: "2029-10-15" },
  { id: "ct-02", employee: "Kandidat Analis Laboratorium", title: "Analis Laboratorium Mutu Level 1", level: "Level 1", status: "In Progress", issued: "—" },
];
