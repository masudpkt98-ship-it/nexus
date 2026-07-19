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
      { label: "Competency Matrix", href: "/competency/matrix" },
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
      { label: "Performance Planning", href: "/performance/planning" },
    ],
  },
  { label: "Development", href: "/development", icon: "development", section: "People & Performance" },

  { label: "Customer Request", href: "/requests", icon: "request", section: "Customer", badge: "3" },
  { label: "Satisfaction", href: "/satisfaction", icon: "satisfaction", section: "Customer" },

  { label: "Meetings", href: "/meetings", icon: "meeting", section: "Workspace" },
  { label: "Knowledge", href: "/knowledge", icon: "knowledge", section: "Workspace" },
  { label: "Documents", href: "/documents", icon: "document", section: "Workspace" },
  { label: "Notifications", href: "/notifications", icon: "bell", section: "Workspace" },

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
