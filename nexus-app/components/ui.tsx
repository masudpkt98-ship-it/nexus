"use client";
import React from "react";
import { useI18n } from "@/lib/i18n";

export function cn(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  glass = true,
}: {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}) {
  return (
    <div
      className={cn(
        "card p-5 shadow-glass",
        glass ? "glass" : "bg-[rgb(var(--surface))]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight">{t(title)}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-[var(--muted)]">{t(subtitle)}</p>
        )}
      </div>
      {action}
    </div>
  );
}

const badgeTones: Record<string, string> = {
  green: "bg-emerald-500/12 text-emerald-500 border-emerald-500/25",
  amber: "bg-gold-400/12 text-gold-500 border-gold-500/30",
  red: "bg-rose-500/12 text-rose-500 border-rose-500/25",
  blue: "bg-royal-500/12 text-royal-400 border-royal-500/30",
  gray: "bg-slate-500/12 text-[var(--muted)] border-slate-500/20",
  purple: "bg-violet-500/12 text-violet-400 border-violet-500/25",
};

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof badgeTones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = "blue",
  className,
}: {
  value: number;
  tone?: "blue" | "gold" | "green" | "red";
  className?: string;
}) {
  const bg =
    tone === "gold"
      ? "from-gold-400 to-gold-500"
      : tone === "green"
      ? "from-emerald-400 to-emerald-500"
      : tone === "red"
      ? "from-rose-400 to-rose-500"
      : "from-royal-400 to-royal-600";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all", bg)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Avatar({ initials, tone = "blue" }: { initials: string; tone?: "blue" | "gold" }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-sm",
        tone === "gold"
          ? "bg-gradient-to-br from-gold-400 to-gold-600"
          : "bg-gradient-to-br from-royal-400 to-royal-700"
      )}
    >
      {initials}
    </div>
  );
}

export function TrafficLight({ status }: { status: "green" | "amber" | "red" }) {
  const color =
    status === "green" ? "bg-emerald-500" : status === "amber" ? "bg-gold-400" : "bg-rose-500";
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", color)} />
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", color)} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Charts (self-contained SVG — no external deps)
// ---------------------------------------------------------------------------

export function Sparkline({
  data,
  min,
  max,
  className,
  tone = "blue",
}: {
  data: number[];
  min?: number;
  max?: number;
  className?: string;
  tone?: "blue" | "gold";
}) {
  const lo = min ?? Math.min(...data);
  const hi = max ?? Math.max(...data);
  const range = hi - lo || 1;
  const w = 100;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - lo) / range) * h;
    return [x, y];
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const stroke = tone === "gold" ? "#e5aa26" : "#2f6bff";
  const id = `sp-${tone}-${data.join("-").slice(0, 8)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function LineChart({
  data,
  labels,
  min,
  max,
  tone = "blue",
  height = 200,
}: {
  data: number[];
  labels: string[];
  min?: number;
  max?: number;
  tone?: "blue" | "gold";
  height?: number;
}) {
  const lo = min ?? Math.min(...data);
  const hi = max ?? Math.max(...data);
  const range = hi - lo || 1;
  const w = 500;
  const h = 180;
  const pad = 8;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((d - lo) / range) * (h - pad * 2);
    return [x, y];
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${line} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
  const stroke = tone === "gold" ? "#e5aa26" : "#2f6bff";
  const id = `lc-${tone}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={w - pad}
            y1={pad + (g / 3) * (h - pad * 2)}
            y2={pad + (g / 3) * (h - pad * 2)}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={stroke} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[10px] text-[var(--muted)]">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 200,
}: {
  data: { label: string; a: number; b?: number }[];
  height?: number;
}) {
  const max = Math.max(...data.flatMap((d) => [d.a, d.b ?? 0])) || 1;
  return (
    <div className="flex items-end justify-between gap-3" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-full w-full items-end justify-center gap-1">
            {d.b !== undefined && (
              <div
                className="w-1/3 rounded-t bg-gradient-to-t from-royal-700 to-royal-400"
                style={{ height: `${(d.b / max) * 100}%` }}
                title={`${d.b}`}
              />
            )}
            <div
              className="w-1/3 rounded-t bg-gradient-to-t from-gold-500 to-gold-300"
              style={{ height: `${(d.a / max) * 100}%` }}
              title={`${d.a}`}
            />
          </div>
          <span className="text-[10px] text-[var(--muted)]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({
  segments,
  size = 160,
  thickness = 18,
  center,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">{center}</div>
      )}
    </div>
  );
}

export function Gauge({ value, size = 120 }: { value: number; size?: number }) {
  const r = size / 2 - 10;
  const c = Math.PI * r; // half circle
  const len = (value / 100) * c;
  const color = value >= 90 ? "#10b981" : value >= 75 ? "#e5aa26" : "#f43f5e";
  return (
    <div className="relative" style={{ width: size, height: size / 2 + 12 }}>
      <svg width={size} height={size / 2 + 12}>
        <path
          d={`M10 ${size / 2} A ${r} ${r} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M10 ${size / 2} A ${r} ${r} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${len} ${c}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <span className="text-xl font-bold" style={{ color }}>
          {value}
          <span className="text-xs">%</span>
        </span>
      </div>
    </div>
  );
}
