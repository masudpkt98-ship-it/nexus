// -----------------------------------------------------------------------------
// Performance exports — Excel (main fields, via xlsx) + PDF (print-to-PDF,
// styled to match ExportPlanning.pdf: title banner, info box, navy KPI table
// grouped by perspective). Shared by Planning · Monitoring · Appraisal.
// -----------------------------------------------------------------------------

import { kpiPerspectives, type PlanningKpi } from "./data";
import {
  type PeriodSel, type RealizationMap, periodLabel, periodTarget, realizationKey, isActivePeriod, achievementRatio,
} from "./perfRealization";
import { rowRatio, displayPct, kpiSkor, appraisalTotals } from "./perfAppraisal";

export const PERUSAHAAN = "PT Pupuk Kalimantan Timur";
export type ExportKind = "excel" | "pdf";

// A unit's export payload: the info-box rows + its KPI list.
export interface ExportSection {
  info: [string, string][];
  kpis: PlanningKpi[];
}

const fmtNum = (v: number) => (v || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const byPerspective = (kpis: PlanningKpi[]) =>
  kpiPerspectives.map((p) => ({ p, rows: kpis.filter((k) => k.perspective === p) })).filter((g) => g.rows.length);

// ---- PDF (print window) ------------------------------------------------------
const CSS = `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 28px; font-size: 12px; }
  .banner { background: #ececec; text-align: center; padding: 16px; margin-bottom: 20px; }
  .banner h1 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: .5px; }
  .banner h2 { margin: 6px 0 0; font-size: 15px; font-weight: 600; }
  table.info { border-collapse: collapse; margin-bottom: 18px; }
  table.info td { border: 1px solid #999; padding: 5px 10px; font-size: 12px; }
  table.info td.k { background: #f0f0f0; font-weight: 600; width: 150px; }
  table.kpi { border-collapse: collapse; width: 100%; }
  table.kpi th, table.kpi td { border: 1px solid #b9c0d6; padding: 5px 8px; font-size: 11px; }
  table.kpi thead th { background: #1f2a63; color: #fff; font-weight: 600; text-align: center; }
  table.kpi td.persp { background: #eef1f8; font-weight: 600; text-align: center; }
  table.kpi td.total { background: #cfdcf3; font-weight: 700; text-align: center; }
  table.kpi td.sub { background: #cfdcf3; font-weight: 700; }
  table.kpi tfoot td { background: #1f2a63; color: #fff; font-weight: 700; }
  .r { text-align: right; } .c { text-align: center; }
  .section + .section { page-break-before: always; }
  @media print { body { margin: 12mm; } }
`;

function printDoc(subtitle: string, sectionsHtml: string) {
  const w = window.open("", "_blank", "width=1180,height=860");
  if (!w) { alert("Popup diblokir. Izinkan popup untuk Export PDF."); return; }
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>KPI — ${esc(subtitle)}</title><style>${CSS}</style></head>` +
    `<body><div class="banner"><h1>KEY PERFORMANCE INDICATORS</h1><h2>${esc(subtitle)}</h2></div>${sectionsHtml}</body></html>`
  );
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch { /* ignore */ } }, 450);
}

const infoBoxHtml = (rows: [string, string][]) =>
  `<table class="info">${rows.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>`;

// ---- Planning ----------------------------------------------------------------
const planningColsPdf = ["Satuan", "Target", "Polaritas"];
function planningTableHtml(kpis: PlanningKpi[]): string {
  const groups = byPerspective(kpis);
  let n = 0;
  const bodies = groups.map((g) => {
    const totalBobot = g.rows.reduce((s, k) => s + (k.weight || 0), 0);
    return g.rows.map((k, i) => {
      n += 1;
      const cells =
        `<td>${esc(k.name)}</td>` +
        `<td class="c">${esc(k.unit)}</td>` +
        `<td class="r">${fmtNum(k.annualTarget)}</td>` +
        `<td class="c">${esc(k.polarity)}</td>` +
        `<td class="r">${fmtNum(k.weight)}</td>`;
      return `<tr>${i === 0 ? `<td class="persp" rowspan="${g.rows.length}">${esc(g.p)}</td>` : ""}<td class="c">${n}</td>${cells}${i === 0 ? `<td class="total" rowspan="${g.rows.length}">${fmtNum(totalBobot)}</td>` : ""}</tr>`;
    }).join("");
  }).join("");
  return `<table class="kpi"><thead>
    <tr><th rowspan="2">Perspektif</th><th rowspan="2">No</th><th rowspan="2">KPI</th><th rowspan="2">Satuan</th><th rowspan="2">Target</th><th rowspan="2">Polaritas</th><th colspan="2">Bobot</th></tr>
    <tr><th>KPI</th><th>Total</th></tr>
  </thead><tbody>${bodies}</tbody></table>`;
}

// ---- Monitoring --------------------------------------------------------------
function monitoringTableHtml(kpis: PlanningKpi[], sel: PeriodSel, realizations: RealizationMap): string {
  const groups = byPerspective(kpis);
  let n = 0;
  const bodies = groups.map((g) =>
    g.rows.map((k, i) => {
      n += 1;
      const active = isActivePeriod(k, sel);
      const entry = realizations[realizationKey(k.id, sel)];
      const target = periodTarget(k, sel);
      const ratio = active && entry ? achievementRatio(entry.value, target, k.polarity || "Maximize") : 0;
      const per = active ? `${Math.round(ratio * 100)}%` : "Inactive";
      const cells = active
        ? `<td class="c">${esc(k.unit)}</td><td class="r">${fmtNum(k.annualTarget)}</td><td class="r">${entry ? fmtNum(entry.value) : "—"}</td><td class="r">${fmtNum(target)}</td><td class="c">${per}</td>`
        : `<td class="c">${esc(k.unit)}</td><td class="r">${fmtNum(k.annualTarget)}</td><td class="c" colspan="3">Inactive</td>`;
      return `<tr>${i === 0 ? `<td class="persp" rowspan="${g.rows.length}">${esc(g.p)}</td>` : ""}<td class="c">${n}</td><td>${esc(k.name)}</td>${cells}</tr>`;
    }).join("")
  ).join("");
  return `<table class="kpi"><thead>
    <tr><th>Perspektif</th><th>No</th><th>KPI</th><th>Satuan</th><th>Target Tahunan</th><th>Realisasi</th><th>Target ${esc(periodLabel(sel))}</th><th>Pencapaian</th></tr>
  </thead><tbody>${bodies}</tbody></table>`;
}

// ---- Appraisal ---------------------------------------------------------------
function appraisalTableHtml(kpis: PlanningKpi[], sel: PeriodSel, realizations: RealizationMap): string {
  const groups = byPerspective(kpis);
  let n = 0;
  const bodies = groups.map((g) => {
    let subBobot = 0, subSkor = 0;
    const rowsHtml = g.rows.map((k, i) => {
      n += 1;
      const ratio = rowRatio(k, sel, realizations);
      const active = ratio !== null;
      const entry = realizations[realizationKey(k.id, sel)];
      const target = periodTarget(k, sel);
      const skor = active ? kpiSkor(k, ratio) : 0;
      if (active) { subBobot += k.weight || 0; subSkor += skor; }
      const cells = active
        ? `<td class="c">${esc(k.unit)}</td><td class="r">${fmtNum(k.annualTarget)}</td><td class="r">${entry ? fmtNum(entry.value) : "—"}</td><td class="r">${fmtNum(target)}</td><td class="c">${displayPct(k, ratio).pct}% (A: ${displayPct(k, ratio).raw}%)</td><td class="r">${fmtNum(k.weight)}</td><td class="r">${fmtNum(skor)}</td>`
        : `<td class="c">${esc(k.unit)}</td><td class="r">${fmtNum(k.annualTarget)}</td><td class="c" colspan="5">Inactive</td>`;
      return `<tr>${i === 0 ? `<td class="persp" rowspan="${g.rows.length + 1}">${esc(g.p)}</td>` : ""}<td class="c">${n}</td><td>${esc(k.name)}</td>${cells}</tr>`;
    }).join("");
    const sub = `<tr><td class="sub c" colspan="6">Subtotal</td><td class="sub r">${fmtNum(subBobot)}</td><td class="sub r">${fmtNum(subSkor)}</td></tr>`;
    return rowsHtml + sub;
  }).join("");
  const t = appraisalTotals(kpis, sel, realizations);
  const foot = `<tfoot>
    <tr><td class="r" colspan="7">Total Bobot dan Skor</td><td class="r">${fmtNum(t.totalBobot)}</td><td class="r">${fmtNum(t.totalSkor)}</td></tr>
    <tr><td class="r" colspan="8">Pencapaian Skor KPI (%)</td><td class="r">${fmtNum(t.pencapaianPct)}</td></tr>
  </tfoot>`;
  return `<table class="kpi"><thead>
    <tr><th>Perspektif</th><th>No</th><th>KPI</th><th>Satuan</th><th>Target Th</th><th>Realisasi</th><th>Target ${esc(periodLabel(sel))}</th><th>Pencapaian</th><th>Bobot</th><th>Skor</th></tr>
  </thead><tbody>${bodies}</tbody>${foot}</table>`;
}

// ---- Excel (main fields) -----------------------------------------------------
async function writeExcel(fileBase: string, sheetName: string, aoa: (string | number)[][]) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${fileBase}.xlsx`);
}

function sectionInfoAoa(info: [string, string][]): (string | number)[][] {
  return [...info.map(([k, v]) => [k, v]), []];
}

// ---- Public entry points -----------------------------------------------------
export function exportPlanning(kind: ExportKind, subtitle: string, fileBase: string, sections: ExportSection[]) {
  if (kind === "pdf") {
    const html = sections.map((s) => `<div class="section">${infoBoxHtml(s.info)}${planningTableHtml(s.kpis)}</div>`).join("");
    return printDoc(subtitle, html);
  }
  const aoa: (string | number)[][] = [];
  for (const s of sections) {
    aoa.push(...sectionInfoAoa(s.info));
    aoa.push(["Perspektif", "KPI", "Satuan", "Target", "Polaritas", "Bobot"]);
    for (const k of byPerspective(s.kpis).flatMap((g) => g.rows))
      aoa.push([k.perspective, k.name, k.unit, k.annualTarget || 0, k.polarity, k.weight || 0]);
    aoa.push([]);
  }
  return writeExcel(fileBase, "Planning", aoa);
}

export function exportMonitoring(kind: ExportKind, subtitle: string, fileBase: string, sections: ExportSection[], sel: PeriodSel, realizations: RealizationMap) {
  if (kind === "pdf") {
    const html = sections.map((s) => `<div class="section">${infoBoxHtml(s.info)}${monitoringTableHtml(s.kpis, sel, realizations)}</div>`).join("");
    return printDoc(subtitle, html);
  }
  const aoa: (string | number)[][] = [];
  for (const s of sections) {
    aoa.push(...sectionInfoAoa(s.info));
    aoa.push(["Perspektif", "KPI", "Satuan", "Target Tahunan", "Realisasi", `Target ${periodLabel(sel)}`, "Pencapaian %"]);
    for (const k of byPerspective(s.kpis).flatMap((g) => g.rows)) {
      const active = isActivePeriod(k, sel);
      const entry = realizations[realizationKey(k.id, sel)];
      const target = periodTarget(k, sel);
      const pct = active && entry ? Math.round(achievementRatio(entry.value, target, k.polarity || "Maximize") * 100) : "";
      aoa.push([k.perspective, k.name, k.unit, k.annualTarget || 0, active ? (entry ? entry.value : "") : "Inactive", active ? target : "", active ? pct : ""]);
    }
    aoa.push([]);
  }
  return writeExcel(fileBase, "Monitoring", aoa);
}

export function exportAppraisal(kind: ExportKind, subtitle: string, fileBase: string, sections: ExportSection[], sel: PeriodSel, realizations: RealizationMap) {
  if (kind === "pdf") {
    const html = sections.map((s) => `<div class="section">${infoBoxHtml(s.info)}${appraisalTableHtml(s.kpis, sel, realizations)}</div>`).join("");
    return printDoc(subtitle, html);
  }
  const aoa: (string | number)[][] = [];
  for (const s of sections) {
    aoa.push(...sectionInfoAoa(s.info));
    aoa.push(["Perspektif", "KPI", "Satuan", "Realisasi", `Target ${periodLabel(sel)}`, "Pencapaian %", "Bobot", "Skor"]);
    for (const k of byPerspective(s.kpis).flatMap((g) => g.rows)) {
      const ratio = rowRatio(k, sel, realizations);
      const active = ratio !== null;
      const entry = realizations[realizationKey(k.id, sel)];
      const target = periodTarget(k, sel);
      aoa.push([k.perspective, k.name, k.unit, active ? (entry ? entry.value : "") : "Inactive", active ? target : "", active ? displayPct(k, ratio).pct : "", active ? k.weight || 0 : "", active ? kpiSkor(k, ratio) : ""]);
    }
    const t = appraisalTotals(s.kpis, sel, realizations);
    aoa.push(["", "", "", "", "", "Total", t.totalBobot, t.totalSkor]);
    aoa.push(["", "", "", "", "", "Pencapaian Skor KPI (%)", t.pencapaianPct, ""]);
    aoa.push([]);
  }
  return writeExcel(fileBase, "Appraisal", aoa);
}
