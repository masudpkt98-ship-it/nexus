"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { downloadBackup } from "@/lib/backup";

/**
 * Global listener for `nexus:storage-error` (emitted by useLocalState when a
 * localStorage write fails — quota full or storage blocked). Shows a persistent
 * warning so a failed save is never silent, and offers an immediate Export so
 * the user can rescue their in-memory data before it's lost.
 */
export function StorageGuard() {
  const [failedKey, setFailedKey] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const key = (e as CustomEvent).detail?.key ?? "";
      setFailedKey(typeof key === "string" ? key : "");
    };
    window.addEventListener("nexus:storage-error", handler);
    return () => window.removeEventListener("nexus:storage-error", handler);
  }, []);

  if (failedKey === null) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-500 shadow-glass backdrop-blur sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
      <div className="flex items-start gap-2">
        <Icon.alert className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex-1">
          <div className="font-semibold">Gagal menyimpan ke penyimpanan browser</div>
          <p className="mt-0.5 text-rose-500/90">
            Penyimpanan mungkin penuh atau diblokir{failedKey ? ` (${failedKey})` : ""}. Perubahan terakhir belum tersimpan
            dan bisa hilang saat halaman dimuat ulang. Export cadangan sekarang, lalu bebaskan ruang penyimpanan.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => { const n = downloadBackup(); alert(`Cadangan berisi ${n} data diunduh.`); }}
              className="rounded-lg border border-rose-500/40 px-2.5 py-1 text-[12px] font-medium transition hover:bg-rose-500/15"
            >
              Export backup
            </button>
            <button onClick={() => setFailedKey(null)} className="text-[12px] text-[var(--muted)] hover:text-rose-500">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
