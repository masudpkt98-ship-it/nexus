"use client";

import React, { useState } from "react";
import { NEXUS_MARK } from "@/lib/logoData";

// The genuine NEXUS emblem — the blue→gold connection ring with four nodes and
// the interlocked "N", from the brand artwork (transparent background).
//
// Served as an inlined data URI (lib/logoData) so the mark never depends on a
// separate image request — this sidesteps the Next dev-server cache quirk where
// a 304 revalidation returns an empty body and breaks the image on localhost
// (production served the file fine). `onError` still falls back to a gradient
// "N" monogram as a last resort.
const MARK_SRC = NEXUS_MARK;

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
