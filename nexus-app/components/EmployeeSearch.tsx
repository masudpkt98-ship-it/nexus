"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import { readEmployees } from "@/lib/compass";
import { type Employee } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

/** Type-ahead search over the Employee Directory. Calls onSelect with the picked
 *  employee. Scales to thousands of rows (no giant dropdown). */
export function EmployeeSearch({ onSelect, placeholder, width = "w-72" }: { onSelect: (e: Employee) => void; placeholder?: string; width?: string }) {
  const { t } = useI18n();
  const [emps, setEmps] = useState<Employee[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { setEmps(readEmployees()); }, []);
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return emps.filter((e) => (e.name || "").toLowerCase().includes(needle)).slice(0, 40);
  }, [q, emps]);

  return (
    <div className={`relative ${width}`}>
      <div className="relative">
        <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={emps.length ? (placeholder ?? t("Type an employee name…")) : t("Sign in to load the employee directory")}
          className="w-full rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[13px] outline-none focus:border-royal-500"
        />
      </div>
      {matches.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-[rgb(var(--surface))] shadow-glass">
          {matches.map((e) => (
            <button key={e.npk || e.name} onClick={() => { onSelect(e); setQ(""); }} className="block w-full px-3 py-1.5 text-left hover:bg-black/5 dark:hover:bg-white/5">
              <div className="truncate text-[12px] font-medium">{e.name}</div>
              <div className="truncate text-[10px] text-[var(--muted)]">{e.position}{e.unit ? ` · ${e.unit}` : ""}</div>
            </button>
          ))}
        </div>
      )}
      {q.trim().length >= 2 && matches.length === 0 && emps.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-3 py-2 text-[12px] text-[var(--muted)] shadow-glass">{t("No employee matches.")}</div>
      )}
    </div>
  );
}
