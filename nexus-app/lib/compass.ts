"use client";
// -----------------------------------------------------------------------------
// COMPASS — shared helpers for the Competency Development modules. Resolves a
// job title / employee to its jabatan competency profile and links competency
// ids/names to the dictionary. All data comes from the committed seeds.
// -----------------------------------------------------------------------------
import { technicalCompetencyLevels, type DictionaryCompetency, type Employee, type JabatanCompetencyProfile } from "./data";
import { competencyDictionarySeed } from "./competencyDictionarySeed";
import { jabatanCompetencyProfiles } from "./jabatanCompetencyProfiles";
import { jabatanTitleMap } from "./jabatanTitleMap";

export const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const _byKey = new Map(jabatanCompetencyProfiles.map((p) => [p.key, p]));

/** Resolve a job title (Employee-Directory naming) to its competency profile. */
export function matchJabatan(position: string): JabatanCompetencyProfile | null {
  const np = norm(position);
  if (!np) return null;
  const mapped = jabatanTitleMap[np];
  return (mapped ? _byKey.get(mapped) : undefined) || _byKey.get(np) ||
    jabatanCompetencyProfiles.find((p) => p.key.includes(np) || np.includes(p.key)) || null;
}

const _techById = new Map<number, DictionaryCompetency>();
const _behByName = new Map<string, DictionaryCompetency>();
for (const c of competencyDictionarySeed) {
  if (c.category === "Kompetensi Teknis") {
    const n = parseInt(c.code.replace(/\D/g, ""), 10);
    if (n) _techById.set(n, c);
  } else if (c.category === "Perilaku") _behByName.set(norm(c.name), c);
}
export const techById = (id: number) => _techById.get(id);
export const behByName = (name: string) => _behByName.get(norm(name));

export const levels = technicalCompetencyLevels;
export const levelName = (l: number) => technicalCompetencyLevels.find((x) => x.level === l)?.name ?? `L${l}`;

/** Read the Employee Directory cached in localStorage (scoped, read-only). */
export function readEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem("nexus-employees");
    return raw ? (JSON.parse(raw) as Employee[]) : [];
  } catch {
    return [];
  }
}

/** A competency line resolved for display: code, name, required level. */
export interface ResolvedTech { code: string; name: string; level: number; levelName: string; definition: string }
export function resolveTech(p: JabatanCompetencyProfile): ResolvedTech[] {
  return p.tech.map((tc) => {
    const c = tc.c ? _techById.get(tc.c) : undefined;
    return {
      code: c?.code ?? (tc.c ? `TC-${tc.c}` : "—"),
      name: c?.name ?? tc.n ?? `#${tc.c}`,
      level: tc.l,
      levelName: levelName(tc.l),
      definition: c?.definition ?? "",
    };
  }).sort((a, b) => b.level - a.level);
}

export const tierTone = (t: string): "green" | "blue" | "gray" =>
  t === "Inti" ? "green" : t === "Primer" ? "blue" : "gray";
export const levelTone = (l: number): "gray" | "blue" | "amber" | "green" | "red" =>
  l >= 5 ? "green" : l >= 4 ? "blue" : l >= 3 ? "amber" : "gray";
