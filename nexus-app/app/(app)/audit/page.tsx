"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useApiAuthed } from "@/lib/auth";
import { apiListAudit, ApiError, type AuditLogDTO } from "@/lib/api";

// Tone per action family — denials stand out for security review.
function tone(action: string): "red" | "amber" | "green" | "blue" | "gray" {
  if (action.endsWith(".denied")) return "red";
  if (action.startsWith("auth.")) return "blue";
  if (action.endsWith(".deleted") || action === "employee.clear") return "amber";
  if (action.endsWith(".created") || action.endsWith(".updated") || action === "employee.import") return "green";
  return "gray";
}

export default function AuditPage() {
  const authed = useApiAuthed();
  const [rows, setRows] = useState<AuditLogDTO[]>([]);
  const [deniedOnly, setDeniedOnly] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "forbidden" | "offline">("idle");

  const load = useCallback(() => {
    if (!authed) return;
    setState("loading");
    apiListAudit({ deniedOnly, limit: 300 })
      .then((data) => { setRows(data); setState("idle"); })
      .catch((e) => setState(e instanceof ApiError && e.status === 403 ? "forbidden" : "offline"));
  }, [authed, deniedOnly]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle="Jejak keamanan · login · perubahan data · penolakan akses (khusus admin)"
        actions={
          <>
            <label className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
              <input type="checkbox" checked={deniedOnly} onChange={(e) => setDeniedOnly(e.target.checked)} className="accent-royal-500" /> Hanya penolakan
            </label>
            <Btn variant="ghost" onClick={load}><Icon.performance className="h-4 w-4" /> Muat ulang</Btn>
          </>
        }
      />

      {!authed || state === "offline" ? (
        <Card className="text-center text-[13px] text-[var(--muted)]">Masuk via API (admin) untuk melihat audit log. Pastikan API berjalan.</Card>
      ) : state === "forbidden" ? (
        <Card className="text-center text-[13px] text-rose-400">Akses ditolak — audit log hanya untuk admin.</Card>
      ) : (
        <div className="glass card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="border-b text-left text-[10px] uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2">Waktu</th>
                  <th className="px-3 py-2">Aksi</th>
                  <th className="px-3 py-2">Pengguna</th>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2">Detail</th>
                  <th className="px-3 py-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 align-top hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap px-3 py-2 text-[var(--muted)]">{r.created_at ? new Date(r.created_at).toLocaleString("id-ID") : "—"}</td>
                    <td className="px-3 py-2"><Badge tone={tone(r.action)}>{r.action}</Badge></td>
                    <td className="px-3 py-2 font-medium">{r.user_name || "—"}</td>
                    <td className="px-3 py-2 text-[var(--muted)]">{r.target || "—"}</td>
                    <td className="px-3 py-2 text-[var(--muted)]">
                      <span className="line-clamp-2">{r.meta ? Object.entries(r.meta).map(([k, v]) => `${k}: ${v}`).join(" · ") : ""}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-[var(--muted)]">{r.ip || "—"}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={6} className={cn("px-3 py-10 text-center text-[13px] text-[var(--muted)]")}>{state === "loading" ? "Memuat…" : "Belum ada entri audit."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
