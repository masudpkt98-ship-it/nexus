"use client";

import React, { useMemo, useRef, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, Avatar, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { NEXIAN_KEY, type Nexian, parseNexian, waLink } from "@/lib/nexian";

const fmt = (n: number) => n.toLocaleString("id-ID");
const selCls = "rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500";
const uniq = (rows: Nexian[], key: keyof Nexian) =>
  [...new Set(rows.map((r) => String(r[key] ?? "").trim()).filter(Boolean))].sort();
const roleTone = (role: string): "purple" | "blue" | "gray" =>
  /manajemen/i.test(role) ? "purple" : /partner/i.test(role) ? "blue" : "gray";
const initials = (name: string) => name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

export default function NexianPage() {
  const { t } = useI18n();
  const [team, setTeam] = useLocalState<Nexian[]>(NEXIAN_KEY, []);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState("");
  const [fUnit, setFUnit] = useState("");
  const [fRole, setFRole] = useState("");
  const [fPic, setFPic] = useState("");

  const onImport = async (file: File) => {
    setBusy(true);
    setNote(null);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const sheet = wb.SheetNames.find((n) => /kpi\s*partner/i.test(n)) ?? wb.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheet], { defval: "" });
      const members = parseNexian(rows);
      if (!members.length) {
        setNote(t("No rows found. Check the sheet has Nama / NPK / Role columns."));
      } else {
        setTeam(members);
        setNote(`${t("Imported")} ${members.length} Nexian — ${t("from sheet")} “${sheet}”.`);
      }
    } catch {
      setNote(t("Could not read the file. Make sure it is a valid .xlsx."));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return team.filter((r) => {
      if (fUnit && r.unit !== fUnit) return false;
      if (fRole && r.role !== fRole) return false;
      if (fPic && r.pic !== fPic) return false;
      if (needle && !`${r.name} ${r.npk} ${r.unit} ${r.role}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [team, q, fUnit, fRole, fPic]);

  const mgmt = team.filter((r) => /manajemen/i.test(r.role)).length;
  const partner = team.filter((r) => /partner/i.test(r.role) && !/manajemen/i.test(r.role)).length;
  const units = uniq(team, "unit").length;

  const stats = [
    { label: "Total Nexian", value: team.length, tone: "" },
    { label: "KPI Partner Manajemen", value: mgmt, tone: "purple" },
    { label: "KPI Partner", value: partner, tone: "blue" },
    { label: "Units covered", value: units, tone: "" },
  ] as const;

  return (
    <>
      <PageHeader
        title="Nexian"
        subtitle="The team driving Competency & Performance — KPI Partners per unit kerja"
        actions={
          <>
            {team.length > 0 && <Btn variant="ghost" onClick={() => { if (confirm(t("Remove all Nexian data from this browser?"))) setTeam([]); }}>{t("Clear data")}</Btn>}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); }} />
            <Btn variant="primary" onClick={() => fileRef.current?.click()}>
              <Icon.plus className="h-4 w-4" /> {busy ? t("Importing…") : t("Import Excel")}
            </Btn>
          </>
        }
      />

      {note && <div className="mb-4 rounded-lg border border-royal-500/30 bg-royal-500/5 px-3 py-2 text-[13px]">{note}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-[var(--muted)]">{t(s.label)}</div>
            <div className={cn("mt-1 text-2xl font-bold", s.tone === "purple" ? "text-violet-400" : s.tone === "blue" ? "text-royal-400" : "")}>{fmt(s.value)}</div>
          </Card>
        ))}
      </div>

      {team.length === 0 ? (
        <Card className="mt-4 text-center">
          <Icon.spark className="mx-auto h-10 w-10 text-[var(--muted)]" />
          <p className="mt-2 text-[14px] font-medium">{t("No Nexian imported yet")}</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] text-[var(--muted)]">
            {t("Use “Import Excel” to load Nexian.xlsx (KPI Partners). Read in your browser only — nothing is uploaded.")}
          </p>
          <p className="mt-2 text-[11px] text-[var(--muted)]">{t("Each Nexian will get KPI & module access scoped to their unit kerja.")}</p>
        </Card>
      ) : (
        <>
          <Card className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search name, NPK, unit…")} className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500" />
              </div>
              <select value={fUnit} onChange={(e) => setFUnit(e.target.value)} className={selCls}><option value="">{t("All units")}</option>{uniq(team, "unit").map((v) => <option key={v} value={v}>{v}</option>)}</select>
              <select value={fRole} onChange={(e) => setFRole(e.target.value)} className={selCls}><option value="">{t("All roles")}</option>{uniq(team, "role").map((v) => <option key={v} value={v}>{v}</option>)}</select>
              <select value={fPic} onChange={(e) => setFPic(e.target.value)} className={selCls}><option value="">{t("All PIC")}</option>{uniq(team, "pic").map((v) => <option key={v} value={v}>{v}</option>)}</select>
              <span className="text-[11px] text-[var(--muted)]">{fmt(filtered.length)} {t("shown")}</span>
            </div>
          </Card>

          <Card className="mt-4">
            <div className="max-h-[72vh] overflow-auto">
              <table className="w-full min-w-[820px] text-[12.5px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    {[t("Name"), "NPK", t("Unit Kerja"), t("Role"), "No WA", "PIC"].map((h, i) => (
                      <th key={i} className="sticky top-0 z-10 border-b bg-[rgb(var(--surface))] px-2 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const link = waLink(r.wa);
                    return (
                      <tr key={`${r.npk}-${i}`} className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-2">
                            <Avatar initials={initials(r.name) || "?"} />
                            <span className="font-medium">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 tabular-nums text-[var(--muted)]">{r.npk}</td>
                        <td className="px-2 py-1.5">{r.unit}</td>
                        <td className="px-2 py-1.5"><Badge tone={roleTone(r.role)}>{r.role}</Badge></td>
                        <td className="px-2 py-1.5">
                          {r.wa ? (
                            <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-500 hover:underline">
                              <Icon.satisfaction className="h-3.5 w-3.5" /> {r.wa}
                            </a>
                          ) : <span className="text-[var(--muted)]">—</span>}
                        </td>
                        <td className="px-2 py-1.5">{r.pic || <span className="text-[var(--muted)]">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
