// Shared, consistent pick-lists for Task Management (Backlog attributes).
// Everything here is meant to be chosen from a dropdown — never free-typed —
// so tasks stay categorized consistently (per Task.png / BusinessValue.png).

export type TaskCategory =
  | "Project"
  | "Improvement"
  | "Incident"
  | "Request"
  | "Maintenance"
  | "Compliance"
  | "Change"
  | "Research";

/** Kategori (Project, Improvement, Incident, Request, dll.) — from Task.png. */
export const TASK_CATEGORIES: { value: TaskCategory; tone: "blue" | "green" | "red" | "amber" | "violet" | "gray" }[] = [
  { value: "Project", tone: "blue" },
  { value: "Improvement", tone: "green" },
  { value: "Incident", tone: "red" },
  { value: "Request", tone: "amber" },
  { value: "Maintenance", tone: "violet" },
  { value: "Compliance", tone: "gray" },
  { value: "Change", tone: "blue" },
  { value: "Research", tone: "violet" },
];

export const categoryTone = (c?: string): "blue" | "green" | "red" | "amber" | "violet" | "gray" =>
  TASK_CATEGORIES.find((x) => x.value === c)?.tone ?? "gray";

/** Kategori Business Value — from BusinessValue.png. Consistent categories with
 *  their contoh manfaat (shown as helper text / tooltip). Picked, not typed. */
export const BUSINESS_VALUES: { value: string; benefit: string }[] = [
  { value: "Revenue Increase", benefit: "Meningkatkan pendapatan." },
  { value: "Cost Reduction", benefit: "Mengurangi biaya operasional." },
  { value: "Time Saving", benefit: "Menghemat waktu proses." },
  { value: "Productivity", benefit: "Meningkatkan produktivitas pengguna." },
  { value: "Customer Experience", benefit: "Meningkatkan kepuasan pengguna." },
  { value: "Employee Experience", benefit: "Mempermudah pekerjaan karyawan." },
  { value: "Data Quality", benefit: "Meningkatkan kualitas dan akurasi data." },
  { value: "Compliance", benefit: "Memenuhi regulasi atau audit." },
  { value: "Security", benefit: "Meningkatkan keamanan informasi." },
  { value: "Risk Reduction", benefit: "Mengurangi risiko operasional." },
  { value: "Innovation", benefit: "Mendukung transformasi digital dan inovasi." },
];

export const businessValueBenefit = (v?: string): string =>
  BUSINESS_VALUES.find((x) => x.value === v)?.benefit ?? "";

/** Estimasi Effort unit — jam atau hari kerja (Task.png). */
export type EffortUnit = "Jam" | "Hari";
export const EFFORT_UNITS: EffortUnit[] = ["Jam", "Hari"];

/** Target Sprint / Periode — generated so it is a dropdown, not free text.
 *  Quarters + months of the given year, newest-usable first (quarters, then months). */
export function periodOptions(year: number): string[] {
  const quarters = ["Q1", "Q2", "Q3", "Q4"].map((q) => `${q} ${year}`);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ].map((m) => `${m} ${year}`);
  return [...quarters, ...months];
}

/** Human effort label, e.g. "8 Jam" / "3 Hari". */
export function effortLabel(value?: number, unit?: EffortUnit): string {
  if (!value || value <= 0) return "";
  return `${value} ${unit ?? "Jam"}`;
}
