// -----------------------------------------------------------------------------
// Per-employee / per-jabatan competency profile export — Excel (xlsx) + PDF
// (print-to-PDF), styled to match the app's other exports (banner, info box,
// navy tables). Technical carries a proficiency level; behavioral a tier.
// -----------------------------------------------------------------------------

export const PERUSAHAAN = "PT Pupuk Kalimantan Timur";
export type ExportKind = "excel" | "pdf";

export interface CompetencyExportData {
  employeeName?: string;
  employeeNpk?: string;
  jabatan: string;
  band: string;
  jobStream: string;
  sf: string;
  technical: { code: string; name: string; level: number; levelName: string }[];
  behavioral: { name: string; tier: string }[];
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

const fileBase = (d: CompetencyExportData) =>
  `Profil Kompetensi - ${(d.employeeName || d.jabatan).replace(/[\\/:*?"<>|]+/g, " ").trim()}`.slice(0, 120);

// ---- PDF (print window) ------------------------------------------------------
const CSS = `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 28px; font-size: 12px; }
  .banner { background: #ececec; text-align: center; padding: 16px; margin-bottom: 18px; }
  .banner h1 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: .5px; }
  .banner h2 { margin: 6px 0 0; font-size: 14px; font-weight: 600; }
  table.info { border-collapse: collapse; margin-bottom: 18px; }
  table.info td { border: 1px solid #999; padding: 5px 10px; font-size: 12px; }
  table.info td.k { background: #f0f0f0; font-weight: 600; width: 130px; }
  h3.sec { margin: 18px 0 8px; font-size: 13px; }
  table.t { border-collapse: collapse; width: 100%; }
  table.t th, table.t td { border: 1px solid #b9c0d6; padding: 5px 8px; font-size: 11px; vertical-align: top; }
  table.t thead th { background: #1f2a63; color: #fff; font-weight: 600; text-align: center; }
  .c { text-align: center; } .muted { color: #666; }
  @media print { body { margin: 12mm; } }
`;

function infoRows(d: CompetencyExportData): [string, string][] {
  const rows: [string, string][] = [];
  if (d.employeeName) rows.push(["Nama", d.employeeName]);
  if (d.employeeNpk) rows.push(["NPK", d.employeeNpk]);
  rows.push(["Jabatan", d.jabatan]);
  if (d.band) rows.push(["Band", d.band]);
  if (d.sf) rows.push(["Struktur", d.sf]);
  if (d.jobStream) rows.push(["Job Stream", d.jobStream]);
  return rows;
}

function toPdf(d: CompetencyExportData) {
  const info = infoRows(d).map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("");
  const tech = d.technical.length
    ? `<table class="t"><thead><tr><th style="width:70px">Kode</th><th>Kompetensi Teknis</th><th style="width:170px">Level Kecakapan</th></tr></thead><tbody>${
        d.technical.map((c) => `<tr><td class="c">${esc(c.code)}</td><td>${esc(c.name)}</td><td class="c">L${c.level} · ${esc(c.levelName)}</td></tr>`).join("")
      }</tbody></table>`
    : `<p class="muted">Tidak ada kompetensi teknis.</p>`;
  const beh = d.behavioral.length
    ? `<table class="t"><thead><tr><th>Kompetensi Perilaku</th><th style="width:120px">Tier</th></tr></thead><tbody>${
        d.behavioral.map((b) => `<tr><td>${esc(b.name)}</td><td class="c">${esc(b.tier)}</td></tr>`).join("")
      }</tbody></table>`
    : `<p class="muted">Tidak ada kompetensi perilaku.</p>`;

  const w = window.open("", "_blank", "width=1100,height=840");
  if (!w) { alert("Popup diblokir. Izinkan popup untuk Export PDF."); return; }
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${esc(fileBase(d))}</title><style>${CSS}</style></head>` +
    `<body><div class="banner"><h1>PROFIL KOMPETENSI JABATAN</h1><h2>${esc(PERUSAHAAN)}</h2></div>` +
    `<table class="info">${info}</table>` +
    `<h3 class="sec">Kompetensi Teknis (${d.technical.length})</h3>${tech}` +
    `<h3 class="sec">Kompetensi Perilaku (${d.behavioral.length})</h3>${beh}` +
    `</body></html>`,
  );
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch { /* ignore */ } }, 450);
}

// ---- Excel -------------------------------------------------------------------
async function toExcel(d: CompetencyExportData) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const head = infoRows(d);

  const techAoa: (string | number)[][] = [
    ["PROFIL KOMPETENSI JABATAN"], [PERUSAHAAN], [],
    ...head, [],
    ["Kode", "Kompetensi Teknis", "Level", "Level Kecakapan"],
    ...d.technical.map((c) => [c.code, c.name, c.level, c.levelName]),
  ];
  const wsT = XLSX.utils.aoa_to_sheet(techAoa);
  wsT["!cols"] = [{ wch: 10 }, { wch: 48 }, { wch: 7 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, wsT, "Kompetensi Teknis");

  const behAoa: (string | number)[][] = [
    ["PROFIL KOMPETENSI JABATAN"], [PERUSAHAAN], [],
    ...head, [],
    ["Kompetensi Perilaku", "Tier"],
    ...d.behavioral.map((b) => [b.name, b.tier]),
  ];
  const wsB = XLSX.utils.aoa_to_sheet(behAoa);
  wsB["!cols"] = [{ wch: 40 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsB, "Kompetensi Perilaku");

  XLSX.writeFile(wb, `${fileBase(d)}.xlsx`);
}

export function exportCompetencyProfile(kind: ExportKind, data: CompetencyExportData) {
  if (kind === "pdf") return toPdf(data);
  return toExcel(data);
}
