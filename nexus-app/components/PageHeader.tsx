import React from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Btn({
  children,
  variant = "ghost",
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "gold";
  onClick?: () => void;
}) {
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-royal-500 to-royal-700 text-white shadow-glow hover:brightness-110"
      : variant === "gold"
      ? "bg-gradient-to-r from-gold-400 to-gold-500 text-navy-900 shadow-gold hover:brightness-105"
      : "glass hover:bg-black/5 dark:hover:bg-white/5";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition ${styles}`}
    >
      {children}
    </button>
  );
}
