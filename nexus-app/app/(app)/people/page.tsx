"use client";

import React, { useMemo, useRef, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { employees as seed, type Employee } from "@/lib/data";
import { rowsToEmployees } from "@/lib/importEmployees";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";

const PAGE_SIZE = 50;
const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?";
const distinct = (list: Employee[], key: keyof Employee) =>
  Array.from(new Set(list.map((e) => String(e[key]).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));

export default function PeoplePage() {
  const { t } = useI18n();
  const [rows, setRows] = useLocalState<Employee[]>("employees", seed);
  const [q, setQ] = useState("");
  const [fDir, setFDir] = useState("");
  const [fLoc, setFLoc] = useState("");
  const [fGrade, setFGrade] = useState("");
  const [fGender, setFGender] = useState("");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const directorates = useMemo(() => distinct(rows, "directorate"), [rows]);
  const locations = useMemo(() => distinct(rows, "location"), [rows]);
  const grades = useMemo(() => distinct(rows, "pg").sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)), [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((e) => {
      if (fDir && e.directorate !== fDir) return false;
      if (fLoc && e.location !== fLoc) return false;
      if (fGrade && e.pg !== fGrade) return false;
      if (fGender && e.gender !== fGender) return false;
      if (needle && !(`${e.name} ${e.npk} ${e.position} ${e.unit}`.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, fDir, fLoc, fGrade, fGender]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const shown = filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  const resetPage = () => setPage(0);

  const onImport = async (file: File) => {
    setBusy(true);
    setNote(null);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      // prefer a sheet named like "Data Karyawan", else the first
      const name = wb.SheetNames.find((n) => /data\s*karyawan/i.test(n) && !/copy/i.test(n)) ?? wb.SheetNames[0];
      const ws = wb.Sheets[name];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const emps = rowsToEmployees(raw);
      if (emps.length === 0) {
        setNote(t("No rows found. Check the sheet has an NPK / Nama column."));
      } else {
        setRows(emps);
        resetPage();
        setNote(`${t("Imported")} ${emps.length} ${t("employees")} — ${t("from sheet")} “${name}”.`);
      }
    } catch (err) {
      setNote(t("Could not read the file. Make sure it is a valid .xlsx."));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const clearData = () => {
    if (!confirm(t("Remove all imported employee data from this browser?"))) return;
    setRows([]);
    resetPage();
    setNote(null);
  };

  const genderLabel = (g: string) => (g === "L" ? t("Male") : g === "P" ? t("Female") : g || "—");
  const maleCount = rows.filter((e) => e.gender === "L").length;
  const femaleCount = rows.filter((e) => e.gender === "P").length;

  const stats = [
    { label: "Total employees", value: rows.length },
    { label: "Directorates", value: directorates.length },
    { label: "Locations", value: locations.length },
    { label: "Male / Female", value: `${maleCount} / ${femaleCount}` },
  ];

  const selCls = "rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500";

  return (
    <>
      <PageHeader
        title="Employee Directory"
        subtitle="Master data karyawan — import dari Excel, cari & filter"
        actions={
          <>
            {rows.length > 0 && (
              <Btn variant="ghost" onClick={clearData}>
                {t("Clear data")}
              </Btn>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); }}
            />
            <Btn variant="primary" onClick={() => fileRef.current?.click()}>
              <Icon.plus className="h-4 w-4" /> {busy ? t("Importing…") : t("Import Excel")}
            </Btn>
          </>
        }
      />

      {note && (
        <div className="mb-4 rounded-xl border border-royal-500/30 bg-royal-500/10 px-4 py-2.5 text-[13px] text-royal-300">{note}</div>
      )}

      {rows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <Icon.users className="h-10 w-10 text-royal-400" />
          <p className="mt-4 text-sm font-medium">{t("No employees yet. Import an Excel file to get started.")}</p>
          <p className="mt-1 max-w-md text-xs text-[var(--muted)]">
            {t("The file is read in your browser only — nothing is uploaded or saved to the server. Expected columns: NPK, Nama, Jabatan, Unit Kerja, Direktorat, Lokasi, PG/JG, Gender…")}
          </p>
          <div className="mt-5">
            <Btn variant="primary" onClick={() => fileRef.current?.click()}>
              <Icon.plus className="h-4 w-4" /> {t("Import Excel")}
            </Btn>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <div className="text-xs text-[var(--muted)]">{t(s.label)}</div>
                <div className="mt-1 text-2xl font-bold">{s.value}</div>
              </Card>
            ))}
          </div>

          <Card className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); resetPage(); }}
                  placeholder={t("Search name, NPK, position…")}
                  className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500"
                />
              </div>
              <select value={fDir} onChange={(e) => { setFDir(e.target.value); resetPage(); }} className={selCls}>
                <option value="">{t("All directorates")}</option>
                {directorates.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
              <select value={fLoc} onChange={(e) => { setFLoc(e.target.value); resetPage(); }} className={selCls}>
                <option value="">{t("All locations")}</option>
                {locations.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
              <select value={fGrade} onChange={(e) => { setFGrade(e.target.value); resetPage(); }} className={selCls}>
                <option value="">{t("All grades")}</option>
                {grades.map((g) => (<option key={g} value={g}>{t("Grade")} {g}</option>))}
              </select>
              <select value={fGender} onChange={(e) => { setFGender(e.target.value); resetPage(); }} className={selCls}>
                <option value="">{t("All genders")}</option>
                <option value="L">{t("Male")}</option>
                <option value="P">{t("Female")}</option>
              </select>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs text-[var(--muted)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("Name")}</th>
                    <th className="px-3 py-2 font-medium">{t("Position")}</th>
                    <th className="px-3 py-2 font-medium">{t("Unit")}</th>
                    <th className="px-3 py-2 font-medium">{t("Directorate")}</th>
                    <th className="px-3 py-2 font-medium">{t("Location")}</th>
                    <th className="px-3 py-2 font-medium">{t("Grade")}</th>
                    <th className="px-3 py-2 font-medium">{t("Gender")}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((e) => (
                    <tr key={e.npk} dir="auto" className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar initials={initials(e.name)} />
                          <div className="min-w-0">
                            <div className="truncate font-medium">{e.name}</div>
                            <div className="text-[11px] text-[var(--muted)]">{e.npk}</div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[240px] px-3 py-2"><span className="line-clamp-2 text-xs">{e.position || "—"}</span></td>
                      <td className="px-3 py-2 text-xs text-[var(--muted)]">{e.unit || "—"}</td>
                      <td className="px-3 py-2 text-xs text-[var(--muted)]">{e.directorate || "—"}</td>
                      <td className="px-3 py-2 text-xs text-[var(--muted)]">{e.location || "—"}</td>
                      <td className="px-3 py-2">{e.pg ? <Badge tone="blue">{e.pg}</Badge> : <span className="text-xs text-[var(--muted)]">—</span>}</td>
                      <td className="px-3 py-2"><Badge tone={e.gender === "L" ? "blue" : e.gender === "P" ? "purple" : "gray"}>{genderLabel(e.gender)}</Badge></td>
                    </tr>
                  ))}
                  {shown.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-[13px] text-[var(--muted)]">{t("No employees match your filters.")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-[12px] text-[var(--muted)]">
              <span>{t("Showing")} {shown.length} {t("of")} {filtered.length} {t("employees")}{filtered.length !== rows.length ? ` (${rows.length} ${t("total")})` : ""}</span>
              {pageCount > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={clampedPage === 0} className="rounded-lg border px-2.5 py-1 transition hover:border-royal-500/40 disabled:opacity-40">{t("Prev")}</button>
                  <span>{t("Page")} {clampedPage + 1} / {pageCount}</span>
                  <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={clampedPage >= pageCount - 1} className="rounded-lg border px-2.5 py-1 transition hover:border-royal-500/40 disabled:opacity-40">{t("Next")}</button>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
