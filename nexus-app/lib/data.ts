// ============================================================================
// NEXUS — Mock data layer (stands in for the Laravel REST API / PostgreSQL)
// ============================================================================

export type Role =
  | "Administrator"
  | "VP"
  | "Manager"
  | "Supervisor"
  | "Staff"
  | "Internal Customer"
  | "Executive";

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
  avatar: string; // initials
  email: string;
}

export const currentUser: User = {
  id: "u-001",
  name: "Arif Wibowo",
  role: "VP",
  title: "VP Competency & Performance",
  avatar: "AW",
  email: "arif.wibowo@nexus.co",
};

export const demoUsers: User[] = [
  currentUser,
  { id: "u-002", name: "Sinta Larasati", role: "Manager", title: "Manager Performance", avatar: "SL", email: "sinta@nexus.co" },
  { id: "u-003", name: "Dimas Prakoso", role: "Supervisor", title: "Supervisor Development", avatar: "DP", email: "dimas@nexus.co" },
  { id: "u-004", name: "Rani Kusuma", role: "Staff", title: "Competency Analyst", avatar: "RK", email: "rani@nexus.co" },
  { id: "u-005", name: "Bagus Hartono", role: "Executive", title: "Director Operations", avatar: "BH", email: "bagus@nexus.co" },
];

// ---------------------------------------------------------------------------
// KPI & dashboard
// ---------------------------------------------------------------------------

export interface Kpi {
  label: string;
  value: number;
  target: number;
  unit: string;
  delta: number; // vs last period, percentage points
  status: "green" | "amber" | "red";
}

export const executiveKpis: Kpi[] = [
  { label: "Overall KPI Achievement", value: 87, target: 90, unit: "%", delta: 3.2, status: "amber" },
  { label: "Task Completion Rate", value: 92, target: 95, unit: "%", delta: 1.8, status: "green" },
  { label: "Customer Satisfaction", value: 4.4, target: 4.5, unit: "/5", delta: 0.2, status: "green" },
  { label: "Competency Index", value: 78, target: 85, unit: "%", delta: -1.1, status: "red" },
];

export const workloadByTeam = [
  { team: "Performance", open: 24, done: 61 },
  { team: "Development", open: 18, done: 42 },
  { team: "Competency", open: 31, done: 38 },
  { team: "Customer", open: 12, done: 55 },
  { team: "Strategy", open: 9, done: 27 },
];

export const kpiTrend = [
  { m: "Jan", v: 72 },
  { m: "Feb", v: 74 },
  { m: "Mar", v: 78 },
  { m: "Apr", v: 77 },
  { m: "May", v: 82 },
  { m: "Jun", v: 85 },
  { m: "Jul", v: 87 },
];

export const satisfactionTrend = [
  { m: "Jan", v: 4.0 },
  { m: "Feb", v: 4.1 },
  { m: "Mar", v: 4.1 },
  { m: "Apr", v: 4.2 },
  { m: "May", v: 4.3 },
  { m: "Jun", v: 4.3 },
  { m: "Jul", v: 4.4 },
];

// Competency heatmap: rows = competency, cols = team, value 0-100
export const competencyHeatmap = {
  competencies: ["Leadership", "Analytics", "Communication", "Project Mgmt", "Technical", "Coaching"],
  teams: ["Perf.", "Dev.", "Comp.", "Cust.", "Strat."],
  matrix: [
    [82, 74, 70, 66, 88],
    [90, 68, 85, 60, 79],
    [76, 80, 72, 88, 70],
    [70, 66, 64, 58, 84],
    [88, 62, 90, 55, 66],
    [64, 78, 60, 72, 74],
  ],
};

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "task" | "approval" | "kpi" | "training" | "request" | "meeting";
}

export const recentActivity: Activity[] = [
  { id: "a1", user: "Sinta L.", action: "completed task", target: "Q3 KPI Cascade", time: "12m", type: "task" },
  { id: "a2", user: "Dimas P.", action: "requested approval for", target: "Leadership Program Budget", time: "38m", type: "approval" },
  { id: "a3", user: "Rani K.", action: "updated competency gap for", target: "Analytics Team", time: "1h", type: "kpi" },
  { id: "a4", user: "System AI", action: "flagged risk on", target: "Project Aurora timeline", time: "2h", type: "task" },
  { id: "a5", user: "Bagus H.", action: "submitted request", target: "SR-2041 Data Access", time: "3h", type: "request" },
  { id: "a6", user: "Sinta L.", action: "scheduled meeting", target: "Quarterly Review", time: "4h", type: "meeting" },
  { id: "a7", user: "Rani K.", action: "enrolled in", target: "Advanced Analytics Cert.", time: "5h", type: "training" },
];

// ---------------------------------------------------------------------------
// Strategy
// ---------------------------------------------------------------------------

export interface Objective {
  id: string;
  title: string;
  owner: string;
  progress: number;
  keyResults: { title: string; progress: number }[];
  quarter: string;
}

export const objectives: Objective[] = [
  {
    id: "okr-1",
    title: "Elevate department competency maturity to Level 4",
    owner: "Arif Wibowo",
    progress: 68,
    quarter: "FY26",
    keyResults: [
      { title: "Assess 100% of staff against matrix", progress: 92 },
      { title: "Close 60% of critical competency gaps", progress: 54 },
      { title: "Launch 3 development programs", progress: 66 },
    ],
  },
  {
    id: "okr-2",
    title: "Achieve 95% on-time execution across programs",
    owner: "Sinta Larasati",
    progress: 74,
    quarter: "FY26",
    keyResults: [
      { title: "Reduce overdue tasks below 8%", progress: 70 },
      { title: "Automate 40% of admin workflows", progress: 61 },
      { title: "Milestone adherence ≥ 90%", progress: 88 },
    ],
  },
  {
    id: "okr-3",
    title: "Deliver best-in-class internal customer value",
    owner: "Bagus Hartono",
    progress: 81,
    quarter: "FY26",
    keyResults: [
      { title: "NPS ≥ 55", progress: 84 },
      { title: "SLA compliance ≥ 95%", progress: 79 },
      { title: "CSAT ≥ 4.5", progress: 80 },
    ],
  },
];

// --- Strategic Planning: Vision, Mission, Core Values, Goals, SWOT ---------

export const strategyVision =
  "To become the intelligent digital ecosystem for organizational excellence.";

export interface MissionItem {
  id: string;
  text: string;
}

export const missionItems: MissionItem[] = [
  { id: "ms-1", text: "Empower organizations through integrated competency and performance management." },
  { id: "ms-2", text: "Connect people, competency, execution, and value into one operating system." },
  { id: "ms-3", text: "Drive data-driven decisions with real-time insight across every department." },
  { id: "ms-4", text: "Cultivate a culture of continuous learning and measurable growth." },
  { id: "ms-5", text: "Deliver best-in-class internal service and lasting stakeholder value." },
];

export interface CoreValue {
  id: string;
  letter: string;
  title: string;
  description: string;
}

export const coreValues: CoreValue[] = [
  { id: "cv-1", letter: "I", title: "Integrity", description: "We act with honesty and hold ourselves accountable for every outcome." },
  { id: "cv-2", letter: "E", title: "Excellence", description: "We pursue the highest standards in everything we deliver." },
  { id: "cv-3", letter: "C", title: "Collaboration", description: "We connect people and teams to achieve shared goals." },
  { id: "cv-4", letter: "N", title: "Innovation", description: "We continuously improve through creativity and technology." },
];

export interface StrategicGoal {
  id: string;
  title: string;
  description: string;
  target: string;
  owner: string;
}

export const strategicGoals: StrategicGoal[] = [
  { id: "sg-1", title: "Build a competency-driven culture", description: "Embed competency assessment across every department.", target: "FY26", owner: "Arif Wibowo" },
  { id: "sg-2", title: "Digitalize performance management", description: "Move all KPI tracking onto the Nexus platform.", target: "FY26", owner: "Sinta Larasati" },
  { id: "sg-3", title: "Elevate internal customer satisfaction", description: "Reach internal-service NPS ≥ 60.", target: "FY27", owner: "Bagus Hartono" },
];

export type SwotType = "Strength" | "Weakness" | "Opportunity" | "Threat";

export interface SwotItem {
  id: string;
  type: SwotType;
  text: string;
}

export const swotItems: SwotItem[] = [
  { id: "sw-1", type: "Strength", text: "Strong leadership commitment to digital transformation." },
  { id: "sw-2", type: "Strength", text: "Skilled and motivated core team." },
  { id: "sw-3", type: "Weakness", text: "Several legacy manual processes still in use." },
  { id: "sw-4", type: "Weakness", text: "Uneven data quality across departments." },
  { id: "sw-5", type: "Opportunity", text: "Growing demand for integrated HR platforms." },
  { id: "sw-6", type: "Opportunity", text: "Executive sponsorship for automation initiatives." },
  { id: "sw-7", type: "Threat", text: "Rapidly changing technology landscape." },
  { id: "sw-8", type: "Threat", text: "Competition for skilled talent." },
];

export interface Program {
  id: string;
  name: string;
  owner: string;
  status: "On Track" | "At Risk" | "Delayed" | "Completed";
  progress: number;
  budget: number;
  spent: number;
  start: string;
  end: string;
  risk: "Low" | "Medium" | "High";
  milestones: number;
  milestonesDone: number;
}

export const programs: Program[] = [
  { id: "PRG-01", name: "Competency Digital Transformation", owner: "Arif Wibowo", status: "On Track", progress: 72, budget: 850, spent: 540, start: "2026-01-10", end: "2026-11-30", risk: "Low", milestones: 8, milestonesDone: 5 },
  { id: "PRG-02", name: "Leadership Development 2026", owner: "Dimas Prakoso", status: "At Risk", progress: 48, budget: 420, spent: 300, start: "2026-02-01", end: "2026-09-15", risk: "Medium", milestones: 6, milestonesDone: 2 },
  { id: "PRG-03", name: "Performance Automation Suite", owner: "Sinta Larasati", status: "On Track", progress: 66, budget: 610, spent: 380, start: "2026-03-05", end: "2026-12-20", risk: "Low", milestones: 7, milestonesDone: 4 },
  { id: "PRG-04", name: "Customer Experience Uplift", owner: "Bagus Hartono", status: "Delayed", progress: 35, budget: 300, spent: 210, start: "2026-01-20", end: "2026-08-30", risk: "High", milestones: 5, milestonesDone: 1 },
  { id: "PRG-05", name: "Knowledge Base Modernization", owner: "Rani Kusuma", status: "Completed", progress: 100, budget: 180, spent: 172, start: "2025-09-01", end: "2026-03-31", risk: "Low", milestones: 4, milestonesDone: 4 },
];

// ---------------------------------------------------------------------------
// Tasks (Kanban)
// ---------------------------------------------------------------------------

export type TaskStatus = "Backlog" | "In Progress" | "Review" | "Done";
export type Priority = "Low" | "Medium" | "High" | "Critical";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string;
  avatar: string;
  due: string;
  program: string;
  checklist: { total: number; done: number };
  comments: number;
  tags: string[];
}

export const tasks: Task[] = [
  { id: "T-101", title: "Draft Q3 KPI cascade for Performance team", status: "In Progress", priority: "High", assignee: "Sinta L.", avatar: "SL", due: "2026-07-10", program: "PRG-03", checklist: { total: 6, done: 4 }, comments: 3, tags: ["KPI", "Q3"] },
  { id: "T-102", title: "Competency gap analysis — Analytics", status: "Review", priority: "Critical", assignee: "Rani K.", avatar: "RK", due: "2026-07-08", program: "PRG-01", checklist: { total: 8, done: 8 }, comments: 5, tags: ["Competency"] },
  { id: "T-103", title: "Finalize Leadership curriculum module 3", status: "Backlog", priority: "Medium", assignee: "Dimas P.", avatar: "DP", due: "2026-07-18", program: "PRG-02", checklist: { total: 5, done: 1 }, comments: 1, tags: ["Training"] },
  { id: "T-104", title: "Migrate SOP library to new KM system", status: "In Progress", priority: "Medium", assignee: "Rani K.", avatar: "RK", due: "2026-07-14", program: "PRG-05", checklist: { total: 10, done: 7 }, comments: 2, tags: ["Knowledge"] },
  { id: "T-105", title: "Configure SLA rules for service requests", status: "Done", priority: "High", assignee: "Sinta L.", avatar: "SL", due: "2026-07-02", program: "PRG-03", checklist: { total: 4, done: 4 }, comments: 0, tags: ["SLA"] },
  { id: "T-106", title: "Executive dashboard traffic-light logic", status: "In Progress", priority: "High", assignee: "Arif W.", avatar: "AW", due: "2026-07-11", program: "PRG-03", checklist: { total: 7, done: 3 }, comments: 4, tags: ["Dashboard"] },
  { id: "T-107", title: "CX survey redesign & NPS mapping", status: "Backlog", priority: "Critical", assignee: "Bagus H.", avatar: "BH", due: "2026-07-20", program: "PRG-04", checklist: { total: 6, done: 0 }, comments: 2, tags: ["CX", "NPS"] },
  { id: "T-108", title: "Approve training budget PRG-02", status: "Review", priority: "High", assignee: "Arif W.", avatar: "AW", due: "2026-07-09", program: "PRG-02", checklist: { total: 3, done: 2 }, comments: 6, tags: ["Approval"] },
  { id: "T-109", title: "Publish IDP templates for supervisors", status: "Done", priority: "Low", assignee: "Dimas P.", avatar: "DP", due: "2026-06-30", program: "PRG-01", checklist: { total: 5, done: 5 }, comments: 1, tags: ["IDP"] },
  { id: "T-110", title: "Set up Redis cache for analytics API", status: "Backlog", priority: "Medium", assignee: "Rani K.", avatar: "RK", due: "2026-07-22", program: "PRG-03", checklist: { total: 4, done: 0 }, comments: 0, tags: ["Tech"] },
];

export const taskColumns: TaskStatus[] = ["Backlog", "In Progress", "Review", "Done"];

// ---------------------------------------------------------------------------
// Competency
// ---------------------------------------------------------------------------

export interface Competency {
  name: string;
  category: string;
  required: number;
  current: number;
}

export const competencies: Competency[] = [
  { name: "Strategic Leadership", category: "Leadership", required: 4, current: 3 },
  { name: "Data Analytics", category: "Technical", required: 4, current: 3 },
  { name: "Performance Coaching", category: "People", required: 5, current: 4 },
  { name: "Project Management", category: "Delivery", required: 4, current: 4 },
  { name: "Stakeholder Communication", category: "People", required: 4, current: 3 },
  { name: "Process Automation", category: "Technical", required: 3, current: 2 },
  { name: "Financial Acumen", category: "Business", required: 3, current: 3 },
  { name: "Change Management", category: "Leadership", required: 4, current: 2 },
];

export interface DevPlan {
  employee: string;
  avatar: string;
  role: string;
  readiness: number;
  gaps: number;
  nextStep: string;
}

export const developmentPlans: DevPlan[] = [
  { employee: "Rani Kusuma", avatar: "RK", role: "Competency Analyst", readiness: 74, gaps: 2, nextStep: "Advanced Analytics Certification" },
  { employee: "Dimas Prakoso", avatar: "DP", role: "Supervisor Development", readiness: 81, gaps: 1, nextStep: "Leadership Simulation Lab" },
  { employee: "Sinta Larasati", avatar: "SL", role: "Manager Performance", readiness: 88, gaps: 1, nextStep: "Executive Coaching" },
  { employee: "Bagus Hartono", avatar: "BH", role: "Director Operations", readiness: 92, gaps: 0, nextStep: "Board Readiness Program" },
];

// ---------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------

export interface PerfKpi {
  id: string;
  name: string;
  level: "Corporate" | "Department" | "Individual";
  weight: number;
  target: number;
  actual: number;
  unit: string;
}

export const performanceKpis: PerfKpi[] = [
  { id: "K1", name: "Program On-Time Delivery", level: "Department", weight: 25, target: 95, actual: 91, unit: "%" },
  { id: "K2", name: "Competency Gap Closure", level: "Department", weight: 20, target: 60, actual: 54, unit: "%" },
  { id: "K3", name: "Internal CSAT", level: "Corporate", weight: 20, target: 4.5, actual: 4.4, unit: "/5" },
  { id: "K4", name: "SLA Compliance", level: "Department", weight: 15, target: 95, actual: 93, unit: "%" },
  { id: "K5", name: "Training Effectiveness", level: "Individual", weight: 10, target: 85, actual: 88, unit: "%" },
  { id: "K6", name: "Cost Efficiency", level: "Corporate", weight: 10, target: 100, actual: 104, unit: "%" },
];

export const topPerformers = [
  { name: "Bagus Hartono", avatar: "BH", score: 96, role: "Director Operations" },
  { name: "Sinta Larasati", avatar: "SL", score: 93, role: "Manager Performance" },
  { name: "Dimas Prakoso", avatar: "DP", score: 89, role: "Supervisor Development" },
  { name: "Rani Kusuma", avatar: "RK", score: 86, role: "Competency Analyst" },
];

// ---------------------------------------------------------------------------
// Customer requests & satisfaction
// ---------------------------------------------------------------------------

export interface ServiceRequest {
  id: string;
  title: string;
  requester: string;
  priority: Priority;
  sla: "Within SLA" | "At Risk" | "Breached";
  status: "New" | "In Progress" | "Waiting Approval" | "Resolved";
  pic: string;
  created: string;
}

export const serviceRequests: ServiceRequest[] = [
  { id: "SR-2041", title: "Access to performance data warehouse", requester: "Bagus H.", priority: "High", sla: "Within SLA", status: "In Progress", pic: "Rani K.", created: "2026-07-05" },
  { id: "SR-2042", title: "New competency dashboard for Ops", requester: "Ops Dept.", priority: "Medium", sla: "At Risk", status: "Waiting Approval", pic: "Sinta L.", created: "2026-07-04" },
  { id: "SR-2043", title: "Bulk training enrollment — 40 staff", requester: "HR Dept.", priority: "High", sla: "Within SLA", status: "New", pic: "Dimas P.", created: "2026-07-06" },
  { id: "SR-2044", title: "Export Q2 appraisal reports", requester: "Finance", priority: "Low", sla: "Breached", status: "In Progress", pic: "Rani K.", created: "2026-06-28" },
  { id: "SR-2045", title: "Integrate Outlook calendar sync", requester: "IT Dept.", priority: "Medium", sla: "Within SLA", status: "Resolved", pic: "Arif W.", created: "2026-06-25" },
];

export const npsData = { promoters: 62, passives: 27, detractors: 11, nps: 51 };

export const satisfactionByService = [
  { service: "Competency Assessment", score: 4.5 },
  { service: "Training Delivery", score: 4.6 },
  { service: "Performance Review", score: 4.2 },
  { service: "Data & Reporting", score: 4.1 },
  { service: "Service Requests", score: 4.4 },
];

// ---------------------------------------------------------------------------
// AI Assistant
// ---------------------------------------------------------------------------

export interface AiInsight {
  id: string;
  type: "risk" | "recommendation" | "summary" | "prediction";
  title: string;
  body: string;
  confidence: number;
}

export const aiInsights: AiInsight[] = [
  { id: "ai1", type: "risk", title: "Project Aurora likely to slip 2 weeks", body: "Milestone velocity dropped 18% over the last sprint. 3 critical tasks are unassigned and 2 dependencies are blocked.", confidence: 87 },
  { id: "ai2", type: "recommendation", title: "Rebalance workload for Competency team", body: "Competency team is at 128% capacity while Strategy is at 61%. Reassign 4 non-critical tasks to level utilization.", confidence: 79 },
  { id: "ai3", type: "prediction", title: "Q3 KPI achievement forecast: 89%", body: "Based on current trend, overall KPI will reach 89% by quarter end — just below the 90% target. Focus on Competency Index to close the gap.", confidence: 82 },
  { id: "ai4", type: "summary", title: "Weekly executive summary ready", body: "12 tasks completed, 3 programs advanced, 1 risk flagged, CSAT up 0.1. Full narrative report generated and ready to export.", confidence: 95 },
];

export const aiSuggestions = [
  "Generate Q3 executive summary",
  "Draft IDP for Rani Kusuma",
  "Predict delays across all programs",
  "Suggest priority for my open tasks",
  "Summarize last meeting minutes",
  "Recommend training for Analytics gaps",
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  channel: "In-App" | "Email" | "WhatsApp" | "Push";
  title: string;
  time: string;
  read: boolean;
  kind: "deadline" | "approval" | "training" | "birthday" | "system";
}

export const notifications: Notification[] = [
  { id: "n1", channel: "In-App", title: "Task T-102 moved to Review — needs your approval", time: "5m", read: false, kind: "approval" },
  { id: "n2", channel: "Email", title: "Deadline tomorrow: Q3 KPI cascade (T-101)", time: "1h", read: false, kind: "deadline" },
  { id: "n3", channel: "WhatsApp", title: "Leadership training starts Monday 09:00", time: "3h", read: true, kind: "training" },
  { id: "n4", channel: "Push", title: "🎂 It's Sinta Larasati's birthday today", time: "6h", read: true, kind: "birthday" },
  { id: "n5", channel: "In-App", title: "AI flagged a schedule risk on Project Aurora", time: "8h", read: true, kind: "system" },
];

// ---------------------------------------------------------------------------
// Modules registry (used by dashboard quick links)
// ---------------------------------------------------------------------------

export interface Meeting {
  id: string;
  title: string;
  time: string;
  attendees: number;
  actionItems: number;
}

export const meetings: Meeting[] = [
  { id: "M1", title: "Quarterly Performance Review", time: "Today · 14:00", attendees: 8, actionItems: 5 },
  { id: "M2", title: "Competency Council Sync", time: "Tomorrow · 10:00", attendees: 5, actionItems: 3 },
  { id: "M3", title: "Program Aurora Standup", time: "Wed · 09:30", attendees: 6, actionItems: 2 },
];

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  version: string;
  updated: string;
  type: "SOP" | "Guideline" | "Template" | "Presentation";
}

export const knowledgeDocs: KnowledgeDoc[] = [
  { id: "D1", title: "Competency Assessment SOP", category: "Competency", version: "v3.2", updated: "2026-06-20", type: "SOP" },
  { id: "D2", title: "KPI Cascade Guideline", category: "Performance", version: "v2.0", updated: "2026-05-11", type: "Guideline" },
  { id: "D3", title: "IDP Template 2026", category: "Development", version: "v1.4", updated: "2026-06-01", type: "Template" },
  { id: "D4", title: "Leadership Program Deck", category: "Development", version: "v1.0", updated: "2026-06-28", type: "Presentation" },
  { id: "D5", title: "Service Request Handling SOP", category: "Customer", version: "v2.5", updated: "2026-06-15", type: "SOP" },
];

// --- Document Management ----------------------------------------------------

export type DocType = "SOP" | "Guideline" | "Template" | "Presentation";
export type DocApproval = "Approved" | "Pending" | "Rejected";

export interface DocItem {
  id: string;
  title: string;
  type: DocType;
  folder: string;
  owner: string;
  version: string;
  approval: DocApproval;
  updated: string; // ISO date (YYYY-MM-DD)
  signed: boolean;
}

export const docFolders = ["Strategy", "Programs", "Competency", "Performance", "Customer", "Templates"];

export const documents: DocItem[] = [
  { id: "doc-1", title: "Competency Assessment SOP", type: "SOP", folder: "Competency", owner: "Arif Wibowo", version: "v3.2", approval: "Approved", updated: "2026-06-20", signed: true },
  { id: "doc-2", title: "KPI Cascade Guideline", type: "Guideline", folder: "Performance", owner: "Sinta Larasati", version: "v2.0", approval: "Pending", updated: "2026-05-11", signed: false },
  { id: "doc-3", title: "IDP Template 2026", type: "Template", folder: "Templates", owner: "Rani Kusuma", version: "v1.4", approval: "Pending", updated: "2026-06-01", signed: false },
  { id: "doc-4", title: "Leadership Program Deck", type: "Presentation", folder: "Programs", owner: "Dimas Prakoso", version: "v1.0", approval: "Pending", updated: "2026-06-28", signed: false },
  { id: "doc-5", title: "Service Request Handling SOP", type: "SOP", folder: "Customer", owner: "Bagus Hartono", version: "v2.5", approval: "Approved", updated: "2026-06-15", signed: true },
  { id: "doc-6", title: "Strategic Plan FY26", type: "Guideline", folder: "Strategy", owner: "Arif Wibowo", version: "v1.2", approval: "Approved", updated: "2026-06-25", signed: true },
  { id: "doc-7", title: "Performance Appraisal SOP", type: "SOP", folder: "Performance", owner: "Sinta Larasati", version: "v4.1", approval: "Approved", updated: "2026-05-30", signed: true },
  { id: "doc-8", title: "Program Charter Template", type: "Template", folder: "Programs", owner: "Dimas Prakoso", version: "v2.0", approval: "Approved", updated: "2026-06-10", signed: false },
  { id: "doc-9", title: "Competency Matrix 2026", type: "Guideline", folder: "Competency", owner: "Rani Kusuma", version: "v3.0", approval: "Pending", updated: "2026-06-18", signed: false },
  { id: "doc-10", title: "Customer Satisfaction Report", type: "Presentation", folder: "Customer", owner: "Bagus Hartono", version: "v1.3", approval: "Approved", updated: "2026-06-22", signed: true },
];

// --- Meetings: agenda & action items ---------------------------------------

export interface AgendaItem {
  id: string;
  text: string;
}

export const meetingAgenda: AgendaItem[] = [
  { id: "ag-1", text: "Review Q3 KPI achievement vs. target" },
  { id: "ag-2", text: "Competency gap closure progress — Analytics team" },
  { id: "ag-3", text: "Leadership Development 2026 budget approval" },
  { id: "ag-4", text: "Open service requests & SLA risk review" },
];

export type ActionStatus = "Open" | "Done";

export interface ActionItem {
  id: string;
  assignee: string;
  text: string;
  status: ActionStatus;
}

export const meetingActions: ActionItem[] = [
  { id: "ac-1", assignee: "SL", text: "Finalize Q3 KPI cascade for Performance team", status: "Open" },
  { id: "ac-2", assignee: "RK", text: "Submit competency gap analysis for Analytics", status: "Done" },
  { id: "ac-3", assignee: "DP", text: "Circulate Leadership curriculum module 3 draft", status: "Open" },
  { id: "ac-4", assignee: "AW", text: "Approve training budget for PRG-02", status: "Open" },
];

// --- Development: training calendar -----------------------------------------

export interface TrainingSession {
  id: string;
  name: string;
  date: string;
  seats: string;
}

export const trainingSessions: TrainingSession[] = [
  { id: "ts-1", name: "Leadership Simulation Lab", date: "Mon · Jul 13 · 09:00", seats: "12 / 20" },
  { id: "ts-2", name: "Advanced Analytics Certification", date: "Wed · Jul 15 · 13:30", seats: "18 / 25" },
  { id: "ts-3", name: "Supervisor Coaching Clinic", date: "Fri · Jul 17 · 10:00", seats: "9 / 15" },
  { id: "ts-4", name: "Executive Presence Workshop", date: "Tue · Jul 21 · 14:00", seats: "6 / 12" },
];
