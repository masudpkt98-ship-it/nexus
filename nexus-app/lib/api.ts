// ============================================================================
// NEXUS API client — talks to the Laravel REST API (Sanctum bearer tokens).
// Falls back gracefully to the local mock layer when the API is unreachable,
// so the UI keeps working for a standalone demo.
// ============================================================================

import type { PlanningKpi } from "./data";

// The API base must share the page's HOST so the httpOnly auth cookie counts as
// same-site (SameSite=Lax) and rides fetches in dev — e.g. page localhost:3999 →
// API localhost:8000 (not 127.0.0.1, which would be cross-site and drop the
// cookie). In production set NEXT_PUBLIC_API_URL (ideally same-origin "/api").
function resolveApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  return "http://127.0.0.1:8000/api";
}
const BASE = resolveApiBase();

const TOKEN_KEY = "nexus-token";
const USER_KEY = "nexus-user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: unknown) {
  // The token now lives in an httpOnly cookie set by the server — never persist
  // it in JS-readable storage (that's the whole point). Clear any legacy copy;
  // keep only the non-secret user object (for display + auth gating).
  void token;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser<T = any>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

/** Whether a real-API session exists. The token is an httpOnly cookie (unreadable
 *  by JS), so session presence is derived from the stored non-secret user. Use
 *  this to gate API calls (it replaced the old getToken() truthiness checks). */
export function hasSession(): boolean {
  return !!getStoredUser();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function headers(): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const t = getToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message || "Login failed", res.status);
  }
  const data = await res.json();
  setSession(data.token, data.user);
  return data;
}

export async function apiChangePassword(currentPassword: string, newPassword: string) {
  const res = await fetch(`${BASE}/auth/change-password`, {
    method: "POST",
    credentials: "include",
    headers: headers(),
    body: JSON.stringify({ current_password: currentPassword, password: newPassword, password_confirmation: newPassword }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message || "Change password failed", res.status);
  }
  const data = await res.json();
  if (data?.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function apiLogout() {
  try {
    await fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "include", headers: headers() });
  } catch {
    /* ignore */
  }
  clearSession();
}

/** GET a resource. Unwraps Laravel's `{ data: ... }` envelope automatically. */
export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers(), credentials: "include", cache: "no-store" });
  if (!res.ok) throw new ApiError(`GET ${path} failed`, res.status);
  const json = await res.json();
  return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
}

export async function apiSend<T = any>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(`${method} ${path} failed`, res.status);
  const json = await res.json().catch(() => ({}));
  return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
}

// ---- Audit trail (admin only) ----------------------------------------------
export interface AuditLogDTO {
  id: number;
  user_name?: string | null;
  action: string;
  target?: string | null;
  unit_key?: string | null;
  directorate?: string | null;
  ip?: string | null;
  meta?: Record<string, unknown> | null;
  created_at?: string | null;
}
export async function apiListAudit(opts: { deniedOnly?: boolean; action?: string; limit?: number } = {}): Promise<AuditLogDTO[]> {
  const q = new URLSearchParams();
  if (opts.deniedOnly) q.set("denied", "1");
  if (opts.action) q.set("action", opts.action);
  if (opts.limit) q.set("limit", String(opts.limit));
  const qs = q.toString();
  return apiGet<AuditLogDTO[]>(`/audit-logs${qs ? `?${qs}` : ""}`);
}

// ---- Employee Directory (PII, server-enforced, unit-scoped) ----------------
/** Employees the caller may see (scoped by unit/directorate). Returns the raw
 *  Employee records, ready to hydrate the client cache. */
export async function apiListEmployees(): Promise<import("./data").Employee[]> {
  return apiGet<import("./data").Employee[]>("/employees");
}
/** Bulk import the directory (admin only). `replace` clears first (send on the
 *  first chunk). */
export async function apiImportEmployees(employees: unknown[], replace = false): Promise<{ imported: number; total: number }> {
  return apiSend("POST", "/employees/import", { employees, replace });
}
export async function apiClearEmployees(): Promise<void> {
  await apiSend("DELETE", "/employees");
}

// ---- Performance Planning — KPIs + Owners (server-enforced, unit-scoped) ---
export interface PlanningKpiDTO {
  kpi_id: string;
  unit_key: string;
  unit_name?: string | null;
  directorate?: string | null;
  period: string;
  payload: PlanningKpi;
}
export interface PlanningOwnerDTO {
  unit_key: string;
  unit_name?: string | null;
  directorate?: string | null;
  jabatan?: string | null;
  name?: string | null;
  npk?: string | null;
}

/** List planned KPIs the caller may see (scoped by unit/directorate). */
export async function apiListPlanningKpis(year: string): Promise<PlanningKpiDTO[]> {
  return apiGet<PlanningKpiDTO[]>(`/planning-kpis?year=${encodeURIComponent(year)}`);
}
/** Upsert one planned KPI (server rejects out-of-scope units with 403). */
export async function apiSavePlanningKpi(payload: PlanningKpiDTO): Promise<PlanningKpiDTO> {
  return apiSend<PlanningKpiDTO>("POST", "/planning-kpis", payload);
}
export async function apiDeletePlanningKpi(kpiId: string): Promise<void> {
  await apiSend("DELETE", `/planning-kpis/${encodeURIComponent(kpiId)}`);
}
export async function apiListPlanningOwners(): Promise<PlanningOwnerDTO[]> {
  return apiGet<PlanningOwnerDTO[]>("/planning-owners");
}
export async function apiSavePlanningOwner(payload: PlanningOwnerDTO): Promise<PlanningOwnerDTO> {
  return apiSend<PlanningOwnerDTO>("POST", "/planning-owners", payload);
}

// ---- Performance Monitoring — Realisasi (server-enforced, unit-scoped) -----
export interface RealizationDTO {
  kpi_id: string;
  slot: string;
  year: string;
  unit_key?: string | null;
  unit_name?: string | null;
  directorate?: string | null;
  value?: number | null;
  evidence_type?: "upload" | "link" | null;
  evidence?: string | null;
  evidence_name?: string | null;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** List Realisasi the caller is allowed to see (scoped by unit/directorate). */
export async function apiListRealizations(year: string): Promise<RealizationDTO[]> {
  return apiGet<RealizationDTO[]>(`/realizations?year=${encodeURIComponent(year)}`);
}

/** Upsert one KPI's Realisasi for a slot. Server rejects (403) if the unit is
 *  outside the caller's scope. */
export async function apiSaveRealization(payload: RealizationDTO): Promise<RealizationDTO> {
  return apiSend<RealizationDTO>("POST", "/realizations", payload);
}

// ---- Performance Appraisal (server-enforced, unit-scoped) ------------------
export interface AppraisalDTO {
  unit_key: string;
  unit_name?: string | null;
  directorate?: string | null;
  year: string;
  status: "Drafted" | "Approved";
  version: number;
  pbi?: Record<string, { reward?: number; punishment?: number; skor?: number }> | null;
}

/** List appraisals the caller is allowed to see (scoped by unit/directorate). */
export async function apiListAppraisals(year: string): Promise<AppraisalDTO[]> {
  return apiGet<AppraisalDTO[]>(`/appraisals?year=${encodeURIComponent(year)}`);
}

/** Upsert one unit's appraisal (status/version/PBI). Server rejects (403) if the
 *  unit is outside the caller's scope, regardless of the client. */
export async function apiSaveAppraisal(payload: AppraisalDTO): Promise<AppraisalDTO> {
  return apiSend<AppraisalDTO>("POST", "/appraisals", payload);
}

// ---- Progress portal (cross-device employee self-service) ------------------
export interface ProgressMetric { done: boolean; label: string; tone: string; available: boolean }
export interface ProgressLookup {
  npk: string; name: string; position: string; unit: string; directorate: string; compartment: string;
  metrics: Record<string, ProgressMetric>;
  period: string;
}

/** Public: look up an employee's own progress by NPK + PIN (no auth). Never
 *  throws — returns a discriminated result so the caller can fall back locally. */
export async function apiLookupProgress(
  npk: string,
  pin: string
): Promise<{ ok: true; data: ProgressLookup } | { ok: false; status: number; message: string }> {
  try {
    const res = await fetch(`${BASE}/progress/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ npk, pin }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, message: json.message || "Gagal memuat" };
    return { ok: true, data: json as ProgressLookup };
  } catch {
    return { ok: false, status: 0, message: "offline" };
  }
}

/** Admin: publish a period's per-employee progress + access PINs to the server. */
export async function apiPublishProgress(payload: unknown): Promise<{ records: number; pins: number; period: string }> {
  return apiSend("POST", "/progress/publish", payload);
}

/** Download a binary response to a file (PDF/Excel/PPTX). Defaults to POST; pass
 *  method "GET" (with no body) for plain download endpoints. */
export async function apiDownload(
  path: string,
  body?: unknown,
  fallbackName = "download",
  method: "GET" | "POST" = "POST"
): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: headers(),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(`download ${path} failed`, res.status);
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") || "";
  const match = cd.match(/filename=([^;]+)/i);
  const name = match ? match[1].trim().replace(/["']/g, "") : fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** True when a user session exists (the token itself is an unreadable httpOnly
 *  cookie, so authentication is tracked via the stored non-secret user). */
export function isAuthenticated(): boolean {
  return !!getStoredUser();
}

/**
 * POST + consume a Server-Sent Events stream. Parses `data: {...}` frames and
 * dispatches them to `onEvent`. Used for token-by-token AI streaming.
 */
export async function apiStream(
  path: string,
  body: unknown,
  onEvent: (evt: any) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!res.ok || !res.body) throw new ApiError(`stream ${path} failed`, res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const json = dataLine.slice(5).trim();
      if (!json) continue;
      try {
        onEvent(JSON.parse(json));
      } catch {
        /* ignore malformed frame */
      }
    }
  }
}
