"use client";
// -----------------------------------------------------------------------------
// Period-snapshot store (IndexedDB).
//
// Each reporting period (e.g. "2026 · Triwulan I") is frozen into its own
// immutable snapshot: the Employee Directory as it was that period, plus the
// Planning / Appraisal / Coaching rows imported for it. Later periods never
// mutate earlier ones — history & audit stay intact even as the Directory
// changes each quarter.
//
// Heavy payloads live in IndexedDB (large quota); a lightweight meta index is
// kept separately (localStorage, via the page) so listing/trends never load the
// full rows.
// -----------------------------------------------------------------------------
import type { Employee } from "./data";
import type { Row, DatasetKind, Gran } from "./perfMonitor";
import type { Exclusions } from "./kpiEligibility";

const DB_NAME = "nexus-perf";
const STORE = "snapshots";
const DB_VERSION = 1;

export interface DatasetMeta {
  fileName: string;
  sheet: string;
  rows: number; // raw rows in the imported sheet
  counted: number; // rows kept after rules + Directory join
  importedAt: string;
}

export interface SnapshotSummary {
  population: number; // Total Wajib KPI (Directory − NIK 9 − excluded)
  excluded: number; // employees excluded from Wajib KPI
  planningPct: number; // KPI Individu Approved %
  appraisalPct: number; // Appraisal Approved % for the period
  coachingPct: number; // coaching coverage %
}

export interface SnapshotMeta {
  id: string; // `${year}-${gran}-${value}`
  year: number;
  gran: Gran;
  value: number;
  label: string; // "2026 · Triwulan I"
  importedAt: string;
  directoryCount: number;
  datasets: Partial<Record<DatasetKind, DatasetMeta>>;
  summary: SnapshotSummary;
}

export interface Snapshot extends SnapshotMeta {
  directory: Employee[]; // frozen Directory for this period
  exclusions: Exclusions; // frozen Wajib-KPI exclusions for this period
  planning: Row[] | null;
  appraisal: Row[] | null;
  coaching: Row[] | null;
}

export const periodId = (year: number, gran: Gran, value: number) => `${year}-${gran}-${value}`;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("IndexedDB unavailable")); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      })
  );
}

export const getSnapshot = (id: string) => tx<Snapshot | undefined>("readonly", (s) => s.get(id)).then((r) => r ?? null);
export const putSnapshot = (snap: Snapshot) => tx("readwrite", (s) => s.put(snap)).then(() => undefined);
export const deleteSnapshot = (id: string) => tx("readwrite", (s) => s.delete(id)).then(() => undefined);
