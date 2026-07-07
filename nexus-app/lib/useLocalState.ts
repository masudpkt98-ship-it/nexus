"use client";

import { useEffect, useRef, useState } from "react";

/**
 * State that persists to localStorage so it survives a page refresh.
 * Hydration-safe: the first render always uses `initial` (matching the server),
 * then the stored value is loaded on mount and every later change is written back.
 *
 * Keys are namespaced with the app's `nexus-` prefix (like `nexus-lang`, `nexus-token`).
 */
export function useLocalState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = `nexus-${key}`;
  const [state, setState] = useState<T>(initial);
  const hydrated = useRef(false);

  // Load once on mount (client only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw != null) setState(JSON.parse(raw) as T);
    } catch {
      /* corrupt or unavailable storage → keep initial */
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist on change, but not before the initial load has run
  // (so we never clobber stored data with the seed value).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* quota or unavailable storage → ignore */
    }
  }, [storageKey, state]);

  return [state, setState];
}
