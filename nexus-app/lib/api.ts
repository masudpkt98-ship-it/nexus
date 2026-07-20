// ============================================================================
// NEXUS API client — talks to the Laravel REST API (Sanctum bearer tokens).
// Falls back gracefully to the local mock layer when the API is unreachable,
// so the UI keeps working for a standalone demo.
// ============================================================================

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const TOKEN_KEY = "nexus-token";
const USER_KEY = "nexus-user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser<T = any>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
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
    await fetch(`${BASE}/auth/logout`, { method: "POST", headers: headers() });
  } catch {
    /* ignore */
  }
  clearSession();
}

/** GET a resource. Unwraps Laravel's `{ data: ... }` envelope automatically. */
export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers(), cache: "no-store" });
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
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(`${method} ${path} failed`, res.status);
  const json = await res.json().catch(() => ({}));
  return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
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

/** True when a token exists (user authenticated against the real API). */
export function isAuthenticated(): boolean {
  return !!getToken();
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
