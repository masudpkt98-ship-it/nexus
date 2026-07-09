"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { type Employee } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

/**
 * Name input backed by the imported Employee Directory ("employees" store).
 * Shows a type-ahead <datalist> of employee names; still allows a free-typed name.
 * Falls back to a plain input when no employees have been imported.
 * onPick fires when the typed value exactly matches a directory employee (e.g. to auto-fill a role).
 */
export function EmployeePicker({
  value,
  onChange,
  onPick,
  placeholderFallback,
  className,
}: {
  value: string;
  onChange: (name: string) => void;
  onPick?: (e: Employee) => void;
  placeholderFallback?: string;
  className?: string;
}) {
  const { t } = useI18n();
  // Read-only consumer of the imported Employee Directory. It must NEVER write the
  // "employees" store (that would risk clobbering the imported data), so we read
  // localStorage directly instead of useLocalState.
  const [emps, setEmps] = useState<Employee[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nexus-employees");
      if (raw) setEmps(JSON.parse(raw) as Employee[]);
    } catch {
      /* ignore */
    }
  }, []);
  const listId = "emp-" + useId().replace(/:/g, "");

  const options = useMemo(() => {
    const byName = new Map<string, string>();
    for (const e of emps) {
      if (e.name && !byName.has(e.name)) byName.set(e.name, e.position || e.unit || e.directorate || "");
    }
    return Array.from(byName, ([name, hint]) => ({ name, hint })).sort((a, b) => a.name.localeCompare(b.name));
  }, [emps]);

  const byName = useMemo(() => {
    const m = new Map<string, Employee>();
    for (const e of emps) if (e.name && !m.has(e.name)) m.set(e.name, e);
    return m;
  }, [emps]);

  const has = options.length > 0;

  return (
    <>
      <input
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v);
          const emp = byName.get(v);
          if (emp && onPick) onPick(emp);
        }}
        placeholder={has ? t("Search or type a name…") : placeholderFallback ?? t("e.g. Arif Wibowo")}
        list={has ? listId : undefined}
        autoComplete="off"
        className={className}
      />
      {has && (
        <datalist id={listId}>
          {options.map((o) => (
            <option key={o.name} value={o.name}>{o.hint}</option>
          ))}
        </datalist>
      )}
      {has && <span className="mt-1 block text-[10px] text-[var(--muted)]">{options.length} {t("from Employee Directory")}</span>}
    </>
  );
}
