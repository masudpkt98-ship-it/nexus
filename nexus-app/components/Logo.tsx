import React from "react";

// Vector re-interpretation of the NEXUS mark: interlocked "N" inside a
// blue→gold connection ring with four nodes (People · Competency · Execution ·
// Performance · Excellence). Crisp at any size and theme-aware.
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <defs>
        <linearGradient id="ring-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4d8dff" />
          <stop offset="100%" stopColor="#1a44bd" />
        </linearGradient>
        <linearGradient id="ring-gold" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffdd8a" />
          <stop offset="100%" stopColor="#c98d14" />
        </linearGradient>
        <linearGradient id="n-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe6a0" />
          <stop offset="100%" stopColor="#e5aa26" />
        </linearGradient>
      </defs>
      {/* ring split blue (left) / gold (right) */}
      <path d="M50 8 A42 42 0 0 0 50 92" stroke="url(#ring-blue)" strokeWidth="7" strokeLinecap="round" />
      <path d="M50 8 A42 42 0 0 1 50 92" stroke="url(#ring-gold)" strokeWidth="7" strokeLinecap="round" />
      {/* nodes */}
      <circle cx="50" cy="8" r="6.5" fill="#2f6bff" />
      <circle cx="50" cy="92" r="6.5" fill="#4d8dff" />
      <circle cx="8" cy="50" r="6.5" fill="#2f6bff" />
      <circle cx="92" cy="50" r="6.5" fill="#e5aa26" />
      {/* stylized N */}
      <path
        d="M32 68 V34 h7 l22 26 V34 h7 v34 h-7 L39 42 v26 z"
        fill="url(#n-gold)"
        stroke="#c98d14"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size * 1.7} />
      <div className="leading-none">
        <div
          className="font-bold tracking-[0.18em] brand-gradient"
          style={{ fontSize: size }}
        >
          NEXUS
        </div>
        <div
          className="mt-0.5 tracking-[0.14em] text-[var(--muted)]"
          style={{ fontSize: size * 0.42 }}
        >
          COMPETENCY &amp; PERFORMANCE
        </div>
      </div>
    </div>
  );
}
