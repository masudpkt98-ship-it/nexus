"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { downloadBackup, restoreBackup } from "@/lib/backup";

/**
 * Topbar Export/Import control. Lets the user snapshot every localStorage data
 * store to a JSON file and restore it later — a safety net against losing data
 * to a cleared browser / different URL while modules are still localStorage-backed.
 */
export function BackupMenu() {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    setOpen(false);
    const n = downloadBackup();
    alert(`Cadangan berisi ${n} data diunduh sebagai file .json.`);
  };

  const onImport = async (file: File) => {
    if (!confirm("Pulihkan data dari file backup? Data dengan kunci yang sama akan ditimpa. Halaman akan dimuat ulang.")) return;
    try {
      const n = await restoreBackup(file);
      alert(`${n} data dipulihkan. Memuat ulang…`);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal memulihkan backup.");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--text)] dark:hover:bg-white/5"
        aria-label="Backup"
        title="Backup data (Export / Import)"
      >
        <Icon.document className="h-[18px] w-[18px]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 w-56 glass card p-1 shadow-glass animate-fade-up">
            <div className="px-2.5 py-1.5 text-[11px] font-semibold text-[var(--muted)]">Backup data</div>
            <button
              onClick={onExport}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Icon.document className="h-4 w-4 text-royal-400" /> Export ke file (.json)
            </button>
            <button
              onClick={() => { setOpen(false); fileRef.current?.click(); }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Icon.plus className="h-4 w-4 text-royal-400" /> Import dari file…
            </button>
            <p className="px-2.5 py-1.5 text-[10px] leading-snug text-[var(--muted)]">
              Menyimpan semua data lokal (KPI, direktori, dll.) kecuali sesi login.
            </p>
          </div>
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); if (fileRef.current) fileRef.current.value = ""; }}
      />
    </div>
  );
}
