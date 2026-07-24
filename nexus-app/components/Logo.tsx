"use client";

import React, { useState } from "react";

// The genuine NEXUS emblem — the blue→gold connection ring with four nodes and
// the interlocked "N", lifted straight from the brand artwork (transparent
// background, so it blends on any theme).
//
// The `?v=` cache-bust changes the URL key so a corrupted/stale browser-cache
// entry can never keep serving a broken image; `onError` falls back to a
// gradient "N" monogram so the brand is never fully missing.
const MARK_SRC = "/nexus-mark.png?v=2";

export function LogoMark({ size = 36 }: { size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-label="NEXUS"
        className="flex select-none items-center justify-center rounded-full bg-gradient-to-br from-royal-500 to-gold-400 font-bold text-white"
        style={{ width: size, height: size, fontSize: size * 0.52 }}
      >
        N
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={MARK_SRC}
      alt="NEXUS"
      width={size}
      height={size}
      className="select-none"
      style={{ width: size, height: size, objectFit: "contain" }}
      draggable={false}
      onError={() => setFailed(true)}
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
