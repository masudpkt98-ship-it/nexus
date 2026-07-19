"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { type Employee } from "@/lib/data";

// Aggregate scopes offered at the top of the list.
const AGGREGATES = ["Seluruh Direktorat", "Seluruh Kompartemen", "Seluruh Departemen", "Seluruh Unit Kerja", "Seluruh Karyawan"];
const SEP = " · "; // multiple units joined with this separator

/**
 * Multi-select org-unit picker (KPI Owner / Data Manager). Offers aggregate
 * scopes + every Direktorat / Kompartemen / Unit Kerja from the Employee
 * Directory (incl. subsidiaries), allows free-typed manual entries, and lets you
 * combine several units. The value is a `SEP`-joined string.
 */
export function UnitPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
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

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => value.split(SEP).map((s) => s.trim()).filter(Boolean), [value]);

  const unitOptions = useMemo(() => {
    const map = new Map<string, string>();
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

  const allOptions = useMemo(
    () => [...AGGREGATES.map((name) => ({ name, hint: "Agregat" })), ...unitOptions],
    [unitOptions]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allOptions.filter((o) => !selected.includes(o.name) && (!q || o.name.toLowerCase().includes(q))).slice(0, 40);
  }, [allOptions, selected, query]);

  const canAddManual = query.trim() && !allOptions.some((o) => o.name.toLowerCase() === query.trim().toLowerCase()) && !selected.includes(query.trim());

  const addVal = (v: string) => {
    const n = v.trim();
    if (n && !selected.includes(n)) onChange([...selected, n].join(SEP));
    setQuery("");
  };
  const removeVal = (v: string) => onChange(selected.filter((x) => x !== v).join(SEP));

  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <div className={cn(className, "flex flex-wrap items-center gap-1 focus-within:border-royal-500")}>
        {selected.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-md bg-royal-500/12 px-1.5 py-0.5 text-[11px] font-medium text-royal-400">
            {s}
            <button type="button" onClick={() => removeVal(s)} className="text-royal-400/70 hover:text-rose-400" aria-label="Hapus">✕</button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) { e.preventDefault(); addVal(query); }
            else if (e.key === "Backspace" && !query && selected.length) removeVal(selected[selected.length - 1]);
          }}
          placeholder={selected.length ? "Tambah…" : "Cari / ketik unit kerja…"}
          autoComplete="off"
          className="min-w-[110px] flex-1 bg-transparent text-[13px] outline-none"
        />
      </div>
      {open && (matches.length > 0 || canAddManual) && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-52 overflow-auto rounded-lg border bg-[rgb(var(--surface))] py-1 shadow-glass">
          {canAddManual && (
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addVal(query)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-royal-400 hover:bg-black/5 dark:hover:bg-white/5">
              <Icon.plus className="h-3 w-3" /> Tambah manual: “{query.trim()}”
            </button>
          )}
          {matches.map((o) => (
            <button key={o.name} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addVal(o.name)}
              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-black/5 dark:hover:bg-white/5">
              <span className="truncate">{o.name}</span>
              <span className={cn("shrink-0 text-[10px]", o.hint === "Agregat" ? "font-semibold text-gold-500" : "text-[var(--muted)]")}>{o.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
