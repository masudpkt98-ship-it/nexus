"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { type StrategicGoal } from "@/lib/data";

/**
 * Searchable single-select for the Strategic Objective. Type to filter goals;
 * pick one, or — when nothing matches — a notice appears and the typed text can
 * be committed as a manual objective.
 */
export function StrategicPicker({
  goals,
  goalId,
  manualText,
  onPick,
  onManual,
  onClear,
  className,
}: {
  goals: StrategicGoal[];
  goalId: string;
  manualText?: string;
  onPick: (id: string) => void;
  onManual: (text: string) => void;
  onClear: () => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const goalLabel = (g: StrategicGoal) => (g.code ? `${g.code} — ${g.title}` : g.title);
  const selectedGoal = goals.find((g) => g.id === goalId);
  const hasSelection = !!goalId || manualText !== undefined;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? goals.filter((g) => `${g.code ?? ""} ${g.title}`.toLowerCase().includes(q)) : goals;
    return list.slice(0, 60);
  }, [goals, query]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const startSearch = () => { onClear(); setQuery(""); setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); };

  if (hasSelection && !open) {
    return (
      <div ref={boxRef} className={cn(className, "flex items-center gap-2")}>
        {selectedGoal ? (
          <span className="min-w-0 flex-1 truncate"><Icon.strategy className="mr-1 inline h-3 w-3 text-violet-400" />{goalLabel(selectedGoal)}</span>
        ) : (
          <span className="min-w-0 flex-1 truncate"><span className="font-medium text-gold-500">✎ Manual:</span> {manualText || <span className="text-[var(--muted)]">(kosong)</span>}</span>
        )}
        <button type="button" onClick={startSearch} className="shrink-0 text-[11px] font-medium text-royal-400 hover:underline">ubah</button>
        <button type="button" onClick={onClear} className="shrink-0 text-[var(--muted)] hover:text-rose-400" aria-label="Hapus">✕</button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) {
            e.preventDefault();
            if (matches.length) onPick(matches[0].id); else onManual(query.trim());
            setOpen(false); setQuery("");
          } else if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Ketik untuk cari Strategic Goal…"
        autoComplete="off"
        className={className}
      />
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-auto rounded-lg border bg-[rgb(var(--surface))] py-1 shadow-glass">
          {matches.length > 0 ? (
            matches.map((g) => (
              <button key={g.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(g.id); setOpen(false); setQuery(""); }}
                className="flex w-full items-start gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-black/5 dark:hover:bg-white/5">
                <Icon.strategy className="mt-0.5 h-3 w-3 shrink-0 text-violet-400" />
                <span>{goalLabel(g)}</span>
              </button>
            ))
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-amber-500">
              <Icon.alert className="h-3.5 w-3.5" /> Tidak ada Strategic Goal yang cocok
            </div>
          )}
          {query.trim() && (
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onManual(query.trim()); setOpen(false); setQuery(""); }}
              className="mt-1 flex w-full items-center gap-2 border-t px-3 py-1.5 text-left text-[12px] font-medium text-royal-400 hover:bg-black/5 dark:hover:bg-white/5">
              <Icon.plus className="h-3 w-3" /> Isi manual: “{query.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
