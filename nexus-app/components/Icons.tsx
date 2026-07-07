import React from "react";

type P = React.SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const Icon = {
  dashboard: (p: P) => (
    <svg {...base(p)}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  strategy: (p: P) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  ),
  program: (p: P) => (
    <svg {...base(p)}>
      <path d="M4 5h16M4 12h10M4 19h16" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  ),
  task: (p: P) => (
    <svg {...base(p)}>
      <rect x="3" y="4" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="6" rx="1.5" />
      <path d="M14 5h7M14 9h5M14 16h7M14 20h5" />
    </svg>
  ),
  competency: (p: P) => (
    <svg {...base(p)}>
      <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.5 7.1 18.2 8 12.7l-4-3.9L9.5 8 12 3z" />
    </svg>
  ),
  performance: (p: P) => (
    <svg {...base(p)}>
      <path d="M4 19V5" />
      <path d="M4 15l4-4 4 3 7-8" />
      <path d="M19 6h-3M19 6v3" />
    </svg>
  ),
  development: (p: P) => (
    <svg {...base(p)}>
      <path d="M12 4C8 4 5 6 5 10c0 3 2 5 3.5 6 .5.4 1 1 1 2h5c0-1 .5-1.6 1-2 1.5-1 3.5-3 3.5-6 0-4-3-6-7-6z" />
      <path d="M9.5 21h5" />
    </svg>
  ),
  request: (p: P) => (
    <svg {...base(p)}>
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9z" />
      <path d="M12 8v4M12 14v.01" />
    </svg>
  ),
  satisfaction: (p: P) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14c.9 1.2 2.1 2 3.5 2s2.6-.8 3.5-2" />
      <path d="M9 9.5v.01M15 9.5v.01" />
    </svg>
  ),
  meeting: (p: P) => (
    <svg {...base(p)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  ),
  knowledge: (p: P) => (
    <svg {...base(p)}>
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5z" />
      <path d="M8 3v14" />
    </svg>
  ),
  document: (p: P) => (
    <svg {...base(p)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5" />
    </svg>
  ),
  bell: (p: P) => (
    <svg {...base(p)}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  ai: (p: P) => (
    <svg {...base(p)}>
      <rect x="5" y="7" width="14" height="12" rx="3" />
      <path d="M12 7V4M9 3h6" />
      <path d="M9 12v2M15 12v2M2 12h3M19 12h3" />
    </svg>
  ),
  analytics: (p: P) => (
    <svg {...base(p)}>
      <path d="M4 20V4" />
      <rect x="7" y="12" width="3" height="8" rx="1" />
      <rect x="12.5" y="8" width="3" height="12" rx="1" />
      <rect x="18" y="4" width="3" height="16" rx="1" />
    </svg>
  ),
  search: (p: P) => (
    <svg {...base(p)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  sun: (p: P) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </svg>
  ),
  moon: (p: P) => (
    <svg {...base(p)}>
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" />
    </svg>
  ),
  logout: (p: P) => (
    <svg {...base(p)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  chevron: (p: P) => (
    <svg {...base(p)}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
  plus: (p: P) => (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  clock: (p: P) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  check: (p: P) => (
    <svg {...base(p)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  alert: (p: P) => (
    <svg {...base(p)}>
      <path d="M12 3 2 20h20L12 3z" />
      <path d="M12 10v4M12 17v.01" />
    </svg>
  ),
  spark: (p: P) => (
    <svg {...base(p)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8l1.5 2.5L16 12l-2.5 1.5L12 16l-1.5-2.5L8 12l2.5-1.5L12 8z" fill="currentColor" stroke="none" />
    </svg>
  ),
  users: (p: P) => (
    <svg {...base(p)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M17 20c0-2.2-1-4-2.5-4.7" />
    </svg>
  ),
  target: (p: P) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  ),
  filter: (p: P) => (
    <svg {...base(p)}>
      <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" />
    </svg>
  ),
};

export type IconName = keyof typeof Icon;
