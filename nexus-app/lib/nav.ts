import type { IconName } from "@/components/Icons";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  section: "Overview" | "Plan & Execute" | "People & Performance" | "Customer" | "Workspace" | "Intelligence";
  badge?: string;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard", section: "Overview" },

  { label: "Strategic Planning", href: "/strategy", icon: "strategy", section: "Plan & Execute" },
  { label: "Program Management", href: "/programs", icon: "program", section: "Plan & Execute" },
  { label: "Task Management", href: "/tasks", icon: "task", section: "Plan & Execute", badge: "8" },
  { label: "Cascade", href: "/cascade", icon: "target", section: "Plan & Execute" },

  { label: "Employee Directory", href: "/people", icon: "users", section: "People & Performance" },
  { label: "Competency Management", href: "/competency", icon: "competency", section: "People & Performance" },
  { label: "Performance Management", href: "/performance", icon: "performance", section: "People & Performance" },
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
