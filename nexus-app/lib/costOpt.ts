// Cost Optimization — "Sistem Pengelolaan Kegiatan & Biaya Bagian (SPKB)".
//
// Domain model + constants + pure helpers for the activity & cost-management
// module described in the spec (Cost Optimization.docx). Philosophy:
// "Simple Process, Complete Evidence" — one activity = one proposal = one LPJ,
// every transaction has evidence, 100% digital archive.
//
// State lives in localStorage via useLocalState("cost-activities", …). Everything
// here is framework-free so it can be unit-reasoned and reused by exports.

// ---------------------------------------------------------------------------
// Proposal budget (Modul 1B) — fixed component catalogue.
export const BUDGET_COMPONENTS = [
  "Konsumsi", "Transport", "Hotel", "Tiket", "ATK", "Honor", "Sewa", "Lain-lain",
] as const;
export type BudgetComponent = (typeof BUDGET_COMPONENTS)[number];

// Activity type (Jenis Kegiatan).
export const ACTIVITY_TYPES = [
  "Pelatihan", "Coaching", "Rapat", "Sosialisasi", "Workshop",
  "Perjalanan Dinas", "Sertifikasi", "Lainnya",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// Payment methods (Modul 2).
export const PAYMENT_METHODS = ["Transfer", "Cash", "Corporate Card", "QRIS"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Proposal attachments checklist (Modul 1D).
export const PROPOSAL_ATTACHMENTS = ["TOR", "Jadwal", "Undangan", "RAB Pendukung"] as const;

// Evidence catalogue (Modul 3) — the "heart" of the system. Each category has a
// fixed checklist of expected documents; the LPJ can't close until the required
// ones are present.
export const EVIDENCE_CATEGORIES: { key: string; label: string; items: string[] }[] = [
  { key: "admin", label: "Evidence Administrasi", items: ["Proposal", "Approval", "Undangan", "Surat Tugas"] },
  { key: "finance", label: "Evidence Keuangan", items: ["Invoice", "Kwitansi", "Bukti Transfer", "e-Ticket", "Boarding Pass", "Bukti Hotel", "Bukti Pajak"] },
  { key: "execution", label: "Evidence Pelaksanaan", items: ["Foto Kegiatan", "Daftar Hadir", "Notulen", "Materi", "Sertifikat"] },
  { key: "travel", label: "Evidence Perjalanan Dinas", items: ["Tiket Pesawat/Kereta", "Boarding Pass", "Invoice Hotel", "Bukti Taksi", "Bukti Tol", "Bukti Parkir", "Foto Lokasi"] },
];

// KPI Pengelolaan (governance scorecard).
export const GOVERNANCE_KPIS: { kpi: string; target: string; good: (v: number) => boolean }[] = [
  { kpi: "Proposal disetujui tepat waktu", target: "≥95%", good: (v) => v >= 95 },
  { kpi: "LPJ selesai maksimal 7 hari kerja", target: "≥95%", good: (v) => v >= 95 },
  { kpi: "Kelengkapan evidence", target: "100%", good: (v) => v >= 100 },
  { kpi: "Selisih anggaran", target: "≤5%", good: (v) => v <= 5 },
  { kpi: "Outstanding LPJ", target: "0", good: (v) => v === 0 },
  { kpi: "Temuan audit administrasi", target: "0", good: (v) => v === 0 },
];

// ---------------------------------------------------------------------------
// Status model. One activity moves through proposal → execution → LPJ → closed.
// The spec's two workflow diagrams are unified into a single lifecycle.
export type ActivityStatus =
  | "Draft"
  | "Waiting Approval" // Submitted, awaiting AVP proposal approval
  | "Need Revision"
  | "Rejected"
  | "In Progress" // proposal approved, activity running / realisasi + evidence
  | "LPJ Review" // LPJ submitted, awaiting AVP verification
  | "Closed";

export const ACTIVITY_STATUSES: ActivityStatus[] = [
  "Draft", "Waiting Approval", "Need Revision", "Rejected", "In Progress", "LPJ Review", "Closed",
];

// Colour mapping from the spec's "Status Warna" legend.
export function statusTone(s: ActivityStatus): "gray" | "amber" | "blue" | "green" | "red" {
  switch (s) {
    case "Closed": return "green";
    case "Need Revision": return "amber";
    case "In Progress": return "blue";
    case "Waiting Approval": case "LPJ Review": return "amber";
    case "Rejected": return "red";
    default: return "gray";
  }
}

// ---------------------------------------------------------------------------
// Record shapes.
export interface BudgetLine {
  component: BudgetComponent;
  qty: number;
  price: number; // unit price (Harga)
}

export interface TravelDetail {
  kotaTujuan: string;
  tglBerangkat: string;
  tglPulang: string;
  moda: string;
  personel: number;
  tiket: number;
  hotel: number;
  uangHarian: number;
  taksi: number;
  tol: number;
  parkir: number;
}

export interface Realization {
  id: string;
  tanggal: string;
  nomorBukti: string;
  vendor: string;
  component: BudgetComponent;
  nominal: number;
  metode: PaymentMethod;
}

export interface LpjRealisasiLine {
  uraian: string;
  rencana: number;
  realisasi: number;
}

export interface Lpj {
  tujuan: string;
  pelaksanaan: string;
  hasil: string;
  manfaat: string;
  output: string;
  outcome: string;
  kendala: string;
  solusi: string;
  rekomendasi: string;
}

export interface Activity {
  id: string; // internal
  refNo: string; // ACT-2026-015
  // A. Informasi Kegiatan
  nama: string;
  jenis: ActivityType;
  tujuan: string;
  latarBelakang: string;
  output: string;
  tanggal: string;
  lokasi: string;
  penanggungJawab: string;
  peserta: string;
  // B. Estimasi Anggaran
  budget: BudgetLine[];
  // C. Biaya Perjalanan Dinas (optional)
  travel?: TravelDetail | null;
  // D. Lampiran (checklist of attachment names present)
  attachments: string[];
  // Modul 2 — realisasi biaya
  realizations: Realization[];
  // Modul 3 — evidence checklist: "category:item" keys that are ticked
  evidence: string[];
  // Modul 4 — LPJ
  lpj: Lpj;
  status: ActivityStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Pure helpers.
export const rupiah = (n: number) =>
  "Rp" + Math.round(n || 0).toLocaleString("id-ID");

export const budgetLineTotal = (l: BudgetLine) => (l.qty || 0) * (l.price || 0);

export const travelTotal = (t?: TravelDetail | null) =>
  t ? (t.tiket + t.hotel + t.uangHarian + t.taksi + t.tol + t.parkir) * Math.max(1, t.personel || 1) : 0;

export const plannedTotal = (a: Activity) =>
  a.budget.reduce((s, l) => s + budgetLineTotal(l), 0) + travelTotal(a.travel);

export const realizedTotal = (a: Activity) =>
  a.realizations.reduce((s, r) => s + (r.nominal || 0), 0);

// Variance % between plan and realisasi (positive = over budget).
export const variancePct = (a: Activity) => {
  const plan = plannedTotal(a);
  if (plan <= 0) return 0;
  return ((realizedTotal(a) - plan) / plan) * 100;
};

// Evidence completeness across all categories (0–100).
export const evidenceCompletion = (a: Activity) => {
  const total = EVIDENCE_CATEGORIES.reduce((s, c) => s + c.items.length, 0);
  if (!total) return 0;
  return Math.round((a.evidence.length / total) * 100);
};

export const evidenceKey = (cat: string, item: string) => `${cat}:${item}`;

// Next reference number, ACT-<year>-<zero-padded seq>, from existing refs.
export function nextRefNo(existing: Activity[], year: number): string {
  const prefix = `ACT-${year}-`;
  const max = existing
    .map((a) => a.refNo)
    .filter((r) => r.startsWith(prefix))
    .map((r) => parseInt(r.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((m, n) => Math.max(m, n), 0);
  return prefix + String(max + 1).padStart(3, "0");
}

export function emptyLpj(): Lpj {
  return { tujuan: "", pelaksanaan: "", hasil: "", manfaat: "", output: "", outcome: "", kendala: "", solusi: "", rekomendasi: "" };
}

// A fresh activity draft with an empty budget row per component removed (start blank).
export function newActivity(refNo: string, createdAt: string): Activity {
  return {
    id: refNo, refNo,
    nama: "", jenis: "Pelatihan", tujuan: "", latarBelakang: "", output: "",
    tanggal: "", lokasi: "", penanggungJawab: "", peserta: "",
    budget: [{ component: "Konsumsi", qty: 1, price: 0 }],
    travel: null, attachments: [], realizations: [], evidence: [],
    lpj: emptyLpj(), status: "Draft", createdAt,
  };
}
