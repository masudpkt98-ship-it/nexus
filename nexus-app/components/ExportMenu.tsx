"use client";

import React, { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/PageHeader";
import { Icon } from "@/components/Icons";
import { type ExportKind } from "@/lib/perfExport";

// Small "Export ▾" dropdown letting the user pick Excel or PDF.
export function ExportMenu({ onSelect, label = "Export" }: { onSelect: (kind: ExportKind) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const pick = (k: ExportKind) => { setOpen(false); onSelect(k); };
  return (
    <div ref={ref} className="relative">
      <Btn variant="ghost" onClick={() => setOpen((o) => !o)}>
        <Icon.document className="h-4 w-4" /> {label} <Icon.chevron className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
      </Btn>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-lg border bg-[rgb(var(--surface))] py-1 shadow-glass">
          <button onClick={() => pick("excel")} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-black/5 dark:hover:bg-white/5">
            <span className="text-emerald-500">▦</span> Export Excel
          </button>
          <button onClick={() => pick("pdf")} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-black/5 dark:hover:bg-white/5">
            <span className="text-rose-500">▤</span> Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
