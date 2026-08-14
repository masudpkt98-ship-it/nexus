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
/** Employees the caller may see for one quarter (scoped by unit/directorate).
 *  Omit `period` to get the latest available quarter. */
export async function apiListEmployees(period?: string): Promise<import("./data").Employee[]> {
  const qs = period ? `?period=${encodeURIComponent(period)}` : "";
  return apiGet<import("./data").Employee[]>(`/employees${qs}`);
}
/** The Triwulan periods available within the caller's scope, newest first. */
export async function apiListEmployeePeriods(): Promise<string[]> {
  return apiGet<string[]>("/employees/periods");
}
/** One employee's record across every quarter — job history over time. */
export async function apiEmployeeHistory(
  npk: string,
): Promise<{ period: string; payload: import("./data").Employee }[]> {
  return apiGet(`/employees/${encodeURIComponent(npk)}/history`);
}
/** Bulk import ONE quarter's directory (admin only). `replace` clears only that
 *  period first (send on the first chunk); other quarters are never touched. */
export async function apiImportEmployees(
  employees: unknown[],
  period: string,
  replace = false,
): Promise<{ imported: number; total: number; period: string }> {
  return apiSend("POST", "/employees/import", { employees, period, replace });
}
/** Clear the directory. With `period`, clears only that quarter; without it, all. */
export async function apiClearEmployees(period?: string): Promise<void> {
  const qs = period ? `?period=${encodeURIComponent(period)}` : "";
  await apiSend("DELETE", `/employees${qs}`);
}

// ---- Corporate KPI catalogue (Performance Dictionary, top of the cascade) --
/** The corporate KPI catalogue — global, shared by every level's planning. */
export async function apiListCorporateKpis(): Promise<import("./data").CorporateKpi[]> {
  return apiGet<import("./data").CorporateKpi[]>("/corporate-kpis");
}
/** Create/update one corporate KPI (upsert by its client id). Needs performance.manage. */
export async function apiSaveCorporateKpi(kpi: import("./data").CorporateKpi): Promise<void> {
  await apiSend("POST", "/corporate-kpis", {
    kpi_id: kpi.id,
    code: kpi.code,
    name: kpi.name,
    perspective: kpi.perspective,
    unit: kpi.unit,
    target: kpi.target,
    strategic_goal_id: kpi.strategicGoalId ?? null,
    cascadable_to: kpi.cascadableTo ?? [],
  });
}
export async function apiDeleteCorporateKpi(id: string): Promise<void> {
  await apiSend("DELETE", `/corporate-kpis/${encodeURIComponent(id)}`);
}

// ---- KPI Teknis (Dictionary — technical KPIs per Job Profile) --------------
export async function apiListKpiTeknis(): Promise<import("./kpiTeknis").KpiTeknis[]> {
  return apiGet<import("./kpiTeknis").KpiTeknis[]>("/kpi-teknis");
}
/** Upsert one KPI Teknis by its client id. Needs performance.manage. */
export async function apiSaveKpiTeknis(k: import("./kpiTeknis").KpiTeknis): Promise<void> {
  const { id, jobProfileId, ...rest } = k;
  await apiSend("POST", "/kpi-teknis", { kpi_id: id, job_profile_id: jobProfileId, ...rest });
}
export async function apiDeleteKpiTeknis(id: string): Promise<void> {
  await apiSend("DELETE", `/kpi-teknis/${encodeURIComponent(id)}`);
}

// ---- Job Profiles (Dictionary — role master) -------------------------------
export async function apiListJobProfiles(): Promise<import("./data").JobProfile[]> {
  return apiGet<import("./data").JobProfile[]>("/job-profiles");
}
/** Upsert one Job Profile by its client id. Needs performance.manage. */
export async function apiSaveJobProfile(p: import("./data").JobProfile): Promise<void> {
  await apiSend("POST", "/job-profiles", {
    profile_id: p.id,
    role: p.role,
    level: p.level,
    unit: p.unit,
    purpose: p.purpose,
    responsibilities: p.responsibilities ?? [],
    kpi_ids: p.kpiIds ?? [],
  });
}
export async function apiDeleteJobProfile(id: string): Promise<void> {
  await apiSend("DELETE", `/job-profiles/${encodeURIComponent(id)}`);
}

// ---- Kamus Kompetensi (competency catalogue + proficiency scale) -----------
type DictComp = import("./data").DictionaryCompetency;
const dictBody = (c: DictComp) => ({
  comp_id: c.id,
  code: c.code,
  name: c.name,
  category: c.category,
  definition: c.definition ?? "",
  indicators: c.indicators ?? [],
  key_actions: c.keyActions ?? [],
  job_family: c.jobFamily ?? null,
  job_family_name: c.jobFamilyName ?? null,
  function_name: c.functionName ?? null,
});
export async function apiListCompetencyDictionary(): Promise<DictComp[]> {
  return apiGet<DictComp[]>("/competency-dictionary");
}
/** Upsert one dictionary competency by its client id. Needs competency.manage. */
export async function apiSaveDictionaryCompetency(c: DictComp): Promise<void> {
  await apiSend("POST", "/competency-dictionary", dictBody(c));
}
export async function apiDeleteDictionaryCompetency(id: string): Promise<void> {
  await apiSend("DELETE", `/competency-dictionary/${encodeURIComponent(id)}`);
}
/** Replace every competency in one category — the Excel import path (one round trip). */
export async function apiReplaceDictionaryCategory(category: string, items: DictComp[]): Promise<void> {
  await apiSend("PUT", "/competency-dictionary/bulk", { category, items: items.map(dictBody) });
}
export async function apiListCompetencyLevels(): Promise<import("./data").CompetencyLevelDef[]> {
  return apiGet<import("./data").CompetencyLevelDef[]>("/competency-levels");
}
/** Replace the whole proficiency scale. Needs competency.manage. */
export async function apiPutCompetencyLevels(levels: import("./data").CompetencyLevelDef[]): Promise<void> {
  await apiSend("PUT", "/competency-levels", { levels });
}

// ---- Top performers (Performance hub ranking) ------------------------------
// Cached client-side under the "appraisals" key, which is unrelated to the KPI
// cascade's /appraisals rows — same word, different data.
export interface TopPerformerDTO {
  id: string;
  name: string;
  avatar: string;
  role: string;
  score: number;
}
export async function apiListTopPerformers(): Promise<TopPerformerDTO[]> {
  return apiGet<TopPerformerDTO[]>("/top-performers");
}
/** Upsert one performer by its client id. Needs performance.manage. */
export async function apiSaveTopPerformer(p: TopPerformerDTO): Promise<void> {
  await apiSend("POST", "/top-performers", p);
}
export async function apiDeleteTopPerformer(id: string): Promise<void> {
  await apiSend("DELETE", `/top-performers/${encodeURIComponent(id)}`);
}

// ---- Training calendar (Development page) ----------------------------------
type TrainingDTO = import("./data").TrainingSession;
export async function apiListTrainingSessions(): Promise<TrainingDTO[]> {
  return apiGet<TrainingDTO[]>("/training-sessions");
}
/** Upsert one training session by its client id. Needs competency.manage. */
export async function apiSaveTrainingSession(s: TrainingDTO, position?: number): Promise<void> {
  await apiSend("POST", "/training-sessions", { ...s, position });
}
export async function apiDeleteTrainingSession(id: string): Promise<void> {
  await apiSend("DELETE", `/training-sessions/${encodeURIComponent(id)}`);
}

// ---- Cost Optimization (activity · proposal · realisasi · LPJ) -------------
type CostActivityDTO = import("./costOpt").Activity;
export async function apiListCostActivities(): Promise<CostActivityDTO[]> {
  return apiGet<CostActivityDTO[]>("/cost-activities");
}
/** Upsert one activity as a whole document. Needs cost.manage. */
export async function apiSaveCostActivity(a: CostActivityDTO): Promise<void> {
  await apiSend("POST", "/cost-activities", a);
}
export async function apiDeleteCostActivity(id: string): Promise<void> {
  await apiSend("DELETE", `/cost-activities/${encodeURIComponent(id)}`);
}

// ---- Satisfaction (NPS + per-service scores) -------------------------------
export interface SatisfactionDoc {
  counts: { promoters: number; passives: number; detractors: number };
  byService: { id: string; service: string; score: number }[];
}
export async function apiGetSatisfaction(): Promise<SatisfactionDoc> {
  const d = await apiGet<Partial<SatisfactionDoc>>("/satisfaction");
  return {
    counts: d?.counts ?? { promoters: 0, passives: 0, detractors: 0 },
    byService: d?.byService ?? [],
  };
}
/** Record one survey response (1–5 rating, optionally about one service). */
export async function apiSaveSatisfactionResponse(rating: number, serviceId?: string): Promise<void> {
  await apiSend("POST", "/satisfaction/responses", { rating, service_id: serviceId || null });
}
export async function apiSaveSatisfactionService(s: { id: string; service: string; score: number }, position?: number): Promise<void> {
  await apiSend("POST", "/satisfaction/services", { service_id: s.id, service: s.service, score: s.score, position });
}
export async function apiDeleteSatisfactionService(id: string): Promise<void> {
  await apiSend("DELETE", `/satisfaction/services/${encodeURIComponent(id)}`);
}

// ---- Meetings (meeting · agenda · action items) ----------------------------
type MeetingDTO = import("./data").Meeting;
type AgendaDTO = import("./data").AgendaItem;
type ActionDTO = import("./data").ActionItem;
export async function apiListMeetings(): Promise<MeetingDTO[]> {
  return apiGet<MeetingDTO[]>("/meetings");
}
/** Upsert one meeting by its client id. */
export async function apiSaveMeeting(m: MeetingDTO): Promise<void> {
  await apiSend("POST", "/meetings", m);
}
export async function apiDeleteMeeting(id: string): Promise<void> {
  await apiSend("DELETE", `/meetings/${encodeURIComponent(id)}`);
}
export async function apiListMeetingAgenda(): Promise<AgendaDTO[]> {
  return apiGet<AgendaDTO[]>("/meeting-agenda");
}
export async function apiSaveMeetingAgenda(a: AgendaDTO, position?: number): Promise<void> {
  await apiSend("POST", "/meeting-agenda", { ...a, position });
}
export async function apiDeleteMeetingAgenda(id: string): Promise<void> {
  await apiSend("DELETE", `/meeting-agenda/${encodeURIComponent(id)}`);
}
export async function apiListMeetingActions(): Promise<ActionDTO[]> {
  return apiGet<ActionDTO[]>("/meeting-actions");
}
export async function apiSaveMeetingAction(a: ActionDTO, position?: number): Promise<void> {
  await apiSend("POST", "/meeting-actions", { ...a, position });
}
export async function apiDeleteMeetingAction(id: string): Promise<void> {
  await apiSend("DELETE", `/meeting-actions/${encodeURIComponent(id)}`);
}

// ---- Program milestones ----------------------------------------------------
type MilestoneDTO = import("./data").Milestone;
export async function apiListMilestones(): Promise<MilestoneDTO[]> {
  return apiGet<MilestoneDTO[]>("/program-milestones");
}
/** Upsert one milestone by its client id. Needs programs.manage. */
export async function apiSaveMilestone(m: MilestoneDTO): Promise<void> {
  await apiSend("POST", "/program-milestones", {
    milestone_id: m.id,
    program_code: m.programId,
    name: m.name,
    due: m.due || null,
    status: m.status,
    progress: m.progress,
  });
}
export async function apiDeleteMilestone(id: string): Promise<void> {
  await apiSend("DELETE", `/program-milestones/${encodeURIComponent(id)}`);
}

// ---- COMPASS (gap levels · job descriptions · OJT) -------------------------
/** Current assessed levels as the Gap Analysis page's flat `npk|code` map. */
export async function apiGetCurrentLevels(): Promise<Record<string, number>> {
  return (await apiGet<Record<string, number>>("/competency-current-levels")) ?? {};
}
export async function apiSaveCurrentLevel(npk: string, code: string, level: number): Promise<void> {
  await apiSend("POST", "/competency-current-levels", { npk, comp_code: code, level });
}
/** Job descriptions as the Job Profile page's `jabatanKey` → JobDesc map. */
export async function apiGetJobDescriptions<T = unknown>(): Promise<Record<string, T>> {
  return (await apiGet<Record<string, T>>("/job-descriptions")) ?? {};
}
/** The Job Profile page's JobDesc, as far as persistence cares. */
export interface JobDescFields {
  jabatanName?: string;
  kodeJabatan?: string;
  direktorat?: string;
  kompartemen?: string;
  departemen?: string;
  purpose?: string;
  responsibilities?: unknown[];
  dimensi?: string;
  authority?: string;
  relations?: string;
  qualifications?: string;
  certifications?: string;
  risks?: string;
}
/** Upsert one or many job descriptions — an import saves the whole batch at once. */
export async function apiSaveJobDescriptions(entries: Record<string, JobDescFields>): Promise<void> {
  const items = Object.entries(entries).map(([key, d]) => ({
    desc_key: key,
    jabatan_name: d.jabatanName ?? null,
    kode_jabatan: d.kodeJabatan ?? null,
    direktorat: d.direktorat ?? null,
    kompartemen: d.kompartemen ?? null,
    departemen: d.departemen ?? null,
    purpose: d.purpose ?? "",
    responsibilities: d.responsibilities ?? [],
    dimensi: d.dimensi ?? null,
    authority: d.authority ?? null,
    relations: d.relations ?? null,
    qualifications: d.qualifications ?? "",
    certifications: d.certifications ?? "",
    risks: d.risks ?? "",
  }));
  if (!items.length) return;
  await apiSend("PUT", "/job-descriptions", { items });
}
export async function apiListOjtItems<T = unknown>(): Promise<T[]> {
  return apiGet<T[]>("/ojt-items");
}
/** Upsert one OJT / Job Shadowing item by its client id. */
export async function apiSaveOjtItem(o: { id: string; employee: string; role?: string; kind: string; activity?: string; mentor?: string; status: string }): Promise<void> {
  const { id, ...rest } = o;
  await apiSend("POST", "/ojt-items", { item_id: id, ...rest });
}

// ---- Competency Matrix (standards + assessed levels per group) -------------
export interface CompetencyMatrixDoc {
  standards: import("./data").CompetencyStandards;
  assessments: import("./data").CompetencyAssessments;
}
/** One call hydrates the whole Matrix page. */
export async function apiGetCompetencyMatrix(): Promise<CompetencyMatrixDoc> {
  const d = await apiGet<Partial<CompetencyMatrixDoc>>("/competency-matrix");
  return { standards: d?.standards ?? {}, assessments: d?.assessments ?? {} };
}
/** Set the required level for one competency in one group. Needs competency.manage. */
export async function apiSaveCompetencyStandard(groupKey: string, compId: string, level: number): Promise<void> {
  await apiSend("POST", "/competency-standards", { group_key: groupKey, comp_id: compId, required_level: level });
}
/** Upsert one assessed employee (whole level map) inside a group. */
export async function apiSaveCompetencyAssessment(groupKey: string, e: import("./data").MatrixEmployee): Promise<void> {
  await apiSend("POST", "/competency-assessments", { group_key: groupKey, npk: e.npk, name: e.name, levels: e.levels ?? {} });
}
export async function apiDeleteCompetencyAssessment(groupKey: string, npk: string): Promise<void> {
  const q = new URLSearchParams({ group_key: groupKey, npk });
  await apiSend("DELETE", `/competency-assessments?${q.toString()}`);
}

// ---- Development plans (IDP — Competency hub) ------------------------------
export interface DevPlanDTO {
  id: string;
  employee: string;
  avatar: string;
  role: string;
  readiness: number;
  gaps: number;
  nextStep: string;
}
/** Upsert one development plan by its client id. Needs competency.manage. */
export async function apiSaveDevelopmentPlan(p: DevPlanDTO): Promise<void> {
  const { id, ...rest } = p;
  await apiSend("POST", "/development-plans", { plan_id: id, ...rest });
}
export async function apiDeleteDevelopmentPlan(id: string): Promise<void> {
  await apiSend("DELETE", `/development-plans/${encodeURIComponent(id)}`);
}

// ---- Strategy (corporate artifact: vision / mission / values / swot / goals) --
type StrategyMission = { id: string; text: string };
type StrategyValue = { id: string; letter: string; title: string; description: string };
type StrategySwot = { id: string; type: string; text: string };
export interface StrategyDoc {
  vision: string;
  mission: StrategyMission[];
  values: StrategyValue[];
  swot: StrategySwot[];
  goals: import("./data").StrategicGoal[];
}
/** One call hydrates the whole Strategy page. */
export async function apiGetStrategy(): Promise<StrategyDoc> {
  return apiGet<StrategyDoc>("/strategy");
}
export async function apiSaveStrategyVision(vision: string): Promise<void> {
  await apiSend("PUT", "/strategy/vision", { vision });
}
/** Upsert a mission / core value / SWOT item. `kind` picks the shape. */
export async function apiSaveStrategyItem(
  kind: "mission" | "value" | "swot",
  item: StrategyMission | StrategyValue | StrategySwot,
): Promise<void> {
  const it = item as StrategyMission & StrategyValue & StrategySwot;
  await apiSend("POST", "/strategy/items", {
    kind, id: it.id, text: it.text, letter: it.letter,
    title: it.title, description: it.description, type: it.type,
  });
}
export async function apiDeleteStrategyItem(id: string): Promise<void> {
  await apiSend("DELETE", `/strategy/items/${encodeURIComponent(id)}`);
}
export async function apiSaveStrategyGoal(goal: import("./data").StrategicGoal): Promise<void> {
  await apiSend("POST", "/strategy/goals", { ...goal, id: goal.id });
}
export async function apiDeleteStrategyGoal(id: string): Promise<void> {
  await apiSend("DELETE", `/strategy/goals/${encodeURIComponent(id)}`);
}

// ---- Performance Planning — KPIs + Owners (server-enforced, unit-scoped) ---
export interface PlanningKpiDTO {
  kpi_id: string;
  unit_key: string;
  unit_name?: string | null;
  directorate?: string | null;
  compartment?: string | null;
  period: string;
  payload: PlanningKpi;
}
export interface PlanningOwnerDTO {
  unit_key: string;
  unit_name?: string | null;
  directorate?: string | null;
  compartment?: string | null;
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
  compartment?: string | null;
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
  compartment?: string | null;
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
