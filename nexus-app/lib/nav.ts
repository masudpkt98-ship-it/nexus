import type { IconName } from "@/components/Icons";

export interface NavChild {
  label: string;
  href: string;
  children?: NavChild[]; // 3rd-level items (e.g. an in-page tab), shown only on the parent's page
}

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  section: "Overview" | "Plan & Execute" | "People & Performance" | "Customer" | "Workspace" | "Intelligence";
  badge?: string;
  children?: NavChild[]; // submodules — rendered as a collapsible group in the sidebar
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    section: "Overview",
    children: [
      { label: "Performance Dashboard", href: "/dashboard/performance" },
      { label: "Competency Dashboard", href: "/dashboard/competency" },
    ],
  },
  // Grouped under Overview, next to the dashboards (order: Nexian, then Directory).
  { label: "Nexian", href: "/nexian", icon: "spark", section: "Overview" },
  {
    label: "Employee Directory",
    href: "/people",
    icon: "users",
    section: "Overview",
    children: [{ label: "KPI Eligibility", href: "/dashboard/eligibility" }],
  },

  { label: "Strategic Planning", href: "/strategy", icon: "strategy", section: "Plan & Execute" },
  { label: "Program Management", href: "/programs", icon: "program", section: "Plan & Execute" },
  { label: "Task Management", href: "/tasks", icon: "task", section: "Plan & Execute", badge: "8" },
  { label: "Cascade", href: "/cascade", icon: "target", section: "Plan & Execute" },

  {
    label: "Competency Management",
    href: "/competency",
    icon: "competency",
    section: "People & Performance",
    children: [
      { label: "Competency Dictionary", href: "/competency/dictionary" },
      { label: "Job Profile", href: "/competency/job-profile" },
      { label: "Job Competency Profile", href: "/competency/profile" },
      { label: "Competency Matrix", href: "/competency/matrix" },
      { label: "Competency Gap Analysis", href: "/competency/gap" },
      { label: "Role Learning Blueprint", href: "/competency/blueprint" },
      { label: "Learning Journey", href: "/competency/journey" },
      { label: "Learning Modules (LMS)", href: "/competency/lms" },
      { label: "OJT & Job Shadowing", href: "/competency/ojt" },
      { label: "Mentoring & Coaching", href: "/competency/mentoring" },
      { label: "Assessment", href: "/competency/assessment" },
      { label: "Certification", href: "/competency/certification" },
      { label: "Competency Passport", href: "/competency/passport" },
    ],
  },
  {
    label: "Performance Management",
    href: "/performance",
    icon: "performance",
    section: "People & Performance",
    children: [
      {
        label: "Performance Dictionary",
        href: "/performance/dictionary",
        children: [{ label: "KPI Teknis", href: "/performance/dictionary?tab=teknis" }],
      },
      { label: "Performance Mapping", href: "/performance/mapping" },
      {
        label: "Performance Planning",
        href: "/performance/planning",
        children: [
          { label: "Korporat", href: "/performance/planning/korporat" },
          { label: "Direktorat", href: "/performance/planning/direktorat" },
          { label: "Manajemen", href: "/performance/planning/manajemen" },
          { label: "Unit Kerja", href: "/performance/planning/unit-kerja" },
          { label: "Individu (AVP & Staf)", href: "/performance/planning/individu" },
        ],
      },
      {
        label: "Performance Monitoring",
        href: "/performance/monitoring",
        children: [
          { label: "Korporat", href: "/performance/monitoring/korporat" },
          { label: "Direktorat", href: "/performance/monitoring/direktorat" },
          { label: "Manajemen", href: "/performance/monitoring/manajemen" },
          { label: "Unit Kerja", href: "/performance/monitoring/unit-kerja" },
          { label: "Individu (AVP & Staf)", href: "/performance/monitoring/individu" },
        ],
      },
      {
        label: "Performance Appraisal",
        href: "/performance/appraisal",
        children: [
          { label: "Korporat", href: "/performance/appraisal/korporat" },
          { label: "Direktorat", href: "/performance/appraisal/direktorat" },
          { label: "Manajemen", href: "/performance/appraisal/manajemen" },
          { label: "Unit Kerja", href: "/performance/appraisal/unit-kerja" },
          { label: "Individu (AVP & Staf)", href: "/performance/appraisal/individu" },
        ],
      },
    ],
  },
  { label: "Development", href: "/development", icon: "development", section: "People & Performance" },

  { label: "Customer Request", href: "/requests", icon: "request", section: "Customer", badge: "3" },
  { label: "Satisfaction", href: "/satisfaction", icon: "satisfaction", section: "Customer" },

  { label: "Meetings", href: "/meetings", icon: "meeting", section: "Workspace" },
  { label: "Knowledge", href: "/knowledge", icon: "knowledge", section: "Workspace" },
  { label: "Documents", href: "/documents", icon: "document", section: "Workspace" },
  { label: "Notifications", href: "/notifications", icon: "bell", section: "Workspace" },
  { label: "Audit Log", href: "/audit", icon: "alert", section: "Workspace" },

  { label: "AI Assistant", href: "/ai-assistant", icon: "ai", section: "Intelligence" },
  { label: "Analytics", href: "/analytics", icon: "analytics", section: "Intelligence" },
];

export const navSections = [
  "Overview",
  "Plan & Execute",
  "People & Performance",
  "Customer",
  "Workspace",
  "Intelligence",
] as const;
