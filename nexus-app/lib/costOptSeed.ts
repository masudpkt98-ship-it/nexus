import type { Activity } from "./costOpt";
import { EVIDENCE_CATEGORIES, evidenceKey } from "./costOpt";

// Demo activities so the module is explorable out of the box. Names are role-based
// (no PII). Users create/replace these; they persist to localStorage on first edit.

const allEvidence = (cats: string[]) =>
  EVIDENCE_CATEGORIES.filter((c) => cats.includes(c.key)).flatMap((c) => c.items.map((i) => evidenceKey(c.key, i)));

export const costActivitiesSeed: Activity[] = [
  {
    id: "ACT-2026-001", refNo: "ACT-2026-001",
    nama: "Pelatihan Penyusunan KPI Berbasis Kompetensi",
    jenis: "Pelatihan",
    tujuan: "Meningkatkan kemampuan penyusunan KPI unit kerja.",
    latarBelakang: "Implementasi RKAP 2026 memerlukan KPI yang selaras kaskade.",
    output: "20 peserta mampu menyusun KPI SMART untuk unitnya.",
    tanggal: "2026-03-12", lokasi: "Ruang Training Lt. 3",
    penanggungJawab: "AVP People Development", peserta: "20 staf lintas departemen",
    budget: [
      { component: "Konsumsi", qty: 20, price: 75000 },
      { component: "ATK", qty: 20, price: 25000 },
      { component: "Honor", qty: 2, price: 1500000 },
      { component: "Sewa", qty: 1, price: 2000000 },
    ],
    travel: null,
    attachments: ["TOR", "Jadwal", "Undangan", "RAB Pendukung"],
    realizations: [
      { id: "r1", tanggal: "2026-03-12", nomorBukti: "INV-0091", vendor: "Katering Sejahtera", component: "Konsumsi", nominal: 1500000, metode: "Transfer" },
      { id: "r2", tanggal: "2026-03-10", nomorBukti: "INV-0088", vendor: "Toko ATK Makmur", component: "ATK", nominal: 480000, metode: "QRIS" },
      { id: "r3", tanggal: "2026-03-13", nomorBukti: "HR-0012", vendor: "Narasumber Eksternal", component: "Honor", nominal: 3000000, metode: "Transfer" },
      { id: "r4", tanggal: "2026-03-05", nomorBukti: "SW-0004", vendor: "Manajemen Gedung", component: "Sewa", nominal: 2000000, metode: "Corporate Card" },
    ],
    evidence: [...allEvidence(["admin", "finance", "execution"])],
    lpj: {
      tujuan: "Meningkatkan kemampuan penyusunan KPI unit kerja.",
      pelaksanaan: "Terlaksana penuh selama 1 hari, 12 Maret 2026.",
      hasil: "20 peserta hadir (100%), 3 materi tersampaikan.",
      manfaat: "Kompetensi perencanaan kinerja meningkat.",
      output: "20 peserta, 3 materi, 100% kehadiran.",
      outcome: "Kualitas KPI unit meningkat, target KPI tercapai.",
      kendala: "Jadwal peserta padat.", solusi: "Sesi dipadatkan menjadi setengah hari.",
      rekomendasi: "Adakan sesi lanjutan tiap triwulan.",
    },
    status: "Closed", createdAt: "2026-03-01",
  },
  {
    id: "ACT-2026-002", refNo: "ACT-2026-002",
    nama: "Coaching Clinic Manajemen Kinerja TW2",
    jenis: "Coaching",
    tujuan: "Pendampingan atasan dalam siklus penilaian kinerja.",
    latarBelakang: "Persiapan appraisal semester I.",
    output: "Seluruh AVP memahami mekanisme appraisal.",
    tanggal: "2026-05-20", lokasi: "Zoom + Ruang Rapat Utama",
    penanggungJawab: "AVP Performance Management", peserta: "12 AVP",
    budget: [
      { component: "Konsumsi", qty: 12, price: 60000 },
      { component: "Honor", qty: 1, price: 2500000 },
    ],
    travel: null,
    attachments: ["TOR", "Undangan"],
    realizations: [
      { id: "r1", tanggal: "2026-05-20", nomorBukti: "INV-0142", vendor: "Katering Sejahtera", component: "Konsumsi", nominal: 720000, metode: "QRIS" },
    ],
    evidence: [...allEvidence(["admin"])],
    lpj: { tujuan: "", pelaksanaan: "", hasil: "", manfaat: "", output: "", outcome: "", kendala: "", solusi: "", rekomendasi: "" },
    status: "In Progress", createdAt: "2026-05-05",
  },
  {
    id: "ACT-2026-003", refNo: "ACT-2026-003",
    nama: "Perjalanan Dinas Benchmarking Talent Management",
    jenis: "Perjalanan Dinas",
    tujuan: "Studi banding praktik talent management ke kantor pusat.",
    latarBelakang: "Penyusunan roadmap COMPASS 2026.",
    output: "Laporan benchmarking & rekomendasi implementasi.",
    tanggal: "2026-08-18", lokasi: "Jakarta",
    penanggungJawab: "AVP People Development", peserta: "3 personel",
    budget: [{ component: "Lain-lain", qty: 1, price: 500000 }],
    travel: {
      kotaTujuan: "Jakarta", tglBerangkat: "2026-08-18", tglPulang: "2026-08-20",
      moda: "Pesawat", personel: 3,
      tiket: 2200000, hotel: 900000, uangHarian: 500000, taksi: 300000, tol: 0, parkir: 100000,
    },
    attachments: ["TOR", "Jadwal"],
    realizations: [],
    evidence: [],
    lpj: { tujuan: "", pelaksanaan: "", hasil: "", manfaat: "", output: "", outcome: "", kendala: "", solusi: "", rekomendasi: "" },
    status: "Waiting Approval", createdAt: "2026-08-01",
  },
];
