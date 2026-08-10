// -----------------------------------------------------------------------------
// Local backup — export/import every "nexus-" data store to a JSON file. A safety
// net while modules still live in localStorage: the user can snapshot their data
// and restore it on another browser/URL, or after clearing site data.
//
// Auth/session keys are excluded so a restore never resurrects a stale token.
// -----------------------------------------------------------------------------

const EXCLUDE = new Set(["nexus-token", "nexus-user", "nexus-session"]);

export interface BackupFile {
  app: "nexus";
  version: 1;
  exportedAt: string;
  data: Record<string, string>; // storageKey → raw JSON string
}

/** Snapshot every persisted data store (excludes auth/session). */
export function collectBackup(exportedAt: string): BackupFile {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("nexus-") || EXCLUDE.has(key)) continue;
    const value = localStorage.getItem(key);
    if (value != null) data[key] = value;
  }
  return { app: "nexus", version: 1, exportedAt, data };
}

/** Trigger a download of the backup file. Returns the number of stores saved. */
export function downloadBackup(): number {
  const now = new Date();
  const backup = collectBackup(now.toISOString());
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nexus-backup-${now.toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return Object.keys(backup.data).length;
}

/**
 * Restore a backup file into localStorage. Returns the number of stores written.
 * Skips auth/session keys and non-nexus keys. Caller should reload so React
 * re-hydrates from the restored values.
 */
export async function restoreBackup(file: File): Promise<number> {
  const text = await file.text();
  let parsed: BackupFile;
  try {
    parsed = JSON.parse(text) as BackupFile;
  } catch {
    throw new Error("File tidak dapat dibaca — pastikan ini file backup NEXUS (.json).");
  }
  if (!parsed || parsed.app !== "nexus" || typeof parsed.data !== "object" || parsed.data == null) {
    throw new Error("File backup tidak valid (bukan backup NEXUS).");
  }
  let restored = 0;
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!key.startsWith("nexus-") || EXCLUDE.has(key) || typeof value !== "string") continue;
    localStorage.setItem(key, value);
    restored++;
  }
  return restored;
}
