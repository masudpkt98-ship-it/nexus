"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { type Employee } from "@/lib/data";

/**
 * Org-unit input backed by the Employee Directory ("nexus-employees").
 * Suggests every distinct Direktorat / Kompartemen / Unit Kerja (incl. subsidiary
 * companies like PT KMBU) via a <datalist>; a free-typed unit is still allowed.
 * Read-only consumer — never writes the employees store.
 */
export function UnitPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (unit: string) => void;
  className?: string;
}) {
  const [emps, setEmps] = useState<Employee[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nexus-employees");
      if (raw) setEmps(JSON.parse(raw) as Employee[]);
    } catch {
      /* ignore */
    }
  }, []);
  const listId = "unit-" + useId().replace(/:/g, "");

  const options = useMemo(() => {
    const map = new Map<string, string>(); // unit name → level hint
    const add = (name: unknown, level: string) => {
      const n = String(name ?? "").trim();
      if (n && !map.has(n)) map.set(n, level);
    };
    for (const e of emps) {
      add(e.directorate, "Direktorat");
      add(e.compartment, "Kompartemen");
      add(e.unit, "Unit Kerja");
    }
    return Array.from(map, ([name, hint]) => ({ name, hint })).sort((a, b) => a.name.localeCompare(b.name));
  }, [emps]);

  const has = options.length > 0;

  return (
    <>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={has ? "Cari / pilih unit kerja…" : "mis. Departemen Hukum / PT KMBU"}
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
      {has && <span className="mt-1 block text-[10px] text-[var(--muted)]">{options.length} unit dari Employee Directory</span>}
    </>
  );
}
