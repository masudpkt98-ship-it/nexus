import React from "react";

// The genuine NEXUS emblem — the blue→gold connection ring with four nodes and
// the interlocked "N", lifted straight from the brand artwork with its metallic
// shading, depth and glow intact (transparent background, so it blends on any
// theme). Preserving the original render keeps the mark exclusive rather than a
// flattened re-drawing.
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/nexus-mark.png"
      alt="NEXUS"
      width={size}
      height={size}
      className="select-none"
      style={{ width: size, height: size, objectFit: "contain" }}
      draggable={false}
    />
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
