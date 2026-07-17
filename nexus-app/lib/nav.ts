import type { IconName } from "@/components/Icons";

export interface NavChild {
  label: string;
  href: string;
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
      { label: "KPI Eligibility", href: "/dashboard/eligibility" },
    ],
  },

  { label: "Strategic Planning", href: "/strategy", icon: "strategy", section: "Plan & Execute" },
  { label: "Program Management", href: "/programs", icon: "program", section: "Plan & Execute" },
  { label: "Task Management", href: "/tasks", icon: "task", section: "Plan & Execute", badge: "8" },
  { label: "Cascade", href: "/cascade", icon: "target", section: "Plan & Execute" },

  { label: "Employee Directory", href: "/people", icon: "users", section: "People & Performance" },
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
      { label: "Performance Dictionary", href: "/performance/dictionary" },
      { label: "Performance Planning", href: "/performance/planning" },
    ],
  },
  { label: "Development", href: "/development", icon: "development", section: "People & Performance" },
  { label: "Nexian", href: "/nexian", icon: "spark", section: "People & Performance" },

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
