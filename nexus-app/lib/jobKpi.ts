"use client";
// Job Profile → responsibilities broken into KPIs (from an Excel template).
// Each responsibility carries one or more KPIs that can later be picked as KPI
// Items in Performance Planning.

export interface JobKpi { name: string; uom: string; target: string; weight: number; perspective: string }
export interface Responsibility { text: string; kpis: JobKpi[] }

const HEADERS = ["Jabatan", "Tanggung Jawab", "KPI", "Satuan", "Target", "Bobot (%)", "Perspektif"];
// Example rows — leave Jabatan/Tanggung Jawab blank to continue the row above.
const EXAMPLE: (string | number)[][] = [
  ["VP Audit Bisnis & Keuangan", "Menyusun rencana & program kerja audit tahunan", "Realisasi Program Kerja Audit", "%", "100", 30, "Internal Business Process"],
  ["", "", "Ketepatan Waktu Penyelesaian Audit", "%", "95", 20, "Internal Business Process"],
  ["", "Melaksanakan penugasan audit sesuai standar", "Temuan Signifikan Ditindaklanjuti", "%", "90", 25, "Internal Business Process"],
  ["", "", "Skor Kepuasan Auditee", "indeks", "80", 15, "Customer"],
  ["", "Mengembangkan kompetensi auditor", "Jam Pelatihan Auditor / Tahun", "jam", "40", 10, "Learning & Growth"],
  ["Operator Ammonia", "Mengoperasikan unit Ammonia secara aman & efisien", "Plant Availability", "%", "98", 40, "Internal Business Process"],
  ["", "", "Energy Consumption Index", "GJ/ton", "target", 30, "Financial"],
  ["", "Menjaga keselamatan proses", "Insiden Keselamatan (LTI)", "kasus", "0", 30, "Internal Business Process"],
];

export async function downloadKpiTemplate(): Promise<void> {
  const XLSX = await import("xlsx");
  const aoa: (string | number)[][] = [
    ["TEMPLATE KPI JABATAN — tiap Tanggung Jawab diisi satu atau beberapa KPI (satu KPI per baris)."],
    ["Kosongkan kolom Jabatan / Tanggung Jawab untuk melanjutkan baris di atasnya. Perspektif: Financial · Customer · Internal Business Process · Learning & Growth."],
    [],
    HEADERS,
    ...EXAMPLE,
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 32 }, { wch: 46 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 11 }, { wch: 26 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "KPI Jabatan");
  XLSX.writeFile(wb, "Template KPI Jabatan.xlsx");
}

export interface JobKpiExport {
  jabatan: string; kodeJabatan?: string; direktorat?: string; kompartemen?: string; departemen?: string;
  responsibilities: Responsibility[];
}

/** Export a job's responsibilities → KPIs to Excel (same layout as the template). */
export async function exportJobKpiExcel(d: JobKpiExport): Promise<void> {
  const XLSX = await import("xlsx");
  const info: (string | number)[][] = [["PROFIL JABATAN — KPI"], ["Jabatan", d.jabatan]];
  if (d.kodeJabatan) info.push(["Kode Jabatan", d.kodeJabatan]);
  if (d.direktorat) info.push(["Direktorat", d.direktorat]);
  if (d.kompartemen) info.push(["Kompartemen", d.kompartemen]);
  if (d.departemen) info.push(["Departemen", d.departemen]);
  const rows: (string | number)[][] = [HEADERS];
  let firstRow = true;
  for (const r of d.responsibilities) {
    const kpis = r.kpis.length ? r.kpis : [{ name: "", uom: "", target: "", weight: 0, perspective: "" }];
    kpis.forEach((k, i) => {
      rows.push([firstRow ? d.jabatan : "", i === 0 ? r.text : "", k.name, k.uom, k.target, k.weight || "", k.perspective]);
      firstRow = false;
    });
  }
  const ws = XLSX.utils.aoa_to_sheet([...info, [], ...rows]);
  ws["!cols"] = [{ wch: 32 }, { wch: 46 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 11 }, { wch: 26 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "KPI Jabatan");
  XLSX.writeFile(wb, `KPI Jabatan - ${d.jabatan.replace(/[\\/:*?"<>|]+/g, " ").trim()}.xlsx`.slice(0, 120));
}

/** Parse the filled template → Map<jabatan, Responsibility[]>. */
export async function parseKpiExcel(file: File): Promise<Map<string, Responsibility[]>> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer());
  const out = new Map<string, Responsibility[]>();
  const s = (v: unknown) => (v == null ? "" : String(v).trim());
  for (const sheet of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheet], { header: 1, defval: "" });
    const hi = rows.findIndex((r) => {
      const line = (r as unknown[]).map(s).join("|").toLowerCase();
      return line.includes("jabatan") && line.includes("kpi");
    });
    if (hi < 0) continue;
    const H = (rows[hi] as unknown[]).map((x) => s(x).toLowerCase());
    const col = (...names: string[]) => H.findIndex((h) => names.some((n) => h.includes(n)));
    const cJab = col("jabatan"), cResp = col("tanggung jawab", "tanggungjawab"), cKpi = col("kpi"),
      cUom = col("satuan", "uom"), cTgt = col("target"), cW = col("bobot", "weight"), cP = col("perspekt");
    let jab = "", resp = "";
    for (const raw of rows.slice(hi + 1)) {
      const r = raw as unknown[];
      const g = (i: number) => (i >= 0 ? s(r[i]) : "");
      const j = g(cJab); if (j) { jab = j; resp = ""; }
      const rs = g(cResp); if (rs) resp = rs;
      const kpi = g(cKpi);
      if (!jab || !kpi) continue;
      let list = out.get(jab); if (!list) { list = []; out.set(jab, list); }
      let R = list.find((x) => x.text === resp);
      if (!R) { R = { text: resp || "(Tanpa tanggung jawab)", kpis: [] }; list.push(R); }
      R.kpis.push({ name: kpi, uom: g(cUom), target: g(cTgt), weight: Number(g(cW)) || 0, perspective: g(cP) });
    }
  }
  return out;
}
