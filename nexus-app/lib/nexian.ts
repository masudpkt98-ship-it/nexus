// -----------------------------------------------------------------------------
// Nexian — the team that drives Competency & Performance (the KPI Partners).
// Two roles: "KPI Partner Manajemen" and "KPI Partner". Imported from Nexian.xlsx
// (sheet "KPI Partner 2026"). Each Nexian belongs to a Unit Kerja and will later
// get KPI/module access scoped to that unit.
// -----------------------------------------------------------------------------

export const NEXIAN_KEY = "nexian-team";

export const NEXIAN_ROLES = ["KPI Partner Manajemen", "KPI Partner"] as const;

export interface Nexian {
  unit: string; // Unit Kerja
  name: string; // Nama
  npk: string; // NPK
  wa: string; // No WA
  role: string; // KPI Partner Manajemen / KPI Partner
  pic: string; // PIC
}

const clean = (v: unknown) => String(v ?? "").trim();

// Parse the imported sheet → members (skips section-header / blank rows).
export function parseNexian(rows: Record<string, unknown>[]): Nexian[] {
  const pick = (r: Record<string, unknown>, keys: string[]) => {
    for (const k of keys) if (k in r) return r[k];
    return "";
  };
  const out: Nexian[] = [];
  for (const r of rows) {
    const name = clean(pick(r, ["Nama", "Name"]));
    const npk = clean(pick(r, ["NPK", "npk"])).replace(/\.0+$/, "");
    if (!name && !npk) continue; // grouping header or blank spacer
    out.push({
      unit: clean(pick(r, ["Unit kerja", "Unit Kerja", "Unit"])),
      name,
      npk,
      wa: clean(pick(r, ["No WA", "No. WA", "WA", "No WhatsApp", "Nomor WA"])),
      role: clean(pick(r, ["Role", "Peran"])),
      pic: clean(pick(r, ["PIC"])),
    });
  }
  return out;
}

// Build a wa.me link from a local Indonesian number.
export function waLink(wa: string): string {
  const d = wa.replace(/\D/g, "");
  if (!d) return "";
  const intl = d.startsWith("62") ? d : d.startsWith("0") ? "62" + d.slice(1) : "62" + d;
  return "https://wa.me/" + intl;
}
